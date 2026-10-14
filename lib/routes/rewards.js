'use strict';

/*
 * Daily free case ("Caja Diaria").
 *
 *   GET  /api/rewards        -> { canClaim, nextClaimAt, streak, tier, serverNow }      (login required)
 *   POST /api/rewards/claim  -> { state, result: { item, caseName, streak, tier, nextClaimAt } }
 *
 * `claimDaily` is a server-only action (registered in ctx.actions, never in the browser engine):
 *   claimDaily(state, params, rng, now, { steamId, ext }) -> { state, result, ext: { rewards } }
 * Bookkeeping lives in the server-only profile field ext.rewards = { lastClaim, streak, totalClaims }
 * and is written atomically with the new state (and cooldown re-checked on every retry).
 *
 * Cooldown: 24 h rolling from the last claim. Streak: claiming within 48 h of the previous claim
 * keeps it going (+1, max 7), otherwise it restarts at 1. From a streak of 3 the case is better.
 */
const engine = require('../../public/js/engine.js');

const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const STREAK_WINDOW_MS = 48 * 60 * 60 * 1000;
const STREAK_MAX = 7;
const STREAK_BONUS_FROM = 3;
const CASE_NAME = 'Caja Diaria';

// Contents of the Caja Diaria: a fixed list of skin ids per rarity (NOT the whole catalog, so catalog growth never
// changes its value) and the rarity odds in % of each tier. One skin of the rolled rarity is picked uniformly.
// Expected value per claim: normal ~0.19 EUR, bonus ~0.26 EUR (test/rewards.test.js keeps it within 0.10 - 0.30).
const POOLS = {
    consumer: [1, 2, 3, 4],
    industrial: [5, 6, 7, 8],
    milspec: [9, 10, 11, 12, 13],
    restricted: [15, 17, 18],
    classified: [23]
};
const TIERS = {
    normal: { consumer: 55, industrial: 30, milspec: 13.5, restricted: 1.4, classified: 0.1 },
    bonus: { consumer: 45, industrial: 33, milspec: 19.4, restricted: 2.3, classified: 0.3 }
};

function tierFor(streak) {
    return streak >= STREAK_BONUS_FROM ? 'bonus' : 'normal';
}

function rewardsError(message, code) {
    const e = new Error(message);
    e.name = 'EngineError';
    e.code = code;
    e.isEngineError = true;   // lib/app.js answers these with 400 + { error, code }
    return e;
}

function rollSkin(tier, rng) {
    const odds = TIERS[tier];
    const total = Object.values(odds).reduce((a, b) => a + b, 0);
    let x = rng() * total;
    let rarity = 'consumer';
    for (const r of Object.keys(odds)) {
        rarity = r;
        if (x < odds[r]) break;
        x -= odds[r];
    }
    const pool = POOLS[rarity];
    return pool[Math.floor(rng() * pool.length) % pool.length];
}

const UID_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';
function makeUid(rng, taken) {
    for (let attempt = 0; attempt < 8; attempt++) {
        let uid = '';
        for (let i = 0; i < 12; i++) uid += UID_CHARS[Math.floor(rng() * UID_CHARS.length) % UID_CHARS.length];
        if (!taken.has(uid)) return uid;
    }
    for (let n = 1; ; n++) {
        const uid = 'daily-' + n;
        if (!taken.has(uid)) return uid;
    }
}

// Current status from ext.rewards (pure; used by the action and by GET /api/rewards)
function dailyStatus(rewards, now) {
    const rw = rewards && typeof rewards === 'object' ? rewards : {};
    let last = Number(rw.lastClaim);
    if (!Number.isFinite(last) || last <= 0) last = 0;
    if (last > now) last = now;   // clock skew between instances: never lock a player out for longer than 24 h
    const streakStored = Math.min(STREAK_MAX, Math.max(0, Math.floor(Number(rw.streak) || 0)));
    const alive = last > 0 && now - last <= STREAK_WINDOW_MS;
    const nextClaimAt = last ? last + COOLDOWN_MS : 0;
    const streak = alive ? streakStored : 0;
    return {
        last,
        canClaim: !last || now >= nextClaimAt,
        nextClaimAt: nextClaimAt || now,
        streak,                                           // streak as of now (0 when it has lapsed)
        nextStreak: alive ? Math.min(STREAK_MAX, streakStored + 1) : 1
    };
}

function claimDaily(state, params, rng, now, { ext } = {}) {
    const rw = (ext && ext.rewards) || {};
    const st = dailyStatus(rw, now);
    if (!st.canClaim) throw rewardsError('Tu caja diaria aún no está lista.', 'daily_cooldown');

    const s = engine.normalizeState(state, rng);
    if (s.inventory.length >= engine.constants.INVENTORY_LIMIT) {
        throw rewardsError('Inventario lleno (máximo ' + engine.constants.INVENTORY_LIMIT + ' objetos). Vende algunas skins primero.', 'inventory_full');
    }

    const streak = st.nextStreak;
    const tier = tierFor(streak);
    const skin = rollSkin(tier, rng);
    const info = engine.skinInfo(skin);
    const uid = makeUid(rng, new Set(s.inventory.map(i => i.uid)));
    const item = { uid, id: info.id, name: info.name, price: info.price, rarity: info.rarity };

    s.inventory.push(item);
    s.stats.casesOpened += 1;
    s.stats.totalWon = engine.round2(s.stats.totalWon + info.price);
    s.stats.rarityDrops[info.rarity] += 1;
    s.history.push({ id: info.id, name: info.name, price: info.price, rarity: info.rarity, caseName: CASE_NAME, timestamp: now, uid });
    const over = s.history.length - engine.constants.HISTORY_LIMIT;
    if (over > 0) s.history.splice(0, over);

    const nextClaimAt = now + COOLDOWN_MS;
    return {
        state: s,
        result: { item, caseName: CASE_NAME, streak, tier, nextClaimAt },
        ext: { rewards: { lastClaim: now, streak, totalClaims: (Math.floor(Number(rw.totalClaims)) || 0) + 1 } }
    };
}

module.exports = {
    register(router, ctx) {
        ctx.actions.claimDaily = claimDaily;
        router.action('/api/rewards/claim', 'claimDaily');

        router.get('/api/rewards', async (req, res, rq) => {
            const profile = await ctx.game.getProfile(rq.session.sid);
            const now = Date.now();
            const st = dailyStatus(profile.ext && profile.ext.rewards, now);
            return {
                canClaim: st.canClaim,
                nextClaimAt: st.nextClaimAt,
                streak: st.streak,
                tier: tierFor(st.nextStreak),                     // case you will get on your next claim
                serverNow: now
            };
        });
    },
    // exported for tests
    claimDaily,
    dailyStatus,
    tierFor,
    TIERS,
    POOLS,
    COOLDOWN_MS,
    STREAK_WINDOW_MS,
    STREAK_MAX,
    STREAK_BONUS_FROM,
    CASE_NAME
};
