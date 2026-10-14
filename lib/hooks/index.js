'use strict';

/*
 * Hook modules, installed once when the handler is created (lib/app.js, createHandler),
 * BEFORE the route modules are registered. Each module exports:
 *
 *     install(hooks, ctx)
 *
 * where `hooks` is the object described in ./defaults.js (makeRng, afterAction, onAfterAction)
 * and `ctx` the application context described in ../routes/index.js. Example:
 *
 *     // lib/hooks/provably-fair.js
 *     module.exports = {
 *         install(hooks, ctx) {
 *             hooks.makeRng = ({ steamId, profile, action }) => ({ rng: seededRng(...), meta: { nonce: 1 } });
 *             hooks.onAfterAction(async ({ steamId, action, result }) => { ... });
 *         }
 *     };
 *
 * To enable a module, add its require() to the array below.
 */
module.exports = [
    require('./fair.js'),      // makeRng: provably fair rng
    require('./feed.js'),      // afterAction: record drops + leaderboard
];
