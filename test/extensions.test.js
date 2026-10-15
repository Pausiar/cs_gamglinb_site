'use strict';

// Server extension points: route modules (lib/routes), hooks (lib/hooks), `fair` in responses.

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { buildConfig, createHandler, createGame, createToken, readToken } = require('../lib/app.js');
const { createMemoryStore } = require('../lib/store.js');
const { createRouter } = require('../lib/router.js');
const { createHooks } = require('../lib/hooks/defaults.js');
const engine = require('../public/js/engine.js');
const data = require('../public/js/data.js');

const SECRET = 'test-secret-0123456789abcdef0123456789abcdef';
const SID = '76561198000000001';

function sessionCookie(sid = SID) {
    const now = Math.floor(Date.now() / 1000);
    return 'sd_session=' + encodeURIComponent(createToken(SECRET, { t: 'session', sid, iat: now, exp: now + 3600 }));
}

async function startServer(opts = {}) {
    const config = buildConfig({ PORT: '0', BASE_URL: 'http://localhost:3000', SESSION_SECRET: SECRET });
    const store = opts.store || createMemoryStore();
    const handler = createHandler(config, Object.assign({
        store,
        fetchImpl: async () => { throw new Error('no network in tests'); }
    }, opts.handler));
    const server = http.createServer(handler);
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    return { store, base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(r => server.close(r)) };
}

function call(base, path, { method = 'POST', body, cookie = sessionCookie(), headers = {} } = {}) {
    return fetch(base + path, {
        method,
        headers: Object.assign(
            { Origin: 'http://localhost:3000' },
            cookie ? { Cookie: cookie } : {},
            body !== undefined ? { 'Content-Type': 'application/json' } : {},
            headers
        ),
        body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
    }).then(async r => ({ status: r.status, headers: r.headers, json: await r.json().catch(() => null) }));
}

// ---------------------------------------------------------------- routes
const dummyRoutes = {
    register(router, ctx) {
        router.get('/api/dummy/hello', async (req, res, rq) => ({ hello: rq.session.sid, q: rq.query.get('q') }));
        router.get('/api/dummy/public', async (req, res, rq) => ({ session: rq.session ? rq.session.sid : null }), { auth: false });
        router.post('/api/dummy/echo', async (req, res, rq) => ({ got: rq.body }));
        router.post('/api/dummy/boom', async () => { throw ctx.apiError(418, 'Soy una tetera.', 'teapot'); });
        router.post('/api/dummy/crash', async () => { throw new Error('secreto interno'); });
        router.post('/api/dummy/empty', async () => undefined);
        router.post('/api/dummy/own', async (req, res) => { ctx.sendJson(res, 201, { own: true }); });
        router.post('/api/dummy/nobody', async (req, res, rq) => ({ body: rq.body === undefined }), { body: false });
        // a server-only action through the same engine pipeline (persisted, hooks, `fair`)
        ctx.actions.bonus = (state, params) => {
            const s = engine.normalizeState(state);
            s.balance = engine.round2(s.balance + Number(params.amount || 1));
            return { state: s, result: { added: Number(params.amount || 1) } };
        };
        router.action('/api/dummy/bonus', 'bonus');
    }
};

test('a dummy route module registered in a test gets all the core security', async () => {
    const srv = await startServer({ handler: { routeModules: [dummyRoutes] } });
    try {
        // GET with session
        let r = await call(srv.base, '/api/dummy/hello?q=7', { method: 'GET' });
        assert.equal(r.status, 200);
        assert.deepEqual(r.json, { hello: SID, q: '7' });
        assert.equal(r.headers.get('cache-control'), 'no-store');
        assert.match(r.headers.get('content-type'), /application\/json/);
        // auth: required by default, optional with auth:false
        assert.equal((await call(srv.base, '/api/dummy/hello', { method: 'GET', cookie: '' })).status, 401);
        assert.equal((await call(srv.base, '/api/dummy/hello', { method: 'GET', cookie: sessionCookie(SID).replace(/.$/, 'x') })).status, 401);
        r = await call(srv.base, '/api/dummy/public', { method: 'GET', cookie: '' });
        assert.deepEqual(r.json, { session: null });
        r = await call(srv.base, '/api/dummy/public', { method: 'GET' });
        assert.deepEqual(r.json, { session: SID });
        // methods
        r = await call(srv.base, '/api/dummy/hello', { method: 'POST', body: {} });
        assert.equal(r.status, 405);
        assert.equal(r.headers.get('allow'), 'GET');
        assert.equal((await call(srv.base, '/api/dummy/echo', { method: 'GET' })).status, 405);

        // POST: ok
        r = await call(srv.base, '/api/dummy/echo', { body: { a: 1 } });
        assert.equal(r.status, 200);
        assert.deepEqual(r.json, { got: { a: 1 } });
        // POST: same-origin, session, content-type, size, JSON
        assert.equal((await call(srv.base, '/api/dummy/echo', { body: {}, headers: { Origin: 'https://evil.example' } })).status, 403);
        assert.equal((await call(srv.base, '/api/dummy/echo', { body: {}, cookie: '' })).status, 401);
        assert.equal((await call(srv.base, '/api/dummy/echo', { body: '{bad' })).status, 400);
        assert.equal((await call(srv.base, '/api/dummy/echo', { body: { pad: 'x'.repeat(11000) } })).status, 413);
        const text = await fetch(srv.base + '/api/dummy/echo', {
            method: 'POST', headers: { Origin: 'http://localhost:3000', Cookie: sessionCookie(), 'Content-Type': 'text/plain' }, body: '{}'
        });
        assert.equal(text.status, 415);
        const noOrigin = await fetch(srv.base + '/api/dummy/echo', {
            method: 'POST', headers: { 'Sec-Fetch-Site': 'cross-site', Cookie: sessionCookie(), 'Content-Type': 'application/json' }, body: '{}'
        });
        assert.equal(noOrigin.status, 403);

        // errors and return values
        r = await call(srv.base, '/api/dummy/boom', { body: {} });
        assert.equal(r.status, 418);
        assert.deepEqual(r.json, { error: 'Soy una tetera.', code: 'teapot' });
        r = await call(srv.base, '/api/dummy/crash', { body: {} });
        assert.equal(r.status, 500);
        assert.ok(!JSON.stringify(r.json).includes('secreto'));
        assert.equal((await call(srv.base, '/api/dummy/empty', { body: {} })).status, 204);
        r = await call(srv.base, '/api/dummy/own', { body: {} });
        assert.equal(r.status, 201);
        assert.deepEqual(r.json, { own: true });
        r = await call(srv.base, '/api/dummy/nobody', { body: 'ni siquiera JSON', headers: { 'Content-Type': 'text/plain' } });
        assert.deepEqual(r.json, { body: true });

        // core routes keep working next to it
        assert.equal((await call(srv.base, '/api/state', { method: 'GET' })).status, 200);
        assert.equal((await call(srv.base, '/api/unknown', { method: 'GET' })).status, 404);
    } finally {
        await srv.close();
    }
});

test('router.action runs a registered server action (persisted) and answers { state, result }', async () => {
    const srv = await startServer({ handler: { routeModules: [dummyRoutes], hookModules: [] } });
    try {
        const r = await call(srv.base, '/api/dummy/bonus', { body: { amount: 2.5 } });
        assert.equal(r.status, 200);
        assert.deepEqual(r.json.result, { added: 2.5 });
        assert.equal(r.json.state.balance, 2.5);
        assert.ok(!('fair' in r.json), 'no fair field without meta');
        assert.equal((await srv.store.getProfile(SID)).data.balance, 2.5);
        assert.equal((await call(srv.base, '/api/dummy/bonus', { body: {}, cookie: '' })).status, 401);
    } finally {
        await srv.close();
    }
});

test('route registration rules', () => {
    const router = createRouter();
    router.get('/api/a', () => ({}));
    assert.throws(() => router.get('/api/a', () => ({})), /duplicada/);
    router.post('/api/a', () => ({}));           // another method on the same path is fine
    for (const bad of ['/auth/x', '/x', '/api/', '/api/index', '/api/me', '/api/state', '/api/A', '/api/../x', '/api/a/', 'api/a', '/api//a']) {
        assert.throws(() => router.get(bad, () => ({})), /no válida/, bad);
    }
    assert.throws(() => router.add('DELETE', '/api/b', () => ({})), /soportado/);
    assert.throws(() => router.get('/api/c', 'nope'), /handler/);
    assert.deepEqual(Object.keys(router.find('/api/a')).sort(), ['GET', 'POST']);
    assert.equal(router.find('/api/zzz'), null);
    assert.equal(router.find('constructor'), null);
});

test('the default lib/routes and lib/hooks lists are plain arrays of modules', () => {
    for (const list of [require('../lib/routes/index.js'), require('../lib/hooks/index.js')]) {
        assert.ok(Array.isArray(list));
    }
});

test('a module can return route definitions instead of calling the router', async () => {
    const mod = { register: () => [{ method: 'GET', path: '/api/defs', handler: async () => ({ ok: 1 }) }] };
    const srv = await startServer({ handler: { routeModules: [mod] } });
    try {
        assert.deepEqual((await call(srv.base, '/api/defs', { method: 'GET' })).json, { ok: 1 });
    } finally {
        await srv.close();
    }
});

// ---------------------------------------------------------------- hooks
test('hooks.makeRng is used by every action; meta is exposed as `fair` only when not null', async () => {
    const calls = [];
    const hookMod = {
        install(hooks) {
            hooks.makeRng = ({ steamId, profile, action }) => {
                calls.push({ steamId, action, version: profile.version, balance: profile.data.balance });
                return action === 'redeemPromo'
                    ? { rng: () => 0, meta: null }
                    : { rng: () => 0, meta: { server: 'seed-hash', nonce: calls.length } };
            };
        }
    };
    const srv = await startServer({ handler: { hookModules: [hookMod] } });
    try {
        let r = await call(srv.base, '/api/promo', { body: { code: 'test' } });
        assert.equal(r.status, 200);
        assert.ok(!('fair' in r.json), 'meta null -> no fair');

        r = await call(srv.base, '/api/open', { body: { caseId: 1 } });
        assert.equal(r.status, 200);
        assert.deepEqual(r.json.fair, { server: 'seed-hash', nonce: 2 });
        // rng() === 0 always picks the first item of the case
        assert.equal(r.json.result.item.id, data.cases.find(c => c.id === 1).items[0].id);

        assert.deepEqual(calls.map(c => [c.steamId, c.action, c.version, c.balance]), [
            [SID, 'redeemPromo', 0, 0],
            [SID, 'openCase', 1, 10000]
        ]);

        // GET /api/state never carries `fair`
        assert.ok(!('fair' in (await call(srv.base, '/api/state', { method: 'GET' })).json));
    } finally {
        await srv.close();
    }
});

test('hooks.afterAction runs after the write with the full event; its errors never fail the request', async () => {
    const events = [];
    let stored = null;
    const store = createMemoryStore();
    const hookMod = {
        install(hooks) {
            hooks.afterAction = async (e) => {   // replaced wholesale
                stored = (await store.getProfile(e.steamId)).version;   // the write is already persisted
                events.push(e);
            };
        }
    };
    const srv = await startServer({ store, handler: { hookModules: [hookMod] } });
    try {
        let r = await call(srv.base, '/api/promo', { body: { code: 'test' } });
        assert.equal(r.status, 200);
        assert.equal(events.length, 1);
        const e = events[0];
        assert.equal(e.steamId, SID);
        assert.equal(e.action, 'redeemPromo');
        assert.deepEqual(e.params, { code: 'test' });
        assert.equal(e.result.amount, 10000);
        assert.equal(e.meta, null);
        assert.equal(e.profile.version, 1);
        assert.equal(e.before.version, 0);
        assert.equal(e.profile.data.balance, 10000);
        assert.equal(e.state.balance, 10000);
        assert.equal(stored, 1);

        // failed actions (engine error) do not call it
        r = await call(srv.base, '/api/promo', { body: { code: 'test' } });
        assert.equal(r.status, 400);
        assert.equal(events.length, 1);
    } finally {
        await srv.close();
    }
});

test('afterAction errors are caught and logged, the request still succeeds', async () => {
    const errors = [];
    const origError = console.error;
    console.error = (...args) => errors.push(args.join(' '));
    const hookMod = {
        install(hooks) {
            hooks.onAfterAction(async () => { throw new Error('listener 1 rompe'); });
            hooks.onAfterAction(async () => { hooks.ran = true; });
        }
    };
    const srv = await startServer({ handler: { hookModules: [hookMod] } });
    try {
        const r = await call(srv.base, '/api/promo', { body: { code: 'test' } });
        assert.equal(r.status, 200);
        assert.equal(r.json.state.balance, 10000);
    } finally {
        console.error = origError;
        await srv.close();
    }
    assert.ok(errors.some(e => e.includes('listener 1 rompe') || e.includes('afterAction')), errors.join('|'));

    // a replaced afterAction that throws / rejects
    console.error = (...args) => errors.push(args.join(' '));
    const thrower = { install(hooks) { hooks.afterAction = () => { throw new Error('síncrono'); }; } };
    const srv2 = await startServer({ handler: { hookModules: [thrower] } });
    try {
        assert.equal((await call(srv2.base, '/api/promo', { body: { code: 'test' } })).status, 200);
    } finally {
        console.error = origError;
        await srv2.close();
    }
});

test('onAfterAction listeners run in order and are isolated; createHooks defaults', async () => {
    const hooks = createHooks({ rng: () => 0.25 });
    const made = hooks.makeRng({ steamId: SID, profile: {}, action: 'openCase' });
    assert.equal(made.rng(), 0.25);
    assert.equal(made.meta, null);
    assert.equal(await hooks.afterAction({}), undefined);   // default no-op
    const order = [];
    hooks.onAfterAction(async () => { order.push(1); });
    const origError = console.error;
    console.error = () => {};
    hooks.onAfterAction(async () => { throw new Error('x'); });
    hooks.onAfterAction(async () => { order.push(3); });
    try {
        await hooks.afterAction({});
    } finally {
        console.error = origError;
    }
    assert.deepEqual(order, [1, 3]);
    assert.throws(() => hooks.onAfterAction('no'), TypeError);

    const def = createHooks();
    const r = def.makeRng({}).rng();
    assert.ok(r >= 0 && r < 1);
});

test('createGame without hooks keeps working with a custom rng; makeRng returning nothing falls back', async () => {
    const store = createMemoryStore();
    await store.createProfile(SID, 'x');
    await store.updateProfile(SID, 0, { balance: 10, inventory: [], stats: {}, history: [], promosUsed: [] });
    const game = createGame({ store, rng: () => 0 });
    const out = await game.runAction(SID, 'openCase', { caseId: 1 });
    assert.equal(out.meta, null);
    assert.equal(out.result.item.id, data.cases[0].items[0].id);

    const hooks = createHooks({ rng: () => 0 });
    hooks.makeRng = () => null;   // misbehaving module: falls back to the game's rng
    const game2 = createGame({ store, rng: () => 0, hooks });
    assert.equal((await game2.runAction(SID, 'openCase', { caseId: 1 })).meta, null);

    await assert.rejects(game.runAction(SID, 'constructor', {}), e => e.status === 404);
    await assert.rejects(game.runAction(SID, 'nope', {}), e => e.status === 404);
});

// ---------------------------------------------------------------- login return page
test('/auth/steam?next=/cajas remembers the page to return to; anything else is ignored', async () => {
    const srv = await startServer();
    try {
        const stateOf = async (qs) => {
            const r = await fetch(srv.base + '/auth/steam' + qs, { redirect: 'manual' });
            assert.equal(r.status, 302);
            const cookie = decodeURIComponent(r.headers.get('set-cookie').match(/sd_login_state=([^;]+)/)[1]);
            return readToken(SECRET, cookie);
        };
        assert.equal((await stateOf('?next=/cajas')).n, '/cajas');
        assert.equal((await stateOf('?next=/provably-fair')).n, '/provably-fair');
        for (const bad of ['//evil.example', 'https://evil.example', '/a/b', '/cajas.html', '/%2e%2e', '/CAJAS', '']) {
            assert.equal((await stateOf('?next=' + encodeURIComponent(bad))).n, undefined, bad);
        }
        assert.equal((await stateOf('')).n, undefined);
    } finally {
        await srv.close();
    }
});
