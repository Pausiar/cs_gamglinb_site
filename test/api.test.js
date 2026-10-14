'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { buildConfig, createHandler, createGame, createToken } = require('../lib/app.js');
const { createMemoryStore, _psdb } = require('../lib/store.js');

const SECRET = 'test-secret-0123456789abcdef0123456789abcdef';
const SID = '76561198000000001';

function sessionCookie(sid = SID, secret = SECRET) {
    const now = Math.floor(Date.now() / 1000);
    return 'sd_session=' + encodeURIComponent(createToken(secret, { t: 'session', sid, iat: now, exp: now + 3600 }));
}

async function startServer(opts = {}) {
    const config = buildConfig({ PORT: '0', BASE_URL: 'http://localhost:3000', SESSION_SECRET: SECRET });
    const store = opts.store || createMemoryStore();
    const handler = createHandler(config, {
        store,
        serialize: opts.serialize,
        fetchImpl: async () => { throw new Error('no network in tests'); }
    });
    const server = http.createServer(handler);
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const base = `http://127.0.0.1:${server.address().port}`;
    return { server, store, base, close: () => new Promise(r => server.close(r)) };
}

function api(base, path, { method = 'POST', body, cookie = sessionCookie(), headers = {} } = {}) {
    return fetch(base + path, {
        method,
        headers: Object.assign(
            { Origin: 'http://localhost:3000', Cookie: cookie },
            body !== undefined ? { 'Content-Type': 'application/json' } : {},
            headers
        ),
        body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
    }).then(async r => ({ status: r.status, json: await r.json().catch(() => null) }));
}

test('auth required, origin checked, body validated', async () => {
    const srv = await startServer();
    try {
        assert.equal((await api(srv.base, '/api/state', { method: 'GET', cookie: '' })).status, 401);
        assert.equal((await api(srv.base, '/api/open', { body: { caseId: 1 }, cookie: '' })).status, 401);
        // forged with another secret
        assert.equal((await api(srv.base, '/api/open', { body: { caseId: 1 }, cookie: sessionCookie(SID, 'x'.repeat(40)) })).status, 401);
        assert.equal((await api(srv.base, '/api/open', { body: { caseId: 1 }, headers: { Origin: 'https://evil.example' } })).status, 403);
        assert.equal((await api(srv.base, '/api/open', { body: '{bad', })).status, 400);
        assert.equal((await api(srv.base, '/api/open', { body: { caseId: 1, pad: 'x'.repeat(11000) } })).status, 413);
        const r = await fetch(srv.base + '/api/open', { method: 'POST', headers: { Origin: 'http://localhost:3000', Cookie: sessionCookie(), 'Content-Type': 'text/plain' }, body: '{}' });
        assert.equal(r.status, 415);
        assert.equal((await api(srv.base, '/api/open', { method: 'GET' })).status, 405);
        // static files are served from public/ only
        assert.equal((await fetch(srv.base + '/')).status, 200);
        assert.equal((await fetch(srv.base + '/js/engine.js')).status, 200);
        assert.equal((await fetch(srv.base + '/server.js')).status, 404);
        assert.equal((await fetch(srv.base + '/lib/app.js')).status, 404);
        assert.equal((await fetch(srv.base + '/package.json')).status, 404);
    } finally {
        await srv.close();
    }
});

test('state, promo, open, sell, upgrade, battle through the API', async () => {
    const srv = await startServer();
    try {
        let r = await api(srv.base, '/api/state', { method: 'GET' });
        assert.equal(r.status, 200);
        assert.equal(r.json.state.balance, 0);
        assert.equal(r.json.steamId, SID);

        r = await api(srv.base, '/api/open', { body: { caseId: 1 } });
        assert.equal(r.status, 400);
        assert.match(r.json.error, /Saldo insuficiente/);

        r = await api(srv.base, '/api/promo', { body: { code: 'test' } });
        assert.equal(r.status, 200);
        assert.equal(r.json.state.balance, 10000);
        r = await api(srv.base, '/api/promo', { body: { code: 'test' } });
        assert.equal(r.status, 400);
        assert.match(r.json.error, /Ya has usado/);

        r = await api(srv.base, '/api/open', { body: { caseId: 5 } });
        assert.equal(r.status, 200);
        assert.equal(r.json.state.balance, 9985);
        const item = r.json.result.item;
        assert.equal(r.json.state.inventory[0].uid, item.uid);

        r = await api(srv.base, '/api/sell', { body: { uids: [item.uid] } });
        assert.equal(r.status, 200);
        assert.equal(r.json.state.balance, Math.round((9985 + item.price) * 100) / 100);
        assert.equal(r.json.state.inventory.length, 0);

        r = await api(srv.base, '/api/upgrade', { body: { uids: [], balanceStake: 10, targetId: 19, mode: 'over' } });
        assert.equal(r.status, 200);
        assert.equal(typeof r.json.result.win, 'boolean');
        assert.equal(r.json.result.chance, 63.33);

        r = await api(srv.base, '/api/battle', { body: { caseIds: [1, 2], mode: '2v2', crazy: true } });
        assert.equal(r.status, 200);
        assert.equal(r.json.result.seats.length, 4);
        assert.equal(r.json.result.rounds.length, 2);
        assert.equal(r.json.result.cost, 3);

        // persisted
        const stored = await srv.store.getProfile(SID);
        assert.equal(stored.version, 5);
        assert.equal(stored.data.balance, r.json.state.balance);
        const s = await api(srv.base, '/api/state', { method: 'GET' });
        assert.deepEqual(s.json.state, r.json.state);
    } finally {
        await srv.close();
    }
});

async function parallelOpens(serialize) {
    const srv = await startServer({ serialize });
    try {
        // Balance for exactly 5 "Caja Principiante" (0.50 each)
        await srv.store.createProfile(SID, 'test');
        assert.equal(await srv.store.updateProfile(SID, 0, { balance: 2.5, inventory: [], stats: {}, history: [], promosUsed: [] }), true);
        const results = await Promise.all(Array.from({ length: 20 }, () => api(srv.base, '/api/open', { body: { caseId: 1 } })));
        const ok = results.filter(r => r.status === 200);
        const final = await srv.store.getProfile(SID);
        results.forEach(r => { if (r.json && r.json.state) assert.ok(r.json.state.balance >= 0); });
        assert.ok(final.data.balance >= 0);
        assert.equal(final.data.inventory.length, ok.length);
        assert.equal(final.data.balance, Math.round((2.5 - 0.5 * ok.length) * 100) / 100);
        assert.equal(final.data.stats.casesOpened, ok.length);
        results.filter(r => r.status !== 200).forEach(r => assert.ok(r.status === 400 || r.status === 409, 'status ' + r.status));
        return { ok: ok.length, statuses: results.map(r => r.status) };
    } finally {
        await srv.close();
    }
}

test('20 parallel opens with balance for 5: exactly 5 succeed', async () => {
    const { ok, statuses } = await parallelOpens(true);
    assert.equal(ok, 5);
    assert.equal(statuses.filter(s => s === 400).length, 15);
});

test('without the in-process queue the version check alone prevents double spend', async () => {
    const { ok } = await parallelOpens(false);
    assert.ok(ok >= 1 && ok <= 5, 'successes: ' + ok);
});

test('optimistic concurrency: retries lost races, 409 after 3 attempts', async () => {
    const inner = createMemoryStore();
    await inner.createProfile(SID, 'x');
    await inner.updateProfile(SID, 0, { balance: 100, inventory: [], stats: {}, history: [], promosUsed: [] });
    let failNext = 0;
    let writes = 0;
    const store = Object.assign({}, inner, {
        async updateProfile(sid, version, data) {
            writes++;
            if (failNext > 0) {
                failNext--;
                // a concurrent writer bumps the version in between
                const cur = await inner.getProfile(sid);
                await inner.updateProfile(sid, cur.version, cur.data);
                return inner.updateProfile(sid, version, data);
            }
            return inner.updateProfile(sid, version, data);
        }
    });
    const game = createGame({ store, rng: Math.random });

    failNext = 2;
    writes = 0;
    const out = await game.runAction(SID, 'openCase', { caseId: 1 });
    assert.equal(writes, 3);
    assert.equal(out.state.balance, 99.5);
    assert.equal((await inner.getProfile(SID)).data.balance, 99.5);

    failNext = 3;
    writes = 0;
    await assert.rejects(game.runAction(SID, 'openCase', { caseId: 1 }), e => e.status === 409);
    assert.equal(writes, 3);
    assert.equal((await inner.getProfile(SID)).data.balance, 99.5, 'nothing written on 409');
});

test('requestUrl recovers the original path from the Vercel rewrite parameter', async () => {
    const srv = await startServer();
    try {
        const r = await fetch(srv.base + '/api/index?__p=api/me');
        assert.equal(r.status, 200);
        assert.deepEqual(await r.json(), { loggedIn: false });
    } finally {
        await srv.close();
    }
});

test('PSDB response helpers are defensive', () => {
    const { unwrap, asRows, rowToProfile, affectedCount, isUniqueConflict, tableUrl } = _psdb;
    assert.deepEqual(unwrap({ data: [1] }), [1]);
    assert.equal(asRows({ rows: [1, 2] }).length, 2);
    assert.equal(affectedCount({ data: { count: 1 } }), 1);
    assert.equal(affectedCount({ count: 0 }), 0);
    assert.equal(affectedCount({ data: [{}, {}] }), 2);
    assert.equal(affectedCount({ data: { updated: 1 } }), 1);
    assert.equal(affectedCount({ data: { id: 'x' } }), null);
    assert.ok(isUniqueConflict(409, {}));
    assert.ok(isUniqueConflict(400, { error: 'duplicate key value violates unique constraint' }));
    const p = rowToProfile({ id: 'r1', 'steam-id': SID, balance: 5, inventory: '[]', stats: {}, history: null, 'promos-used': ['test'], version: 3 });
    assert.equal(p.version, 3);
    assert.deepEqual(p.data.inventory, []);
    assert.deepEqual(p.data.history, []);
    assert.equal(rowToProfile({ id: 1, data: { 'steam-id': SID, version: 1 } }).steamId, SID);
    assert.equal(
        tableUrl({ baseUrl: 'https://x.app', project: 'skindrop', table: 'profiles' }, { 'steam-id': 'eq.1', version: 'eq.2' }),
        'https://x.app/api/v1/skindrop/profiles?steam-id=eq.1&version=eq.2'
    );
});

test('PS_Database store against a fake API with the assumed HTTP shapes', async () => {
    const { createPsdbStore } = require('../lib/store.js');
    const rows = [];
    const calls = [];
    const fakeFetch = async (url, init) => {
        const u = new URL(url);
        calls.push(`${init.method} ${u.pathname}${u.search}`);
        assert.equal(init.headers.Authorization, 'Bearer k');
        assert.equal(init.headers['x-api-key'], 'k');
        assert.equal(u.pathname, '/api/v1/skindrop/profiles');
        const filters = [...u.searchParams].filter(([k]) => k !== 'limit');
        const match = r => filters.every(([k, v]) => String(r[k]) === v.replace(/^eq\./, ''));
        const reply = (status, body) => ({ ok: status < 300, status, text: async () => JSON.stringify(body) });
        if (init.method === 'GET') return reply(200, { data: rows.filter(match) });
        if (init.method === 'POST') {
            const body = JSON.parse(init.body);
            if (rows.some(r => r['steam-id'] === body['steam-id'])) return reply(409, { error: 'duplicate key' });
            const row = Object.assign({ id: 'r' + rows.length }, body);
            rows.push(row);
            return reply(201, { data: row });
        }
        if (init.method === 'PATCH') {
            const hit = rows.filter(match);
            hit.forEach(r => Object.assign(r, JSON.parse(init.body)));
            return reply(200, { data: { count: hit.length } });
        }
        return reply(405, {});
    };
    const store = createPsdbStore({ PSDB_URL: 'https://psdb.test/', PSDB_API_KEY: 'k' }, { fetchImpl: fakeFetch });
    assert.equal(await store.getProfile(SID), null);
    const p = await store.createProfile(SID, 'Pau');
    assert.equal(p.version, 0);
    assert.equal((await store.createProfile(SID, 'Pau')).version, 0, 'unique conflict -> read');
    assert.equal(rows.length, 1);
    const game = createGame({ store, rng: Math.random });
    await assert.rejects(game.runAction(SID, 'openCase', { caseId: 1 }), e => e.status === 400);
    const out = await game.runAction(SID, 'redeemPromo', { code: 'test' });
    assert.equal(out.state.balance, 10000);
    assert.equal(rows[0].version, 1);
    assert.equal(rows[0].balance, 10000);
    assert.deepEqual(rows[0]['promos-used'], ['test']);
    assert.equal(await store.updateProfile(SID, 0, out.state), false, 'stale version');
    assert.ok(calls.some(c => c.startsWith('PATCH /api/v1/skindrop/profiles?steam-id=eq.' + SID + '&version=eq.0')));
});
