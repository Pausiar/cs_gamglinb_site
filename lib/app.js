'use strict';

/*
 * SkinDrop request handler: Steam OpenID 2.0 login, session cookie, the game
 * API (server-authoritative economy) and, for local runs, the static site.
 * Zero dependencies, Node >= 20 (global fetch).
 *
 * Used by server.js (local `npm start`) and api/index.js (Vercel function).
 *
 * Env: PORT, BASE_URL, SESSION_SECRET, STEAM_API_KEY, NODE_ENV,
 *      PSDB_URL, PSDB_API_KEY, PSDB_PROJECT, PSDB_TABLE (see lib/store.js)
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const engine = require('../public/js/engine.js');
const { createStore } = require('./store.js');

const DEFAULT_STATIC_ROOT = path.join(__dirname, '..', 'public');

// ==================== .env LOADER ====================
// Minimal KEY=VALUE parser; real environment variables take precedence.
function loadDotEnv(file) {
    let text;
    try {
        text = fs.readFileSync(file, 'utf8');
    } catch (e) {
        return;
    }
    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (!m) continue;
        let value = m[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        } else {
            value = value.replace(/\s+#.*$/, '');
        }
        if (process.env[m[1]] === undefined) process.env[m[1]] = value;
    }
}

// ==================== CONFIG ====================
const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';
const OPENID_NS = 'http://specs.openid.net/auth/2.0';
const IDENTIFIER_SELECT = 'http://specs.openid.net/auth/2.0/identifier_select';
const CLAIMED_ID_RE = /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/;

const SESSION_COOKIE = 'sd_session';
const STATE_COOKIE = 'sd_login_state';
const SESSION_TTL_S = 7 * 24 * 60 * 60; // 7 days
const STATE_TTL_S = 10 * 60;            // 10 minutes to complete the Steam login
const NONCE_MAX_AGE_MS = 5 * 60 * 1000;
const PROFILE_TTL_MS = 60 * 60 * 1000;

function parseBaseUrl(raw) {
    let parsed;
    try {
        parsed = new URL(String(raw).trim().replace(/\/+$/, ''));
    } catch (e) {
        throw new Error(`BASE_URL no es una URL válida: ${raw}`);
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('BASE_URL debe empezar por http:// o https://');
    }
    return { baseUrl: parsed.origin + parsed.pathname.replace(/\/+$/, ''), secure: parsed.protocol === 'https:' };
}

/*
 * BASE_URL decides the Steam return_to/realm, the Origin accepted on POSTs and
 * whether cookies are Secure. On Vercel, when BASE_URL is not set, it is derived
 * per request from x-forwarded-proto / x-forwarded-host (see originFor) - set
 * BASE_URL in production to avoid trusting those headers.
 */
function buildConfig(env = process.env) {
    const port = parseInt(env.PORT, 10) || 3000;
    const onVercel = !!env.VERCEL;
    const rawBase = (env.BASE_URL || '').trim();
    const dynamicBaseUrl = !rawBase && onVercel;
    const fixed = parseBaseUrl(rawBase || `http://localhost:${port}`);

    const production = env.NODE_ENV === 'production' || onVercel;
    let secret = env.SESSION_SECRET || '';
    if (!secret) {
        if (production) {
            throw new Error('SESSION_SECRET es obligatorio en producción (NODE_ENV=production / Vercel).');
        }
        secret = crypto.randomBytes(32).toString('hex');
        console.warn('[auth] AVISO: SESSION_SECRET no definido; usando uno aleatorio. ' +
            'Las sesiones se perderán al reiniciar. Defínelo en .env.');
    } else if (secret.length < 32) {
        console.warn('[auth] AVISO: SESSION_SECRET es corto; usa al menos 32 caracteres aleatorios.');
    }

    return {
        port,
        baseUrl: fixed.baseUrl,
        returnUrl: `${fixed.baseUrl}/auth/steam/return`,
        secure: fixed.secure,
        dynamicBaseUrl,
        secret,
        steamApiKey: (env.STEAM_API_KEY || '').trim(),
        production
    };
}

// ==================== HELPERS ====================
function b64url(buf) {
    return Buffer.from(buf).toString('base64url');
}

function sign(secret, data) {
    return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

function safeEqual(a, b) {
    const ab = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
}

// Signed token: base64url(JSON payload) + "." + HMAC
function createToken(secret, payload) {
    const body = b64url(JSON.stringify(payload));
    return `${body}.${sign(secret, body)}`;
}

function readToken(secret, token) {
    if (typeof token !== 'string' || token.length > 4096) return null;
    const dot = token.indexOf('.');
    if (dot <= 0) return null;
    const body = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    if (!safeEqual(sig, sign(secret, body))) return null;
    let payload;
    try {
        payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    } catch (e) {
        return null;
    }
    if (!payload || typeof payload !== 'object') return null;
    if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) return null;
    return payload;
}

function parseCookies(header) {
    const out = {};
    if (!header) return out;
    for (const part of header.split(';')) {
        const i = part.indexOf('=');
        if (i < 0) continue;
        const k = part.slice(0, i).trim();
        if (!k || k in out) continue;
        try {
            out[k] = decodeURIComponent(part.slice(i + 1).trim());
        } catch (e) {
            out[k] = part.slice(i + 1).trim();
        }
    }
    return out;
}

function cookieHeader(config, name, value, maxAge) {
    const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAge}`];
    if (maxAge > 0) parts.push(`Expires=${new Date(Date.now() + maxAge * 1000).toUTCString()}`);
    else parts.push('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    if (config.secure) parts.push('Secure');
    return parts.join('; ');
}

function send(res, status, body, headers = {}) {
    res.writeHead(status, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
        ...headers
    });
    res.end(body);
}

function sendJson(res, status, obj, headers = {}) {
    send(res, status, JSON.stringify(obj), {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        ...headers
    });
}

function redirect(res, location, headers = {}) {
    res.writeHead(302, { Location: location, 'Cache-Control': 'no-store', ...headers });
    res.end();
}

// ==================== STEAM OPENID ====================
function buildSteamLoginUrl(config, state) {
    const params = new URLSearchParams({
        'openid.ns': OPENID_NS,
        'openid.mode': 'checkid_setup',
        'openid.return_to': `${config.returnUrl}?state=${encodeURIComponent(state)}`,
        'openid.realm': config.baseUrl,
        'openid.identity': IDENTIFIER_SELECT,
        'openid.claimed_id': IDENTIFIER_SELECT
    });
    return `${STEAM_OPENID_URL}?${params.toString()}`;
}

// Replay protection on top of Steam's own nonce handling.
// NOTE (serverless): this Map (like profileCache below) is per instance, so on
// Vercel a replay could land on another instance. That is acceptable: the real
// guard is Steam's check_authentication, which only validates a nonce once.
const seenNonces = new Map(); // nonce -> expiry ms
function rememberNonce(nonce) {
    const now = Date.now();
    for (const [n, exp] of seenNonces) if (exp < now) seenNonces.delete(n);
    if (seenNonces.has(nonce)) return false;
    seenNonces.set(nonce, now + 2 * NONCE_MAX_AGE_MS);
    return true;
}

/*
 * Validates a positive assertion from Steam. `query` is a URLSearchParams of the
 * request to /auth/steam/return. Returns { ok:true, steamId } or { ok:false, reason }.
 */
async function verifySteamAssertion(config, query, expectedState, fetchImpl = globalThis.fetch) {
    const get = (k) => query.get(k);

    if (get('openid.mode') !== 'id_res') return { ok: false, reason: 'mode' };
    if (get('openid.ns') !== OPENID_NS) return { ok: false, reason: 'ns' };
    if (get('openid.op_endpoint') !== STEAM_OPENID_URL) return { ok: false, reason: 'op_endpoint' };

    // return_to must be exactly the URL we sent (including our state parameter)
    const state = get('state');
    if (!state || !expectedState || !safeEqual(state, expectedState)) return { ok: false, reason: 'state' };
    const expectedReturn = `${config.returnUrl}?state=${encodeURIComponent(expectedState)}`;
    if (get('openid.return_to') !== expectedReturn) return { ok: false, reason: 'return_to' };

    const claimedId = get('openid.claimed_id') || '';
    const match = claimedId.match(CLAIMED_ID_RE);
    if (!match) return { ok: false, reason: 'claimed_id' };
    if (get('openid.identity') !== claimedId) return { ok: false, reason: 'identity' };

    const signed = (get('openid.signed') || '').split(',');
    for (const field of ['op_endpoint', 'claimed_id', 'identity', 'return_to', 'response_nonce']) {
        if (!signed.includes(field)) return { ok: false, reason: 'signed' };
    }
    if (!get('openid.sig') || !get('openid.assoc_handle')) return { ok: false, reason: 'sig' };

    const nonce = get('openid.response_nonce') || '';
    const nonceTime = Date.parse(nonce.slice(0, 20)); // e.g. 2026-10-14T17:53:00Z...
    if (!Number.isFinite(nonceTime) || Math.abs(Date.now() - nonceTime) > NONCE_MAX_AGE_MS) {
        return { ok: false, reason: 'nonce' };
    }

    // Server-side verification with Steam (never trust the params on their own)
    const body = new URLSearchParams();
    for (const [k, v] of query) {
        if (k.startsWith('openid.')) body.append(k, v);
    }
    body.set('openid.mode', 'check_authentication');

    let text;
    try {
        const resp = await fetchImpl(STEAM_OPENID_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'text/plain' },
            body: body.toString(),
            redirect: 'error',
            signal: AbortSignal.timeout(10000)
        });
        if (!resp.ok) return { ok: false, reason: `check_http_${resp.status}` };
        text = await resp.text();
    } catch (e) {
        return { ok: false, reason: 'check_network' };
    }

    const kv = {};
    for (const line of String(text).split('\n')) {
        const i = line.indexOf(':');
        if (i > 0) kv[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
    if (kv.ns !== OPENID_NS || kv.is_valid !== 'true') return { ok: false, reason: 'not_valid' };

    if (!rememberNonce(nonce)) return { ok: false, reason: 'replay' };

    return { ok: true, steamId: match[1] };
}

// ==================== STEAM PROFILE ====================
const profileCache = new Map(); // steamId -> { data, at }

function fallbackProfile(steamId) {
    return {
        name: `Steam ${steamId.slice(-4)}`,
        avatar: null,
        profileUrl: `https://steamcommunity.com/profiles/${steamId}`
    };
}

async function getProfile(config, steamId, fetchImpl = globalThis.fetch) {
    if (!config.steamApiKey) return fallbackProfile(steamId);

    const cached = profileCache.get(steamId);
    if (cached && Date.now() - cached.at < PROFILE_TTL_MS) return cached.data;

    let data = fallbackProfile(steamId);
    try {
        const url = 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?' +
            new URLSearchParams({ key: config.steamApiKey, steamids: steamId }).toString();
        const resp = await fetchImpl(url, { signal: AbortSignal.timeout(8000) });
        if (resp.ok) {
            const json = await resp.json();
            const p = json && json.response && Array.isArray(json.response.players) && json.response.players[0];
            if (p && p.steamid === steamId) {
                const name = typeof p.personaname === 'string' ? p.personaname.slice(0, 64).trim() : '';
                const avatar = typeof p.avatarfull === 'string' && /^https:\/\//.test(p.avatarfull)
                    ? p.avatarfull
                    : (typeof p.avatarmedium === 'string' && /^https:\/\//.test(p.avatarmedium) ? p.avatarmedium : null);
                const profileUrl = typeof p.profileurl === 'string' && p.profileurl.startsWith('https://steamcommunity.com/')
                    ? p.profileurl
                    : data.profileUrl;
                data = { name: name || data.name, avatar, profileUrl };
            }
        } else {
            console.warn(`[auth] GetPlayerSummaries HTTP ${resp.status}`);
        }
    } catch (e) {
        console.warn('[auth] GetPlayerSummaries falló:', e.message);
        return data; // don't cache failures
    }

    if (profileCache.size > 5000) profileCache.clear();
    profileCache.set(steamId, { data, at: Date.now() });
    return data;
}

// ==================== STATIC FILES ====================
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav'
};

// Only these top-level files / directories of public/ are ever served
const STATIC_FILES = new Set(['index.html', 'favicon.ico']);
const STATIC_DIRS = new Set(['css', 'js', 'images', 'img', 'assets', 'sounds', 'fonts']);

function resolveStatic(pathname, root = DEFAULT_STATIC_ROOT) {
    let rel;
    try {
        rel = decodeURIComponent(pathname);
    } catch (e) {
        return null;
    }
    if (rel.includes('\0') || rel.includes('\\')) return null;
    if (rel === '/') rel = '/index.html';
    const segments = rel.split('/').filter(Boolean);
    if (!segments.length) return null;
    if (segments.some(s => s === '.' || s === '..' || s.startsWith('.'))) return null;

    if (segments.length === 1) {
        if (!STATIC_FILES.has(segments[0])) return null;
    } else if (!STATIC_DIRS.has(segments[0])) {
        return null;
    }
    const ext = path.extname(segments[segments.length - 1]).toLowerCase();
    if (!MIME[ext]) return null;

    const full = path.resolve(root, ...segments);
    if (!full.startsWith(root + path.sep)) return null;
    return { full, type: MIME[ext] };
}

async function serveStatic(req, res, pathname, root = DEFAULT_STATIC_ROOT) {
    const target = resolveStatic(pathname, root);
    if (!target) return send(res, 404, 'Not found');
    let stat;
    try {
        // realpath guards against symlinks pointing outside the site
        const real = await fs.promises.realpath(target.full);
        if (!real.startsWith(root + path.sep)) return send(res, 404, 'Not found');
        stat = await fs.promises.stat(real);
        if (!stat.isFile()) return send(res, 404, 'Not found');
    } catch (e) {
        return send(res, 404, 'Not found');
    }
    res.writeHead(200, {
        'Content-Type': target.type,
        'Content-Length': stat.size,
        'Cache-Control': 'no-cache',
        'Last-Modified': stat.mtime.toUTCString()
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(target.full).on('error', () => res.destroy()).pipe(res);
}

// ==================== GAME API ====================
const MAX_BODY_BYTES = 10 * 1024;
const MAX_WRITE_ATTEMPTS = 3;
const RNG_MAX = 2 ** 48 - 1;

// Uniform float in [0, 1) from the CSPRNG
function secureRng() {
    return crypto.randomInt(0, RNG_MAX) / RNG_MAX;
}

const GAME_ACTIONS = {
    '/api/open': 'openCase',
    '/api/sell': 'sellItems',
    '/api/upgrade': 'upgrade',
    '/api/battle': 'battle',
    '/api/promo': 'redeemPromo'
};

function apiError(status, message, code) {
    const e = new Error(message);
    e.status = status;
    e.code = code || 'error';
    e.expose = true;
    return e;
}

// Reads a small JSON body. Works with a plain Node request and with Vercel's
// request (which may already have buffered the body into req.body).
async function readJsonBody(req) {
    const type = String(req.headers['content-type'] || '').toLowerCase();
    if (!type.startsWith('application/json')) throw apiError(415, 'Se esperaba JSON.', 'bad_content_type');
    const declared = parseInt(req.headers['content-length'], 10);
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) throw apiError(413, 'Petición demasiado grande.', 'too_large');

    let text;
    if (!req.readableEnded && req.readable !== false) {
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
            size += chunk.length;
            if (size > MAX_BODY_BYTES) throw apiError(413, 'Petición demasiado grande.', 'too_large');
            chunks.push(chunk);
        }
        text = Buffer.concat(chunks).toString('utf8');
    } else {
        // Body already consumed by the platform
        let body;
        try { body = req.body; } catch (e) { throw apiError(400, 'JSON inválido.', 'bad_json'); }
        if (Buffer.isBuffer(body)) text = body.toString('utf8');
        else if (typeof body === 'string') text = body;
        else if (body && typeof body === 'object') text = JSON.stringify(body);
        else text = '';
        if (Buffer.byteLength(text) > MAX_BODY_BYTES) throw apiError(413, 'Petición demasiado grande.', 'too_large');
    }
    if (!text) return {};
    try {
        return JSON.parse(text);
    } catch (e) {
        throw apiError(400, 'JSON inválido.', 'bad_json');
    }
}

function publicState(data) {
    const s = engine.normalizeState(data);
    return { balance: s.balance, inventory: s.inventory, stats: s.stats, history: s.history, promosUsed: s.promosUsed };
}

/*
 * Runs one engine action against the stored profile with optimistic
 * concurrency: read (version N) -> compute -> write "where version = N" (-> N+1).
 * If another writer got there first, re-read and retry (max 3), then 409.
 * Within one process, requests of the same user are additionally queued, so
 * the version check only has to resolve races between instances.
 */
function createGame({ store, rng = secureRng, serialize = true, profileName = async () => null }) {
    const queues = new Map(); // steamId -> tail promise

    function queued(steamId, fn) {
        if (!serialize) return fn();
        const prev = queues.get(steamId) || Promise.resolve();
        const run = prev.then(fn, fn);
        const tail = run.catch(() => {});
        queues.set(steamId, tail);
        tail.then(() => { if (queues.get(steamId) === tail) queues.delete(steamId); });
        return run;
    }

    async function loadOrCreate(steamId) {
        const existing = await store.getProfile(steamId);
        if (existing) return existing;
        let name = null;
        try { name = await profileName(steamId); } catch (e) { name = null; }
        return store.createProfile(steamId, name);
    }

    async function getState(steamId) {
        const profile = await loadOrCreate(steamId);
        return publicState(profile.data);
    }

    function runAction(steamId, actionName, params) {
        const action = engine.actions[actionName];
        if (!action) return Promise.reject(apiError(404, 'Acción desconocida.', 'unknown_action'));
        return queued(steamId, async () => {
            for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt++) {
                const profile = await loadOrCreate(steamId);
                let out;
                try {
                    out = action(profile.data, params, rng);
                } catch (e) {
                    if (e && e.isEngineError) throw apiError(400, e.message, e.code);
                    throw e;
                }
                const ok = await store.updateProfile(steamId, profile.version, out.state);
                if (ok) return { state: publicState(out.state), result: out.result };
                // Lost the race: back off a little and try again with fresh data
                await new Promise(r => setTimeout(r, 5 + crypto.randomInt(0, 25) * (attempt + 1)));
            }
            throw apiError(409, 'Demasiadas operaciones a la vez. Inténtalo de nuevo.', 'conflict');
        });
    }

    return { getState, runAction };
}

// ==================== APP ====================
const HOST_RE = /^[a-z0-9.-]+(:\d{1,5})?$/i;

/*
 * Vercel rewrites /auth/* and /api/* to the single function api/index.js.
 * Node functions normally keep the original URL in req.url; vercel.json also
 * passes it as ?__p=<path> so the handler can recover it if req.url shows
 * /api/index instead.
 */
function requestUrl(req) {
    const url = new URL(req.url || '/', 'http://internal');
    const p = url.searchParams.get('__p');
    url.searchParams.delete('__p');
    if (p !== null && (url.pathname === '/api/index' || url.pathname === '/api/index.js' || url.pathname === '/api')) {
        const fixed = '/' + p.replace(/^\/+/, '');
        if (/^\/(auth|api)(\/|$)/.test(fixed)) url.pathname = fixed;
    }
    return url;
}

function createHandler(config, { fetchImpl, store, rng, serialize, staticRoot = DEFAULT_STATIC_ROOT, serveStaticFiles = true } = {}) {
    const doFetch = fetchImpl || ((...args) => globalThis.fetch(...args));
    const db = store || createStore(process.env);
    const game = createGame({
        store: db,
        rng,
        serialize,
        profileName: async (sid) => (await getProfile(config, sid, doFetch)).name
    });

    // Per-request view of the config (base URL may come from forwarded headers)
    function configFor(req) {
        if (!config.dynamicBaseUrl) return config;
        const proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
        const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
        if (!HOST_RE.test(host) || (proto !== 'https' && proto !== 'http')) return config;
        const baseUrl = `${proto}://${host}`;
        return { ...config, baseUrl, returnUrl: `${baseUrl}/auth/steam/return`, secure: proto === 'https' };
    }

    function getSession(req) {
        const cookies = parseCookies(req.headers.cookie);
        const payload = readToken(config.secret, cookies[SESSION_COOKIE]);
        if (!payload || payload.t !== 'session' || typeof payload.sid !== 'string' || !/^\d{17}$/.test(payload.sid)) {
            return null;
        }
        return payload;
    }

    function sameOrigin(req, cfg) {
        const origin = req.headers.origin;
        if (!origin) return true; // non-browser or same-origin navigation without Origin
        return origin === new URL(cfg.baseUrl).origin;
    }

    // Stricter check for state-changing game calls: a browser always sends
    // Origin on fetch POSTs; without it, accept only Sec-Fetch-Site same-origin
    // or non-browser clients (no Sec-Fetch-Site at all).
    function sameOriginApi(req, cfg) {
        if (req.headers.origin) return sameOrigin(req, cfg);
        const site = req.headers['sec-fetch-site'];
        return !site || site === 'same-origin' || site === 'none';
    }

    function sendApiError(res, e) {
        if (e && e.expose) return sendJson(res, e.status || 400, { error: e.message, code: e.code });
        if (e && e.status === 503) return sendJson(res, 503, { error: 'Base de datos no disponible. Inténtalo más tarde.', code: 'db_unavailable' });
        console.error('[api] Error:', e);
        return sendJson(res, 500, { error: 'Error interno del servidor.', code: 'internal' });
    }

    return async function handler(req, res) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'same-origin');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');

        let url;
        try {
            url = requestUrl(req);
        } catch (e) {
            return send(res, 400, 'Bad request');
        }
        const p = url.pathname;
        const method = req.method;
        const cfg = configFor(req);

        try {
            if (p === '/auth/steam' && method === 'GET') {
                const state = crypto.randomBytes(16).toString('base64url');
                const stateToken = createToken(config.secret, {
                    t: 'state', s: state, exp: Math.floor(Date.now() / 1000) + STATE_TTL_S
                });
                return redirect(res, buildSteamLoginUrl(cfg, state), {
                    'Set-Cookie': cookieHeader(cfg, STATE_COOKIE, stateToken, STATE_TTL_S)
                });
            }

            if (p === '/auth/steam/return' && method === 'GET') {
                const cookies = parseCookies(req.headers.cookie);
                const st = readToken(config.secret, cookies[STATE_COOKIE]);
                const expectedState = st && st.t === 'state' ? st.s : null;
                const clearState = cookieHeader(cfg, STATE_COOKIE, '', 0);

                if (url.searchParams.get('openid.mode') === 'cancel') {
                    return redirect(res, '/?login=cancel', { 'Set-Cookie': clearState });
                }

                const result = await verifySteamAssertion(cfg, url.searchParams, expectedState, doFetch);
                if (!result.ok) {
                    console.warn(`[auth] Login de Steam rechazado: ${result.reason}`);
                    return redirect(res, '/?login=error', { 'Set-Cookie': clearState });
                }

                const now = Math.floor(Date.now() / 1000);
                const session = createToken(config.secret, {
                    t: 'session', sid: result.steamId, iat: now, exp: now + SESSION_TTL_S
                });
                // Warm the profile cache (non-blocking)
                getProfile(config, result.steamId, doFetch).catch(() => {});
                return redirect(res, '/?login=ok', {
                    'Set-Cookie': [clearState, cookieHeader(cfg, SESSION_COOKIE, session, SESSION_TTL_S)]
                });
            }

            if (p === '/auth/logout' && method === 'POST') {
                if (!sameOrigin(req, cfg)) return sendJson(res, 403, { error: 'forbidden' });
                return sendJson(res, 200, { loggedIn: false }, {
                    'Set-Cookie': cookieHeader(cfg, SESSION_COOKIE, '', 0)
                });
            }

            if (p === '/api/me' && (method === 'GET' || method === 'HEAD')) {
                const session = getSession(req);
                if (!session) return sendJson(res, 200, { loggedIn: false });
                const profile = await getProfile(config, session.sid, doFetch);
                return sendJson(res, 200, {
                    loggedIn: true,
                    steamId: session.sid,
                    name: profile.name,
                    avatar: profile.avatar,
                    profileUrl: profile.profileUrl
                });
            }

            if (p === '/api/state') {
                if (method !== 'GET') return sendJson(res, 405, { error: 'Método no permitido.', code: 'method' }, { Allow: 'GET' });
                const session = getSession(req);
                if (!session) return sendJson(res, 401, { error: 'Inicia sesión con Steam.', code: 'unauthorized' });
                try {
                    const state = await game.getState(session.sid);
                    return sendJson(res, 200, { steamId: session.sid, state });
                } catch (e) {
                    return sendApiError(res, e);
                }
            }

            if (Object.prototype.hasOwnProperty.call(GAME_ACTIONS, p)) {
                if (method !== 'POST') return sendJson(res, 405, { error: 'Método no permitido.', code: 'method' }, { Allow: 'POST' });
                if (!sameOriginApi(req, cfg)) return sendJson(res, 403, { error: 'forbidden', code: 'forbidden' });
                const session = getSession(req);
                if (!session) return sendJson(res, 401, { error: 'Inicia sesión con Steam.', code: 'unauthorized' });
                try {
                    const params = await readJsonBody(req);
                    const out = await game.runAction(session.sid, GAME_ACTIONS[p], params);
                    return sendJson(res, 200, out);
                } catch (e) {
                    return sendApiError(res, e);
                }
            }

            if (p.startsWith('/auth/') || p.startsWith('/api/')) {
                return send(res, method === 'GET' || method === 'POST' ? 404 : 405, 'Not found');
            }

            if (!serveStaticFiles) return send(res, 404, 'Not found');
            if (method === 'GET' || method === 'HEAD') return await serveStatic(req, res, p, staticRoot);
            return send(res, 405, 'Method not allowed', { Allow: 'GET, HEAD' });
        } catch (e) {
            console.error('[server] Error:', e);
            if (!res.headersSent) send(res, 500, 'Internal server error');
            else res.destroy();
        }
    };
}

module.exports = {
    buildConfig,
    createHandler,
    createGame,
    verifySteamAssertion,
    buildSteamLoginUrl,
    createToken,
    readToken,
    resolveStatic,
    loadDotEnv,
    secureRng,
    SESSION_COOKIE,
    DEFAULT_STATIC_ROOT
};
