'use strict';

// Live feed (drops), leaderboard upkeep and the public /api/feed + /api/leaderboard endpoints.

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { buildConfig, createHandler, createToken } = require('../lib/app.js');
const { createMemoryStore } = require('../lib/store.js');
const { createFeed, isNotable, leaderboardColumns, constants } = require('../lib/feed.js');
const feedHook = require('../lib/hooks/feed.js');
const feedRoutes = require('../lib/routes/feed.js');
const rewardsRoutes = require('../lib/routes/rewards.js');

const SECRET = 'test-secret-0123456789abcdef0123456789abcdef';
const SID = '76561198000000001';
const SID2 = '76561198000000002';

// Store whose tables count every call (the PS_Database budget is 120 requests/min for the whole site)
function countingStore(store = createMemoryStore()) {
    const calls = [];
    const real = store.table;
    store.table = slug => {
        const t = real(slug);
        const wrap = name => (...a) => { calls.push(`${slug}.${name}`); return t[name](...a); };
        return { list: wrap('list'), get: wrap('get'), insert: wrap('insert'), update: wrap('update') };
    };
    store.calls = calls;
    return store;
}

function profileOf(over = {}) {
    return Object.assign({
        steamId: SID,
        name: 'Tester',
        version: 1,
        ext: { avatar: 'https://avatars.example/a.jpg' },
        data: {
            balance: 0, inventory: [], history: [], promosUsed: [],
            stats: { casesOpened: 3, totalSpent: 10, totalWon: 14.5, rarityDrops: {} }
        }
    }, over);
}

// Skins picked from the catalog by rarity (so the tests survive catalog changes); prices rise restricted < classified < covert
const catalog = require('../public/js/data.js');
const byPrice = (rarity, pred = () => true) => catalog.skins[rarity].filter(pred).sort((a, b) => a.price - b.price);
const SKIN = {
    consumer: byPrice('consumer')[0].id,
    milspec: byPrice('milspec', x => x.price < 1)[0].id,
    restricted: byPrice('restricted')[0].id,
    classified: byPrice('classified', x => x.price >= 15)[0].id,
    covert: byPrice('covert').pop().id
};
const priceOf = id => require('../public/js/engine.js').skinInfo(id).price;

function entry(id) {
    const info = require('../public/js/engine.js').skinInfo(id);
    return { uid: 'u' + id, id, name: info.name, price: info.price, rarity: info.rarity };
}

function fakeCtx(store) {
    return { store, config: { steamApiKey: '' }, fetch: async () => { throw new Error('no network'); } };
}

// ---------------------------------------------------------------- recording drops
test('isNotable: restricted or better, or worth >= 1 EUR', () => {
    assert.equal(constants.DROP_MIN_RARITY, 'restricted');
    assert.equal(constants.DROP_MIN_PRICE, 1);
    assert.equal(isNotable({ price: 0.8, rarity: 'milspec' }), false);
    assert.equal(isNotable({ price: 3.5, rarity: 'restricted' }), true);
    assert.equal(isNotable({ price: 1, rarity: 'consumer' }), true);
    assert.equal(isNotable({ price: 0.99, rarity: 'industrial' }), false);
    assert.equal(isNotable({ price: 8.5, rarity: 'classified' }), true);
});

test('recordDrop: only notable items, one insert per action, the most valuable of a battle', async () => {
    const store = countingStore();
    const feed = createFeed(fakeCtx(store));
    const ev = (action, result, extra) => Object.assign({ steamId: SID, action, result, profile: profileOf() }, extra);

    // not notable
    assert.equal(await feed.recordDrop(ev('openCase', { caseId: 1, item: entry(SKIN.consumer) })), null);
    assert.equal(await feed.recordDrop(ev('openCase', { caseId: 1, item: entry(SKIN.milspec) })), null);
    // unrelated actions are ignored
    assert.equal(await feed.recordDrop(ev('sellItems', { sold: [entry(SKIN.covert)] })), null);
    assert.equal(await feed.recordDrop(ev('redeemPromo', { amount: 5 })), null);
    assert.equal(store.calls.filter(c => c === 'drops.insert').length, 0);

    // case opening: recorded with the player's name, avatar and the case name
    const row = await feed.recordDrop(ev('openCase', { caseId: 8, item: entry(SKIN.covert) }));
    assert.equal(row['steam-id'], SID);
    assert.equal(row.name, 'Tester');
    assert.equal(row.avatar, 'https://avatars.example/a.jpg');
    assert.equal(row['item-id'], SKIN.covert);
    assert.equal(row.rarity, 'covert');
    assert.equal(row.source, 'case');
    assert.equal(row['case-name'], 'Caja Dragon');

    // upgrade: only wins count
    assert.equal(await feed.recordDrop(ev('upgrade', { win: false, item: null })), null);
    const up = await feed.recordDrop(ev('upgrade', { win: true, item: entry(SKIN.classified) }));
    assert.equal(up.source, 'upgrade');

    // battle: lost -> nothing; won with many items -> ONE insert, the most valuable
    assert.equal(await feed.recordDrop(ev('battle', { won: false, items: [] })), null);
    const before = store.calls.filter(c => c === 'drops.insert').length;
    const battle = await feed.recordDrop(ev('battle', {
        won: true, items: [entry(SKIN.restricted), entry(SKIN.covert), entry(SKIN.classified), entry(SKIN.consumer)]
    }));
    assert.equal(battle['item-id'], SKIN.covert);
    assert.equal(battle.source, 'battle');
    assert.equal(store.calls.filter(c => c === 'drops.insert').length, before + 1);

    // daily case
    const daily = await feed.recordDrop(ev('claimDaily', { item: entry(SKIN.restricted) }));
    assert.equal(daily.source, 'daily');
    assert.equal(daily['case-name'], 'Caja Diaria');

    const rows = await store.table('drops').list({});
    assert.equal(rows.length, 4);
});

test('recordDrop trusts the catalog, not the item sent in the event', async () => {
    const store = createMemoryStore();
    const feed = createFeed(fakeCtx(store));
    const row = await feed.recordDrop({
        steamId: SID, action: 'openCase', profile: profileOf(),
        result: { caseId: 1, item: { id: SKIN.restricted, price: 99999, rarity: 'gold', name: 'x' } }
    });
    assert.equal(row.price, priceOf(SKIN.restricted));
    assert.equal(row.rarity, 'restricted');
    assert.equal(await feed.recordDrop({ steamId: SID, action: 'openCase', profile: profileOf(), result: { item: { id: 999999 } } }), null);
});

test('other modules can add drop sources through feed.extractors', async () => {
    const store = createMemoryStore();
    const feed = createFeed(fakeCtx(store));
    feed.extractors.joinLobby = ev => [{ item: ev.result.prize, source: 'pvp', caseName: 'PvP' }];
    const row = await feed.recordDrop({ steamId: SID, action: 'joinLobby', profile: profileOf(), result: { prize: entry(SKIN.covert) } });
    assert.equal(row.source, 'pvp');
});

// ---------------------------------------------------------------- leaderboard upkeep
test('leaderboardColumns: totals, profit and best drop from history + inventory', () => {
    const cols = leaderboardColumns(profileOf({
        data: {
            inventory: [entry(SKIN.classified)],
            history: [entry(SKIN.restricted), entry(SKIN.consumer)],
            stats: { casesOpened: 7, totalSpent: 20, totalWon: 12.34 }
        }
    }));
    assert.deepEqual(cols, {
        'total-won': 12.34, profit: -7.66, 'cases-opened': 7, 'best-drop-price': priceOf(SKIN.classified), 'best-drop-item-id': SKIN.classified
    });
});

test('leaderboard writes: one row per player, at most one per 60 s, at once when the best drop improves', async () => {
    const store = countingStore();
    let t = 1_000_000;
    const feed = createFeed(fakeCtx(store), { now: () => t });
    const writes = () => store.calls.filter(c => c.startsWith('leaderboard.') && c !== 'leaderboard.list').length;
    const ev = (best) => ({
        steamId: SID,
        profile: profileOf({ data: { inventory: [], history: best ? [entry(best)] : [], stats: { casesOpened: 2, totalSpent: 5, totalWon: 6 } } })
    });

    // nothing to rank yet
    assert.equal(await feed.updateLeaderboard({ steamId: SID, profile: profileOf({ data: { inventory: [], history: [], stats: {} } }) }), 'skipped');
    assert.equal(writes(), 0);

    // first write: update (0 rows) + insert
    assert.equal(await feed.updateLeaderboard(ev(SKIN.restricted)), 'inserted');
    assert.equal(writes(), 2);
    const rows = await store.table('leaderboard').list({});
    assert.equal(rows.length, 1);
    assert.equal(rows[0].name, 'Tester');
    assert.equal(rows[0]['best-drop-item-id'], SKIN.restricted);

    // within the interval, same best drop: skipped without touching the database
    t += 30_000;
    const w = writes();
    assert.equal(await feed.updateLeaderboard(ev(SKIN.restricted)), 'skipped');
    assert.equal(await feed.updateLeaderboard(ev(SKIN.consumer)), 'skipped');
    assert.equal(writes(), w);

    // best drop improved: immediately, as a single update now that the row exists
    assert.equal(await feed.updateLeaderboard(ev(SKIN.classified)), 'updated');
    assert.equal(writes(), w + 1);
    assert.equal((await store.table('leaderboard').list({}))[0]['best-drop-price'], priceOf(SKIN.classified));

    // after the interval: written again (update only)
    t += 61_000;
    assert.equal(await feed.updateLeaderboard(ev(SKIN.classified)), 'updated');
    assert.equal(writes(), w + 2);
    assert.equal((await store.table('leaderboard').list({})).length, 1, 'still one row per player');

    // another player gets their own row
    assert.equal(await feed.updateLeaderboard(Object.assign(ev(SKIN.restricted), { steamId: SID2 })), 'inserted');
    assert.equal((await store.table('leaderboard').list({})).length, 2);
});

test('concurrent actions of one player produce a single leaderboard write', async () => {
    const store = countingStore();
    const feed = createFeed(fakeCtx(store), { now: () => 5_000_000 });
    const ev = { steamId: SID, profile: profileOf() };
    const out = await Promise.all([feed.updateLeaderboard(ev), feed.updateLeaderboard(ev), feed.updateLeaderboard(ev)]);
    assert.deepEqual(out.filter(o => o !== 'skipped').length, 1);
    assert.equal((await store.table('leaderboard').list({})).length, 1);
});

test('leaderboard upsert: unique conflict (409) on insert falls back to an update', async () => {
    const log = [];
    let updates = 0;
    const store = {
        table: slug => ({
            async update(filters, patch) {
                log.push(['update', slug, filters, patch]);
                updates++;
                return updates === 1 ? 0 : 1;      // row not visible at first, then there
            },
            async insert(columns) {
                log.push(['insert', slug, columns]);
                const err = new Error('duplicate');
                err.status = 409;
                throw err;
            }
        })
    };
    const feed = createFeed(fakeCtx(store), { now: () => 1 });
    assert.equal(await feed.updateLeaderboard({ steamId: SID, profile: profileOf() }), 'updated');
    assert.deepEqual(log.map(l => l[0]), ['update', 'insert', 'update']);
    assert.deepEqual(log[0][2], { 'steam-id': `eq.${SID}` });
    assert.equal(log[1][2]['steam-id'], SID);
    assert.equal(log[2][3].name, 'Tester');
});

test('other insert errors are not swallowed by the upsert, and never reach the player (onAfterAction)', async () => {
    const store = {
        table: () => ({
            async update() { return 0; },
            async insert() { const e = new Error('boom'); e.status = 502; throw e; }
        })
    };
    const feed = createFeed(fakeCtx(store), { now: () => 1 });
    await assert.rejects(() => feed.updateLeaderboard({ steamId: SID, profile: profileOf() }), /boom/);
    const warn = console.warn;
    console.warn = () => {};
    try {
        await feed.onAfterAction({ steamId: SID, action: 'openCase', result: { caseId: 8, item: entry(SKIN.covert) }, profile: profileOf() });
    } finally {
        console.warn = warn;
    }
});

// ---------------------------------------------------------------- HTTP
function sessionCookie(sid = SID) {
    const now = Math.floor(Date.now() / 1000);
    return 'sd_session=' + encodeURIComponent(createToken(SECRET, { t: 'session', sid, iat: now, exp: now + 3600 }));
}

async function startServer(store = countingStore()) {
    const config = buildConfig({ PORT: '0', BASE_URL: 'http://localhost:3000', SESSION_SECRET: SECRET });
    const handler = createHandler(config, {
        store,
        rng: () => 0.5,
        fetchImpl: async () => { throw new Error('no network in tests'); },
        hookModules: [feedHook],
        routeModules: [feedRoutes, rewardsRoutes]
    });
    const server = http.createServer(handler);
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    return { store, base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(r => server.close(r)) };
}

function call(base, path, { method = 'GET', body, sid } = {}) {
    return fetch(base + path, {
        method,
        headers: Object.assign(
            { Origin: 'http://localhost:3000' },
            sid ? { Cookie: sessionCookie(sid) } : {},
            body !== undefined ? { 'Content-Type': 'application/json' } : {}
        ),
        body: body !== undefined ? JSON.stringify(body) : undefined
    }).then(async r => ({ status: r.status, headers: r.headers, json: await r.json().catch(() => null) }));
}

test('real actions feed the drops table and the leaderboard through the hook (few requests)', async () => {
    const srv = await startServer();
    try {
        assert.equal((await call(srv.base, '/api/promo', { method: 'POST', sid: SID, body: { code: 'test' } })).status, 200);
        const callsAfterPromo = srv.store.calls.length;
        assert.equal(callsAfterPromo, 0, 'a promo code does not touch drops/leaderboard');

        // caja 8 only contains covert/gold items: always notable
        const r = await call(srv.base, '/api/open', { method: 'POST', sid: SID, body: { caseId: 8 } });
        assert.equal(r.status, 200);
        const drops = srv.store.calls.filter(c => c === 'drops.insert').length;
        assert.equal(drops, 1, 'one drops insert for the action');
        const lb = srv.store.calls.filter(c => c.startsWith('leaderboard.'));
        assert.deepEqual(lb, ['leaderboard.update', 'leaderboard.insert'], 'first leaderboard write: update + insert');

        // second action right after: another drop, no leaderboard write (throttled, same best drop)
        srv.store.calls.length = 0;
        const r2 = await call(srv.base, '/api/open', { method: 'POST', sid: SID, body: { caseId: 8 } });
        assert.equal(r2.status, 200);
        const total = srv.store.calls.length;
        assert.ok(total <= 2, `at most drops.insert (+ one leaderboard update if the best drop improved), got ${srv.store.calls}`);
        assert.equal(srv.store.calls.filter(c => c === 'drops.insert').length, 1);
    } finally {
        await srv.close();
    }
});

test('GET /api/feed: public, shape, no steam ids, CDN cache headers, in-instance cache', async () => {
    const srv = await startServer();
    try {
        await call(srv.base, '/api/promo', { method: 'POST', sid: SID, body: { code: 'test' } });
        await call(srv.base, '/api/open', { method: 'POST', sid: SID, body: { caseId: 8 } });

        const first = await call(srv.base, '/api/feed?limit=20');
        assert.equal(first.status, 200);
        assert.equal(first.headers.get('cache-control'), 'public, max-age=10, s-maxage=10');
        assert.ok(Array.isArray(first.json.drops));
        assert.equal(first.json.drops.length, 1);
        const d = first.json.drops[0];
        assert.deepEqual(Object.keys(d).sort(), ['at', 'avatar', 'caseName', 'id', 'itemId', 'name', 'price', 'profileUrl', 'rarity', 'source'].sort());
        assert.equal(d.source, 'case');
        assert.equal(d.caseName, 'Caja Dragon');
        assert.equal(d.profileUrl, `https://steamcommunity.com/profiles/${SID}`);
        assert.ok(d.price >= 10);
        assert.ok(!JSON.stringify(first.json).includes('steam-id'));

        // cached: more calls do not hit the table again within the TTL
        const listsBefore = srv.store.calls.filter(c => c === 'drops.list').length;
        await call(srv.base, '/api/feed?limit=5');
        await call(srv.base, '/api/feed');
        assert.equal(srv.store.calls.filter(c => c === 'drops.list').length, listsBefore);

        // validation
        assert.equal((await call(srv.base, '/api/feed?limit=abc')).status, 400);
        assert.equal((await call(srv.base, '/api/feed', { method: 'POST', body: {} })).status, 405);
        const big = await call(srv.base, '/api/feed?limit=9999');
        assert.equal(big.status, 200);
    } finally {
        await srv.close();
    }
});

test('GET /api/feed on an empty table answers an empty list', async () => {
    const srv = await startServer();
    try {
        const r = await call(srv.base, '/api/feed');
        assert.equal(r.status, 200);
        assert.deepEqual(r.json, { drops: [] });
    } finally {
        await srv.close();
    }
});

test('GET /api/leaderboard: public, three orderings, shape, validation, caching headers', async () => {
    const store = countingStore();
    const lb = store.table('leaderboard');
    await lb.insert({ 'steam-id': SID, name: 'Ana', avatar: 'https://a.example/1.jpg', 'total-won': 100, profit: -5, 'cases-opened': 40, 'best-drop-price': 3500, 'best-drop-item-id': 27 });
    await lb.insert({ 'steam-id': SID2, name: 'Bob', avatar: null, 'total-won': 50, profit: 30, 'cases-opened': 10, 'best-drop-price': 80, 'best-drop-item-id': 24 });
    store.calls.length = 0;
    const srv = await startServer(store);
    try {
        const won = await call(srv.base, '/api/leaderboard?by=total-won');
        assert.equal(won.status, 200);
        assert.equal(won.headers.get('cache-control'), 'public, max-age=10, s-maxage=10');
        assert.equal(won.json.by, 'total-won');
        assert.deepEqual(won.json.rows.map(r => r.name), ['Ana', 'Bob']);
        assert.deepEqual(won.json.rows[0], {
            rank: 1, name: 'Ana', avatar: 'https://a.example/1.jpg', profileUrl: `https://steamcommunity.com/profiles/${SID}`,
            totalWon: 100, profit: -5, casesOpened: 40, bestDropPrice: 3500, bestDropItemId: 27
        });
        assert.equal(won.json.rows[1].avatar, null);
        assert.ok(!JSON.stringify(won.json).includes('steam-id'));

        assert.deepEqual((await call(srv.base, '/api/leaderboard?by=profit')).json.rows.map(r => r.name), ['Bob', 'Ana']);
        assert.deepEqual((await call(srv.base, '/api/leaderboard?by=best-drop-price&limit=1')).json.rows.map(r => r.name), ['Ana']);
        // default ordering
        assert.equal((await call(srv.base, '/api/leaderboard')).json.by, 'total-won');

        // cached per ordering
        const lists = store.calls.filter(c => c === 'leaderboard.list').length;
        assert.equal(lists, 3);
        await call(srv.base, '/api/leaderboard?by=profit');
        await call(srv.base, '/api/leaderboard?by=total-won&limit=1');
        assert.equal(store.calls.filter(c => c === 'leaderboard.list').length, lists);

        assert.equal((await call(srv.base, '/api/leaderboard?by=hax')).status, 400);
        assert.equal((await call(srv.base, '/api/leaderboard?limit=-1')).status, 400);
        assert.equal((await call(srv.base, '/api/leaderboard', { method: 'POST', body: {} })).status, 405);
    } finally {
        await srv.close();
    }
});

test('reads: cached for the TTL, stale data is served while the database fails', async () => {
    const store = createMemoryStore();
    await store.table('drops').insert({ 'steam-id': SID, name: 'Ana', 'item-id': 24, price: 80, rarity: 'covert', source: 'case', 'case-name': 'x' });
    let t = 1_000;
    const feed = createFeed(fakeCtx(store), { now: () => t });
    assert.equal((await feed.getFeed(20)).length, 1);
    await store.table('drops').insert({ 'steam-id': SID, name: 'Ana', 'item-id': 25, price: 95, rarity: 'covert', source: 'case', 'case-name': 'x' });
    t += 5_000;
    assert.equal((await feed.getFeed(20)).length, 1, 'cached within 10 s');
    t += 6_000;
    assert.equal((await feed.getFeed(20)).length, 2, 'refreshed after the TTL');
    const real = store.table;
    store.table = () => ({ list: async () => { throw new Error('down'); } });
    t += 11_000;
    assert.equal((await feed.getFeed(20)).length, 2, 'stale data while the database fails');
    store.table = real;
});

test('endpoints degrade: stale data while the database fails, 503 when there is none', async () => {
    const store = countingStore();
    const srv = await startServer(store);
    const warn = console.warn;
    console.warn = () => {};
    try {
        const real = store.table;
        store.table = () => ({ list: async () => { const e = new Error('down'); e.status = 502; throw e; } });
        const down = await call(srv.base, '/api/feed');
        assert.equal(down.status, 503);
        assert.equal(down.json.code, 'db_unavailable');
        store.table = real;
        assert.equal((await call(srv.base, '/api/feed')).status, 200);
    } finally {
        console.warn = warn;
        await srv.close();
    }
});
