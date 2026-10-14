'use strict';

/*
 * Public read-only endpoints (no session needed):
 *   GET /api/feed?limit=20                                  latest notable drops (max 50)
 *   GET /api/leaderboard?by=total-won|profit|best-drop-price&limit=50
 * Responses are cached in the instance (lib/feed.js) and carry CDN cache headers, so Vercel's edge
 * absorbs the traffic. Only name, avatar and a Steam profile URL are exposed per player.
 */
const { feedFor, LEADERBOARD_SORTS, FEED_MAX, LEADERBOARD_MAX } = require('../feed.js');

const CACHE_HEADERS = { 'Cache-Control': 'public, max-age=10, s-maxage=10' };

function intParam(q, name, def, max) {
    const raw = q.get(name);
    if (raw === null || raw === '') return def;
    if (!/^\d{1,4}$/.test(raw)) return null;
    return Math.min(max, Math.max(1, parseInt(raw, 10)));
}

module.exports = {
    register(router, ctx) {
        const feed = feedFor(ctx);

        function unavailable(e) {
            console.warn('[feed] lectura falló:', e && e.message);
            return ctx.apiError(503, 'Datos no disponibles. Inténtalo más tarde.', 'db_unavailable');
        }

        router.get('/api/feed', async (req, res, rq) => {
            const limit = intParam(rq.query, 'limit', 20, FEED_MAX);
            if (limit === null) throw ctx.apiError(400, 'Parámetro limit inválido.', 'bad_request');
            let drops;
            try { drops = await feed.getFeed(limit); } catch (e) { throw unavailable(e); }
            ctx.sendJson(res, 200, { drops }, CACHE_HEADERS);
        }, { auth: false });

        router.get('/api/leaderboard', async (req, res, rq) => {
            const by = rq.query.get('by') || 'total-won';
            if (!LEADERBOARD_SORTS.includes(by)) throw ctx.apiError(400, 'Parámetro by inválido.', 'bad_request');
            const limit = intParam(rq.query, 'limit', LEADERBOARD_MAX, LEADERBOARD_MAX);
            if (limit === null) throw ctx.apiError(400, 'Parámetro limit inválido.', 'bad_request');
            let rows;
            try { rows = await feed.getLeaderboard(by, limit); } catch (e) { throw unavailable(e); }
            ctx.sendJson(res, 200, { by, rows }, CACHE_HEADERS);
        }, { auth: false });
    }
};
