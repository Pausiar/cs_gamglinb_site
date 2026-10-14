'use strict';

/*
 * Tiny route registry for JSON API routes added from lib/routes/*.js.
 * It only stores routes; lib/app.js dispatches them (so session, same-origin, content-type and
 * body-size checks are applied in one place). See lib/routes/index.js for the full contract.
 */

const METHODS = new Set(['GET', 'POST']);
// Vercel rewrites /api/* to the function; keep to simple lowercase paths
const PATH_RE = /^\/api\/[a-z0-9](?:[a-z0-9/_-]*[a-z0-9])?$/;
const RESERVED = new Set(['/api/index', '/api/me', '/api/state']);

function createRouter() {
    const table = new Map(); // path -> { GET?: route, POST?: route }

    function add(method, path, handler, opts) {
        const m = String(method).toUpperCase();
        if (!METHODS.has(m)) throw new Error(`Método no soportado en rutas: ${method}`);
        if (typeof path !== 'string' || !PATH_RE.test(path) || path.includes('//') || RESERVED.has(path)) {
            throw new Error(`Ruta no válida: ${path} (debe ser /api/<nombre>)`);
        }
        if (typeof handler !== 'function') throw new TypeError(`La ruta ${m} ${path} necesita un handler`);
        const entry = table.get(path) || {};
        if (entry[m]) throw new Error(`Ruta duplicada: ${m} ${path}`);
        entry[m] = { method: m, path, handler, opts: Object.assign({ auth: true, body: true }, opts) };
        table.set(path, entry);
        return router;
    }

    const router = {
        add,
        get: (path, handler, opts) => add('GET', path, handler, opts),
        post: (path, handler, opts) => add('POST', path, handler, opts),
        // router.action(path, actionName, opts) is attached by lib/app.js (needs the game)
        // Methods registered for a path, or null
        find: (path) => table.get(path) || null,
        get paths() { return [...table.keys()]; }
    };
    return router;
}

module.exports = { createRouter };
