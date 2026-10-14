'use strict';

/*
 * Extra API routes. Each module exports:
 *
 *     register(router, ctx)
 *
 * and is loaded from the array below. Core routes (/auth/*, /api/me, /api/state and the game
 * actions /api/open|sell|upgrade|battle|promo) live in lib/app.js; new features go here, in
 * their own file, without touching the core.
 *
 * ---- router ----------------------------------------------------------------------------
 *   router.get(path, handler, opts)
 *   router.post(path, handler, opts)
 *   router.action(path, actionName, opts)   POST that runs ctx.actions[actionName] for the
 *                                           logged-in user (persisted, hooks called) and
 *                                           answers { state, result, fair? }
 *   `path` must be "/api/<something>" (that is what vercel.json rewrites to the function);
 *   duplicates throw at startup. opts: { auth: true, body: true }
 *       auth: false  -> no session required (rq.session may be null). Default: 401 without session.
 *       body: false  -> POST body is not read. Default: JSON body parsed into rq.body.
 *   Security applied by the router, identical to the game actions:
 *       POST: same-origin check (403) -> session (401) -> Content-Type JSON (415) -> body <= 10 KB
 *             (413) -> valid JSON (400);  wrong method -> 405 with Allow.
 *   handler(req, res, rq) may be async. rq = { session: {sid, ...} | null, body, query: URLSearchParams,
 *       url: URL, cfg } . Return a JSON-serialisable value (sent as 200 JSON), or return nothing
 *       to answer 204, or answer yourself with ctx.sendJson(res, ...) and return. Throw
 *       ctx.apiError(status, message, code) for expected errors ({ error, code } JSON); anything
 *       else becomes a logged 500.
 *
 * ---- ctx -------------------------------------------------------------------------------
 *   config            buildConfig() result (secret, baseUrl, secure, ...). Per-request view: rq.cfg
 *   store             profile store (lib/store.js): getProfile / createProfile / updateProfile(steamId, version, data)
 *   game              { getState(steamId), runAction(steamId, actionName, params) -> { state, result, meta } }
 *   actions           server action registry (name -> (data, params, rng) => { state, result });
 *                     starts as a copy of engine.actions, add entries here for server-only actions
 *   engine            public/js/engine.js (rules shared with the browser)
 *   hooks             { makeRng, afterAction, onAfterAction } (see ../hooks/defaults.js)
 *   getSession(req)           -> { sid, ... } | null
 *   requireSession(req)       -> { sid, ... } or throws a 401 apiError
 *   readJsonBody(req)         -> parsed body (limits as above); needed only with body: false
 *   checkSameOrigin(req)      -> boolean (the strict Origin / Sec-Fetch-Site check used for POSTs)
 *   sendJson(res, status, obj, headers?)
 *   sendError(res, err)       -> the standard JSON error response
 *   apiError(status, message, code?)
 *   fetch             fetch implementation (injectable in tests)
 *
 * Example:
 *
 *     // lib/routes/ping.js
 *     module.exports = {
 *         register(router, ctx) {
 *             router.get('/api/ping', async (req, res, rq) => ({ pong: true, steamId: rq.session.sid }));
 *             router.action('/api/daily', 'claimDaily');          // needs ctx.actions.claimDaily
 *         }
 *     };
 */
module.exports = [
    // require('./ping.js'),
];
