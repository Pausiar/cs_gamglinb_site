'use strict';

/*
 * Provably fair API (all routes need a session). Algorithm: lib/fair.js.
 *
 *   GET  /api/fair
 *        -> { serverSeedHash, clientSeed, nonce, revealed: [{ serverSeed, serverSeedHash, clientSeed, nonces, revealedAt }] }
 *        `nonce` is the nonce the NEXT action will use. The current serverSeed is never sent.
 *        The first call creates (and persists) the player's commitment.
 *
 *   POST /api/fair/rotate   body: { clientSeed? }
 *        Reveals the current server seed (moved to `revealed`), commits to a new one, nonce -> 0 and
 *        optionally sets a new client seed (1-64 chars [A-Za-z0-9_-]). Changing the client seed always
 *        rotates the server seed too, so there is no separate client-seed endpoint.
 *        -> { state, result: { serverSeedHash, clientSeed, nonce, revealed: [...], previous: {...} } }
 *        `previous` is the entry just revealed (also at revealed[0]).
 *
 * Both writes go through the game pipeline as server-only actions (fairInit / fairRotate), so they are
 * saved atomically with the profile version check. hooks/fair.js skips the nonce bump for them.
 */

const F = require('../fair.js');

module.exports = {
    register(router, ctx) {
        const engineError = (message, code) => Object.assign(new Error(message), { isEngineError: true, code });

        // Creates the commitment if the profile has none (idempotent: concurrent calls keep the first)
        ctx.actions.fairInit = (state, params, rng, now, { ext }) => {
            if (F.isValid(ext && ext.fair)) return { state, result: null };
            return { state, result: null, ext: { fair: F.newState(null, ext && ext.fair && ext.fair.revealed) } };
        };

        ctx.actions.fairRotate = (state, params, rng, now, { ext }) => {
            const p = params && typeof params === 'object' && !Array.isArray(params) ? params : {};
            let clientSeed = p.clientSeed;
            if (clientSeed !== undefined && clientSeed !== null && clientSeed !== '') {
                if (!F.isClientSeed(clientSeed)) {
                    throw engineError('La semilla del cliente debe tener entre 1 y 64 caracteres (letras, números, _ y -).', 'invalid_client_seed');
                }
            } else {
                clientSeed = undefined;
            }
            const current = F.isValid(ext && ext.fair) ? ext.fair : F.newState(null, ext && ext.fair && ext.fair.revealed);
            const { fair, revealed } = F.rotate(current, clientSeed, now);
            return {
                state,
                result: Object.assign(F.publicView(fair), { previous: revealed }),
                ext: { fair }
            };
        };

        router.get('/api/fair', async (req, res, rq) => {
            const sid = rq.session.sid;
            let profile = await ctx.game.getProfile(sid);
            if (!F.isValid(profile.ext && profile.ext.fair)) {
                await ctx.game.runAction(sid, 'fairInit', {});
                profile = await ctx.game.getProfile(sid);
            }
            return F.publicView(profile.ext.fair);
        });

        router.action('/api/fair/rotate', 'fairRotate');
    }
};
