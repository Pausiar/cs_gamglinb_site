'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../public/js/engine.js');
const data = require('../public/js/data.js');

// Deterministic rng (mulberry32)
function seeded(seed) {
    let a = seed >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
// rng that replays a fixed sequence (then 0)
function seq(values) {
    let i = 0;
    return () => (i < values.length ? values[i++] : 0);
}

function withBalance(balance, extra) {
    return Object.assign(engine.defaultState(), { balance }, extra || {});
}

function expectError(fn, re) {
    assert.throws(fn, err => err.isEngineError === true && re.test(err.message));
}

test('openCase deducts price, adds item, updates stats and history', () => {
    const s0 = withBalance(10);
    const { state, result } = engine.openCase(s0, { caseId: 1 }, seeded(1), 1000);
    assert.equal(s0.balance, 10, 'input not mutated');
    assert.equal(state.balance, 9.5);
    assert.equal(state.inventory.length, 1);
    assert.equal(state.inventory[0].uid, result.item.uid);
    assert.equal(state.stats.casesOpened, 1);
    assert.equal(state.stats.totalSpent, 0.5);
    assert.equal(state.stats.totalWon, result.item.price);
    assert.equal(state.stats.rarityDrops[result.rarity], 1);
    assert.equal(state.history.length, 1);
    assert.equal(state.history[0].caseName, 'Caja Principiante');
    assert.equal(state.history[0].timestamp, 1000);
    const caseItems = data.cases[0].items.map(i => i.id);
    assert.ok(caseItems.includes(result.item.id));
});

test('openCase is deterministic for the same rng', () => {
    const a = engine.openCase(withBalance(100), { caseId: 7 }, seeded(42), 1);
    const b = engine.openCase(withBalance(100), { caseId: 7 }, seeded(42), 1);
    assert.deepEqual(a, b);
});

test('openCase rejects unknown case and insufficient balance', () => {
    expectError(() => engine.openCase(withBalance(100), { caseId: 999 }, seeded(1)), /Caja desconocida/);
    expectError(() => engine.openCase(withBalance(100), { caseId: 'x' }, seeded(1)), /Caja desconocida/);
    expectError(() => engine.openCase(withBalance(0.49), { caseId: 1 }, seeded(1)), /Saldo insuficiente/);
    expectError(() => engine.openCase(withBalance(1), null, seeded(1)), /Petición inválida/);
});

test('no float drift over many operations', () => {
    let s = withBalance(10000);
    const rng = seeded(7);
    for (let i = 0; i < 300; i++) {
        s = engine.openCase(s, { caseId: 1 + (i % 3) }, rng).state;
        if (i % 4 === 0) s = engine.sellItems(s, { uids: s.inventory.map(x => x.uid) }, rng).state;
    }
    const cents = Math.round(s.balance * 100);
    assert.equal(s.balance, cents / 100);
    assert.equal(s.stats.totalSpent, Math.round(s.stats.totalSpent * 100) / 100);
    assert.equal(s.history.length, 100, 'history capped at 100');
    assert.equal(s.stats.casesOpened, 300);
});

test('sellItems credits prices and removes items; rejects unknown uids', () => {
    let s = withBalance(10);
    s = engine.openCase(s, { caseId: 1 }, seeded(3)).state;
    s = engine.openCase(s, { caseId: 1 }, seeded(4)).state;
    const [a, b] = s.inventory;
    const out = engine.sellItems(s, { uids: [a.uid, b.uid] }, seeded(1));
    assert.equal(out.state.inventory.length, 0);
    assert.equal(out.result.amount, engine.round2(a.price + b.price));
    assert.equal(out.state.balance, engine.round2(s.balance + a.price + b.price));
    expectError(() => engine.sellItems(out.state, { uids: [a.uid] }, seeded(1)), /ya no está/);
    expectError(() => engine.sellItems(s, { uids: [] }, seeded(1)), /ningún objeto/);
    expectError(() => engine.sellItems(s, { uids: [a.uid, a.uid] }, seeded(1)), /repetido/);
    expectError(() => engine.sellItems(s, { uids: 'abc' }, seeded(1)), /inválida/);
});

test('inventory prices come from the catalog, not from stored data', () => {
    const s = withBalance(0, { inventory: [{ uid: 'abc', id: 27, price: 999999, name: 'hack' }] });
    const out = engine.sellItems(s, { uids: ['abc'] }, seeded(1));
    assert.equal(out.result.amount, 3500);
    assert.equal(out.state.balance, 3500);
});

test('upgrade: chance formula, win and lose with balance stake', () => {
    // AWP | Redline (id 19) costs 15; stake 5 -> 5/15*0.95 = 31.66%
    const s = withBalance(10);
    const win = engine.upgrade(s, { uids: [], balanceStake: 5, targetId: 19, mode: 'under' }, seq([0.1]), 5);
    assert.equal(win.result.chance, 31.66);
    assert.equal(win.result.roll, 10);
    assert.equal(win.result.win, true);
    assert.equal(win.state.balance, 5);
    assert.equal(win.state.inventory.length, 1);
    assert.equal(win.state.inventory[0].id, 19);
    assert.equal(win.state.stats.totalSpent, 5);
    assert.equal(win.state.stats.totalWon, 15);
    assert.equal(win.state.history[0].caseName, 'Upgrader');

    const lose = engine.upgrade(s, { balanceStake: 5, targetId: 19, mode: 'under' }, seq([0.5]));
    assert.equal(lose.result.win, false);
    assert.equal(lose.result.roll, 50);
    assert.equal(lose.state.inventory.length, 0);
    assert.equal(lose.state.balance, 5);

    // over: win iff roll >= 100 - chance (68.34)
    const over = engine.upgrade(s, { balanceStake: 5, targetId: 19, mode: 'over' }, seq([0.6834]));
    assert.equal(over.result.win, true);
    const over2 = engine.upgrade(s, { balanceStake: 5, targetId: 19, mode: 'over' }, seq([0.6833]));
    assert.equal(over2.result.win, false);
});

test('upgrade with items: stakes items, caps chance at 75%', () => {
    const s = withBalance(0, { inventory: [{ uid: 'u1', id: 21 }, { uid: 'u2', id: 19 }] }); // 18 + 15 = 33
    const out = engine.upgrade(s, { uids: ['u1', 'u2'], balanceStake: 0, targetId: 25, mode: 'under' }, seq([0.7499])); // 95
    assert.equal(out.result.stake, 33);
    assert.equal(out.result.chance, 33 / 95 * 0.95 * 100 >= 75 ? 75 : Math.floor(33 / 95 * 95 * 100) / 100);
    assert.equal(out.state.inventory.filter(i => i.uid === 'u1' || i.uid === 'u2').length, 0);
    const capped = engine.upgrade(withBalance(100), { balanceStake: 79, targetId: 24 }, seq([0.7499])); // 79/80
    assert.equal(capped.result.chance, 75);
    assert.equal(capped.result.win, true);
});

test('upgrade validation', () => {
    const s = withBalance(10, { inventory: [{ uid: 'u1', id: 1 }] });
    expectError(() => engine.upgrade(s, { balanceStake: 20, targetId: 19 }, seeded(1)), /Saldo insuficiente/);
    expectError(() => engine.upgrade(s, { balanceStake: 0, targetId: 19 }, seeded(1)), /Selecciona/);
    expectError(() => engine.upgrade(s, { balanceStake: 5, targetId: 9999 }, seeded(1)), /objetivo inválida/i);
    expectError(() => engine.upgrade(s, { balanceStake: 5, targetId: 1 }, seeded(1)), /debe valer más/);
    expectError(() => engine.upgrade(s, { balanceStake: 0.01, targetId: 27 }, seeded(1)), /demasiado baja/);
    expectError(() => engine.upgrade(s, { uids: ['nope'], balanceStake: 1, targetId: 19 }, seeded(1)), /ya no está/);
    expectError(() => engine.upgrade(s, { balanceStake: 5, targetId: 19, mode: 'sideways' }, seeded(1)), /Modo/);
    expectError(() => engine.upgrade(s, { balanceStake: -1, targetId: 19 }, seeded(1)), /inválida/);
    expectError(() => engine.upgrade(s, { balanceStake: '5', targetId: 19 }, seeded(1)), /inválida/);
});

test('battle 1v1: user pays own seat, winner takes all', () => {
    const s = withBalance(100);
    // Find a seed where the user wins and one where the user loses
    let winOut = null, loseOut = null;
    for (let seed = 1; seed < 200 && (!winOut || !loseOut); seed++) {
        const out = engine.battle(s, { caseIds: [3, 3], mode: '1v1', crazy: false }, seeded(seed), 100);
        if (out.result.won && !winOut) winOut = out;
        if (!out.result.won && !loseOut) loseOut = out;
    }
    assert.ok(winOut && loseOut);
    for (const out of [winOut, loseOut]) {
        const r = out.result;
        assert.equal(r.cost, 10);
        assert.equal(out.state.balance, 90);
        assert.equal(out.state.stats.casesOpened, 2);
        assert.equal(out.state.stats.totalSpent, 10);
        assert.equal(r.seats.length, 2);
        assert.equal(r.rounds.length, 2);
        assert.equal(r.rounds[0].length, 2);
        assert.equal(r.totals[0], engine.round2(r.rounds[0][0].price + r.rounds[1][0].price));
        assert.equal(r.pot, engine.round2(r.totals[0] + r.totals[1]));
        if (!r.tiebreak) {
            const best = Math.max(...r.teams);
            assert.equal(r.teams[r.winnerTeam], best);
        }
    }
    assert.equal(winOut.state.inventory.length, 4);
    assert.equal(winOut.result.items.length, 4);
    assert.equal(winOut.state.stats.totalWon, winOut.result.pot);
    assert.equal(winOut.state.history.length, 4);
    assert.match(winOut.state.history[0].caseName, /^Batalla: /);
    assert.equal(loseOut.state.inventory.length, 0);
    assert.equal(loseOut.state.stats.totalWon, 0);
});

test('battle crazy: lowest total wins; 2v2 sums teams', () => {
    for (let seed = 1; seed < 40; seed++) {
        const r = engine.battle(withBalance(100), { caseIds: [2], mode: '2v2', crazy: true }, seeded(seed)).result;
        assert.equal(r.teams.length, 2);
        assert.equal(r.teams[0], engine.round2(r.totals[0] + r.totals[1]));
        assert.equal(r.teams[1], engine.round2(r.totals[2] + r.totals[3]));
        assert.equal(r.teams[r.winnerTeam], Math.min(...r.teams));
        assert.equal(r.won, r.winnerTeam === 0);
        if (r.tiebreak) assert.ok(r.leaders.includes(r.winnerTeam));
    }
});

test('battle tiebreak is random among leaders', () => {
    // Caja AK-47 only has 4 items; force identical drops: rng 0 always -> first item for every seat
    const winners = new Set();
    for (const tb of [0, 0.3, 0.6, 0.99]) {
        let calls = 0;
        // botNames given so no shuffle; rolls: 4 seats x 1 round -> 0; then tiebreak value
        const rng = () => (calls++ < 4 ? 0 : tb);
        const r = engine.battle(withBalance(100), { caseIds: [3], mode: '1v1v1v1', botNames: ['LuckyBot', 'SilverFox', 'PhantomX'] }, rng).result;
        assert.equal(r.tiebreak, true);
        assert.deepEqual(r.leaders, [0, 1, 2, 3]);
        winners.add(r.winnerTeam);
    }
    assert.deepEqual([...winners].sort(), [0, 1, 2, 3]);
});

test('battle validation', () => {
    const s = withBalance(10);
    expectError(() => engine.battle(s, { caseIds: [1], mode: '5v5' }, seeded(1)), /Modo de batalla/);
    expectError(() => engine.battle(s, { caseIds: [], mode: '1v1' }, seeded(1)), /al menos una caja/);
    expectError(() => engine.battle(s, { caseIds: new Array(11).fill(1), mode: '1v1' }, seeded(1)), /Máximo 10/);
    expectError(() => engine.battle(s, { caseIds: [99], mode: '1v1' }, seeded(1)), /Caja desconocida/);
    expectError(() => engine.battle(s, { caseIds: [8], mode: '1v1' }, seeded(1)), /Saldo insuficiente/);
    expectError(() => engine.battle(s, { caseIds: [1], mode: '1v1', crazy: 'yes' }, seeded(1)), /Crazy/);
    expectError(() => engine.battle(s, { caseIds: [1], mode: '1v1', botNames: ['Hacker'] }, seeded(1)), /Bots/);
});

test('promo "test" gives 10000 once per profile', () => {
    const a = engine.redeemPromo(withBalance(1), { code: '  TEST ' }, seeded(1));
    assert.equal(a.state.balance, 10001);
    assert.equal(a.result.amount, 10000);
    expectError(() => engine.redeemPromo(a.state, { code: 'test' }, seeded(1)), /Ya has usado/);
    expectError(() => engine.redeemPromo(withBalance(0), { code: 'gratis' }, seeded(1)), /Código inválido/);
    expectError(() => engine.redeemPromo(withBalance(0), { code: 5 }, seeded(1)), /Código inválido/);
});

test('normalizeState repairs legacy saves', () => {
    const legacy = {
        balance: '12.345', inventory: [{ id: 1, name: 'x', price: 0.05, image: 'http://x' }, { id: 9999 }, null],
        stats: { casesOpened: 3, totalSpent: 1.5, totalWon: 0.3, rarityDrops: { consumer: 2 } },
        history: [{ id: 2, price: 0.08, caseName: 'Caja', timestamp: 5, image: 'x' }],
        currentCase: {}, isSpinning: true
    };
    const s = engine.normalizeState(legacy, seeded(1));
    assert.equal(s.balance, 12.35);
    assert.equal(s.inventory.length, 1);
    assert.ok(engine.isUid(s.inventory[0].uid));
    assert.equal(s.inventory[0].image, undefined);
    assert.equal(s.stats.rarityDrops.gold, 0);
    assert.equal(s.history[0].name, 'MAC-10 | Silver');
    assert.deepEqual(s.promosUsed, []);
    assert.equal(s.currentCase, undefined);
});
