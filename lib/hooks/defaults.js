'use strict';

/*
 * Default hooks object shared by every game action (see lib/app.js, createGame).
 *
 *   hooks.makeRng({ steamId, profile, action })
 *        -> { rng: () => number in [0, 1), meta }          (sync or Promise)
 *      Called once per attempt of every action, BEFORE the engine runs. `rng` is the only
 *      random source the action may use; `meta` (anything JSON-serialisable, or null) is
 *      returned to the client as `fair` in the API response when it is not null, and passed
 *      to afterAction. Default: crypto RNG, meta null.
 *
 *   hooks.afterAction({ steamId, profile, action, params, result, meta, state, before })
 *        -> Promise<void>
 *      Called after an action has been successfully persisted (awaited, so serverless
 *      functions are not frozen mid-way, but with a timeout). Errors are caught and logged:
 *      they can never fail the request. `profile` is the stored profile AFTER the action
 *      ({ steamId, name, version, data }), `before` the one the action started from,
 *      `state` the public state returned to the client.
 *
 *   hooks.onAfterAction(fn)
 *      Registers an extra afterAction listener (run in order, each isolated from the others'
 *      errors). Prefer it over replacing hooks.afterAction, so several modules can coexist.
 *
 * Modules in lib/hooks/index.js receive this object in install(hooks, ctx) and may replace
 * makeRng (only one module should) and/or add afterAction listeners.
 */

const { secureRng } = require('../rng.js');

function createHooks({ rng } = {}) {
    const baseRng = typeof rng === 'function' ? rng : secureRng;
    const afterListeners = [];

    const hooks = {
        makeRng: () => ({ rng: baseRng, meta: null }),
        afterAction: async (event) => {
            for (const fn of afterListeners) {
                try {
                    await fn(event);
                } catch (e) {
                    console.error('[hooks] afterAction listener falló:', e);
                }
            }
        },
        onAfterAction(fn) {
            if (typeof fn !== 'function') throw new TypeError('onAfterAction espera una función');
            afterListeners.push(fn);
        }
    };
    return hooks;
}

module.exports = { createHooks };
