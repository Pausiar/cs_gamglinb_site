'use strict';

// Server-only profile fields (`ext`): written atomically with the game state,
// never part of the public state.

const test = require('node:test');
const assert = require('node:assert/strict');
const { createGame } = require('../lib/app.js');
const { createMemoryStore } = require('../lib/store.js');
const { createHooks } = require('../lib/hooks/defaults.js');
const engine = require('../public/js/engine.js');

test('makeRng ext patch and action ext patch are persisted with the state', async () => {
    const store = createMemoryStore();
    const hooks = createHooks({ rng: Math.random });
    hooks.makeRng = ({ profile }) => ({
        rng: Math.random,
        meta: { nonce: (profile.ext.fair.nonce || 0) },
        ext: { fair: { nonce: (profile.ext.fair.nonce || 0) + 1 } }
    });
    const actions = Object.assign({}, engine.actions, {
        claim(state, params, rng, now, ctx) {
            const s = JSON.parse(JSON.stringify(state));
            s.balance += 1;
            return { state: s, result: { last: ctx.ext.rewards.last || null }, ext: { rewards: { last: now } } };
        }
    });
    const game = createGame({ store, hooks, actions });

    const first = await game.runAction('765', 'claim', {});
    assert.equal(first.result.last, null);
    assert.deepEqual(first.meta, { nonce: 0 });
    assert.equal(first.state.balance, 1);
    assert.equal(first.state.fair, undefined, 'ext must not leak into the public state');

    const second = await game.runAction('765', 'claim', {});
    assert.equal(typeof second.result.last, 'number');
    assert.deepEqual(second.meta, { nonce: 1 });

    const profile = await game.getProfile('765');
    assert.equal(profile.ext.fair.nonce, 2);
    assert.equal(typeof profile.ext.rewards.last, 'number');
    assert.equal(profile.version, 2);
});

test('unknown ext keys are not written', async () => {
    const store = createMemoryStore();
    await store.createProfile('1', null);
    await store.updateProfile('1', 0, { balance: 0, inventory: [], stats: {}, history: [], promosUsed: [] }, null, { fair: { a: 1 }, balance: 999, evil: true });
    const p = await store.getProfile('1');
    assert.deepEqual(p.ext.fair, { a: 1 });
    assert.equal(p.ext.evil, undefined);
    assert.equal(p.data.balance, 0);
});

test('generic tables: insert, list with filters/order, optimistic update', async () => {
    const store = createMemoryStore();
    const t = store.table('lobbies');
    const a = await t.insert({ status: 'open', cost: 5, version: 0 });
    await t.insert({ status: 'done', cost: 50, version: 0 });
    await t.insert({ status: 'open', cost: 20, version: 0 });
    const open = await t.list({ filters: { status: 'eq.open' }, order: 'cost.desc' });
    assert.deepEqual(open.map(r => r.cost), [20, 5]);
    assert.equal((await t.list({ filters: { cost: 'gte.20' } })).length, 2);
    assert.equal((await t.list({ filters: { status: 'in.(open,done)' }, limit: 2 })).length, 2);
    assert.equal(await t.update({ id: `eq.${a.id}`, version: 'eq.0' }, { status: 'running', version: 1 }), 1);
    assert.equal(await t.update({ id: `eq.${a.id}`, version: 'eq.0' }, { status: 'x', version: 1 }), 0);
    assert.equal((await t.get(a.id)).status, 'running');
    await assert.rejects(() => t.update({}, { status: 'x' }));
    assert.throws(() => store.table('../profiles'));
});

test('psdb tables flatten rows and build PostgREST URLs', async () => {
    const { createPsdbStore } = require('../lib/store.js');
    const calls = [];
    const fetchImpl = async (url, opts) => {
        calls.push({ url, method: opts.method, body: opts.body });
        const body = opts.method === 'PATCH'
            ? { ok: true, data: { count: 1, rows: [] } }
            : { ok: true, data: [{ id: 'r1', data: { status: 'open', 'steam-id': '9' }, createdAt: 't', updatedAt: 'u' }] };
        return { status: 200, ok: true, text: async () => JSON.stringify(body) };
    };
    const store = createPsdbStore({ PSDB_URL: 'https://db.example', PSDB_API_KEY: 'k' }, { fetchImpl });
    const rows = await store.table('lobbies').list({ filters: { status: 'eq.open' }, limit: 5 });
    assert.deepEqual(rows[0], { status: 'open', 'steam-id': '9', id: 'r1', createdAt: 't', updatedAt: 'u' });
    assert.match(calls[0].url, /^https:\/\/db\.example\/api\/v1\/skindrop\/lobbies\?status=eq\.open&order=created_at\.desc&limit=5$/);
    assert.equal(await store.table('lobbies').update({ id: 'eq.r1', version: 'eq.0' }, { version: 1 }), 1);
    assert.equal(calls[1].method, 'PATCH');
});
