'use strict';

/*
 * makeRng for logged-in players: a deterministic rng from (serverSeed, clientSeed, nonce) kept in
 * the server-only profile field ext.fair (algorithm: lib/fair.js). The nonce is bumped by one per
 * action, in the same atomic write as the action itself (the pipeline persists the returned `ext`).
 * Actions that manage the seeds themselves (fairInit, fairRotate in lib/routes/fair.js) don't use it.
 */

const F = require('../fair.js');

// Actions that don't draw random numbers from the player's seed: seed management and PvP money moves
const SEED_ACTIONS = new Set(['fairInit', 'fairRotate', 'lobbyPay', 'lobbyRefund', 'lobbyPayout']);

module.exports = {
    install(hooks) {
        const fallback = hooks.makeRng;
        hooks.makeRng = (args) => {
            const { action, profile } = args || {};
            if (SEED_ACTIONS.has(action)) return fallback(args);

            const stored = profile && profile.ext && profile.ext.fair;
            // A missing / corrupt record starts a fresh commitment (keeping any revealed history)
            const fair = F.isValid(stored) ? stored : F.newState(null, stored && stored.revealed);
            const nonce = fair.nonce;
            return {
                rng: F.createRng(fair.serverSeed, fair.clientSeed, nonce),
                meta: { serverSeedHash: fair.serverSeedHash, clientSeed: fair.clientSeed, nonce },
                ext: { fair: Object.assign({}, fair, { nonce: nonce + 1 }) }
            };
        };
    }
};
