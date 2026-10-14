'use strict';

/*
 * Live drops feed + leaderboard (server side). One instance per application context:
 *
 *     const feed = feedFor(ctx);          // lib/hooks/feed.js and lib/routes/feed.js share it
 *
 * Tables (PS_Database, see lib/store.js `store.table(slug)`):
 *   drops        steam-id, name, avatar, item-id, price, rarity, source, case-name
 *   leaderboard  steam-id (unique), name, avatar, total-won, profit, cases-opened,
 *                best-drop-price, best-drop-item-id
 *
 * PS_Database allows 120 requests/min per IP+project for the whole site, so this module is frugal:
 *   - at most ONE `drops` insert per game action (the most valuable notable item),
 *   - at most one leaderboard write per player per LEADERBOARD_MIN_INTERVAL_MS per instance
 *     (immediately again when the player's best drop improves),
 *   - reads are cached in the instance for CACHE_TTL_MS (the routes also send CDN cache headers).
 *
 * Drop sources are described by `feed.extractors` (action name -> event -> [{ item, source, caseName }]).
 * Other modules (lobbies...) may add their own: `feedFor(ctx).extractors.myAction = ev => [...]`.
 */

const engine = require('../public/js/engine.js');
const catalog = require('../public/js/data.js');

const RARITIES = ['consumer', 'industrial', 'milspec', 'restricted', 'classified', 'covert', 'gold'];
const SOURCES = ['case', 'upgrade', 'battle', 'daily', 'pvp'];

// ---- thresholds ----
const DROP_MIN_RARITY = 'restricted';      // drops of this rarity or better are recorded...
const DROP_MIN_PRICE = 1;                  // ...and so is anything worth at least this (EUR)
const LEADERBOARD_MIN_INTERVAL_MS = 60 * 1000;
const CACHE_TTL_MS = 10 * 1000;
const FEED_MAX = 50;
const LEADERBOARD_MAX = 50;
const LEADERBOARD_SORTS = {
    'total-won': 'total-won',
    'profit': 'profit',
    'best-drop-price': 'best-drop-price'
};
const AVATAR_TTL_MS = 60 * 60 * 1000;
const THROTTLE_MAX_ENTRIES = 5000;

const DROPS_TABLE = 'drops';
const LEADERBOARD_TABLE = 'leaderboard';

const caseNameById = new Map(catalog.cases.map(c => [c.id, c.name]));

function rarityRank(r) {
    return RARITIES.indexOf(r);
}

function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function round2(n) {
    return Math.round(n * 100) / 100;
}

function httpsUrl(v) {
    return typeof v === 'string' && /^https:\/\//i.test(v) && v.length <= 500 ? v : null;
}

function steamProfileUrl(steamId) {
    return `https://steamcommunity.com/profiles/${steamId}`;
}

function displayName(profile, steamId) {
    const n = profile && typeof profile.name === 'string' ? profile.name.trim().slice(0, 64) : '';
    return n || `Steam ${String(steamId).slice(-4)}`;
}

// ==================== WHICH ITEMS A GAME ACTION GAVE THE PLAYER ====================
const extractors = {
    openCase(ev) {
        const it = ev.result && ev.result.item;
        const name = caseNameById.get(num(ev.result && ev.result.caseId)) || '';
        return it ? [{ item: it, source: 'case', caseName: name }] : [];
    },
    upgrade(ev) {
        const r = ev.result;
        return r && r.win && r.item ? [{ item: r.item, source: 'upgrade', caseName: 'Upgrader' }] : [];
    },
    battle(ev) {
        const r = ev.result;
        // Only what the player actually received (items are empty when the player lost)
        return r && r.won && Array.isArray(r.items) ? r.items.map(item => ({ item, source: 'battle', caseName: 'Batalla' })) : [];
    },
    claimDaily(ev) {
        const it = ev.result && ev.result.item;
        return it ? [{ item: it, source: 'daily', caseName: 'Caja Diaria' }] : [];
    }
};

// Catalog-checked view of an item (never trusts names/prices coming from elsewhere)
function catalogItem(item) {
    const info = item && engine.skinInfo(Number(item.id));
    return info ? { id: info.id, price: info.price, rarity: info.rarity } : null;
}

function isNotable(info) {
    return info.price >= DROP_MIN_PRICE || rarityRank(info.rarity) >= rarityRank(DROP_MIN_RARITY);
}

// ==================== LEADERBOARD ROW FROM A STORED PROFILE ====================
function bestDrop(data) {
    let best = { price: 0, id: 0 };
    const scan = list => {
        (Array.isArray(list) ? list : []).forEach(it => {
            const info = it && engine.skinInfo(Number(it.id));
            if (info && info.price > best.price) best = { price: info.price, id: info.id };
        });
    };
    scan(data.history);
    scan(data.inventory);
    return best;
}

function leaderboardColumns(profile) {
    const data = profile.data || {};
    const st = data.stats || {};
    const totalWon = round2(num(st.totalWon));
    const totalSpent = round2(num(st.totalSpent));
    const best = bestDrop(data);
    return {
        'total-won': totalWon,
        'profit': round2(totalWon - totalSpent),
        'cases-opened': Math.max(0, Math.floor(num(st.casesOpened))),
        'best-drop-price': best.price,
        'best-drop-item-id': best.id
    };
}

// ==================== THE FEED ====================
function createFeed(ctx, { now = () => Date.now() } = {}) {
    const store = ctx.store;
    const doFetch = ctx.fetch || ((...a) => globalThis.fetch(...a));
    const steamApiKey = (ctx.config && ctx.config.steamApiKey) || '';

    // ---------- avatar ----------
    // ext.avatar when the profile has one; otherwise a Steam lookup (cached; only with STEAM_API_KEY)
    const avatars = new Map(); // steamId -> { at, url }
    async function resolveAvatar(steamId, ext) {
        const stored = httpsUrl(ext && ext.avatar);
        if (stored) return stored;
        if (!steamApiKey) return null;
        const hit = avatars.get(steamId);
        if (hit && now() - hit.at < AVATAR_TTL_MS) return hit.url;
        let url = null;
        try {
            const resp = await doFetch('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?' +
                new URLSearchParams({ key: steamApiKey, steamids: steamId }).toString(), { signal: AbortSignal.timeout(3000) });
            if (resp.ok) {
                const json = await resp.json();
                const p = json && json.response && Array.isArray(json.response.players) && json.response.players[0];
                if (p && p.steamid === steamId) url = httpsUrl(p.avatarmedium) || httpsUrl(p.avatarfull);
            }
        } catch (e) {
            url = null;
        }
        if (avatars.size > THROTTLE_MAX_ENTRIES) avatars.clear();
        avatars.set(steamId, { at: now(), url });
        return url;
    }

    // ---------- recording drops ----------
    // Returns the inserted summary, or null when nothing notable was received.
    async function recordDrop(ev) {
        const extract = Object.prototype.hasOwnProperty.call(extractors, ev.action) ? extractors[ev.action] : null;
        if (!extract) return null;
        let best = null;
        for (const d of extract(ev) || []) {
            const info = catalogItem(d.item);
            if (!info || !isNotable(info)) continue;
            if (!best || info.price > best.info.price) best = { info, source: d.source, caseName: d.caseName };
        }
        if (!best) return null;
        const profile = ev.profile || {};
        const row = {
            'steam-id': ev.steamId,
            name: displayName(profile, ev.steamId),
            avatar: await resolveAvatar(ev.steamId, profile.ext),
            'item-id': best.info.id,
            price: best.info.price,
            rarity: best.info.rarity,
            source: SOURCES.includes(best.source) ? best.source : 'case',
            'case-name': String(best.caseName || '').slice(0, 80)
        };
        await store.table(DROPS_TABLE).insert(row);
        return row;
    }

    // ---------- leaderboard upkeep ----------
    const throttle = new Map(); // steamId -> { at, best }

    async function upsertLeaderboard(steamId, columns) {
        const t = store.table(LEADERBOARD_TABLE);
        const filter = { 'steam-id': `eq.${steamId}` };
        if ((await t.update(filter, columns)) > 0) return 'updated';
        try {
            await t.insert(Object.assign({ 'steam-id': steamId }, columns));
            return 'inserted';
        } catch (e) {
            if (e && e.status === 409) {   // another instance inserted it first
                await t.update(filter, columns);
                return 'updated';
            }
            throw e;
        }
    }

    // Returns 'skipped' | 'updated' | 'inserted'
    async function updateLeaderboard(ev) {
        const profile = ev.profile;
        if (!profile || !profile.data) return 'skipped';
        const cols = leaderboardColumns(profile);
        if (!cols['cases-opened'] && !cols['total-won']) return 'skipped';   // nothing to rank yet

        const prev = throttle.get(ev.steamId);
        const t = now();
        const improved = !prev || cols['best-drop-price'] > prev.best;
        if (!improved && t - prev.at < LEADERBOARD_MIN_INTERVAL_MS) return 'skipped';

        // Mark first: concurrent actions of the same player must not all write
        if (throttle.size > THROTTLE_MAX_ENTRIES) throttle.clear();
        throttle.set(ev.steamId, { at: t, best: Math.max(prev ? prev.best : 0, cols['best-drop-price']) });

        const columns = Object.assign({
            name: displayName(profile, ev.steamId),
            avatar: await resolveAvatar(ev.steamId, profile.ext)
        }, cols);
        return upsertLeaderboard(ev.steamId, columns);
    }

    // The afterAction listener. Both writes are independent and failures never reach the player.
    async function onAfterAction(ev) {
        if (!ev || !ev.steamId) return;
        const jobs = [recordDrop(ev), updateLeaderboard(ev)];
        const names = ['drops', 'leaderboard'];
        const settled = await Promise.allSettled(jobs);
        settled.forEach((s, i) => {
            if (s.status === 'rejected') console.warn(`[feed] ${names[i]}: ${s.reason && s.reason.message}`);
        });
    }

    // ---------- cached reads ----------
    const cache = new Map(); // key -> { at, value, promise }
    function cached(key, loader) {
        const e = cache.get(key);
        const t = now();
        if (e && e.value !== undefined && t - e.at < CACHE_TTL_MS) return Promise.resolve(e.value);
        if (e && e.promise) return e.promise;
        const entry = e || { at: 0, value: undefined, promise: null };
        entry.promise = loader().then(value => {
            entry.value = value;
            entry.at = now();
            entry.promise = null;
            return value;
        }, err => {
            entry.promise = null;
            if (entry.value !== undefined) {      // serve stale data while the database is down
                entry.at = now() - CACHE_TTL_MS + 3000;
                return entry.value;
            }
            throw err;
        });
        cache.set(key, entry);
        return entry.promise;
    }

    function publicDrop(r) {
        const sid = String(r['steam-id'] || '');
        return {
            id: r.id,
            name: typeof r.name === 'string' && r.name ? r.name.slice(0, 64) : 'Jugador',
            avatar: httpsUrl(r.avatar),
            profileUrl: /^\d{17}$/.test(sid) ? steamProfileUrl(sid) : null,
            itemId: num(r['item-id']),
            price: round2(num(r.price)),
            rarity: RARITIES.includes(r.rarity) ? r.rarity : 'consumer',
            source: SOURCES.includes(r.source) ? r.source : 'case',
            caseName: typeof r['case-name'] === 'string' ? r['case-name'] : '',
            at: Number.isFinite(Date.parse(r.createdAt)) ? Date.parse(r.createdAt) : null
        };
    }

    function getFeed(limit) {
        const n = Math.min(FEED_MAX, Math.max(1, Math.floor(num(limit)) || 20));
        return cached('feed', async () => {
            const rows = await store.table(DROPS_TABLE).list({ order: 'created_at.desc', limit: FEED_MAX });
            return rows.map(publicDrop);
        }).then(all => all.slice(0, n));
    }

    function publicEntry(r, i) {
        const sid = String(r['steam-id'] || '');
        return {
            rank: i + 1,
            name: typeof r.name === 'string' && r.name ? r.name.slice(0, 64) : 'Jugador',
            avatar: httpsUrl(r.avatar),
            profileUrl: /^\d{17}$/.test(sid) ? steamProfileUrl(sid) : null,
            totalWon: round2(num(r['total-won'])),
            profit: round2(num(r.profit)),
            casesOpened: Math.floor(num(r['cases-opened'])),
            bestDropPrice: round2(num(r['best-drop-price'])),
            bestDropItemId: num(r['best-drop-item-id'])
        };
    }

    // by: 'total-won' | 'profit' | 'best-drop-price'
    function getLeaderboard(by, limit) {
        const col = LEADERBOARD_SORTS[by];
        if (!col) return Promise.reject(new TypeError('by inválido'));
        const n = Math.min(LEADERBOARD_MAX, Math.max(1, Math.floor(num(limit)) || LEADERBOARD_MAX));
        return cached('lb:' + col, async () => {
            const rows = await store.table(LEADERBOARD_TABLE).list({ order: `${col}.desc`, limit: LEADERBOARD_MAX });
            return rows.map(publicEntry);
        }).then(all => all.slice(0, n));
    }

    return { onAfterAction, recordDrop, updateLeaderboard, getFeed, getLeaderboard, extractors, resolveAvatar };
}

// One feed per application context (hooks and routes share it)
function feedFor(ctx) {
    if (!ctx.feed) ctx.feed = createFeed(ctx);
    return ctx.feed;
}

module.exports = {
    createFeed,
    feedFor,
    leaderboardColumns,
    isNotable,
    RARITIES,
    LEADERBOARD_SORTS: Object.keys(LEADERBOARD_SORTS),
    FEED_MAX,
    LEADERBOARD_MAX,
    constants: { DROP_MIN_RARITY, DROP_MIN_PRICE, LEADERBOARD_MIN_INTERVAL_MS, CACHE_TTL_MS }
};
