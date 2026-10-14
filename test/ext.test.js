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
