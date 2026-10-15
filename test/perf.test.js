'use strict';

// Speed + resilience: per-instance profile cache, PS_Database 429/503 retries, Steam name / avatar
// sync, and the login hint cookie.

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { buildConfig, createHandler, createGame, createToken } = require('../lib/app.js');
const { createMemoryStore, createPsdbStore } = require('../lib/store.js');

const SECRET = 'test-secret-0123456789abcdef0123456789abcdef';
const SID = '76561198000000001';
const SID2 = '76561198000000002';
const EMPTY = { balance: 0, inventory: [], stats: {}, history: [], promosUsed: [] };

function sessionCookie(sid = SID) {
    const now = Math.floor(Date.now() / 1000);
    return 'sd_session=' + encodeURIComponent(createToken(SECRET, { t: 'session', sid, iat: now, exp: now + 3600 }));
}

// Memory store that counts every call
function countingStore(inner = createMemoryStore()) {
    const calls = { get: 0, create: 0, update: 0 };
    const store = {
        kind: inner.kind,
        table: inner.table,
        async getProfile(id) { calls.get++; return inner.getProfile(id); },
        async createProfile(id, name) { calls.create++; return inner.createProfile(id, name); },
        async updateProfile(...a) { calls.update++; return inner.updateProfile(...a); }
    };
    return { store, inner, calls, reset() { calls.get = calls.create = calls.update = 0; } };
}

// ==================== profile cache ====================
test('cache hit: after the first read an action costs exactly one store call (the write)', async () => {
    const c = countingStore();
    const game = createGame({ store: c.store, rng: Math.random });

    await game.runAction(SID, 'redeemPromo', { code: 'test' });
    assert.deepEqual(c.calls, { get: 1, create: 1, update: 1 }, 'cold: read + create + write');

    c.reset();
    const open = await game.runAction(SID, 'openCase', { caseId: 5 });
    assert.deepEqual(c.calls, { get: 0, create: 0, update: 1 }, 'warm: only the conditional write');
    assert.equal(open.state.balance, 9985);

    c.reset();
    const sell = await game.runAction(SID, 'sellItems', { uids: [open.result.item.uid] });
    assert.deepEqual(c.calls, { get: 0, create: 0, update: 1 });
    assert.equal((await c.inner.getProfile(SID)).data.balance, sell.state.balance);

    c.reset();
    const state = await game.getState(SID);
    assert.equal(c.calls.get, 0, 'state served from a fresh cache entry');
    assert.deepEqual(state, sell.state);
});

test('cache keeps version, ext and name in step with every write', async () => {
    const c = countingStore();
    await c.inner.createProfile(SID, 'Pau');
    const game = createGame({ store: c.store, rng: Math.random });
    await game.runAction(SID, 'redeemPromo', { code: 'test' });
    const cached = await game.getProfile(SID);
    const stored = await c.inner.getProfile(SID);
    assert.equal(cached.version, stored.version);
    assert.equal(cached.name, 'Pau');
    assert.deepEqual(cached.ext, stored.ext);
    assert.deepEqual(cached.data.balance, stored.data.balance);
});

test('lost race with a stale cache: the write misses, then re-read + retry succeeds', async () => {
    const c = countingStore();
    await c.inner.createProfile(SID, 'x');
    await c.inner.updateProfile(SID, 0, Object.assign({}, EMPTY, { balance: 100 }));
    const game = createGame({ store: c.store, rng: Math.random });
    await game.runAction(SID, 'openCase', { caseId: 1 });          // warms the cache (99.5)

    // another instance writes behind our back (+50)
    const cur = await c.inner.getProfile(SID);
    await c.inner.updateProfile(SID, cur.version, Object.assign({}, cur.data, { balance: cur.data.balance + 50 }));

    c.reset();
    const out = await game.runAction(SID, 'openCase', { caseId: 1 });
    assert.equal(out.state.balance, 149, 'computed on top of the other writer, not on the stale copy');
    assert.deepEqual(c.calls, { get: 1, create: 0, update: 2 }, 'stale write, re-read, good write');
    assert.equal((await c.inner.getProfile(SID)).data.balance, 149);

    c.reset();
    await game.runAction(SID, 'openCase', { caseId: 1 });
    assert.deepEqual(c.calls, { get: 0, create: 0, update: 1 }, 'cache is warm again');
});

test('a rejection computed on cached data is double-checked against the store', async () => {
    const c = countingStore();
    await c.inner.createProfile(SID, 'x');
    const game = createGame({ store: c.store, rng: Math.random });
    await assert.rejects(game.runAction(SID, 'openCase', { caseId: 1 }), e => e.status === 400);   // balance 0, cached

    const cur = await c.inner.getProfile(SID);
    await c.inner.updateProfile(SID, cur.version, Object.assign({}, cur.data, { balance: 10 }));   // top-up elsewhere

    c.reset();
    const out = await game.runAction(SID, 'openCase', { caseId: 1 });
    assert.equal(out.state.balance, 9.5);
    assert.equal(c.calls.get, 1, 're-read before trusting the "Saldo insuficiente"');

    c.reset();
    await assert.rejects(game.runAction(SID, 'sellItems', { uids: ['nope'] }), e => e.status === 400);
    assert.ok(c.calls.get <= 1);
});

test('TTL: entries older than 5 min are re-read; reads trust only entries younger than 10 s', async () => {
    let now = 1_000_000;
    const c = countingStore();
    const game = createGame({ store: c.store, rng: Math.random, clock: () => now });

    await game.runAction(SID, 'redeemPromo', { code: 'test' });
    c.reset();

    now += 9_000;
    await game.getState(SID);
    assert.equal(c.calls.get, 0, '9 s: fresh');
    now += 2_000;
    await game.getState(SID);
    assert.equal(c.calls.get, 1, '11 s: read again');

    c.reset();
    now += 60_000;
    await game.runAction(SID, 'openCase', { caseId: 1 });
    assert.deepEqual(c.calls, { get: 0, create: 0, update: 1 }, '1 min: actions still start from the cache');

    c.reset();
    now += 5 * 60_000 + 1;
    await game.runAction(SID, 'openCase', { caseId: 1 });
    assert.equal(c.calls.get, 1, '> 5 min: expired, read first');
    assert.equal(c.calls.update, 1);
});

test('cache is a bounded LRU', async () => {
    const c = countingStore();
    const game = createGame({ store: c.store, rng: Math.random, cache: { max: 3 } });
    for (let i = 0; i < 6; i++) await game.runAction('7656119800000010' + i, 'redeemPromo', { code: 'test' });
    assert.equal(game._cache.size, 3);
    assert.ok(!game._cache.has('76561198000000100'), 'oldest evicted');
    assert.ok(game._cache.has('76561198000000105'));

    c.reset();
    await game.runAction('76561198000000100', 'sellItems', { uids: [] }).catch(() => {});
    assert.equal(c.calls.get, 1, 'evicted user is read again');
});

test('cache: false restores read-then-write on every action', async () => {
    const c = countingStore();
    const game = createGame({ store: c.store, rng: Math.random, cache: false });
    await game.runAction(SID, 'redeemPromo', { code: 'test' });
    c.reset();
    await game.runAction(SID, 'openCase', { caseId: 1 });
    assert.deepEqual(c.calls, { get: 1, create: 0, update: 1 });
});

// ==================== PS_Database: PATCH rows, 429 / 503 ====================
function fakePsdb({ onPatch, onGet } = {}) {
    const rows = [];
    const calls = [];
    const reply = (status, body, headers = {}) => ({
        ok: status < 300,
        status,
        headers: { get: (k) => headers[k.toLowerCase()] ?? null },
        text: async () => JSON.stringify(body)
    });
    const fetchImpl = async (url, init) => {
        const u = new URL(url);
        calls.push(`${init.method}`);
        const filters = [...u.searchParams].filter(([k]) => k !== 'limit');
        const match = r => filters.every(([k, v]) => String(r[k]) === v.replace(/^eq\./, ''));
        if (init.method === 'GET') return (onGet && onGet(rows, match, reply)) || reply(200, { data: rows.filter(match) });
        if (init.method === 'POST') {
            const body = JSON.parse(init.body);
            const row = Object.assign({ id: 'r' + rows.length }, body);
            rows.push(row);
            return reply(201, { data: row });
        }
        if (init.method === 'PATCH') {
            if (onPatch) { const r = onPatch(rows, match, JSON.parse(init.body), reply); if (r) return r; }
            const hit = rows.filter(match);
            hit.forEach(r => Object.assign(r, JSON.parse(init.body)));
            return reply(200, { ok: true, data: { count: hit.length, rows: hit } });
        }
        return reply(405, {});
    };
    return { rows, calls, fetchImpl, reply };
}

const PSDB_ENV = { PSDB_URL: 'https://psdb.test', PSDB_API_KEY: 'k' };

test('PS_Database: rows returned by the PATCH are trusted (no read-back), the cache follows them', async () => {
    const f = fakePsdb();
    const store = createPsdbStore(PSDB_ENV, { fetchImpl: f.fetchImpl });
    const game = createGame({ store, rng: Math.random });
    await game.runAction(SID, 'redeemPromo', { code: 'test' });
    assert.deepEqual(f.calls, ['GET', 'POST', 'GET', 'PATCH'], 'cold: read, create, re-read, write');
    f.calls.length = 0;

    const out = await game.runAction(SID, 'openCase', { caseId: 5 });
    assert.deepEqual(f.calls, ['PATCH'], 'warm: a single PS_Database request per action');
    assert.equal(out.state.balance, 9985);
    assert.equal(f.rows[0].version, 2);
    const cached = await game.getProfile(SID);
    assert.equal(cached.version, 2);
    assert.equal(cached.data.stats._wid, f.rows[0].stats._wid, 'cache holds the stored row (with its write token)');
    assert.deepEqual(f.calls, ['PATCH'], 'getProfile served from cache');
});

test('PS_Database: PATCH without rows keeps the computed state', async () => {
    const f = fakePsdb({
        onPatch: (rows, match, body, reply) => {
            rows.filter(match).forEach(r => Object.assign(r, body));
            return reply(200, { data: { count: 1 } });
        }
    });
    const store = createPsdbStore(PSDB_ENV, { fetchImpl: f.fetchImpl });
    const game = createGame({ store, rng: Math.random });
    await game.runAction(SID, 'redeemPromo', { code: 'test' });
    f.calls.length = 0;
    await game.runAction(SID, 'openCase', { caseId: 5 });
    assert.deepEqual(f.calls, ['PATCH']);
    const cached = await game.getProfile(SID);
    assert.equal(cached.version, 2);
    assert.equal(cached.data.balance, 9985);
});

test('PS_Database 429: retries twice honoring Retry-After (capped at 2 s), then succeeds', async () => {
    let n = 0;
    const f = fakePsdb({
        onGet: (rows, match, reply) => (++n <= 2 ? reply(429, { error: 'rate' }, { 'retry-after': n === 1 ? '1' : '30' }) : null)
    });
    const sleeps = [];
    const store = createPsdbStore(PSDB_ENV, { fetchImpl: f.fetchImpl, sleep: async ms => { sleeps.push(ms); }, random: () => 0.5 });
    assert.equal(await store.getProfile(SID), null);
    assert.equal(n, 3);
    assert.deepEqual(sleeps, [1125, 2125], '1 s and min(30 s, 2 s), each plus jitter');
});

test('PS_Database 429 without Retry-After uses a short jittered backoff; a third 429 becomes a clean "busy" 503', async () => {
    const f = fakePsdb({ onGet: (rows, match, reply) => reply(429, { error: 'rate' }) });
    const sleeps = [];
    const store = createPsdbStore(PSDB_ENV, { fetchImpl: f.fetchImpl, sleep: async ms => { sleeps.push(ms); } });
    await assert.rejects(store.getProfile(SID), e => {
        assert.equal(e.status, 503);
        assert.equal(e.code, 'busy');
        assert.equal(e.expose, true);
        assert.equal(e.message, 'Servidor ocupado, inténtalo en unos segundos.');
        return true;
    });
    assert.equal(f.calls.length, 3, '1 try + 2 retries');
    assert.equal(sleeps.length, 2);
    sleeps.forEach(ms => assert.ok(ms >= 250 && ms <= 2250, 'delay ' + ms));
});

test('PS_Database 503 is retried like 429; other HTTP errors are not', async () => {
    let n = 0;
    const f = fakePsdb({ onGet: (rows, match, reply) => (++n === 1 ? reply(503, {}) : null) });
    const store = createPsdbStore(PSDB_ENV, { fetchImpl: f.fetchImpl, sleep: async () => {} });
    assert.equal(await store.getProfile(SID), null);
    assert.equal(n, 2);

    let m = 0;
    const g = fakePsdb({ onGet: (rows, match, reply) => { m++; return reply(500, { error: 'boom' }); } });
    const store2 = createPsdbStore(PSDB_ENV, { fetchImpl: g.fetchImpl, sleep: async () => {} });
    await assert.rejects(store2.getProfile(SID), e => e.status === 502);
    assert.equal(m, 1);
});

test('PS_Database: a PATCH retried after a 503 that had actually applied is not mistaken for a lost race', async () => {
    let first = true;
    const f = fakePsdb({
        onPatch: (rows, match, body, reply) => {
            if (first) {   // applied, but the answer was lost as a 503
                first = false;
                rows.filter(match).forEach(r => Object.assign(r, body));
                return reply(503, {});
            }
            return reply(200, { data: { count: 0 } });   // retry: version no longer matches
        }
    });
    const store = createPsdbStore(PSDB_ENV, { fetchImpl: f.fetchImpl, sleep: async () => {} });
    const p = await store.createProfile(SID, 'x');
    assert.equal(await store.updateProfile(SID, p.version, Object.assign({}, EMPTY, { balance: 5 })), true);
    assert.equal(f.rows[0].version, 1);
});

test('the API answers a busy PS_Database with 503 { code: "busy" }', async () => {
    const f = fakePsdb({ onGet: (rows, match, reply) => reply(429, {}) });
    const store = createPsdbStore(PSDB_ENV, { fetchImpl: f.fetchImpl, sleep: async () => {} });
    const config = buildConfig({ PORT: '0', BASE_URL: 'http://localhost:3000', SESSION_SECRET: SECRET });
    const handler = createHandler(config, { store, fetchImpl: async () => { throw new Error('offline'); } });
    const server = http.createServer(handler);
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    try {
        const base = `http://127.0.0.1:${server.address().port}`;
        const r = await fetch(base + '/api/state', { headers: { Cookie: sessionCookie() } });
        assert.equal(r.status, 503);
        assert.deepEqual(await r.json(), { error: 'Servidor ocupado, inténtalo en unos segundos.', code: 'busy' });
    } finally {
        await new Promise(r => server.close(r));
    }
});

// ==================== Steam name + avatar, hint cookie ====================
function steamFetch(players) {
    const calls = [];
    const fn = async (url, init) => {
        const u = String(url);
        calls.push(u);
        if (u.startsWith('https://api.steampowered.com/')) {
            const id = new URL(u).searchParams.get('steamids');
            const p = players[id];
            return { ok: true, status: 200, json: async () => ({ response: { players: p ? [Object.assign({ steamid: id }, p)] : [] } }) };
        }
        if (u.startsWith('https://steamcommunity.com/openid/login')) {
            return { ok: true, status: 200, text: async () => 'ns:http://specs.openid.net/auth/2.0\nis_valid:true\n' };
        }
        throw new Error('unexpected fetch ' + u);
    };
    fn.calls = calls;
    return fn;
}

async function startApp({ env = {}, fetchImpl, store } = {}) {
    const config = buildConfig(Object.assign({ PORT: '0', BASE_URL: 'http://localhost:3000', SESSION_SECRET: SECRET }, env));
    const handler = createHandler(config, { store, fetchImpl });
    const server = http.createServer(handler);
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    return { base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(r => server.close(r)) };
}

const settle = () => new Promise(r => setTimeout(r, 50));

test('/api/me stores the Steam name + avatar once, off the response path, and only rewrites on change', async () => {
    const players = { [SID]: { personaname: 'Pau', avatarmedium: 'https://cdn/m.jpg', avatarfull: 'https://cdn/f.jpg', profileurl: 'https://steamcommunity.com/id/pau/' } };
    const c = countingStore();
    await c.inner.createProfile(SID, 'Steam 0001');
    const app = await startApp({ env: { STEAM_API_KEY: 'key' }, fetchImpl: steamFetch(players), store: c.store });
    try {
        const me = () => fetch(app.base + '/api/me', { headers: { Cookie: sessionCookie() } }).then(r => r.json());
        const first = await me();
        assert.equal(first.name, 'Pau');
        assert.equal(first.avatar, 'https://cdn/f.jpg');
        await settle();
        let stored = await c.inner.getProfile(SID);
        assert.equal(stored.name, 'Pau');
        assert.equal(stored.ext.avatar, 'https://cdn/f.jpg');
        assert.equal(c.calls.update, 1);
        assert.equal(stored.version, 1);

        const readsBefore = c.calls.get;
        await me(); await me();
        await settle();
        assert.equal(c.calls.update, 1, 'no extra write when nothing changed');
        assert.equal(c.calls.get, readsBefore, 'no extra read either');

        // a different instance (fresh game, same store) compares first and skips the write too
        const app2 = await startApp({ env: { STEAM_API_KEY: 'key' }, fetchImpl: steamFetch(players), store: c.store });
        try {
            await fetch(app2.base + '/api/me', { headers: { Cookie: sessionCookie() } }).then(r => r.json());
            await settle();
            assert.equal(c.calls.update, 1, 'already stored -> no write');
        } finally { await app2.close(); }
    } finally {
        await app.close();
    }
});

test('/api/me answers before the identity write finishes (never blocks on it)', async () => {
    const players = { [SID]: { personaname: 'Pau', avatarfull: 'https://cdn/f.jpg' } };
    const inner = createMemoryStore();
    await inner.createProfile(SID, null);
    const store = Object.assign({}, inner, {
        async updateProfile(...a) { await new Promise(r => setTimeout(r, 400)); return inner.updateProfile(...a); }
    });
    const app = await startApp({ env: { STEAM_API_KEY: 'key' }, fetchImpl: steamFetch(players), store });
    try {
        const t0 = Date.now();
        const me = await fetch(app.base + '/api/me', { headers: { Cookie: sessionCookie() } }).then(r => r.json());
        assert.equal(me.name, 'Pau');
        assert.ok(Date.now() - t0 < 300, 'responded in ' + (Date.now() - t0) + ' ms');
        await new Promise(r => setTimeout(r, 600));
        assert.equal((await inner.getProfile(SID)).name, 'Pau');
    } finally {
        await app.close();
    }
});

test('a failing identity write is logged, never fails /api/me', async () => {
    const players = { [SID]: { personaname: 'Pau', avatarfull: 'https://cdn/f.jpg' } };
    const inner = createMemoryStore();
    await inner.createProfile(SID, null);
    const store = Object.assign({}, inner, { async updateProfile() { throw new Error('db down'); } });
    const app = await startApp({ env: { STEAM_API_KEY: 'key' }, fetchImpl: steamFetch(players), store });
    const origError = console.error;
    const logged = [];
    console.error = (...a) => logged.push(a.join(' '));
    try {
        const r = await fetch(app.base + '/api/me', { headers: { Cookie: sessionCookie() } });
        assert.equal(r.status, 200);
        assert.equal((await r.json()).name, 'Pau');
        await settle();
        assert.ok(logged.some(l => /db down/.test(l)), 'error logged');
    } finally {
        console.error = origError;
        await app.close();
    }
});

test('without STEAM_API_KEY the name stays "Steam XXXX" and nothing is written', async () => {
    const c = countingStore();
    const app = await startApp({ fetchImpl: steamFetch({}), store: c.store });
    try {
        const me = await fetch(app.base + '/api/me', { headers: { Cookie: sessionCookie() } }).then(r => r.json());
        assert.equal(me.name, 'Steam 0001');
        assert.equal(me.avatar, null);
        await settle();
        assert.deepEqual(c.calls, { get: 0, create: 0, update: 0 });
        const st = await fetch(app.base + '/api/state', { headers: { Cookie: sessionCookie() } });
        assert.equal(st.status, 200);
        assert.equal((await c.inner.getProfile(SID)).name, 'Steam 0001');
    } finally {
        await app.close();
    }
});

test('a failed Steam lookup (fallback name) never overwrites a stored real name', async () => {
    const c = countingStore();
    await c.inner.createProfile(SID2, 'Pau');
    const app = await startApp({ env: { STEAM_API_KEY: 'key' }, fetchImpl: steamFetch({}), store: c.store });   // players: none (the module-level Steam cache is keyed by id, hence a separate id)
    try {
        const me = await fetch(app.base + '/api/me', { headers: { Cookie: sessionCookie(SID2) } }).then(r => r.json());
        assert.equal(me.name, 'Steam 0002');
        await settle();
        assert.equal(c.calls.update, 0);
        assert.equal((await c.inner.getProfile(SID2)).name, 'Pau');
    } finally {
        await app.close();
    }
});

function loginQuery(state) {
    const returnTo = `http://localhost:3000/auth/steam/return?state=${encodeURIComponent(state)}`;
    const claimed = `https://steamcommunity.com/openid/id/${SID}`;
    const q = new URLSearchParams({
        'openid.ns': 'http://specs.openid.net/auth/2.0',
        'openid.mode': 'id_res',
        'openid.op_endpoint': 'https://steamcommunity.com/openid/login',
        'openid.claimed_id': claimed,
        'openid.identity': claimed,
        'openid.return_to': returnTo,
        'openid.response_nonce': new Date().toISOString().replace(/\.\d+Z$/, 'Z') + 'abc' + Math.random().toString(36).slice(2),
        'openid.assoc_handle': '1234',
        'openid.signed': 'signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle',
        'openid.sig': 'sig',
        state
    });
    return q.toString();
}

test('login stores name + avatar before redirecting and sets the readable sd_hint cookie', async () => {
    const players = { [SID]: { personaname: 'Pau', avatarfull: 'https://cdn/f.jpg' } };
    const c = countingStore();
    const app = await startApp({ env: { STEAM_API_KEY: 'key' }, fetchImpl: steamFetch(players), store: c.store });
    try {
        const start = await fetch(app.base + '/auth/steam?next=/cajas', { redirect: 'manual' });
        const stateCookie = start.headers.get('set-cookie').split(';')[0];
        const state = new URL(new URL(start.headers.get('location')).searchParams.get('openid.return_to')).searchParams.get('state');
        const r = await fetch(app.base + '/auth/steam/return?' + loginQuery(state), { redirect: 'manual', headers: { Cookie: stateCookie } });
        assert.equal(r.status, 302);
        assert.equal(r.headers.get('location'), '/cajas?login=ok');
        const cookies = r.headers.getSetCookie();
        const hint = cookies.find(x => x.startsWith('sd_hint='));
        assert.ok(hint, 'sd_hint set');
        assert.match(hint, /^sd_hint=1;/);
        assert.doesNotMatch(hint, /HttpOnly/i);
        assert.match(hint, /SameSite=Lax/);
        assert.match(hint, /Max-Age=604800/);
        assert.match(cookies.find(x => x.startsWith('sd_session=')), /HttpOnly/);
        const stored = await c.inner.getProfile(SID);
        assert.equal(stored.name, 'Pau');
        assert.equal(stored.ext.avatar, 'https://cdn/f.jpg');
    } finally {
        await app.close();
    }
});

test('sd_hint: refreshed by /api/me when logged in, cleared when not, cleared on logout', async () => {
    const app = await startApp({ fetchImpl: steamFetch({}), store: createMemoryStore() });
    try {
        // logged in without the hint (e.g. a session from before this feature): the hint is added
        let r = await fetch(app.base + '/api/me', { headers: { Cookie: sessionCookie() } });
        assert.match(r.headers.get('set-cookie'), /^sd_hint=1;/);
        // hint already there: nothing to set
        r = await fetch(app.base + '/api/me', { headers: { Cookie: sessionCookie() + '; sd_hint=1' } });
        assert.equal(r.headers.get('set-cookie'), null);
        // hint without a valid session: cleared
        r = await fetch(app.base + '/api/me', { headers: { Cookie: 'sd_hint=1' } });
        assert.deepEqual(await r.json(), { loggedIn: false });
        assert.match(r.headers.get('set-cookie'), /^sd_hint=;.*Max-Age=0/);
        // plain guest: no cookie traffic
        r = await fetch(app.base + '/api/me');
        assert.equal(r.headers.get('set-cookie'), null);
        // logout clears both
        r = await fetch(app.base + '/auth/logout', { method: 'POST', headers: { Cookie: sessionCookie() + '; sd_hint=1', Origin: 'http://localhost:3000', Accept: 'application/json' } });
        assert.equal(r.status, 200);
        const cleared = r.headers.getSetCookie();
        assert.ok(cleared.some(c => /^sd_session=;.*Max-Age=0/.test(c)));
        assert.ok(cleared.some(c => /^sd_hint=;.*Max-Age=0/.test(c)));
        // a plain form post goes back to the same page
        r = await fetch(app.base + '/auth/logout?next=/cajas', { method: 'POST', redirect: 'manual', headers: { Cookie: sessionCookie(), Origin: 'http://localhost:3000', Accept: 'text/html' } });
        assert.equal(r.status, 303);
        assert.equal(r.headers.get('location'), '/cajas');
    } finally {
        await app.close();
    }
});
