'use strict';

// PvP lobbies: money safety (pay / refund / payout are idempotent and reconcilable), prizes, HTTP API.

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { buildConfig, createHandler, createGame, createToken } = require('../lib/app.js');
const { createMemoryStore } = require('../lib/store.js');
const { createLobbies, registerActions, computePayouts, ledgerMarker } = require('../lib/lobbies.js');
const engine = require('../public/js/engine.js');

const SILENT = { error() {}, warn() {}, log() {} };
const A = '76561198000000001';
const B = '76561198000000002';
const C = '76561198000000003';
const D = '76561198000000004';

function apiError(status, message, code) {
    const e = new Error(message);
    e.status = status;
    e.code = code || 'error';
    e.expose = true;
    return e;
}

function seeded(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const cents = n => Math.round(n * 100);
const valueOf = items => items.reduce((s, i) => s + cents(i.price), 0);

async function setup(opts = {}) {
    const store = opts.store || createMemoryStore();
    const actions = Object.assign({}, engine.actions);
    registerActions(actions, engine);
    const game = createGame({ store, actions, cache: opts.cache === undefined ? false : opts.cache });
    const wrapped = opts.wrapGame ? opts.wrapGame(game) : game;
    let clock = opts.now || (() => Date.now());
    const svc = createLobbies({
        store, game: wrapped, engine, apiError, rng: opts.rng, log: SILENT,
        now: () => clock(), ttl: opts.ttl
    });
    const h = {
        store, game, svc, table: store.table('lobbies'),
        setNow(fn) { clock = fn; },
        async fund(sid, amount = 1000) {
            // promo gives 10000; scale by spending nothing: just use the promo
            await game.runAction(sid, 'redeemPromo', { code: 'test' });
            return amount;
        },
        async state(sid) { return game.getState(sid); },
        async balance(sid) { return (await game.getState(sid)).balance; },
        async lobby(id) { return svc.fresh(id); }
    };
    return h;
}

// total money in the system for the given players (balances + inventory value)
async function wealth(h, sids) {
    let sum = 0;
    for (const sid of sids) {
        const s = await h.state(sid);
        sum += cents(s.balance) + valueOf(s.inventory);
    }
    return sum;
}

const CASE = 3;   // 5.00 EUR per round
const params = (extra) => Object.assign({ caseIds: [CASE, CASE], mode: '1v1', crazy: false }, extra);

// ==================== engine ====================
test('resolveBattle matches engine.battle for the same rng', () => {
    for (const mode of ['1v1', '1v1v1', '2v2', '1v1v1v1']) {
        for (const crazy of [false, true]) {
            for (let seed = 1; seed <= 5; seed++) {
                const seats = engine.constants.BATTLE_MODES[mode].seats;
                const bots = engine.constants.BOT_NAMES.slice(0, seats - 1);
                const state = Object.assign(engine.defaultState(), { balance: 1000 });
                const out = engine.battle(state, { caseIds: [2, 3, 3], mode, crazy, botNames: bots }, seeded(seed), 100).result;
                const seatList = [{ name: 'Tú', isUser: true }].concat(bots.map(name => ({ name, isUser: false })));
                const res = engine.resolveBattle({ caseIds: [2, 3, 3], mode, crazy, seats: seatList }, seeded(seed));
                assert.deepEqual(res.rounds, out.rounds);
                assert.deepEqual(res.totals, out.totals);
                assert.deepEqual(res.teams, out.teams);
                assert.deepEqual(res.leaders, out.leaders);
                assert.equal(res.tiebreak, out.tiebreak);
                assert.equal(res.winnerTeam, out.winnerTeam);
                assert.equal(res.pot, out.pot);
                assert.deepEqual(res.seats, out.seats);
            }
        }
    }
    assert.throws(() => engine.resolveBattle({ caseIds: [3], mode: '1v1', seats: [{}] }, seeded(1)), /plazas/);
    assert.throws(() => engine.resolveBattle({ caseIds: [3], mode: 'x', seats: [{}, {}] }, seeded(1)), /Modo/);
});

test('prizes: single winner takes all, 2v2 splits fairly, bots get nothing', () => {
    const item = (id, price) => ({ id, name: 'x' + id, price, rarity: 'milspec' });
    // 1v1: seat 1 wins
    let res = {
        seats: [{ steamId: A, team: 0 }, { steamId: B, team: 1 }], winnerTeam: 1,
        rounds: [[item(1, 1), item(2, 3)], [item(3, 2), item(4, 4)]]
    };
    let p = computePayouts(res, engine);
    assert.deepEqual(p.payouts.map(x => [x.steamId, x.value, x.items.length]), [[B, 10, 4]]);
    assert.equal(p.houseKept, 0);

    // 2v2: team 0 (seats 0,1) wins; own items stay, losers' items alternate by value starting with the poorer teammate
    res = {
        seats: [{ steamId: A, team: 0 }, { steamId: B, team: 0 }, { steamId: C, team: 1 }, { steamId: D, team: 1 }], winnerTeam: 0,
        rounds: [[item(1, 10), item(2, 1), item(3, 8), item(4, 6)], [item(5, 10), item(6, 1), item(7, 4), item(8, 2)]]
    };
    p = computePayouts(res, engine);
    const byId = Object.fromEntries(p.payouts.map(x => [x.steamId, x]));
    // A own 20, B own 2 -> B (poorer) picks first from losers [8, 6, 4, 2]: B gets 8 and 4, A gets 6 and 2
    assert.equal(byId[A].value, 28);
    assert.equal(byId[B].value, 14);
    assert.equal(byId[A].value + byId[B].value, 42);
    assert.equal(p.houseKept, 0);

    // a bot on the winning team: its share goes to the house, the human keeps his own + his half
    res.seats[1] = { steamId: null, isBot: true, team: 0 };
    p = computePayouts(res, engine);
    assert.equal(p.payouts.length, 1);
    assert.equal(p.payouts[0].steamId, A);
    assert.equal(p.payouts[0].value + p.houseKept, 42);

    // a bot wins a 1v1: nobody is paid
    res = { seats: [{ steamId: A, team: 0 }, { steamId: null, isBot: true, team: 1 }], winnerTeam: 1, rounds: [[item(1, 1), item(2, 3)]] };
    p = computePayouts(res, engine);
    assert.deepEqual(p.payouts, []);
    assert.equal(p.houseKept, 4);
});

// ==================== profile actions ====================
test('lobbyPay / lobbyRefund / lobbyPayout are idempotent and keep the ledger', async () => {
    const h = await setup();
    await h.fund(A);
    const base = await h.balance(A);
    const pay = { lobbyId: 'L1', rid: 'r1', cost: 10, rounds: 2 };

    let out = await h.game.runAction(A, 'lobbyPay', pay);
    assert.equal(out.state.balance, base - 10);
    assert.equal(out.state.stats.totalSpent, 10);
    assert.equal(out.state.stats.casesOpened, 2);
    out = await h.game.runAction(A, 'lobbyPay', pay);          // repeat: no second debit
    assert.equal(out.state.balance, base - 10);
    assert.equal(out.result.already, true);

    out = await h.game.runAction(A, 'lobbyRefund', pay);
    assert.equal(out.state.balance, base);
    assert.equal(out.state.stats.totalSpent, 0);
    assert.equal(out.state.stats.casesOpened, 0);
    out = await h.game.runAction(A, 'lobbyRefund', pay);       // repeat: no second credit
    assert.equal(out.state.balance, base);

    // after the refund the same reservation can never be paid (tombstone)
    await assert.rejects(() => h.game.runAction(A, 'lobbyPay', pay), /ya no es válida/);
    // a refund without payment only plants the tombstone
    out = await h.game.runAction(A, 'lobbyRefund', { lobbyId: 'L2', rid: 'r9', cost: 10, rounds: 2 });
    assert.equal(out.state.balance, base);
    await assert.rejects(() => h.game.runAction(A, 'lobbyPay', { lobbyId: 'L2', rid: 'r9', cost: 10, rounds: 2 }), /ya no es válida/);

    // payout is applied once
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const itemsValue = engine.round2(items.reduce((sum, i) => sum + engine.skinInfo(i.id).price, 0));
    out = await h.game.runAction(A, 'lobbyPayout', { lobbyId: 'L3', itemIds: items.map(i => i.id) });
    assert.equal(out.state.inventory.length, 3);
    assert.equal(out.state.stats.totalWon, itemsValue);
    assert.ok(out.state.history.every(x => x.caseName === 'Batalla PvP'));
    out = await h.game.runAction(A, 'lobbyPayout', { lobbyId: 'L3', itemIds: items.map(i => i.id) });
    assert.equal(out.state.inventory.length, 3);
    assert.equal(out.state.stats.totalWon, itemsValue);

    // the ledger markers are plain short strings
    const profile = await h.game.getProfile(A);
    assert.ok(profile.data.promosUsed.every(x => x.length <= 64));
    assert.ok(profile.data.promosUsed.includes(ledgerMarker('L3', 'payout', 'w')));
    // engine actions still work with the markers present
    await h.game.runAction(A, 'sellItems', { uids: out.state.inventory.map(i => i.uid) });
});

test('lobbyPayout credits items that do not fit in a full inventory', async () => {
    const h = await setup();
    await h.game.runAction(A, 'redeemPromo', { code: 'test' });
    // fill the inventory with 499 cheap items directly in the store
    const profile = await h.store.getProfile(A);
    const data = engine.normalizeState(profile.data);
    for (let i = 0; i < 499; i++) data.inventory.push({ uid: 'u' + i, id: 1, name: 'x', price: 0.05, rarity: 'consumer' });
    assert.ok(await h.store.updateProfile(A, profile.version, data));
    const before = await h.balance(A);
    const out = await h.game.runAction(A, 'lobbyPayout', { lobbyId: 'L9', itemIds: [1, 2, 3] });
    assert.equal(out.state.inventory.length, 500);
    assert.equal(out.result.autoSold, 2);
    // kept the most valuable one, sold the other two at their catalog price
    const won = [1, 2, 3].map(id => engine.skinInfo(id));
    const kept = won.slice().sort((a, b) => b.price - a.price)[0];
    const sold = engine.round2(won.filter(x => x.id !== kept.id).reduce((sum, x) => sum + x.price, 0));
    assert.equal(out.state.balance, engine.round2(before + sold));
});

// ==================== service ====================
test('create -> join -> auto start -> prizes are paid exactly once, money is conserved', async () => {
    const h = await setup();
    await h.fund(A); await h.fund(B);
    const total0 = await wealth(h, [A, B]);

    const created = await h.svc.create(A, params());
    assert.equal(created.lobby.status, 'open');
    assert.equal(created.lobby.cost, 10);
    assert.equal(created.state.balance, 9990);
    assert.equal(created.lobby.seats.length, 1);
    assert.equal(created.lobby.seats[0].paid, true);

    const joined = await h.svc.join(B, { id: created.lobby.id });
    assert.equal(joined.state.balance, 9990, 'the response state is the one right after paying (no prize leak)');
    const lobby = joined.lobby;
    assert.ok(['running', 'finished'].includes(lobby.status));
    assert.equal(lobby.status, 'finished');
    assert.ok(lobby.result.rounds.length === 2 && lobby.result.rounds[0].length === 2);
    assert.deepEqual(lobby.result.paid, [lobby.result.payouts[0].steamId]);
    assert.ok(lobby.startedAt > 0);

    const winner = lobby.result.payouts[0].steamId;
    const loser = winner === A ? B : A;
    const sw = await h.state(winner);
    const sl = await h.state(loser);
    assert.equal(sw.inventory.length, 4);
    assert.equal(sl.inventory.length, 0);
    assert.equal(sw.stats.totalWon, lobby.result.pot);
    assert.equal(valueOf(sw.inventory), cents(lobby.result.pot));
    assert.equal(sw.stats.totalSpent, 10);
    assert.equal(sl.stats.totalSpent, 10);
    assert.equal(sl.stats.casesOpened, 2);
    // money conservation: players lost exactly their entry fees and won exactly the pot
    assert.equal(await wealth(h, [A, B]), total0 - cents(20) + cents(lobby.result.pot));

    // retries do not pay again
    const wealthAfter = await wealth(h, [A, B]);
    await h.svc.settle(lobby.id);
    await h.svc.settle(lobby.id);
    await h.svc.reconcileLobby(lobby.id);
    await h.svc.processRefunds(lobby.id);
    assert.equal(await wealth(h, [A, B]), wealthAfter);
    assert.equal((await h.state(winner)).inventory.length, 4);

    // the detail endpoint shows the same transcript
    const again = await h.svc.get(lobby.id);
    assert.deepEqual(again.result.rounds, lobby.result.rounds);
    // listed as finished
    const listed = await h.svc.list();
    assert.equal(listed.lobbies[0].id, lobby.id);
    assert.equal(listed.lobbies[0].status, 'finished');
    assert.deepEqual(listed.lobbies[0].winners.length, 1);
});

test('two players racing for the last seat: exactly one gets it, the other is never charged', async () => {
    for (let round = 0; round < 6; round++) {
        const h = await setup();
        for (const sid of [A, B, C, D]) await h.fund(sid);
        const total0 = await wealth(h, [A, B, C, D]);
        const created = await h.svc.create(A, params({ mode: '1v1v1' }));
        await h.svc.join(B, { id: created.lobby.id });
        const results = await Promise.allSettled([
            h.svc.join(C, { id: created.lobby.id }),
            h.svc.join(D, { id: created.lobby.id })
        ]);
        const ok = results.filter(r => r.status === 'fulfilled');
        const bad = results.filter(r => r.status === 'rejected');
        assert.equal(ok.length, 1, 'exactly one joiner wins');
        assert.equal(bad.length, 1);
        assert.equal(bad[0].reason.status, 409);
        assert.match(bad[0].reason.code, /lobby_full|seat_taken|seat_lost|not_open/);
        const loserSid = results[0].status === 'rejected' ? C : D;
        assert.equal(await h.balance(loserSid), 10000, 'the loser keeps all his money');
        const final = await h.lobby(created.lobby.id);
        assert.equal(final.status, 'finished');
        assert.equal(final.seats.filter(s => s.state === 'paid').length, 3);
        const players = [A, B, C, D];
        const pot = final.result.pot;
        // 3 entries of 10 were paid, the pot (3 seats x 2 rounds of items) was handed to one winner
        assert.equal(await wealth(h, players), total0 - cents(30) + cents(pot));
    }
});

test('a payer that loses its seat after paying is refunded (seat_lost)', async () => {
    const h = await setup({ ttl: { reserve: 0 } });
    await h.fund(A); await h.fund(B);
    const created = await h.svc.create(A, params({ mode: '1v1v1' }));
    const realRun = h.game.runAction.bind(h.game);
    let hijacked = false;
    const svc2 = createLobbies({
        store: h.store, engine, apiError, log: SILENT, ttl: { reserve: 0 },
        game: Object.assign({}, h.game, {
            getProfile: sid => h.game.getProfile(sid),
            async runAction(sid, name, p) {
                const out = await realRun(sid, name, p);
                if (name === 'lobbyPay' && sid === B && !hijacked) {
                    hijacked = true;
                    // the debit landed, then the reconciler expires B's reservation (and refunds it) before the confirmation
                    await new Promise(r => setTimeout(r, 5));
                    await h.svc.reconcileLobby(created.lobby.id);
                }
                return out;
            }
        })
    });
    await assert.rejects(() => svc2.join(B, { id: created.lobby.id }), e => e.code === 'seat_lost' && e.status === 409);
    assert.equal(await h.balance(B), 10000, 'refunded exactly once');
    const st = await h.state(B);
    assert.equal(st.stats.totalSpent, 0);
    assert.equal(st.stats.casesOpened, 0);
    await h.svc.reconcile({ force: true });
    assert.equal(await h.balance(B), 10000);
});

test('insufficient balance and guests: no seat is taken, no lobby is created', async () => {
    const h = await setup();
    await h.fund(A);
    // B has no balance
    await assert.rejects(() => h.svc.create(B, params()), e => e.status === 400 && e.code === 'insufficient_balance');
    assert.equal((await h.table.list({})).length, 0, 'no row is created when the creator cannot pay');

    const created = await h.svc.create(A, params());
    await assert.rejects(() => h.svc.join(B, { id: created.lobby.id }), e => e.code === 'insufficient_balance');
    const lobby = await h.lobby(created.lobby.id);
    assert.equal(lobby.seats.filter(s => s.state === 'reserved' || s.state === 'paid').length, 1);
    assert.equal(lobby.status, 'open');
    // the creator cannot take two seats
    await assert.rejects(() => h.svc.join(A, { id: created.lobby.id }), e => e.code === 'already_in');
    // case ids / mode are validated
    await assert.rejects(() => h.svc.create(A, { caseIds: [], mode: '1v1' }), e => e.status === 400);
    await assert.rejects(() => h.svc.create(A, { caseIds: [3], mode: '9v9' }), e => e.status === 400);
    await assert.rejects(() => h.svc.create(A, { caseIds: [999], mode: '1v1' }), e => e.status === 400);
    await assert.rejects(() => h.svc.join(A, { id: '../x' }), e => e.status === 400);
    await assert.rejects(() => h.svc.join(B, { id: 'nope' }), e => e.status === 404);
});

test('bots: creator fills the empty seats; items go to the human winner, nobody is paid when a bot wins', async () => {
    let humanWins = 0;
    let botWins = 0;
    for (let seed = 1; seed <= 40 && (!humanWins || !botWins); seed++) {
        const h = await setup({ rng: seeded(seed) });
        await h.fund(A); await h.fund(B);
        const total0 = await wealth(h, [A, B]);
        const created = await h.svc.create(A, params({ mode: '1v1v1', caseIds: [CASE] }));
        await h.svc.join(B, { id: created.lobby.id });
        await assert.rejects(() => h.svc.fillBots(B, { id: created.lobby.id }), e => e.status === 403);
        const out = await h.svc.fillBots(A, { id: created.lobby.id });
        const lobby = out.lobby;
        assert.equal(lobby.status, 'finished');
        assert.equal(lobby.seats.filter(s => s.isBot).length, 1);
        assert.ok(lobby.seats.filter(s => s.isBot).every(s => s.steamId === null && s.paid));
        const res = lobby.result;
        const winnerSeat = res.seats.find(s => s.team === res.winnerTeam);
        const w = await wealth(h, [A, B]);
        if (winnerSeat.isBot) {
            botWins++;
            assert.deepEqual(res.payouts, []);
            assert.equal(w, total0 - cents(5) * 2, 'both entries are lost to the bot');
            assert.equal(res.houseKept, res.pot);
        } else {
            humanWins++;
            assert.equal(res.payouts.length, 1);
            // the human winner gets his own items + the bot's items + the other human's items
            assert.equal(res.payouts[0].value, res.pot);
            assert.equal(w, total0 - cents(5) * 2 + cents(res.pot));
        }
        await assert.rejects(() => h.svc.fillBots(A, { id: created.lobby.id }), e => e.status === 409);
    }
    assert.ok(humanWins && botWins, 'saw both outcomes');
});

test('2v2 with a human team-mate pair: both winners are paid their share', async () => {
    let checked = false;
    for (let seed = 1; seed <= 30 && !checked; seed++) {
        const h = await setup({ rng: seeded(seed) });
        for (const sid of [A, B, C, D]) await h.fund(sid);
        const total0 = await wealth(h, [A, B, C, D]);
        const created = await h.svc.create(A, params({ mode: '2v2' }));
        const id = created.lobby.id;
        await h.svc.join(B, { id, seat: 2 });          // opponent
        await h.svc.join(C, { id, seat: 1 });          // A's team mate
        await assert.rejects(() => h.svc.join(D, { id, seat: 1 }), e => e.code === 'seat_taken');
        const out = await h.svc.join(D, { id, seat: 3 });
        const res = out.lobby.result;
        assert.equal(out.lobby.status, 'finished');
        assert.equal(res.payouts.length, 2);
        assert.equal(res.payouts.reduce((s, p) => s + cents(p.value), 0), cents(res.pot));
        assert.deepEqual(new Set(res.paid), new Set(res.payouts.map(p => p.steamId)));
        const winners = res.seats.filter(s => s.team === res.winnerTeam).map(s => s.steamId);
        assert.deepEqual(new Set(res.payouts.map(p => p.steamId)), new Set(winners));
        assert.equal(await wealth(h, [A, B, C, D]), total0 - cents(40) + cents(res.pot));
        checked = true;
    }
});

test('cancel refunds every paid seat once and closes the lobby', async () => {
    const h = await setup();
    await h.fund(A); await h.fund(B);
    const created = await h.svc.create(A, params({ mode: '1v1v1' }));
    const id = created.lobby.id;
    await h.svc.join(B, { id });
    assert.equal(await h.balance(A), 9990);
    assert.equal(await h.balance(B), 9990);

    await assert.rejects(() => h.svc.cancel(B, { id }), e => e.status === 403);
    const out = await h.svc.cancel(A, { id });
    assert.equal(out.lobby.status, 'cancelled');
    assert.equal(await h.balance(A), 10000);
    assert.equal(await h.balance(B), 10000);
    assert.equal((await h.state(A)).stats.totalSpent, 0);
    assert.equal((await h.state(B)).stats.casesOpened, 0);

    // idempotent
    await assert.rejects(() => h.svc.cancel(A, { id }), e => e.status === 409);
    await h.svc.processRefunds(id);
    await h.svc.reconcileLobby(id);
    assert.equal(await h.balance(A), 10000);
    // nobody can join a cancelled lobby, and it is not listed
    await assert.rejects(() => h.svc.join(B, { id }), e => e.code === 'not_open');
    assert.equal((await h.svc.list()).lobbies.length, 0);
});

// ==================== crash recovery ====================
async function crashedPayment(h, sid, state, ageMs) {
    // what a crash right after the debit leaves behind: money taken, seat still 'reserved'
    const cost = 10;
    const row = await h.table.insert({
        status: 'open', mode: '1v1', crazy: false, 'case-ids': [CASE, CASE], cost, version: 3, 'created-by': sid,
        seats: [{ seat: 0, steamId: sid, name: 'X', avatar: null, team: 0, state, paid: state === 'paid', rid: 'rid1', at: Date.now() - ageMs }],
        result: null
    });
    await h.game.runAction(sid, 'lobbyPay', { lobbyId: row.id, rid: 'rid1', cost, rounds: 2 });
    return row.id;
}

test('reconcile: a reservation that was paid but never confirmed is refunded once', async () => {
    const h = await setup({ ttl: { reserve: 60 * 1000 } });
    await h.fund(A);
    const id = await crashedPayment(h, A, 'reserved', 5 * 60 * 1000);
    assert.equal(await h.balance(A), 9990);
    await h.svc.reconcile({ force: true });
    assert.equal(await h.balance(A), 10000);
    const lobby = await h.lobby(id);
    assert.ok(lobby.seats.every(s => s.state === 'refunded'));
    await h.svc.reconcile({ force: true });
    await h.svc.processRefunds(id);
    assert.equal(await h.balance(A), 10000, 'no double refund');
    assert.equal((await h.state(A)).stats.totalSpent, 0);
});

test('reconcile: a fresh reservation is left alone', async () => {
    const h = await setup({ ttl: { reserve: 60 * 1000 } });
    await h.fund(A);
    const id = await crashedPayment(h, A, 'reserved', 1000);
    await h.svc.reconcile({ force: true });
    assert.equal(await h.balance(A), 9990);
    assert.equal((await h.lobby(id)).seats[0].state, 'reserved');
});

test('reconcile: lobbies stuck open for 15 minutes are cancelled and refunded', async () => {
    const h = await setup();
    await h.fund(A); await h.fund(B);
    const created = await h.svc.create(A, params({ mode: '1v1v1' }));
    await h.svc.join(B, { id: created.lobby.id });
    assert.equal(await h.balance(A), 9990);
    h.setNow(() => Date.now() + 16 * 60 * 1000);
    const listed = await h.svc.list();                     // the lazy reconciler runs from the list
    assert.equal(listed.lobbies.length, 0);
    const lobby = await h.lobby(created.lobby.id);
    assert.equal(lobby.status, 'cancelled');
    assert.equal(await h.balance(A), 10000);
    assert.equal(await h.balance(B), 10000);
});

test('reconcile: a cancel that crashed before refunding is completed (never twice)', async () => {
    const h = await setup();
    await h.fund(A); await h.fund(B);
    const created = await h.svc.create(A, params({ mode: '1v1v1' }));
    const id = created.lobby.id;
    await h.svc.join(B, { id });
    // simulate: seats marked 'refunding' + cancelling, then the process died before any refund
    const lobby = await h.lobby(id);
    const seats = lobby.seats.map(s => Object.assign({}, s, { state: 'refunding', paid: false }));
    await h.table.update({ id: `eq.${id}`, version: `eq.${lobby.version}` }, { seats, result: { cancelling: true }, version: lobby.version + 1 });
    assert.equal(await h.balance(A), 9990);
    assert.equal((await h.svc.list()).lobbies.length, 0);
    await h.svc.reconcile({ force: true });
    assert.equal(await h.balance(A), 10000);
    assert.equal(await h.balance(B), 10000);
    assert.equal((await h.lobby(id)).status, 'cancelled');
    await h.svc.reconcile({ force: true });
    assert.equal(await h.balance(A), 10000);
});

test('reconcile: a crash after the payout of one winner and before the lobby was closed pays nobody twice', async () => {
    let failOnce = true;
    const h = await setup({
        wrapGame: game => Object.assign({}, game, {
            async runAction(sid, name, p) {
                if (name === 'lobbyPayout' && failOnce) { failOnce = false; const e = new Error('db down'); e.status = 502; throw e; }
                return game.runAction(sid, name, p);
            }
        }),
        ttl: { settle: 0 }
    });
    await h.fund(A); await h.fund(B);
    const total0 = await wealth(h, [A, B]);
    const created = await h.svc.create(A, params());
    const joined = await h.svc.join(B, { id: created.lobby.id });
    assert.equal(joined.lobby.status, 'running', 'payout failed: the lobby stays running');
    assert.deepEqual(joined.lobby.result.paid, []);
    const pot = joined.lobby.result.pot;
    assert.equal(await wealth(h, [A, B]), total0 - cents(20), 'prize not yet paid');
    await h.svc.reconcile({ force: true });
    await h.svc.reconcile({ force: true });
    const lobby = await h.lobby(created.lobby.id);
    assert.equal(lobby.status, 'finished');
    assert.equal(await wealth(h, [A, B]), total0 - cents(20) + cents(pot));
});

test('reconcile: a full lobby that never started is started', async () => {
    const h = await setup();
    await h.fund(A); await h.fund(B);
    // two paid seats, status still open (the process died between confirm and start)
    const row = await h.table.insert({
        status: 'open', mode: '1v1', crazy: false, 'case-ids': [CASE], cost: 5, version: 4, 'created-by': A, result: null,
        seats: [
            { seat: 0, steamId: A, name: 'A', avatar: null, team: 0, state: 'paid', paid: true, rid: 'a1', at: Date.now() },
            { seat: 1, steamId: B, name: 'B', avatar: null, team: 1, state: 'paid', paid: true, rid: 'b1', at: Date.now() }
        ]
    });
    await h.game.runAction(A, 'lobbyPay', { lobbyId: row.id, rid: 'a1', cost: 5, rounds: 1 });
    await h.game.runAction(B, 'lobbyPay', { lobbyId: row.id, rid: 'b1', cost: 5, rounds: 1 });
    await h.svc.reconcile({ force: true });
    const lobby = await h.lobby(row.id);
    assert.equal(lobby.status, 'finished');
    assert.equal(lobby.result.payouts.length, 1);
});

test('names are sanitised and results never expose reservation ids', async () => {
    const h = await setup();
    await h.fund(A);
    const profile = await h.store.getProfile(A);
    await h.store.updateProfile(A, profile.version, profile.data, '<img src=x onerror=alert(1)>\u0007Eve');
    const created = await h.svc.create(A, params());
    assert.equal(created.lobby.seats[0].name, 'img src=x onerror=alert(1)Eve');
    assert.ok(!JSON.stringify(created.lobby).includes('rid'));
    assert.ok(!/[<>]/.test(created.lobby.seats[0].name));
});

// ==================== HTTP ====================
const SECRET = 'test-secret-0123456789abcdef0123456789abcdef';

function cookie(sid) {
    const now = Math.floor(Date.now() / 1000);
    return 'sd_session=' + encodeURIComponent(createToken(SECRET, { t: 'session', sid, iat: now, exp: now + 3600 }));
}

async function startServer() {
    const config = buildConfig({ PORT: '0', BASE_URL: 'http://localhost:3000', SESSION_SECRET: SECRET });
    const store = createMemoryStore();
    const handler = createHandler(config, { store, fetchImpl: async () => { throw new Error('no network'); } });
    const server = http.createServer(handler);
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    return { base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(r => server.close(r)) };
}

function call(base, path, { method = 'POST', body, sid } = {}) {
    return fetch(base + path, {
        method,
        headers: Object.assign(
            { Origin: 'http://localhost:3000' },
            sid ? { Cookie: cookie(sid) } : {},
            body !== undefined ? { 'Content-Type': 'application/json' } : {}
        ),
        body: body !== undefined ? JSON.stringify(body) : undefined
    }).then(async r => ({ status: r.status, headers: r.headers, json: await r.json().catch(() => null) }));
}

test('HTTP: public list / detail, login required for actions, full 1v1 through the API', async () => {
    const srv = await startServer();
    try {
        // guests can look, not touch
        let r = await call(srv.base, '/api/lobbies', { method: 'GET' });
        assert.equal(r.status, 200);
        assert.deepEqual(r.json, { lobbies: [] });
        assert.match(r.headers.get('cache-control'), /s-maxage=2/);
        for (const p of ['/api/lobbies', '/api/lobbies/join', '/api/lobbies/bots', '/api/lobbies/cancel']) {
            r = await call(srv.base, p, { body: { id: 'x', caseIds: [3], mode: '1v1' } });
            assert.equal(r.status, 401, p);
        }
        r = await call(srv.base, '/api/lobbies', { body: { caseIds: [3], mode: '1v1' }, sid: A });
        assert.equal(r.status, 400);
        assert.match(r.json.error, /Saldo/);
        r = await call(srv.base, '/api/lobby', { method: 'GET' });
        assert.equal(r.status, 400);
        r = await call(srv.base, '/api/lobby?id=nope', { method: 'GET' });
        assert.equal(r.status, 404);
        r = await call(srv.base, '/api/lobbies/join', { body: { id: 'x' }, headers: {}, sid: A });
        assert.ok([400, 404].includes(r.status));

        for (const sid of [A, B]) assert.equal((await call(srv.base, '/api/promo', { body: { code: 'test' }, sid })).status, 200);

        r = await call(srv.base, '/api/lobbies', { body: { caseIds: [CASE, CASE], mode: '1v1', crazy: false }, sid: A });
        assert.equal(r.status, 200);
        assert.equal(r.json.state.balance, 9990);
        assert.equal(typeof r.json.serverNow, 'number');
        const id = r.json.lobby.id;

        // visible to everybody
        r = await call(srv.base, '/api/lobbies', { method: 'GET' });
        assert.equal(r.json.lobbies.length, 1);
        assert.equal(r.json.lobbies[0].id, id);
        assert.equal(r.json.lobbies[0].seats.length, 1);
        assert.equal(r.json.lobbies[0].result, undefined);

        r = await call(srv.base, '/api/lobbies/join', { body: { id }, sid: B });
        assert.equal(r.status, 200);
        assert.equal(r.json.lobby.status, 'finished');

        r = await call(srv.base, `/api/lobby?id=${id}`, { method: 'GET' });
        assert.equal(r.status, 200);
        assert.equal(r.json.lobby.result.rounds.length, 2);
        assert.equal(r.json.lobby.startedAt > 0, true);
        assert.equal(typeof r.json.serverNow, 'number');
        assert.equal(r.headers.get('cache-control'), 'no-store');

        // the winner got the pot (state endpoint)
        const winner = r.json.lobby.result.payouts[0].steamId;
        const st = await call(srv.base, '/api/state', { method: 'GET', sid: winner });
        assert.equal(st.json.state.inventory.length, 4);
        // joining a finished lobby fails without charging
        r = await call(srv.base, '/api/lobbies/join', { body: { id }, sid: B });
        assert.equal(r.status, 409);
    } finally {
        await srv.close();
    }
});
