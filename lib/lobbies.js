'use strict';

/*
 * PvP case battles ("lobbies"): service + server-only profile actions.
 * HTTP routes live in lib/routes/lobbies.js; the browser side in public/js/lobbies.js.
 *
 * ======================= MONEY FLOW (read this before changing anything) =======================
 * A lobby is one row of the PS_Database table `lobbies`; a player profile is another row. There is
 * no transaction across the two, so every money movement is (a) a server-only action on the profile
 * that is IDEMPOTENT through a marker kept in the profile itself, and (b) preceded by a durable
 * record in the lobby row, so that a crash between any two steps can always be reconciled.
 *
 * Profile markers ("ledger"). Stored as strings in `promosUsed` (the only profile list that survives
 * engine.normalizeState and is written atomically with balance / inventory):
 *     lb:<hash(lobbyId|rid)>:p   seat paid       (rid = random id of that seat reservation)
 *     lb:<hash(lobbyId|rid)>:r   seat refunded / closed (also a tombstone: a late pay is refused)
 *     lb:<hash(lobbyId|payout)>:w  winnings of that lobby already paid out
 *
 * Server-only actions (registered in ctx.actions, never reachable from a route by name):
 *   lobbyPay     debit `cost`, totalSpent += cost, casesOpened += rounds, marker p. Repeats are no-ops.
 *                Refused if marker r exists.
 *   lobbyRefund  if marker p: credit `cost` back (stats undone), drop p, add r. Without p it only
 *                plants r (so an in-flight pay can never land later). Repeats are no-ops.
 *   lobbyPayout  add the items to the inventory (history "Batalla PvP", totalWon). Items that do
 *                not fit in a full inventory are credited to the balance at their price. Marker w.
 *
 * Joining a seat (create is the same with seat 0):
 *   1. RESERVE  conditional update of the lobby (version N -> N+1): seat entry {state:'reserved', rid}.
 *               Two players racing for the last seat: exactly one update wins, the other gets
 *               "batalla llena" and was never charged.
 *   2. PAY      lobbyPay through game.runAction (atomic per profile, optimistic concurrency).
 *               Failure -> the reservation is released (or marked 'refunding' when the outcome is unknown).
 *   3. CONFIRM  conditional update: state 'paid' (paid:true). If the seat is no longer ours (the
 *               reconciler expired it, or the lobby was cancelled) -> lobbyRefund and 409.
 *   4. START    whoever sees every seat paid resolves the battle IN MEMORY (crypto rng,
 *               engine.resolveBattle) and writes status 'running' + result + started-at in ONE
 *               conditional update (only one request can win it), then settles.
 *   5. SETTLE   (idempotent, callable by anyone, any number of times) lobbyPayout for each human
 *               winner, then one conditional update: result.paid = [steamIds], status 'finished'.
 *
 * Refunds never delete the seat entry first: the entry becomes 'refunding' (durable intent), the
 * refund runs, then the entry becomes 'refunded'. A crash in between leaves 'refunding' behind and
 * the reconciler finishes it. Cancel = every active seat -> 'refunding' + result.cancelling, status
 * 'cancelled' once everything is refunded.
 *
 * Reconciler (lazy, runs from GET /api/lobbies at most once a minute per instance, and from
 * GET /api/lobby for that lobby): reservations unpaid > 90 s are expired and refunded, lobbies
 * 'open' > 15 min are cancelled and refunded, half-finished cancels/payouts are completed, a full
 * lobby that never started is started.
 *
 * Prizes (computePayouts): the winning team keeps what its own seats opened and receives the items
 * opened by the losing seats. 1v1 / 1v1v1 / 1v1v1v1: the single winner takes everything. 2v2: each
 * winning teammate gets the items their own seat opened PLUS the losers' items shared out one by one
 * from the most valuable down, starting with the teammate who opened less (so teams split fairly).
 * Bot seats pay nothing; items belonging to a winning bot go to nobody (the house); a bot's items go
 * to the human winners when they lose.
 *
 * PS_Database budget (120 requests/min per IP+project for the whole site): reads are cached 2 s
 * in the instance and coalesced, the list is also CDN-cacheable for 2 s, the clients poll every
 * 2.5-4 s, and the reconciler sweep (2 reads) runs at most once a minute.
 */

const crypto = require('node:crypto');
const { secureRng } = require('./rng.js');

const RESERVE_TTL_MS = 90 * 1000;        // an unpaid reservation older than this is expired
const OPEN_TTL_MS = 15 * 60 * 1000;      // a lobby still open after this is cancelled + refunded
const SETTLE_GRACE_MS = 20 * 1000;       // a 'running' lobby with pending payouts is re-settled after this
const CACHE_MS = 2000;
const SWEEP_EVERY_MS = 60 * 1000;
const RECONCILE_PER_LOBBY_MS = 8 * 1000;
const LIST_LIMIT = 20;
const LIST_FETCH = 30;
const FINISHED_VISIBLE_MS = 20 * 60 * 1000;
const MAX_OPEN_PER_USER = 3;
const MAX_MARKERS = 400;                 // newest ledger markers kept in a profile
const MAX_CLOSED_SEATS = 6;              // 'refunded' entries kept in a lobby row
const COUNTDOWN_MS = 3500;               // the client animation starts this long after started-at

// ==================== small helpers ====================
function engineErr(message, code) {
    const e = new Error(message);
    e.isEngineError = true;
    e.code = code || 'invalid';
    return e;
}

function jsonCol(v, fallback) {
    if (typeof v === 'string') {
        try { return JSON.parse(v); } catch (e) { return fallback; }
    }
    return v === undefined || v === null ? fallback : v;
}

function cleanName(name, steamId) {
    const n = String(name == null ? '' : name).replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 32);
    return n || `Jugador ${String(steamId).slice(-4)}`;
}

function cleanAvatar(url) {
    return typeof url === 'string' && /^https:\/\/[^\s"'<>]{1,300}$/.test(url) ? url : null;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const isActive = s => !!s && (s.state === 'reserved' || s.state === 'paid');

function ledgerMarker(lobbyId, key, kind) {
    const h = crypto.createHash('sha1').update(`${lobbyId}|${key}`).digest('base64url').slice(0, 20);
    return `lb:${h}:${kind}`;
}

function withMarker(list, marker) {
    const out = list.filter(x => x !== marker);
    out.push(marker);
    const lb = out.filter(x => typeof x === 'string' && x.startsWith('lb:'));
    if (lb.length <= MAX_MARKERS) return out;
    const drop = new Set(lb.slice(0, lb.length - MAX_MARKERS));
    return out.filter(x => !drop.has(x));
}

// ==================== prizes ====================
/*
 * result: transcript from engine.resolveBattle with `seats[i].steamId / isBot`.
 * Returns { winnerSeats, payouts: [{ steamId, seat, items:[{id,name,price,rarity}], value }], houseKept }
 * Values are euros with 2 decimals; houseKept = value of items that nobody receives.
 */
function computePayouts(result, engine) {
    const toC = engine.toCents;
    const fromC = engine.fromCents;
    const seats = result.seats;
    const winnerSeats = seats.map((s, i) => (s.team === result.winnerTeam ? i : -1)).filter(i => i >= 0);
    const winnerSet = new Set(winnerSeats);

    const own = new Map(winnerSeats.map(i => [i, result.rounds.map(row => row[i])]));
    const lost = [];
    result.rounds.forEach((row, ri) => row.forEach((item, si) => {
        if (!winnerSet.has(si)) lost.push({ item, ri, si });
    }));
    lost.sort((a, b) => (toC(b.item.price) - toC(a.item.price)) || (a.ri - b.ri) || (a.si - b.si));

    const ownTotal = i => own.get(i).reduce((sum, it) => sum + toC(it.price), 0);
    const order = winnerSeats.slice().sort((a, b) => (ownTotal(a) - ownTotal(b)) || (a - b));
    const gets = new Map(winnerSeats.map(i => [i, own.get(i).slice()]));
    lost.forEach((entry, k) => gets.get(order[k % order.length]).push(entry.item));

    const payouts = [];
    let keptC = 0;
    let potC = 0;
    result.rounds.forEach(row => row.forEach(it => { potC += toC(it.price); }));
    winnerSeats.forEach(i => {
        const seat = seats[i];
        if (seat.isBot || !seat.steamId) return;
        const items = gets.get(i).map(it => ({ id: it.id, name: it.name, price: it.price, rarity: it.rarity }));
        const valueC = items.reduce((sum, it) => sum + toC(it.price), 0);
        keptC += valueC;
        payouts.push({ steamId: seat.steamId, seat: i, items, value: fromC(valueC) });
    });
    return { winnerSeats, payouts, houseKept: fromC(potC - keptC) };
}

// ==================== server-only profile actions ====================
function registerActions(actions, engine) {
    const toC = engine.toCents;
    const fromC = engine.fromCents;
    const UID_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';
    const { INVENTORY_LIMIT, HISTORY_LIMIT, BATTLE_MAX_ROUNDS } = engine.constants;

    function str(v, max) {
        if (typeof v !== 'string' || !v || v.length > max) throw engineErr('Petición inválida.');
        return v;
    }

    function payParams(p) {
        if (!p || typeof p !== 'object') throw engineErr('Petición inválida.');
        const lobbyId = str(p.lobbyId, 80);
        const rid = str(p.rid, 40);
        const costC = toC(p.cost);
        const rounds = Number(p.rounds);
        if (!(costC > 0) || costC > 100000 * 100 || !Number.isInteger(rounds) || rounds < 1 || rounds > BATTLE_MAX_ROUNDS) {
            throw engineErr('Petición inválida.');
        }
        return { lobbyId, rid, costC, rounds };
    }

    function addStat(s, field, cents) {
        s.stats[field] = fromC(Math.max(0, toC(s.stats[field]) + cents));
    }

    function newUid(taken) {
        for (;;) {
            const bytes = crypto.randomBytes(12);
            let uid = '';
            for (let i = 0; i < 12; i++) uid += UID_CHARS[bytes[i] % UID_CHARS.length];
            if (!taken.has(uid)) { taken.add(uid); return uid; }
        }
    }

    actions.lobbyPay = function lobbyPay(state, params, rng) {
        const { lobbyId, rid, costC, rounds } = payParams(params);
        const s = engine.normalizeState(state, rng);
        const mp = ledgerMarker(lobbyId, rid, 'p');
        const mr = ledgerMarker(lobbyId, rid, 'r');
        if (s.promosUsed.includes(mr)) throw engineErr('Esta reserva ya no es válida.', 'stale_payment');
        if (s.promosUsed.includes(mp)) return { state: s, result: { paid: true, already: true, cost: fromC(costC) } };
        if (toC(s.balance) < costC) throw engineErr('Saldo insuficiente.', 'insufficient_balance');
        s.balance = fromC(toC(s.balance) - costC);
        addStat(s, 'totalSpent', costC);
        s.stats.casesOpened += rounds;
        s.promosUsed = withMarker(s.promosUsed, mp);
        return { state: s, result: { paid: true, already: false, cost: fromC(costC) } };
    };

    actions.lobbyRefund = function lobbyRefund(state, params, rng) {
        const { lobbyId, rid, costC, rounds } = payParams(params);
        const s = engine.normalizeState(state, rng);
        const mp = ledgerMarker(lobbyId, rid, 'p');
        const mr = ledgerMarker(lobbyId, rid, 'r');
        if (s.promosUsed.includes(mr)) return { state: s, result: { refunded: false, already: true } };
        let refunded = false;
        if (s.promosUsed.includes(mp)) {
            s.balance = fromC(toC(s.balance) + costC);
            addStat(s, 'totalSpent', -costC);
            s.stats.casesOpened = Math.max(0, s.stats.casesOpened - rounds);
            s.promosUsed = s.promosUsed.filter(x => x !== mp);
            refunded = true;
        }
        s.promosUsed = withMarker(s.promosUsed, mr);
        return { state: s, result: { refunded, already: false, amount: refunded ? fromC(costC) : 0 } };
    };

    actions.lobbyPayout = function lobbyPayout(state, params, rng, now) {
        if (!params || typeof params !== 'object') throw engineErr('Petición inválida.');
        const lobbyId = str(params.lobbyId, 80);
        if (!Array.isArray(params.itemIds) || params.itemIds.length > 60) throw engineErr('Petición inválida.');
        const infos = params.itemIds.map(id => {
            const info = engine.skinInfo(Number(id));
            if (!info) throw engineErr('Objeto inválido.');
            return info;
        });
        const s = engine.normalizeState(state, rng);
        const mw = ledgerMarker(lobbyId, 'payout', 'w');
        if (s.promosUsed.includes(mw)) return { state: s, result: { items: [], already: true } };

        infos.sort((a, b) => toC(b.price) - toC(a.price));
        const room = Math.max(0, INVENTORY_LIMIT - s.inventory.length);
        const keep = infos.slice(0, room);
        const sold = infos.slice(room);
        const taken = new Set(s.inventory.map(i => i.uid));
        const ts = Number.isFinite(now) ? now : Date.now();
        const items = keep.map((info, k) => {
            const entry = { uid: newUid(taken), id: info.id, name: info.name, price: info.price, rarity: info.rarity };
            s.inventory.push(entry);
            s.stats.rarityDrops[entry.rarity] = (s.stats.rarityDrops[entry.rarity] || 0) + 1;
            s.history.push({
                id: info.id, name: info.name, price: info.price, rarity: info.rarity,
                caseName: 'Batalla PvP', timestamp: ts + k, uid: entry.uid
            });
            return entry;
        });
        if (s.history.length > HISTORY_LIMIT) s.history.splice(0, s.history.length - HISTORY_LIMIT);
        const soldC = sold.reduce((sum, i) => sum + toC(i.price), 0);
        s.balance = fromC(toC(s.balance) + soldC);
        const wonC = infos.reduce((sum, i) => sum + toC(i.price), 0);
        addStat(s, 'totalWon', wonC);
        s.promosUsed = withMarker(s.promosUsed, mw);
        return { state: s, result: { items, autoSold: sold.length, credited: fromC(soldC), value: fromC(wonC), already: false } };
    };
}

// ==================== service ====================
function createLobbies({ store, game, engine, apiError, rng = secureRng, now = Date.now, log = console, ttl = {} }) {
    const table = store.table('lobbies');
    const T = Object.assign({ reserve: RESERVE_TTL_MS, open: OPEN_TTL_MS, settle: SETTLE_GRACE_MS, sweep: SWEEP_EVERY_MS, perLobby: RECONCILE_PER_LOBBY_MS }, ttl);
    const MODES = engine.constants.BATTLE_MODES;
    const BOT_NAMES = engine.constants.BOT_NAMES;
    const toC = engine.toCents;
    const fromC = engine.fromCents;

    const rowCache = new Map();      // id -> { at, row | null, promise }
    let listCache = null;            // { at, promise, value }
    const reconciledAt = new Map();  // id -> ms
    let lastSweep = 0;

    // ---------- row <-> lobby ----------
    function parseRow(row) {
        if (!row || typeof row !== 'object') return null;
        const seats = jsonCol(row.seats, []);
        const result = jsonCol(row.result, null);
        const started = row['started-at'] ? Date.parse(row['started-at']) : NaN;
        return {
            id: String(row.id),
            status: String(row.status || 'open'),
            mode: String(row.mode || ''),
            crazy: row.crazy === true || row.crazy === 'true',
            caseIds: (jsonCol(row['case-ids'], []) || []).map(Number),
            seats: (Array.isArray(seats) ? seats : []).map(s => {
                const e = Object.assign({}, s);
                if (!e.state) e.state = e.paid ? 'paid' : 'reserved';
                e.paid = e.state === 'paid';
                return e;
            }),
            createdBy: row['created-by'] == null ? null : String(row['created-by']),
            cost: Number(row.cost) || 0,
            result: result && typeof result === 'object' ? result : null,
            version: Number(row.version) || 0,
            startedAt: Number.isFinite(started) ? started : null,
            createdAt: Date.parse(row.createdAt) || 0
        };
    }

    function columns(patch) {
        const out = {};
        if (patch.status !== undefined) out.status = patch.status;
        if (patch.seats !== undefined) out.seats = patch.seats;
        if (patch.result !== undefined) out.result = patch.result;
        if (patch.startedAt !== undefined) out['started-at'] = new Date(patch.startedAt).toISOString();
        return out;
    }

    function applyPatch(lobby, patch) {
        const next = Object.assign({}, lobby, { version: lobby.version + 1 });
        ['status', 'seats', 'result', 'startedAt'].forEach(k => { if (patch[k] !== undefined) next[k] = patch[k]; });
        return clone(next);
    }

    const modeInfo = lobby => MODES[lobby.mode];
    const rounds = lobby => lobby.caseIds.length;
    const cancelling = lobby => !!(lobby.result && lobby.result.cancelling);

    // ---------- cached / fresh reads ----------
    function prime(lobby) {
        rowCache.set(lobby.id, { at: now(), lobby: clone(lobby), promise: null });
        listCache = null;
    }

    async function fresh(id) {
        const row = await table.get(id);
        const lobby = parseRow(row);
        if (lobby) rowCache.set(lobby.id, { at: now(), lobby: clone(lobby), promise: null });
        return lobby;
    }

    async function cached(id) {
        const hit = rowCache.get(id);
        if (hit && hit.promise) return hit.promise.then(l => clone(l));
        if (hit && now() - hit.at < CACHE_MS) return clone(hit.lobby);
        const promise = fresh(id).finally(() => {
            const cur = rowCache.get(id);
            if (cur && cur.promise === promise) cur.promise = null;
        });
        rowCache.set(id, { at: hit ? hit.at : 0, lobby: hit ? hit.lobby : null, promise });
        const lobby = await promise;
        if (!lobby) rowCache.delete(id);
        return lobby ? clone(lobby) : null;
    }

    /*
     * Optimistic read-modify-write on one lobby. fn(lobby) returns a patch { status?, seats?, result?, startedAt? }
     * or null for "nothing to change"; it may throw. `seed` (an already fresh lobby) saves the first read.
     */
    async function mutate(id, fn, seed) {
        for (let attempt = 0; attempt < 6; attempt++) {
            const lobby = attempt === 0 && seed ? clone(seed) : await fresh(id);
            if (!lobby) throw apiError(404, 'Batalla no encontrada.', 'not_found');
            const patch = await fn(lobby);
            if (!patch) return { lobby, changed: false };
            const n = await table.update(
                { id: `eq.${id}`, version: `eq.${lobby.version}` },
                Object.assign(columns(patch), { version: lobby.version + 1 })
            );
            if (n > 0) {
                const next = applyPatch(lobby, patch);
                prime(next);
                return { lobby: next, changed: true };
            }
            rowCache.delete(id);
            await sleep(5 + Math.floor(Math.random() * 30) * (attempt + 1));
        }
        throw apiError(409, 'La batalla está muy concurrida. Inténtalo de nuevo.', 'conflict');
    }

    // ---------- seats ----------
    function pruneSeats(seats) {
        const closed = seats.filter(s => s.state === 'refunded');
        if (closed.length <= MAX_CLOSED_SEATS) return seats;
        const drop = new Set(closed.slice(0, closed.length - MAX_CLOSED_SEATS));
        return seats.filter(s => !drop.has(s));
    }

    function expireStale(seats) {
        let changed = false;
        seats.forEach(s => {
            if (s.state === 'reserved' && now() - (s.at || 0) > T.reserve) { s.state = 'refunding'; s.paid = false; changed = true; }
        });
        return changed;
    }

    function isFull(lobby) {
        const info = modeInfo(lobby);
        if (!info) return false;
        for (let i = 0; i < info.seats; i++) {
            const s = lobby.seats.find(x => x.seat === i && isActive(x));
            if (!s || s.state !== 'paid') return false;
        }
        return true;
    }

    function publicSeats(lobby) {
        return lobby.seats.filter(isActive).sort((a, b) => a.seat - b.seat).map(s => ({
            seat: s.seat,
            team: s.team,
            steamId: s.isBot ? null : s.steamId,
            name: s.name,
            avatar: s.avatar || null,
            isBot: !!s.isBot,
            paid: s.state === 'paid'
        }));
    }

    function hasPaidHuman(lobby) {
        return lobby.seats.some(s => s.state === 'paid' && !s.isBot);
    }

    function isVisible(lobby) {
        if (cancelling(lobby) || lobby.status === 'cancelled') return false;
        if (lobby.status === 'open') return hasPaidHuman(lobby);
        if (lobby.status === 'finished' || lobby.status === 'running') {
            return !lobby.startedAt || now() - lobby.startedAt < FINISHED_VISIBLE_MS;
        }
        return false;
    }

    function summary(lobby) {
        const info = modeInfo(lobby) || { seats: 0 };
        const out = {
            id: lobby.id,
            status: lobby.status,
            mode: lobby.mode,
            crazy: lobby.crazy,
            caseIds: lobby.caseIds,
            cost: lobby.cost,
            slots: info.seats,
            cancelling: cancelling(lobby),
            createdBy: lobby.createdBy,
            createdAt: lobby.createdAt || null,
            startedAt: lobby.startedAt,
            seats: publicSeats(lobby)
        };
        const res = lobby.result;
        if (res && !res.cancelling && Array.isArray(res.seats)) {
            out.pot = res.pot;
            out.winnerTeam = res.winnerTeam;
            out.winners = res.seats.filter(s => s.team === res.winnerTeam).map(s => s.name);
        }
        return out;
    }

    function detail(lobby) {
        const out = summary(lobby);
        const res = lobby.result;
        if (res && !res.cancelling && (lobby.status === 'running' || lobby.status === 'finished')) {
            out.result = res;
            out.countdownMs = COUNTDOWN_MS;
        }
        return out;
    }

    // ---------- start ----------
    function buildResult(lobby) {
        const info = modeInfo(lobby);
        const seatsMeta = [];
        for (let i = 0; i < info.seats; i++) {
            const s = lobby.seats.find(x => x.seat === i && x.state === 'paid');
            seatsMeta.push({ name: s.name, steamId: s.isBot ? null : s.steamId, avatar: s.avatar || null, isBot: !!s.isBot });
        }
        const res = engine.resolveBattle({ caseIds: lobby.caseIds, mode: lobby.mode, crazy: lobby.crazy, seats: seatsMeta }, rng);
        delete res.potCents;
        const prizes = computePayouts(res, engine);
        res.winnerSeats = prizes.winnerSeats;
        res.payouts = prizes.payouts;
        res.houseKept = prizes.houseKept;
        res.cost = lobby.cost;
        res.paid = [];
        return res;
    }

    // Starts the lobby if every seat is paid. Returns the lobby (running) or null when it did not start here.
    async function maybeStart(id, seed) {
        for (let attempt = 0; attempt < 4; attempt++) {
            const lobby = attempt === 0 && seed ? clone(seed) : await fresh(id);
            if (!lobby || lobby.status !== 'open' || cancelling(lobby) || !isFull(lobby)) return null;
            const result = buildResult(lobby);
            const startedAt = now();
            const n = await table.update(
                { id: `eq.${id}`, version: `eq.${lobby.version}` },
                { status: 'running', result, 'started-at': new Date(startedAt).toISOString(), version: lobby.version + 1 }
            );
            if (n > 0) {
                const next = applyPatch(lobby, { status: 'running', result, startedAt });
                prime(next);
                return settle(id, next);
            }
            rowCache.delete(id);
        }
        return null;
    }

    // ---------- settle (payouts) ----------
    async function settle(id, seed) {
        const lobby = seed && seed.status === 'running' ? clone(seed) : await fresh(id);
        if (!lobby || lobby.status !== 'running' || !lobby.result || lobby.result.cancelling) return lobby;
        const res = lobby.result;
        const done = new Set(res.paid || []);
        const pending = (res.payouts || []).filter(p => !done.has(p.steamId));
        const succeeded = [];
        for (const p of pending) {
            try {
                await game.runAction(p.steamId, 'lobbyPayout', { lobbyId: id, itemIds: p.items.map(i => i.id) });
                succeeded.push(p.steamId);
            } catch (e) {
                log.error(`[lobbies] pago de ${id} a ${p.steamId} falló:`, e && e.message);
            }
        }
        try {
            const out = await mutate(id, l => {
                if (l.status !== 'running' || !l.result) return null;
                const paid = new Set(l.result.paid || []);
                succeeded.forEach(s => paid.add(s));
                const all = (l.result.payouts || []).every(p => paid.has(p.steamId));
                const same = paid.size === (l.result.paid || []).length;
                if (same && !all) return null;
                return { result: Object.assign({}, l.result, { paid: [...paid] }), status: all ? 'finished' : 'running' };
            }, lobby);
            return out.lobby;
        } catch (e) {
            log.error(`[lobbies] cierre de ${id} falló:`, e && e.message);
            return lobby;
        }
    }

    // ---------- refunds ----------
    async function processRefunds(id) {
        const lobby = await fresh(id);
        if (!lobby) return null;
        const todo = lobby.seats.filter(s => s.state === 'refunding' && !s.isBot);
        const closed = new Set();
        for (const s of todo) {
            try {
                await game.runAction(s.steamId, 'lobbyRefund', { lobbyId: id, rid: s.rid, cost: lobby.cost, rounds: rounds(lobby) });
                closed.add(s.rid);
            } catch (e) {
                log.error(`[lobbies] reembolso de ${id} a ${s.steamId} falló:`, e && e.message);
            }
        }
        try {
            const out = await mutate(id, l => {
                const seats = l.seats.map(s => (s.state === 'refunding' && (s.isBot || closed.has(s.rid)) ? Object.assign({}, s, { state: 'refunded', paid: false }) : s));
                const changed = seats.some((s, i) => s !== l.seats[i]);
                const settled = !seats.some(s => s.state === 'refunding' || isActive(s));
                const close = l.status === 'open' && cancelling(l) && settled;
                if (!changed && !close) return null;
                const patch = { seats: pruneSeats(seats) };
                if (close) patch.status = 'cancelled';
                return patch;
            }, lobby);
            return out.lobby;
        } catch (e) {
            log.error(`[lobbies] cierre de reembolsos de ${id} falló:`, e && e.message);
            return lobby;
        }
    }

    // Marks every active seat for refund and closes the lobby when nothing is left to refund
    async function cancelLobby(id, reason, who) {
        const out = await mutate(id, l => {
            if (who !== undefined && l.createdBy !== who) throw apiError(403, 'Solo el creador puede cancelar la batalla.', 'forbidden');
            if (l.status !== 'open') throw apiError(409, 'La batalla ya ha empezado o terminado.', 'not_open');
            if (cancelling(l)) return null;
            const seats = l.seats.map(s => {
                if (!isActive(s)) return s;
                return Object.assign({}, s, s.isBot ? { state: 'refunded', paid: false } : { state: 'refunding', paid: false });
            });
            const pendingRefund = seats.some(s => s.state === 'refunding');
            return {
                seats: pruneSeats(seats),
                result: { cancelling: true, reason: reason || 'cancelled' },
                status: pendingRefund ? 'open' : 'cancelled'
            };
        });
        if (out.lobby.status === 'open') return processRefunds(id);
        return out.lobby;
    }

    // ---------- reconcile ----------
    async function reconcileLobby(l, force) {
        const t = now();
        if (!force && t - (reconciledAt.get(l.id) || 0) < T.perLobby) return;
        reconciledAt.set(l.id, t);
        if (reconciledAt.size > 500) reconciledAt.clear();
        try {
            if (l.status === 'open') {
                if (cancelling(l)) { await processRefunds(l.id); return; }
                if (l.createdAt && t - l.createdAt > T.open) { await cancelLobby(l.id, 'timeout'); return; }
                const stale = l.seats.some(s => s.state === 'reserved' && t - (s.at || 0) > T.reserve);
                if (stale) {
                    await mutate(l.id, x => {
                        const seats = clone(x.seats);
                        return expireStale(seats) ? { seats } : null;
                    });
                }
                if (stale || l.seats.some(s => s.state === 'refunding')) await processRefunds(l.id);
                if (isFull(l)) await maybeStart(l.id);
            } else if (l.status === 'running') {
                const done = new Set((l.result && l.result.paid) || []);
                const pending = l.result && (l.result.payouts || []).some(p => !done.has(p.steamId));
                const started = l.startedAt || 0;
                if (l.result && (pending || !(l.result.payouts || []).length) && (force || t - started > T.settle)) await settle(l.id);
            }
        } catch (e) {
            log.error(`[lobbies] reconciliación de ${l.id} falló:`, e && e.message);
        }
    }

    // Looks at the oldest open / running lobbies (they may have dropped out of the newest-20 list)
    async function sweep(force) {
        const t = now();
        if (!force && t - lastSweep < T.sweep) return;
        lastSweep = t;
        try {
            const [open, running] = await Promise.all([
                table.list({ filters: { status: 'eq.open' }, order: 'created_at.asc', limit: 10 }),
                table.list({ filters: { status: 'eq.running' }, order: 'created_at.asc', limit: 10 })
            ]);
            const lobbies = open.concat(running).map(parseRow).filter(Boolean);
            await Promise.all(lobbies.map(l => reconcileLobby(l, force)));
        } catch (e) {
            log.error('[lobbies] barrido falló:', e && e.message);
        }
    }

    function needsReconcile(l) {
        const t = now();
        if (l.status === 'open') {
            return cancelling(l)
                || (l.createdAt && t - l.createdAt > T.open)
                || l.seats.some(s => s.state === 'refunding' || (s.state === 'reserved' && t - (s.at || 0) > T.reserve))
                || isFull(l);
        }
        if (l.status === 'running') {
            const done = new Set((l.result && l.result.paid) || []);
            return !!(l.result && (l.result.payouts || []).some(p => !done.has(p.steamId)) && t - (l.startedAt || 0) > T.settle);
        }
        return false;
    }

    // ---------- public API ----------
    async function list() {
        const hit = listCache;
        if (hit && hit.promise) return hit.promise;
        if (hit && hit.value && now() - hit.at < CACHE_MS) return hit.value;
        const promise = (async () => {
            const rows = await table.list({ filters: { status: 'in.(open,running,finished)' }, order: 'created_at.desc', limit: LIST_FETCH });
            const lobbies = rows.map(parseRow).filter(Boolean);
            lobbies.forEach(l => rowCache.set(l.id, { at: now(), lobby: clone(l), promise: null }));
            const todo = lobbies.filter(needsReconcile).slice(0, 4);
            if (todo.length || now() - lastSweep >= T.sweep) {
                await Promise.all(todo.map(l => reconcileLobby(l)));
                await sweep();
            }
            // show what the reconciler just changed, not the rows read before it
            const latest = lobbies.map(l => {
                const hit = todo.includes(l) ? rowCache.get(l.id) : null;
                return hit && hit.lobby ? hit.lobby : l;
            });
            const visible = latest.filter(isVisible).slice(0, LIST_LIMIT).map(summary);
            return { lobbies: visible };
        })();
        listCache = { at: now(), promise, value: null };
        try {
            const value = await promise;
            listCache = { at: now(), promise: null, value };
            return value;
        } catch (e) {
            listCache = null;
            throw e;
        }
    }

    async function get(id) {
        let lobby = await cached(id);
        if (!lobby) throw apiError(404, 'Batalla no encontrada.', 'not_found');
        if (needsReconcile(lobby)) {
            await reconcileLobby(lobby);
            lobby = (await cached(id)) || lobby;
        }
        return detail(lobby);
    }

    async function playerInfo(steamId) {
        const profile = await game.getProfile(steamId);
        return {
            name: cleanName(profile.name, steamId),
            avatar: cleanAvatar(profile.ext && profile.ext.avatar),
            balance: profile.data ? Number(profile.data.balance) || 0 : 0
        };
    }

    function newRid() {
        return crypto.randomBytes(8).toString('hex');
    }

    // Steps 2-4 for an existing reservation { id, rid, seat }; returns { lobby, state }
    async function payAndConfirm(steamId, lobby, rid) {
        const id = lobby.id;
        let paid;
        try {
            paid = await game.runAction(steamId, 'lobbyPay', { lobbyId: id, rid, cost: lobby.cost, rounds: rounds(lobby) });
        } catch (e) {
            const definitive = e && e.code === 'insufficient_balance';
            try {
                await mutate(id, l => {
                    const idx = l.seats.findIndex(s => s.rid === rid && s.state === 'reserved');
                    if (idx < 0) return null;
                    const seats = clone(l.seats);
                    if (definitive) seats.splice(idx, 1);
                    else { seats[idx].state = 'refunding'; seats[idx].paid = false; }
                    return { seats };
                });
                if (!definitive) await processRefunds(id);
            } catch (e2) {
                log.error(`[lobbies] liberar reserva de ${id} falló:`, e2 && e2.message);
            }
            throw e;
        }

        let confirmed;
        try {
            confirmed = await mutate(id, l => {
                const seat = l.seats.find(s => s.rid === rid);
                if (!seat || (seat.state !== 'reserved' && seat.state !== 'paid') || l.status !== 'open' || cancelling(l)) {
                    throw Object.assign(new Error('lost'), { lostSeat: true });
                }
                if (seat.state === 'paid') return null;
                const seats = clone(l.seats);
                const mine = seats.find(s => s.rid === rid);
                mine.state = 'paid';
                mine.paid = true;
                return { seats };
            });
        } catch (e) {
            if (e && e.lostSeat) {
                await game.runAction(steamId, 'lobbyRefund', { lobbyId: id, rid, cost: lobby.cost, rounds: rounds(lobby) });
                throw apiError(409, 'Tu plaza ya no estaba disponible. Se te ha devuelto el dinero.', 'seat_lost');
            }
            // Unknown outcome of the confirmation: leave it to the reconciler, which expires the unpaid reservation
            throw e;
        }
        let current = confirmed.lobby;
        if (isFull(current)) {
            const started = await maybeStart(id, current);
            if (started) current = started;
            else current = (await fresh(id)) || current;
        }
        return { lobby: current, state: paid.state };
    }

    function parseCreate(params) {
        if (!params || typeof params !== 'object' || Array.isArray(params)) throw apiError(400, 'Petición inválida.', 'invalid');
        let cfg;
        try {
            cfg = engine.parseBattleConfig(params);
        } catch (e) {
            if (e && e.isEngineError) throw apiError(400, e.message, e.code);
            throw e;
        }
        return cfg;
    }

    async function create(steamId, params) {
        const cfg = parseCreate(params);
        const costC = cfg.caseList.reduce((sum, c) => sum + toC(c.price), 0);
        const cost = fromC(costC);

        // best effort cap of open lobbies per player (uses the cached list)
        try {
            const open = (await list()).lobbies.filter(l => l.status === 'open' && l.createdBy === steamId);
            if (open.length >= MAX_OPEN_PER_USER) {
                throw apiError(429, `Ya tienes ${MAX_OPEN_PER_USER} batallas abiertas. Cancela alguna o espera a que empiecen.`, 'too_many_lobbies');
            }
        } catch (e) {
            if (e && e.code === 'too_many_lobbies') throw e;
        }

        const me = await playerInfo(steamId);
        if (toC(me.balance) < costC) throw apiError(400, 'Saldo insuficiente.', 'insufficient_balance');

        const rid = newRid();
        const row = await table.insert({
            status: 'open',
            mode: cfg.modeKey,
            crazy: cfg.crazy,
            'case-ids': cfg.caseList.map(c => c.id),
            seats: [{
                seat: 0, steamId, name: me.name, avatar: me.avatar, team: cfg.mode.teams[0],
                state: 'reserved', paid: false, rid, at: now()
            }],
            'created-by': steamId,
            cost,
            result: null,
            version: 0
        });
        const lobby = parseRow(row);
        prime(lobby);
        let out;
        try {
            out = await payAndConfirm(steamId, lobby, rid);
        } catch (e) {
            // the lobby never had a paid seat: close it so it does not linger
            try { await cancelLobby(lobby.id, 'creator_failed'); } catch (e2) { /* the reconciler will */ }
            throw e;
        }
        return { lobby: detail(out.lobby), state: out.state };
    }

    async function join(steamId, params) {
        const id = params && typeof params.id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(params.id) ? params.id : null;
        if (!id) throw apiError(400, 'Batalla inválida.', 'invalid');
        let want = null;
        if (params.seat !== undefined && params.seat !== null) {
            want = Number(params.seat);
            if (!Number.isInteger(want) || want < 0 || want > 3) throw apiError(400, 'Plaza inválida.', 'invalid');
        }

        const first = await fresh(id);
        if (!first) throw apiError(404, 'Batalla no encontrada.', 'not_found');
        const me = await playerInfo(steamId);
        if (toC(me.balance) < toC(first.cost)) throw apiError(400, 'Saldo insuficiente.', 'insufficient_balance');

        const rid = newRid();
        let seatIdx = -1;
        let expiredAny = false;
        const reserved = await mutate(id, l => {
            if (l.status !== 'open' || cancelling(l)) throw apiError(409, 'Esta batalla ya no está abierta.', 'not_open');
            if (!hasPaidHuman(l)) throw apiError(409, 'Esta batalla no está disponible.', 'not_open');
            const info = modeInfo(l);
            if (!info) throw apiError(409, 'Batalla no válida.', 'not_open');
            const seats = clone(l.seats);
            expiredAny = expireStale(seats) || expiredAny;
            if (seats.some(s => isActive(s) && !s.isBot && s.steamId === steamId)) throw apiError(409, 'Ya estás en esta batalla.', 'already_in');
            const free = [];
            for (let i = 0; i < info.seats; i++) if (!seats.some(s => s.seat === i && isActive(s))) free.push(i);
            if (!free.length) throw apiError(409, 'La batalla está llena.', 'lobby_full');
            if (want !== null) {
                if (want >= info.seats) throw apiError(400, 'Plaza inválida.', 'invalid');
                if (!free.includes(want)) throw apiError(409, 'Esa plaza ya está ocupada.', 'seat_taken');
                seatIdx = want;
            } else {
                seatIdx = free[0];
            }
            seats.push({
                seat: seatIdx, steamId, name: me.name, avatar: me.avatar, team: info.teams[seatIdx],
                state: 'reserved', paid: false, rid, at: now()
            });
            return { seats: pruneSeats(seats) };
        }, first);

        if (expiredAny) processRefunds(id).catch(() => {});
        const out = await payAndConfirm(steamId, reserved.lobby, rid);
        return { lobby: detail(out.lobby), state: out.state };
    }

    async function fillBots(steamId, params) {
        const id = params && typeof params.id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(params.id) ? params.id : null;
        if (!id) throw apiError(400, 'Batalla inválida.', 'invalid');
        const out = await mutate(id, l => {
            if (l.createdBy !== steamId) throw apiError(403, 'Solo el creador puede llenar con bots.', 'forbidden');
            if (l.status !== 'open' || cancelling(l)) throw apiError(409, 'Esta batalla ya no está abierta.', 'not_open');
            const info = modeInfo(l);
            const seats = clone(l.seats);
            expireStale(seats);
            const used = new Set(seats.filter(isActive).map(s => s.name));
            const pool = BOT_NAMES.filter(n => !used.has(n));
            for (let i = pool.length - 1; i > 0; i--) {
                const j = crypto.randomInt(0, i + 1);
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }
            let added = 0;
            for (let i = 0; i < info.seats; i++) {
                if (seats.some(s => s.seat === i && isActive(s))) continue;
                seats.push({
                    seat: i, steamId: null, name: pool[added++], avatar: null, team: info.teams[i],
                    state: 'paid', paid: true, isBot: true, at: now()
                });
            }
            if (!added) throw apiError(409, 'No quedan plazas libres.', 'lobby_full');
            return { seats: pruneSeats(seats) };
        });
        let current = out.lobby;
        if (isFull(current)) {
            const started = await maybeStart(id, current);
            current = started || (await fresh(id)) || current;
        } else if (current.seats.some(s => s.state === 'refunding')) {
            processRefunds(id).catch(() => {});
        }
        return { lobby: detail(current) };
    }

    async function cancel(steamId, params) {
        const id = params && typeof params.id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(params.id) ? params.id : null;
        if (!id) throw apiError(400, 'Batalla inválida.', 'invalid');
        const lobby = await cancelLobby(id, 'cancelled', steamId);
        return { lobby: detail(lobby) };
    }

    return {
        list, get, create, join, fillBots, cancel,
        // exposed for tests / maintenance
        reconcile: (opts) => sweep(!!(opts && opts.force)),
        reconcileLobby: (id) => fresh(id).then(l => (l ? reconcileLobby(l, true) : null)),
        settle: (id) => settle(id),
        processRefunds,
        fresh,
        constants: { RESERVE_TTL_MS, OPEN_TTL_MS, COUNTDOWN_MS }
    };
}

module.exports = { createLobbies, registerActions, computePayouts, ledgerMarker, COUNTDOWN_MS };
