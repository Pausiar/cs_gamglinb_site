// SkinDrop game engine: pure, deterministic given an rng.
// Shared by the browser (guest mode, global `SkinDropEngine`) and the server
// (require('./public/js/engine.js'), authoritative for Steam users).
//
// Every action has the shape (state, params, rng, now?) => { state: newState, result }
// and never mutates its input. Invalid input throws an EngineError whose message is
// Spanish and safe to show to the user. Money is computed in integer cents and
// stored as euros with 2 decimals.
(function (root, factory) {
    'use strict';
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./data.js'));
    } else {
        /* global skins, cases, dropChances, getRarity, getItemChances, rollItem */
        root.SkinDropEngine = factory({
            skins: skins,
            cases: cases,
            dropChances: dropChances,
            getRarity: getRarity,
            getItemChances: getItemChances,
            rollItem: rollItem
        });
    }
})(typeof self !== 'undefined' ? self : this, function (data) {
    'use strict';

    // ==================== CONFIG ====================
    const HISTORY_LIMIT = 100;
    const INVENTORY_LIMIT = 500;
    const UPGRADE_HOUSE_EDGE = 0.05;
    const UPGRADE_MAX_CHANCE = 75;
    const UPGRADE_MIN_CHANCE = 0.5;
    const BATTLE_MAX_ROUNDS = 10;
    const SELL_MAX_ITEMS = 500;
    const PROMOS = { test: 10000 };
    const RARITIES = ['consumer', 'industrial', 'milspec', 'restricted', 'classified', 'covert', 'gold'];

    const BATTLE_MODES = {
        '1v1': { seats: 2, teams: [0, 1] },
        '1v1v1': { seats: 3, teams: [0, 1, 2] },
        '2v2': { seats: 4, teams: [0, 0, 1, 1] },
        '1v1v1v1': { seats: 4, teams: [0, 1, 2, 3] }
    };
    const BOT_NAMES = [
        'NightHunter', 'xXSniperXx', 'LuckyBot', 'HeadshotKing', 'SilverFox', 'PhantomX',
        'GoldenEagle', 'ToxicRush', 'ClutchMaster', 'AceHunter', 'FragMachine', 'RushB_Bot',
        'DeagleDiva', 'SprayControl', 'FlashBang', 'EcoRoundEddie'
    ];

    // ==================== ERRORS ====================
    function EngineError(message, code) {
        const e = new Error(message);
        e.name = 'EngineError';
        e.code = code || 'invalid';
        e.isEngineError = true;
        return e;
    }
    function fail(message, code) { throw EngineError(message, code); }

    // ==================== MONEY ====================
    function toCents(n) { return Math.round((Number(n) || 0) * 100); }
    function fromCents(c) { return c / 100; }
    function round2(n) { return fromCents(toCents(n)); }

    // ==================== CATALOG ====================
    const skinById = new Map();
    Object.keys(data.skins).forEach(rarity => {
        data.skins[rarity].forEach(s => skinById.set(s.id, { id: s.id, name: s.name, price: s.price, rarity }));
    });
    const caseById = new Map();
    data.cases.forEach(c => caseById.set(c.id, c));

    function skinInfo(id) { return skinById.get(id) || null; }
    function rarityOf(item) {
        const s = skinById.get(item.id);
        return s ? s.rarity : data.getRarity(item);
    }

    // ==================== STATE ====================
    function defaultStats() {
        const rarityDrops = {};
        RARITIES.forEach(r => { rarityDrops[r] = 0; });
        return { casesOpened: 0, totalSpent: 0, totalWon: 0, rarityDrops };
    }

    function defaultState() {
        return { balance: 0, inventory: [], stats: defaultStats(), history: [], promosUsed: [] };
    }

    function isUid(v) { return typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v); }
    function nonNeg(v) { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 0; }
    function count(v) { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 ? n : 0; }

    // Item entries are rebuilt from the catalog (name/price/rarity are never trusted from storage)
    function itemEntry(id, uid) {
        const s = skinInfo(id);
        if (!s) return null;
        return { uid, id: s.id, name: s.name, price: s.price, rarity: s.rarity };
    }

    // Brings any stored / legacy state into the canonical shape (fresh object)
    function normalizeState(raw, rng) {
        const base = defaultState();
        if (!raw || typeof raw !== 'object') return base;
        const out = base;
        out.balance = round2(nonNeg(raw.balance));

        const seen = new Set();
        (Array.isArray(raw.inventory) ? raw.inventory : []).forEach(it => {
            if (!it || typeof it !== 'object') return;
            let uid = isUid(it.uid) && !seen.has(it.uid) ? it.uid : null;
            if (!uid) uid = makeUid(rng || Math.random, seen);
            const entry = itemEntry(Number(it.id), uid);
            if (!entry) return;
            seen.add(uid);
            out.inventory.push(entry);
        });

        const st = raw.stats && typeof raw.stats === 'object' ? raw.stats : {};
        out.stats.casesOpened = count(st.casesOpened);
        out.stats.totalSpent = round2(nonNeg(st.totalSpent));
        out.stats.totalWon = round2(nonNeg(st.totalWon));
        const rd = st.rarityDrops && typeof st.rarityDrops === 'object' ? st.rarityDrops : {};
        RARITIES.forEach(r => { out.stats.rarityDrops[r] = count(rd[r]); });

        (Array.isArray(raw.history) ? raw.history : []).slice(-HISTORY_LIMIT).forEach(h => {
            if (!h || typeof h !== 'object') return;
            const s = skinInfo(Number(h.id));
            if (!s) return;
            const entry = {
                id: s.id, name: s.name, price: round2(nonNeg(h.price) || s.price), rarity: s.rarity,
                caseName: typeof h.caseName === 'string' ? h.caseName.slice(0, 80) : '',
                timestamp: Number.isFinite(Number(h.timestamp)) ? Number(h.timestamp) : 0
            };
            if (isUid(h.uid)) entry.uid = h.uid;
            out.history.push(entry);
        });

        const promos = raw.promosUsed;
        (Array.isArray(promos) ? promos : []).forEach(p => {
            if (typeof p === 'string' && p.length <= 64 && !out.promosUsed.includes(p)) out.promosUsed.push(p);
        });
        return out;
    }

    function clone(state) {
        return {
            balance: state.balance,
            inventory: state.inventory.map(i => Object.assign({}, i)),
            stats: Object.assign({}, state.stats, { rarityDrops: Object.assign({}, state.stats.rarityDrops) }),
            history: state.history.map(h => Object.assign({}, h)),
            promosUsed: state.promosUsed.slice()
        };
    }

    // Input states are normalized (cheap) so actions work on canonical data only
    function prepare(state, rng) { return clone(normalizeState(state, rng)); }

    const UID_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';
    function makeUid(rng, taken) {
        const used = uid => !!taken && (taken.has ? taken.has(uid) : taken.some(i => i.uid === uid));
        let uid = '';
        for (let attempt = 0; attempt < 8; attempt++) {
            uid = '';
            for (let i = 0; i < 12; i++) uid += UID_CHARS[Math.floor(rng() * UID_CHARS.length) % UID_CHARS.length];
            if (!used(uid)) return uid;
        }
        // Degenerate rng (tests): make it unique with a counter suffix
        for (let n = 1; ; n++) {
            if (!used(uid + '-' + n)) return uid + '-' + n;
        }
    }

    function addItem(state, skinId, rng) {
        const entry = itemEntry(skinId, makeUid(rng, state.inventory));
        state.inventory.push(entry);
        return entry;
    }

    function pushHistory(state, item, caseName, timestamp) {
        state.history.push({
            id: item.id, name: item.name, price: item.price, rarity: item.rarity,
            caseName, timestamp, uid: item.uid
        });
        if (state.history.length > HISTORY_LIMIT) state.history.splice(0, state.history.length - HISTORY_LIMIT);
    }

    function addCents(state, field, cents) {
        state.stats[field] = fromCents(toCents(state.stats[field]) + cents);
    }

    function ensureRoom(state, adding) {
        if (state.inventory.length + adding > INVENTORY_LIMIT) {
            fail('Inventario lleno (máximo ' + INVENTORY_LIMIT + ' objetos). Vende algunas skins primero.', 'inventory_full');
        }
    }

    // ==================== VALIDATION ====================
    function objParams(params) {
        if (!params || typeof params !== 'object' || Array.isArray(params)) fail('Petición inválida.');
        return params;
    }

    function intId(v, message) {
        const n = typeof v === 'string' && /^\d{1,6}$/.test(v) ? Number(v) : v;
        if (!Number.isInteger(n) || n <= 0) fail(message);
        return n;
    }

    function uidList(v, { allowEmpty, max }) {
        if (v === undefined && allowEmpty) return [];
        if (!Array.isArray(v)) fail('Lista de objetos inválida.');
        if (!allowEmpty && v.length === 0) fail('No has seleccionado ningún objeto.');
        if (v.length > max) fail('Demasiados objetos seleccionados.');
        const set = new Set();
        v.forEach(u => {
            if (!isUid(u)) fail('Objeto inválido.');
            if (set.has(u)) fail('Objeto repetido en la selección.');
            set.add(u);
        });
        return v.slice();
    }

    function takeOwned(state, uids) {
        const idx = new Map(state.inventory.map((it, i) => [it.uid, i]));
        const items = uids.map(u => {
            if (!idx.has(u)) fail('Ese objeto ya no está en tu inventario.', 'not_owned');
            return state.inventory[idx.get(u)];
        });
        const remove = new Set(uids);
        state.inventory = state.inventory.filter(it => !remove.has(it.uid));
        return items;
    }

    function rngOf(rng) {
        if (typeof rng !== 'function') throw new Error('Engine: rng requerido');
        return function () {
            const x = Number(rng());
            if (!(x >= 0 && x < 1)) throw new Error('Engine: rng fuera de rango');
            return x;
        };
    }

    // ==================== ACTIONS ====================
    function openCase(state, params, rng, now) {
        const r = rngOf(rng);
        const p = objParams(params);
        const caseId = intId(p.caseId, 'Caja desconocida.');
        const c = caseById.get(caseId);
        if (!c) fail('Caja desconocida.', 'unknown_case');
        const s = prepare(state, r);
        const price = toCents(c.price);
        if (toCents(s.balance) < price) fail('Saldo insuficiente.', 'insufficient_balance');
        ensureRoom(s, 1);

        const rolled = data.rollItem(c.items, r);
        s.balance = fromCents(toCents(s.balance) - price);
        addCents(s, 'totalSpent', price);
        s.stats.casesOpened += 1;
        const item = addItem(s, rolled.id, r);
        addCents(s, 'totalWon', toCents(item.price));
        s.stats.rarityDrops[item.rarity] += 1;
        pushHistory(s, item, c.name, now || Date.now());
        return { state: s, result: { caseId, item, rarity: item.rarity } };
    }

    function sellItems(state, params, rng) {
        const r = rngOf(rng);
        const p = objParams(params);
        const uids = uidList(p.uids, { allowEmpty: false, max: SELL_MAX_ITEMS });
        const s = prepare(state, r);
        const sold = takeOwned(s, uids);
        const cents = sold.reduce((sum, it) => sum + toCents(it.price), 0);
        s.balance = fromCents(toCents(s.balance) + cents);
        return { state: s, result: { sold, amount: fromCents(cents) } };
    }

    // chance (%) = stake / target * (1 - house edge), capped, floored to 2 decimals
    function upgradeChance(stake, targetPrice) {
        if (!(stake > 0) || !(targetPrice > 0)) return 0;
        const raw = (stake / targetPrice) * (1 - UPGRADE_HOUSE_EDGE) * 100;
        return Math.floor(Math.min(raw, UPGRADE_MAX_CHANCE) * 100 + 1e-9) / 100;
    }

    function upgrade(state, params, rng, now) {
        const r = rngOf(rng);
        const p = objParams(params);
        const uids = uidList(p.uids, { allowEmpty: true, max: SELL_MAX_ITEMS });
        let bal = p.balanceStake === undefined || p.balanceStake === null ? 0 : p.balanceStake;
        if (typeof bal !== 'number' || !Number.isFinite(bal) || bal < 0) fail('Cantidad de saldo inválida.');
        const balCents = toCents(bal);
        const mode = p.mode === undefined ? 'under' : p.mode;
        if (mode !== 'under' && mode !== 'over') fail('Modo de tirada inválido.');
        const targetId = intId(p.targetId, 'Skin objetivo inválida.');
        const target = skinInfo(targetId);
        if (!target) fail('Skin objetivo inválida.', 'invalid_target');

        const s = prepare(state, r);
        if (balCents > toCents(s.balance)) fail('Saldo insuficiente para esa apuesta.', 'insufficient_balance');
        const staked = takeOwned(s, uids);
        const itemsCents = staked.reduce((sum, it) => sum + toCents(it.price), 0);
        const stakeCents = itemsCents + balCents;
        if (stakeCents <= 0) fail('Selecciona skins de tu inventario o añade saldo para apostar.');
        const targetCents = toCents(target.price);
        if (targetCents <= stakeCents) fail('El objetivo debe valer más que tu apuesta.', 'invalid_target');
        const chance = upgradeChance(fromCents(stakeCents), target.price);
        if (chance < UPGRADE_MIN_CHANCE) {
            fail('Probabilidad demasiado baja (mínimo ' + UPGRADE_MIN_CHANCE + '%). Elige un objetivo más barato o apuesta más.', 'chance_too_low');
        }

        // Roll in 0.00 .. 99.99 (10000 equally likely values): P(win) is exactly chance %
        const roll = Math.floor(r() * 10000) / 100;
        const win = mode === 'over' ? roll >= round2(100 - chance) : roll < chance;

        s.balance = fromCents(toCents(s.balance) - balCents);
        // Everything staked counts as spent (staked skins were already counted as won when they dropped)
        addCents(s, 'totalSpent', stakeCents);
        let item = null;
        if (win) {
            item = addItem(s, target.id, r);
            addCents(s, 'totalWon', targetCents);
            pushHistory(s, item, 'Upgrader', now || Date.now());
        }
        return {
            state: s,
            result: {
                win, roll, chance, mode,
                stake: fromCents(stakeCents),
                itemsValue: fromCents(itemsCents),
                balanceStake: fromCents(balCents),
                itemCount: staked.length,
                staked,
                target: { id: target.id, name: target.name, price: target.price, rarity: target.rarity },
                item
            }
        };
    }

    function pickBots(r, count, requested) {
        if (requested !== undefined && requested !== null) {
            if (!Array.isArray(requested) || requested.length !== count) fail('Bots inválidos.');
            const set = new Set();
            requested.forEach(n => {
                if (typeof n !== 'string' || !BOT_NAMES.includes(n) || set.has(n)) fail('Bots inválidos.');
                set.add(n);
            });
            return requested.slice();
        }
        const pool = BOT_NAMES.slice();
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(r() * (i + 1));
            const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
        }
        return pool.slice(0, count);
    }

    function battle(state, params, rng, now) {
        const r = rngOf(rng);
        const p = objParams(params);
        const modeKey = p.mode;
        const mode = typeof modeKey === 'string' && Object.prototype.hasOwnProperty.call(BATTLE_MODES, modeKey) ? BATTLE_MODES[modeKey] : null;
        if (!mode) fail('Modo de batalla inválido.');
        if (p.crazy !== undefined && typeof p.crazy !== 'boolean') fail('Opción Crazy inválida.');
        const crazy = p.crazy === true;
        if (!Array.isArray(p.caseIds) || p.caseIds.length === 0) fail('Añade al menos una caja.');
        if (p.caseIds.length > BATTLE_MAX_ROUNDS) fail('Máximo ' + BATTLE_MAX_ROUNDS + ' rondas por batalla.');
        const caseList = p.caseIds.map(id => {
            const c = caseById.get(intId(id, 'Caja desconocida.'));
            if (!c) fail('Caja desconocida.', 'unknown_case');
            return c;
        });
        const bots = pickBots(r, mode.seats - 1, p.botNames);

        const s = prepare(state, r);
        const costCents = caseList.reduce((sum, c) => sum + toCents(c.price), 0);
        if (toCents(s.balance) < costCents) fail('Saldo insuficiente.', 'insufficient_balance');
        const potSize = caseList.length * mode.seats;
        ensureRoom(s, potSize);

        const seats = [{ name: 'Tú', isUser: true, team: mode.teams[0] }]
            .concat(bots.map((name, i) => ({ name, isUser: false, team: mode.teams[i + 1] })));

        // rounds[r][seat] = dropped skin
        const rounds = caseList.map(c => seats.map(() => {
            const it = data.rollItem(c.items, r);
            const info = skinInfo(it.id);
            return { id: info.id, name: info.name, price: info.price, rarity: info.rarity };
        }));

        const totalsC = seats.map((_, i) => rounds.reduce((sum, row) => sum + toCents(row[i].price), 0));
        const teamCount = Math.max.apply(null, mode.teams) + 1;
        const teamsC = new Array(teamCount).fill(0);
        totalsC.forEach((t, i) => { teamsC[seats[i].team] += t; });
        const best = crazy ? Math.min.apply(null, teamsC) : Math.max.apply(null, teamsC);
        const leaders = [];
        teamsC.forEach((t, i) => { if (t === best) leaders.push(i); });
        const tiebreak = leaders.length > 1;
        const winnerTeam = tiebreak ? leaders[Math.floor(r() * leaders.length)] : leaders[0];
        const won = winnerTeam === seats[0].team;
        const potCents = totalsC.reduce((a, b) => a + b, 0);

        s.balance = fromCents(toCents(s.balance) - costCents);
        addCents(s, 'totalSpent', costCents);
        s.stats.casesOpened += caseList.length;
        const items = [];
        if (won) {
            const ts = now || Date.now();
            addCents(s, 'totalWon', potCents);
            let k = 0;
            rounds.forEach((row, ri) => row.forEach(drop => {
                const entry = addItem(s, drop.id, r);
                s.stats.rarityDrops[entry.rarity] += 1;
                pushHistory(s, entry, 'Batalla: ' + caseList[ri].name, ts + k++);
                items.push(entry);
            }));
        }

        return {
            state: s,
            result: {
                mode: modeKey,
                crazy,
                caseIds: caseList.map(c => c.id),
                seats,
                rounds,
                totals: totalsC.map(fromCents),
                teams: teamsC.map(fromCents),
                leaders,
                tiebreak,
                winnerTeam,
                won,
                pot: fromCents(potCents),
                cost: fromCents(costCents),
                items
            }
        };
    }

    function redeemPromo(state, params, rng) {
        const r = rngOf(rng);
        const p = objParams(params);
        if (typeof p.code !== 'string' || p.code.length > 64) fail('Código inválido.', 'invalid_code');
        const code = p.code.trim().toLowerCase();
        if (!Object.prototype.hasOwnProperty.call(PROMOS, code)) fail('Código inválido.', 'invalid_code');
        const s = prepare(state, r);
        if (s.promosUsed.includes(code)) fail('Ya has usado este código.', 'promo_used');
        const amount = PROMOS[code];
        s.balance = fromCents(toCents(s.balance) + toCents(amount));
        s.promosUsed.push(code);
        return { state: s, result: { code, amount } };
    }

    const actions = { openCase, sellItems, upgrade, battle, redeemPromo };

    return {
        actions,
        openCase, sellItems, upgrade, battle, redeemPromo,
        normalizeState,
        defaultState,
        upgradeChance,
        skinInfo,
        rarityOf,
        isUid,
        toCents, fromCents, round2,
        constants: {
            HISTORY_LIMIT, INVENTORY_LIMIT, UPGRADE_HOUSE_EDGE, UPGRADE_MAX_CHANCE, UPGRADE_MIN_CHANCE,
            BATTLE_MAX_ROUNDS, BATTLE_MODES, BOT_NAMES
        }
    };
});
