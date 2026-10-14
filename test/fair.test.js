'use strict';

// Provably fair: deterministic rng, node:crypto vs WebCrypto, nonce persistence, rotation, no seed leaks, replay.

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { buildConfig, createHandler, createGame, createToken } = require('../lib/app.js');
const { createMemoryStore } = require('../lib/store.js');
const { createHooks } = require('../lib/hooks/defaults.js');
const F = require('../lib/fair.js');
const fairHook = require('../lib/hooks/fair.js');
const fairRoutes = require('../lib/routes/fair.js');
const browserFair = require('../public/js/fair.js');
const engine = require('../public/js/engine.js');

const SECRET = 'test-secret-0123456789abcdef0123456789abcdef';
const SID = '76561198000000001';
const SEED = 'a'.repeat(64);

function sessionCookie(sid = SID) {
    const now = Math.floor(Date.now() / 1000);
    return 'sd_session=' + encodeURIComponent(createToken(SECRET, { t: 'session', sid, iat: now, exp: now + 3600 }));
}

async function startServer() {
    const config = buildConfig({ PORT: '0', BASE_URL: 'http://localhost:3000', SESSION_SECRET: SECRET });
    const store = createMemoryStore();
    const handler = createHandler(config, { store, fetchImpl: async () => { throw new Error('offline'); } });
    const server = http.createServer(handler);
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    return { store, base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(r => server.close(r)) };
}

function api(base, path, { method = 'POST', body, cookie = sessionCookie() } = {}) {
    return fetch(base + path, {
        method,
        headers: Object.assign({ Origin: 'http://localhost:3000', Cookie: cookie }, body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        body: body !== undefined ? JSON.stringify(body) : undefined
    }).then(async r => ({ status: r.status, text: await r.clone().text(), json: await r.json().catch(() => null) }));
}

// A game wired like the real handler: fair hook + fair actions, memory store
function fairGame() {
    const store = createMemoryStore();
    const hooks = createHooks({ rng: Math.random });
    fairHook.install(hooks, {});
    const actions = Object.assign({}, engine.actions);
    const router = { get() {}, action() {} };
    fairRoutes.register(router, { actions, game: null });
    const game = createGame({ store, hooks, actions });
    return { store, game };
}

const rich = { balance: 1000, inventory: [], stats: {}, history: [], promosUsed: [] };

test('rng is deterministic, in [0,1), depends on every input, and follows the documented layout', () => {
    const a = F.floats(SEED, 'client', 7, 40);
    const b = F.floats(SEED, 'client', 7, 40);
    assert.deepEqual(a, b);
    assert.ok(a.every(x => x >= 0 && x < 1));
    assert.equal(new Set(a).size, 40);
    assert.notDeepEqual(a.slice(0, 8), F.floats(SEED, 'client', 8, 8));
    assert.notDeepEqual(a.slice(0, 8), F.floats(SEED, 'other', 7, 8));
    assert.notDeepEqual(a.slice(0, 8), F.floats('b'.repeat(64), 'client', 7, 8));

    // float k = uint32_be(HMAC(seed, `${client}:${nonce}:${floor(k/8)}`)[4*(k%8)..]) / 2^32
    const block1 = F.hmacBlock(SEED, 'client', 7, 1);
    assert.equal(block1.length, 32);
    assert.equal(a[8 + 3], block1.readUInt32BE(12) / 2 ** 32);
    assert.equal(a[0], F.hmacBlock(SEED, 'client', 7, 0).readUInt32BE(0) / 2 ** 32);
    // sha256 of the seed string
    assert.equal(F.sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('node:crypto and WebCrypto give identical floats and hashes', async () => {
    assert.ok(globalThis.crypto && globalThis.crypto.subtle, 'WebCrypto available');
    for (const [seed, client, nonce] of [[SEED, 'client', 0], [F.newServerSeed(), F.newClientSeed(), 12345], [F.newServerSeed(), 'a_b-C9', 3]]) {
        const server = F.floats(seed, client, nonce, 100);
        const web = await browserFair.floats(seed, client, nonce, 100);
        assert.deepEqual(web, server);
        assert.equal(await browserFair.sha256Hex(seed), F.sha256Hex(seed));
    }
    // the sync rng wrapper hands the same sequence out
    const rng = await browserFair.createRng(SEED, 'client', 0, 20);
    const srv = F.createRng(SEED, 'client', 0);
    for (let i = 0; i < 20; i++) assert.equal(rng(), srv());
    assert.throws(() => rng(), /agotaron/);
});

test('every game action bumps the nonce by exactly 1, persisted atomically', async () => {
    const { store, game } = fairGame();
    await store.createProfile(SID, null);
    assert.equal(await store.updateProfile(SID, 0, rich), true);

    const first = await game.runAction(SID, 'openCase', { caseId: 1 });
    assert.equal(first.meta.nonce, 0);
    assert.match(first.meta.serverSeedHash, /^[0-9a-f]{64}$/);
    assert.match(first.meta.clientSeed, /^[0-9a-f]{16}$/);
    assert.deepEqual(Object.keys(first.meta).sort(), ['clientSeed', 'nonce', 'serverSeedHash']);

    const second = await game.runAction(SID, 'openCase', { caseId: 2 });
    const third = await game.runAction(SID, 'sellItems', { uids: [first.result.item.uid] });
    assert.equal(second.meta.nonce, 1);
    assert.equal(third.meta.nonce, 2);
    assert.equal(third.meta.serverSeedHash, first.meta.serverSeedHash);

    const p = await store.getProfile(SID);
    assert.equal(p.ext.fair.nonce, 3);
    assert.equal(p.ext.fair.serverSeedHash, F.sha256Hex(p.ext.fair.serverSeed));

    // a failed action (engine error) persists nothing, so the nonce is not burnt
    await assert.rejects(() => game.runAction(SID, 'openCase', { caseId: 9999 }));
    assert.equal((await store.getProfile(SID)).ext.fair.nonce, 3);
    assert.equal((await game.runAction(SID, 'openCase', { caseId: 1 })).meta.nonce, 3);
});

test('replaying an openCase with the stored seed reproduces the item (node and browser versions)', async () => {
    const { store, game } = fairGame();
    await store.createProfile(SID, null);
    await store.updateProfile(SID, 0, rich);
    const outs = [];
    for (let i = 0; i < 5; i++) outs.push(await game.runAction(SID, 'openCase', { caseId: 3 }));

    const fair = (await store.getProfile(SID)).ext.fair;
    outs.forEach(out => {
        const state = Object.assign(engine.defaultState(), { balance: 1000000 });
        const mine = engine.openCase(state, { caseId: 3 }, F.createRng(fair.serverSeed, out.meta.clientSeed, out.meta.nonce), 0);
        assert.equal(mine.result.item.id, out.result.item.id);
        assert.equal(mine.result.item.uid, out.result.item.uid);
    });
    for (const out of outs) {
        const re = await browserFair.replay(engine, { game: 'open', caseId: 3, serverSeed: fair.serverSeed, clientSeed: out.meta.clientSeed, nonce: out.meta.nonce });
        assert.equal(re.result.item.id, out.result.item.id);
        assert.equal(re.result.item.uid, out.result.item.uid);
        assert.equal(re.floats.length, 5);
    }
});

test('replay reproduces upgrades and battles (with and without client-chosen bots)', async () => {
    const { store, game } = fairGame();
    await store.createProfile(SID, null);
    await store.updateProfile(SID, 0, rich);
    const up = await game.runAction(SID, 'upgrade', { uids: [], balanceStake: 10, targetId: 19, mode: 'over' });
    const bots = engine.constants.BOT_NAMES.slice(0, 3);
    const b1 = await game.runAction(SID, 'battle', { caseIds: [1, 2, 3], mode: '1v1v1v1', crazy: true, botNames: bots });
    const b2 = await game.runAction(SID, 'battle', { caseIds: [1, 5], mode: '2v2' });
    const fair = (await store.getProfile(SID)).ext.fair;
    const base = { serverSeed: fair.serverSeed, clientSeed: up.meta.clientSeed };

    const ru = await browserFair.replay(engine, Object.assign({ game: 'upgrade', stake: 10, targetId: 19, mode: 'over', nonce: up.meta.nonce }, base));
    assert.equal(ru.result.roll, up.result.roll);
    assert.equal(ru.result.win, up.result.win);

    const r1 = await browserFair.replay(engine, Object.assign({ game: 'battle', mode: '1v1v1v1', crazy: true, caseIds: [1, 2, 3], nonce: b1.meta.nonce }, base));
    assert.deepEqual(r1.result.rounds, b1.result.rounds);
    assert.equal(r1.result.winnerTeam, b1.result.winnerTeam);

    const r2 = await browserFair.replay(engine, Object.assign({ game: 'battle', mode: '2v2', caseIds: [1, 5], serverBots: true, nonce: b2.meta.nonce }, base));
    assert.deepEqual(r2.result.rounds, b2.result.rounds);
    assert.deepEqual(r2.result.seats.map(s => s.name), b2.result.seats.map(s => s.name));
});

test('HTTP: GET /api/fair, rotate reveals a seed matching the published hash, seeds never leak', async () => {
    const srv = await startServer();
    try {
        assert.equal((await api(srv.base, '/api/fair', { method: 'GET', cookie: '' })).status, 401);
        assert.equal((await api(srv.base, '/api/fair/rotate', { body: {}, cookie: '' })).status, 401);
        assert.equal((await api(srv.base, '/api/fair', { body: {} })).status, 405);

        const g1 = await api(srv.base, '/api/fair', { method: 'GET' });
        assert.equal(g1.status, 200);
        assert.deepEqual(Object.keys(g1.json).sort(), ['clientSeed', 'nonce', 'revealed', 'serverSeedHash']);
        assert.equal(g1.json.nonce, 0);
        assert.deepEqual(g1.json.revealed, []);
        const hash0 = g1.json.serverSeedHash;
        assert.equal((await api(srv.base, '/api/fair', { method: 'GET' })).json.serverSeedHash, hash0, 'GET is stable');

        assert.equal((await api(srv.base, '/api/promo', { body: { code: 'test' } })).status, 200);
        const open = await api(srv.base, '/api/open', { body: { caseId: 1 } });
        assert.equal(open.status, 200);
        assert.deepEqual(open.json.fair, { serverSeedHash: hash0, clientSeed: g1.json.clientSeed, nonce: 1 });
        const open2 = await api(srv.base, '/api/open', { body: { caseId: 1 } });
        assert.equal(open2.json.fair.nonce, 2);
        assert.equal((await api(srv.base, '/api/fair', { method: 'GET' })).json.nonce, 3);

        const stored = (await srv.store.getProfile(SID)).ext.fair;
        const secret = stored.serverSeed;
        assert.equal(F.sha256Hex(secret), hash0);

        // the secret is nowhere in any response so far
        const state = await api(srv.base, '/api/state', { method: 'GET' });
        for (const r of [g1, open, open2, state, await api(srv.base, '/api/fair', { method: 'GET' }), await api(srv.base, '/api/me', { method: 'GET' })]) {
            assert.ok(!r.text.includes(secret), 'serverSeed leaked');
        }

        // bad client seeds
        for (const bad of ['has space', 'x'.repeat(65), 'ñandú', 5, ['a']]) {
            const r = await api(srv.base, '/api/fair/rotate', { body: { clientSeed: bad } });
            assert.equal(r.status, 400, JSON.stringify(bad));
            assert.equal(r.json.code, 'invalid_client_seed');
        }
        assert.equal((await srv.store.getProfile(SID)).ext.fair.serverSeed, secret, 'a rejected rotate changes nothing');

        // rotate
        const rot = await api(srv.base, '/api/fair/rotate', { body: { clientSeed: 'my-new_seed1' } });
        assert.equal(rot.status, 200);
        assert.equal(rot.json.fair, undefined, 'rotate does not burn a nonce');
        const res = rot.json.result;
        assert.equal(res.clientSeed, 'my-new_seed1');
        assert.equal(res.nonce, 0);
        assert.notEqual(res.serverSeedHash, hash0);
        assert.equal(res.previous.serverSeed, secret);
        assert.equal(F.sha256Hex(res.previous.serverSeed), hash0);
        assert.equal(res.previous.serverSeedHash, hash0);
        assert.equal(res.previous.nonces, 3);   // promo (0), open (1), open (2)
        assert.equal(res.previous.clientSeed, g1.json.clientSeed);
        assert.deepEqual(res.revealed[0], res.previous);

        // the NEW secret never leaks, GET shows the revealed one
        const newSecret = (await srv.store.getProfile(SID)).ext.fair.serverSeed;
        assert.notEqual(newSecret, secret);
        assert.equal(F.sha256Hex(newSecret), res.serverSeedHash);
        assert.ok(!rot.text.includes(newSecret));
        const g2 = await api(srv.base, '/api/fair', { method: 'GET' });
        assert.ok(!g2.text.includes(newSecret));
        assert.equal(g2.json.revealed.length, 1);
        assert.equal(g2.json.nonce, 0);

        // omitted client seed keeps the current one; nonce restarts with the new seed
        const keep = await api(srv.base, '/api/fair/rotate', { body: {} });
        assert.equal(keep.json.result.clientSeed, 'my-new_seed1');
        assert.equal(keep.json.result.revealed.length, 2);
        const o3 = await api(srv.base, '/api/open', { body: { caseId: 1 } });
        assert.equal(o3.json.fair.nonce, 0);
        assert.equal(o3.json.fair.clientSeed, 'my-new_seed1');
        assert.ok(!o3.text.includes((await srv.store.getProfile(SID)).ext.fair.serverSeed));

        // the revealed seed reproduces the items of both opens
        const re = await browserFair.replay(engine, {
            game: 'open', caseId: 1, serverSeed: res.previous.serverSeed, clientSeed: res.previous.clientSeed, nonce: open.json.fair.nonce
        });
        assert.equal(re.result.item.uid, open.json.result.item.uid);
        assert.equal(re.result.item.id, open.json.result.item.id);
        const re2 = await browserFair.replay(engine, {
            game: 'open', caseId: 1, serverSeed: res.previous.serverSeed, clientSeed: res.previous.clientSeed, nonce: open2.json.fair.nonce
        });
        assert.equal(re2.result.item.uid, open2.json.result.item.uid);
    } finally {
        await srv.close();
    }
});

test('first game action creates the commitment; only the last 10 revealed seeds are kept', async () => {
    const srv = await startServer();
    try {
        await api(srv.base, '/api/promo', { body: { code: 'test' } });
        const first = await api(srv.base, '/api/open', { body: { caseId: 1 } });
        assert.equal(first.json.fair.nonce, 1);   // promo was nonce 0
        const hashes = [first.json.fair.serverSeedHash];
        for (let i = 0; i < 12; i++) {
            const r = await api(srv.base, '/api/fair/rotate', { body: {} });
            assert.equal(r.status, 200);
            hashes.push(r.json.result.serverSeedHash);
        }
        const g = await api(srv.base, '/api/fair', { method: 'GET' });
        assert.equal(g.json.revealed.length, F.REVEALED_LIMIT);
        assert.deepEqual(g.json.revealed.map(r => r.serverSeedHash), hashes.slice(2, 12).reverse());
        g.json.revealed.forEach(r => assert.equal(F.sha256Hex(r.serverSeed), r.serverSeedHash));
        assert.equal(g.json.revealed[0].nonces, 0);
    } finally {
        await srv.close();
    }
});

test('concurrent actions and rotations never reuse a nonce or lose a commitment', async () => {
    const srv = await startServer();
    try {
        await api(srv.base, '/api/promo', { body: { code: 'test' } });
        const results = await Promise.all(Array.from({ length: 12 }, () => api(srv.base, '/api/open', { body: { caseId: 1 } })));
        const nonces = results.filter(r => r.status === 200).map(r => r.json.fair.nonce).sort((a, b) => a - b);
        assert.equal(new Set(nonces).size, nonces.length, 'unique nonces');
        const stored = (await srv.store.getProfile(SID)).ext.fair;
        assert.equal(stored.nonce, 1 + nonces.length);
        // simultaneous GETs on a fresh account create ONE commitment
        const other = '76561198000000002';
        const gets = await Promise.all(Array.from({ length: 6 }, () => api(srv.base, '/api/fair', { method: 'GET', cookie: sessionCookie(other) })));
        assert.equal(new Set(gets.map(g => g.json.serverSeedHash)).size, 1);
        assert.equal((await srv.store.getProfile(other)).ext.fair.serverSeedHash, gets[0].json.serverSeedHash);
    } finally {
        await srv.close();
    }
});

test('a corrupt stored record never reuses a mismatching hash', () => {
    assert.equal(F.isValid(null), false);
    const ok = F.newState();
    assert.equal(F.isValid(ok), true);
    assert.equal(F.isValid(Object.assign({}, ok, { serverSeedHash: 'f'.repeat(64) })), false);
    assert.equal(F.isValid(Object.assign({}, ok, { clientSeed: 'no good' })), false);
    assert.equal(F.isValid(Object.assign({}, ok, { nonce: -1 })), false);
    assert.equal(F.isValid(Object.assign({}, ok, { nonce: 1.5 })), false);
});
