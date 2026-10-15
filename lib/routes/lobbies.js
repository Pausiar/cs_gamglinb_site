'use strict';

/*
 * PvP case battles. Money flow, prizes and the reconciler are documented in lib/lobbies.js.
 *
 *   GET  /api/lobbies          public    { lobbies: [summary] }      open + recent running/finished, newest first, max 20
 *   GET  /api/lobby?id=ID      public    { lobby, serverNow }        detail; `result` once the battle has started
 *   POST /api/lobbies          login     { caseIds, mode, crazy }    create (the creator pays seat 0)  -> { lobby, state }
 *   POST /api/lobbies/join     login     { id, seat? }               pay a seat                         -> { lobby, state }
 *   POST /api/lobbies/bots     login     { id }                      creator only: fill empty seats with bots -> { lobby }
 *   POST /api/lobbies/cancel   login     { id }                      creator only: cancel + refund      -> { lobby }
 *
 * The router only knows exact paths, hence the action in the path and the id in the body / query.
 * `state` is the caller's public profile right after paying (before any prize) so the header
 * balance can be updated without spoiling the result.
 */

const { createLobbies, registerActions } = require('../lobbies.js');

module.exports = {
    register(router, ctx) {
        registerActions(ctx.actions, ctx.engine);
        // the live feed / leaderboard learns about prizes won in PvP battles (source 'pvp')
        try {
            const { feedFor } = require('../feed.js');
            feedFor(ctx).extractors.lobbyPayout = ev => (ev.result && Array.isArray(ev.result.items)
                ? ev.result.items.map(item => ({ item, source: 'pvp', caseName: 'Batalla PvP' }))
                : []);
        } catch (e) { /* feed module not available: nothing to report to */ }
        const lobbies = createLobbies({
            store: ctx.store,
            game: ctx.game,
            engine: ctx.engine,
            apiError: ctx.apiError
        });

        const stamp = out => Object.assign(out, { serverNow: Date.now() });

        router.get('/api/lobbies', async (req, res) => {
            const out = await lobbies.list();
            // identical for everybody: the CDN may keep it for 2 s
            ctx.sendJson(res, 200, out, { 'Cache-Control': 'public, max-age=0, s-maxage=2' });
        }, { auth: false });

        router.get('/api/lobby', async (req, res, rq) => {
            const id = rq.query.get('id') || '';
            if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) throw ctx.apiError(400, 'Batalla inválida.', 'invalid');
            const lobby = await lobbies.get(id);
            return { lobby, serverNow: Date.now() };
        }, { auth: false });

        router.post('/api/lobbies', async (req, res, rq) => stamp(await lobbies.create(rq.session.sid, rq.body)));
        router.post('/api/lobbies/join', async (req, res, rq) => stamp(await lobbies.join(rq.session.sid, rq.body)));
        router.post('/api/lobbies/bots', async (req, res, rq) => stamp(await lobbies.fillBots(rq.session.sid, rq.body)));
        router.post('/api/lobbies/cancel', async (req, res, rq) => stamp(await lobbies.cancel(rq.session.sid, rq.body)));
    }
};
