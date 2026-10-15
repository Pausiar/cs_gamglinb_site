'use strict';

/*
 * Vercel serverless function. vercel.json rewrites /auth/* and /api/* here;
 * static files (public/) are served by Vercel itself, never by this function.
 *
 * Config and store are created once per instance (cold start). In-memory
 * caches (Steam nonces, Steam profiles, the per-user request queue) are per
 * instance; correctness across instances comes from Steam's
 * check_authentication and from the store's optimistic version check.
 */

const { buildConfig, createHandler } = require('../lib/app.js');
const { createStore } = require('../lib/store.js');

let handler = null;
let initError = null;

function getHandler() {
    if (handler || initError) return handler;
    try {
        const config = buildConfig(process.env);
        const store = createStore(process.env);
        if (store.kind === 'memory') {
            // Per-instance memory would silently lose / fork profiles on serverless
            if (process.env.ALLOW_MEMORY_STORE !== '1') {
                throw new Error('PSDB_URL y PSDB_API_KEY son obligatorios en Vercel (o ALLOW_MEMORY_STORE=1 solo para pruebas).');
            }
            console.warn('[store] ALLOW_MEMORY_STORE=1: perfiles en memoria por instancia (solo para pruebas).');
        }
        handler = createHandler(config, { store, serveStaticFiles: false });
    } catch (e) {
        initError = e;
        console.error('[config]', e.message);
    }
    return handler;
}

module.exports = async function (req, res) {
    const h = getHandler();
    if (!h) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'Servidor mal configurado.', code: 'config' }));
        return;
    }
    return h(req, res);
};
