'use strict';

// Daily free case: cooldown, streak, inventory/history/stats, persisted ext.rewards, HTTP guards.

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { buildConfig, createHandler, createToken } = require('../lib/app.js');
const { createMemoryStore } = require('../lib/store.js');
const engine = require('../public/js/engine.js');
const rewards = require('../lib/routes/rewards.js');
const feedRoutes = require('../lib/routes/feed.js');
const feedHook = require('../lib/hooks/feed.js');

const { claimDaily, dailyStatus, COOLDOWN_MS, STREAK_WINDOW_MS } = rewards;
const HOUR = 60 * 60 * 1000;
const T0 = Date.UTC(2026, 9, 14, 12, 0, 0);

const SECRET = 'test-secret-0123456789abcdef0123456789abcdef';
const SID = '76561198000000001';

// Applies claimDaily the way lib/app.js does (state in, state + ext patch out)
function claimAt(profile, now, rng = Math.random) {
    const out = claimDaily(profile.data, {}, rng, now, { steamId: SID, ext: JSON.parse(JSON.stringify(profile.ext)) });
    return { data: out.state, ext: Object.assign({}, profile.ext, out.ext), result: out.result };
}

const fresh = () => ({ data: engine.defaultState(), ext: { rewards: {} } });

test('first claim: a valid inventory item, history, stats and ext.rewards', () => {
    const out = claimAt(fresh(), T0);
    const item = out.result.item;
    assert.equal(out.data.inventory.length, 1);
    assert.deepEqual(out.data.inventory[0], item);
    const info = engine.skinInfo(item.id);
    assert.deepEqual({ id: item.id, name: item.name, price: item.price, rarity: item.rarity }, { id: info.id, name: info.name, price: info.price, rarity: info.rarity });
    assert.ok(engine.isUid(item.uid));
    assert.equal(out.data.history.length, 1);
    assert.equal(out.data.history[0].caseName, 'Caja Diaria');
    assert.equal(out.data.history[0].timestamp, T0);
    assert.equal(out.data.history[0].uid, item.uid);
    assert.equal(out.data.stats.casesOpened, 1);
    assert.equal(out.data.stats.totalWon, item.price);
    assert.equal(out.data.stats.totalSpent, 0);
    assert.equal(out.data.stats.rarityDrops[item.rarity], 1);
    assert.equal(out.data.balance, 0);
    assert.deepEqual(out.ext.rewards, { lastClaim: T0, streak: 1, totalClaims: 1 });
    assert.equal(out.result.nextClaimAt, T0 + COOLDOWN_MS);
    assert.equal(out.result.caseName, 'Caja Diaria');
    // the result is a state the engine accepts as-is
    assert.deepEqual(engine.normalizeState(out.data), out.data);
});

test('cooldown is 24 h rolling from the last claim', () => {
    const first = claimAt(fresh(), T0);
    for (const dt of [0, 1, 12 * HOUR, 24 * HOUR - 1]) {
        assert.throws(() => claimAt(first, T0 + dt), e => e.isEngineError && e.code === 'daily_cooldown', `dt=${dt}`);
    }
    const second = claimAt(first, T0 + COOLDOWN_MS);
    assert.equal(second.data.inventory.length, 2);
    assert.equal(second.ext.rewards.lastClaim, T0 + COOLDOWN_MS);
    assert.equal(second.ext.rewards.totalClaims, 2);
    assert.notEqual(second.data.inventory[0].uid, second.data.inventory[1].uid);
});

test('streak: +1 per claim within 48 h, capped at 7, reset after a longer gap', () => {
    let p = claimAt(fresh(), T0);
    let t = T0;
    const seen = [p.ext.rewards.streak];
    for (let i = 0; i < 8; i++) {
        t += COOLDOWN_MS + HOUR;                 // 25 h later: inside the 48 h window
        p = claimAt(p, t);
        seen.push(p.ext.rewards.streak);
    }
    assert.deepEqual(seen, [1, 2, 3, 4, 5, 6, 7, 7, 7]);

    t += STREAK_WINDOW_MS + 1;                    // too late: starts over
    p = claimAt(p, t);
    assert.equal(p.ext.rewards.streak, 1);
    assert.equal(p.result.streak, 1);
});

test('streak >= 3 rolls the better case', () => {
    // 0.975 of the way through the odds: milspec in the normal case, restricted in the improved one
    const rng = () => 0.975;
    let p = claimAt(fresh(), T0, rng);
    assert.equal(p.result.tier, 'normal');
    assert.equal(p.result.item.rarity, 'milspec');
    p = claimAt(p, T0 + 25 * HOUR, rng);
    assert.equal(p.result.tier, 'normal');
    p = claimAt(p, T0 + 50 * HOUR, rng);
    assert.equal(p.result.streak, 3);
    assert.equal(p.result.tier, 'bonus');
    assert.equal(p.result.item.rarity, 'restricted');
});

test('expected value of both cases is small (0.10 - 0.30 EUR) and only cheap fixed contents', () => {
    for (const [tier, odds] of Object.entries(rewards.TIERS)) {
        const total = Object.values(odds).reduce((a, b) => a + b, 0);
        assert.ok(Math.abs(total - 100) < 1e-9, tier);
        let ev = 0;
        for (const [rarity, pct] of Object.entries(odds)) {
            const pool = rewards.POOLS[rarity].map(id => engine.skinInfo(id));
            assert.ok(pool.every(x => x && x.rarity === rarity), `${rarity}: every id exists in the catalog with that rarity`);
            ev += (pct / 100) * pool.reduce((s, x) => s + x.price, 0) / pool.length;
            assert.ok(['consumer', 'industrial', 'milspec', 'restricted', 'classified'].includes(rarity));
        }
        assert.ok(ev >= 0.10 && ev <= 0.30, `${tier} EV ${ev}`);
    }
});

test('rolled items are always valid catalog skins (rng edge values)', () => {
    for (const x of [0, 0.0001, 0.5, 0.9, 0.9999999]) {
        const out = claimAt(fresh(), T0, () => x);
        assert.ok(engine.skinInfo(out.result.item.id), `rng ${x}`);
    }
});

test('a full inventory blocks the claim without consuming the cooldown', () => {
    const p = fresh();
    for (let i = 0; i < engine.constants.INVENTORY_LIMIT; i++) {
        p.data.inventory.push({ uid: 'x' + i, id: 1, name: 'x', price: 0.05, rarity: 'consumer' });
    }
    assert.throws(() => claimAt(p, T0), e => e.isEngineError && e.code === 'inventory_full');
});

test('dailyStatus: ready, cooling down, lapsed streak, clock skew', () => {
    assert.equal(dailyStatus({}, T0).canClaim, true);
    assert.equal(dailyStatus({}, T0).streak, 0);
    assert.equal(dailyStatus(undefined, T0).nextStreak, 1);

    const rw = { lastClaim: T0, streak: 4 };
    let st = dailyStatus(rw, T0 + HOUR);
    assert.equal(st.canClaim, false);
    assert.equal(st.nextClaimAt, T0 + COOLDOWN_MS);
    assert.equal(st.streak, 4);
    assert.equal(st.nextStreak, 5);
    st = dailyStatus(rw, T0 + COOLDOWN_MS);
    assert.equal(st.canClaim, true);
    st = dailyStatus(rw, T0 + STREAK_WINDOW_MS + 1);
    assert.equal(st.canClaim, true);
    assert.equal(st.streak, 0);
    assert.equal(st.nextStreak, 1);
    // lastClaim in the future (another instance's clock): never locked for more than 24 h
    st = dailyStatus({ lastClaim: T0 + 10 * 24 * HOUR, streak: 2 }, T0);
    assert.ok(st.nextClaimAt <= T0 + COOLDOWN_MS);
    // garbage in storage
    assert.equal(dailyStatus({ lastClaim: 'x', streak: -5 }, T0).canClaim, true);
});

// ---------------------------------------------------------------- HTTP
function sessionCookie(sid = SID) {
    const now = Math.floor(Date.now() / 1000);
    return 'sd_session=' + encodeURIComponent(createToken(SECRET, { t: 'session', sid, iat: now, exp: now + 3600 }));
}

async function startServer(store = createMemoryStore()) {
    const config = buildConfig({ PORT: '0', BASE_URL: 'http://localhost:3000', SESSION_SECRET: SECRET });
    const handler = createHandler(config, {
        store,
        fetchImpl: async () => { throw new Error('no network in tests'); },
        hookModules: [feedHook],
        routeModules: [feedRoutes, rewards]
    });
    const server = http.createServer(handler);
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    return { store, base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(r => server.close(r)) };
}

function call(base, path, { method = 'GET', body, sid, headers = {} } = {}) {
    return fetch(base + path, {
        method,
        headers: Object.assign(
            { Origin: 'http://localhost:3000' },
            sid ? { Cookie: sessionCookie(sid) } : {},
            body !== undefined ? { 'Content-Type': 'application/json' } : {},
            headers
        ),
        body: body !== undefined ? JSON.stringify(body) : undefined
    }).then(async r => ({ status: r.status, headers: r.headers, json: await r.json().catch(() => null) }));
}

test('HTTP: guests and bad requests are rejected', async () => {
    const srv = await startServer();
    try {
        assert.equal((await call(srv.base, '/api/rewards')).status, 401);
        assert.equal((await call(srv.base, '/api/rewards/claim', { method: 'POST', body: {} })).status, 401);
        assert.equal((await call(srv.base, '/api/rewards/claim', { method: 'POST', body: {}, sid: SID, headers: { Origin: 'https://evil.example' } })).status, 403);
        assert.equal((await call(srv.base, '/api/rewards/claim', { sid: SID })).status, 405);
        assert.equal((await call(srv.base, '/api/rewards', { method: 'POST', body: {}, sid: SID })).status, 405);
        assert.equal((await srv.store.getProfile(SID)), null, 'rejected requests never create a profile');
    } finally {
        await srv.close();
    }
});

test('HTTP: claim once, cooldown after, status and persisted ext.rewards', async () => {
    const srv = await startServer();
    try {
        let r = await call(srv.base, '/api/rewards', { sid: SID });
        assert.equal(r.status, 200);
        assert.equal(r.json.canClaim, true);
        assert.equal(r.json.streak, 0);
        assert.equal(r.json.tier, 'normal');
        assert.equal(typeof r.json.serverNow, 'number');
        assert.equal(r.headers.get('cache-control'), 'no-store');

        const t0 = Date.now();
        r = await call(srv.base, '/api/rewards/claim', { method: 'POST', body: {}, sid: SID });
        assert.equal(r.status, 200);
        const { state, result } = r.json;
        assert.equal(state.inventory.length, 1);
        assert.equal(state.inventory[0].uid, result.item.uid);
        assert.equal(state.history[0].caseName, 'Caja Diaria');
        assert.equal(state.stats.casesOpened, 1);
        assert.equal(state.fair, undefined);
        assert.equal(state.ext, undefined);
        assert.equal(result.streak, 1);
        assert.ok(result.nextClaimAt >= t0 + COOLDOWN_MS && result.nextClaimAt <= Date.now() + COOLDOWN_MS);

        const again = await call(srv.base, '/api/rewards/claim', { method: 'POST', body: {}, sid: SID });
        assert.equal(again.status, 400);
        assert.equal(again.json.code, 'daily_cooldown');
        const st = await call(srv.base, '/api/state', { sid: SID });
        assert.equal(st.json.state.inventory.length, 1, 'no second item');

        r = await call(srv.base, '/api/rewards', { sid: SID });
        assert.equal(r.json.canClaim, false);
        assert.equal(r.json.nextClaimAt, result.nextClaimAt);
        assert.equal(r.json.streak, 1);

        const profile = await srv.store.getProfile(SID);
        assert.equal(profile.ext.rewards.lastClaim, result.nextClaimAt - COOLDOWN_MS);
        assert.equal(profile.ext.rewards.streak, 1);
        assert.equal(profile.ext.rewards.totalClaims, 1);
    } finally {
        await srv.close();
    }
});

test('HTTP: two simultaneous claims give exactly one item', async () => {
    const srv = await startServer();
    try {
        const out = await Promise.all([1, 2, 3].map(() => call(srv.base, '/api/rewards/claim', { method: 'POST', body: {}, sid: SID })));
        assert.deepEqual(out.map(o => o.status).sort(), [200, 400, 400]);
        const st = await call(srv.base, '/api/state', { sid: SID });
        assert.equal(st.json.state.inventory.length, 1);
    } finally {
        await srv.close();
    }
});

test('HTTP: players have independent cooldowns and a rewards ext of their own', async () => {
    const srv = await startServer();
    try {
        assert.equal((await call(srv.base, '/api/rewards/claim', { method: 'POST', body: {}, sid: SID })).status, 200);
        assert.equal((await call(srv.base, '/api/rewards/claim', { method: 'POST', body: {}, sid: '76561198000000002' })).status, 200);
        assert.equal((await call(srv.base, '/api/rewards', { sid: '76561198000000003' })).json.canClaim, true);
    } finally {
        await srv.close();
    }
});
