'use strict';

/*
 * SkinDrop server: static site + "Iniciar sesión con Steam" (Steam OpenID 2.0).
 * Zero dependencies, Node >= 18 (uses global fetch). Run: npm start
 *
 * Env (or .env file): PORT, BASE_URL, SESSION_SECRET, STEAM_API_KEY, NODE_ENV
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = __dirname;

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

function buildConfig(env = process.env) {
    const port = parseInt(env.PORT, 10) || 3000;
    let baseUrl = (env.BASE_URL || `http://localhost:${port}`).trim().replace(/\/+$/, '');
    let parsed;
    try {
        parsed = new URL(baseUrl);
    } catch (e) {
        throw new Error(`BASE_URL no es una URL válida: ${baseUrl}`);
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('BASE_URL debe empezar por http:// o https://');
    }
    baseUrl = parsed.origin + parsed.pathname.replace(/\/+$/, '');

    const production = env.NODE_ENV === 'production';
    let secret = env.SESSION_SECRET || '';
    if (!secret) {
        if (production) {
            throw new Error('SESSION_SECRET es obligatorio en producción (NODE_ENV=production).');
        }
        secret = crypto.randomBytes(32).toString('hex');
        console.warn('[auth] AVISO: SESSION_SECRET no definido; usando uno aleatorio. ' +
            'Las sesiones se perderán al reiniciar. Defínelo en .env.');
    } else if (secret.length < 32) {
        console.warn('[auth] AVISO: SESSION_SECRET es corto; usa al menos 32 caracteres aleatorios.');
    }

    return {
        port,
        baseUrl,
        returnUrl: `${baseUrl}/auth/steam/return`,
        secure: parsed.protocol === 'https:',
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

// Replay protection on top of Steam's own nonce handling
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

// Only these top-level files / directories are ever served
const STATIC_FILES = new Set(['index.html', 'favicon.ico']);
const STATIC_DIRS = new Set(['css', 'js', 'images', 'img', 'assets', 'sounds', 'fonts']);

function resolveStatic(pathname) {
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

    const full = path.resolve(ROOT, ...segments);
    if (!full.startsWith(ROOT + path.sep)) return null;
    return { full, type: MIME[ext] };
}

async function serveStatic(req, res, pathname) {
    const target = resolveStatic(pathname);
    if (!target) return send(res, 404, 'Not found');
    let stat;
    try {
        // realpath guards against symlinks pointing outside the site
        const real = await fs.promises.realpath(target.full);
        if (!real.startsWith(ROOT + path.sep)) return send(res, 404, 'Not found');
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

// ==================== APP ====================
function createHandler(config, { fetchImpl } = {}) {
    const doFetch = fetchImpl || ((...args) => globalThis.fetch(...args));

    function getSession(req) {
        const cookies = parseCookies(req.headers.cookie);
        const payload = readToken(config.secret, cookies[SESSION_COOKIE]);
        if (!payload || payload.t !== 'session' || typeof payload.sid !== 'string' || !/^\d{17}$/.test(payload.sid)) {
            return null;
        }
        return payload;
    }

    function sameOrigin(req) {
        const origin = req.headers.origin;
        if (!origin) return true; // non-browser or same-origin navigation without Origin
        return origin === new URL(config.baseUrl).origin;
    }

    return async function handler(req, res) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'same-origin');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');

        let url;
        try {
            url = new URL(req.url, 'http://internal');
        } catch (e) {
            return send(res, 400, 'Bad request');
        }
        const p = url.pathname;
        const method = req.method;

        try {
            if (p === '/auth/steam' && method === 'GET') {
                const state = crypto.randomBytes(16).toString('base64url');
                const stateToken = createToken(config.secret, {
                    t: 'state', s: state, exp: Math.floor(Date.now() / 1000) + STATE_TTL_S
                });
                return redirect(res, buildSteamLoginUrl(config, state), {
                    'Set-Cookie': cookieHeader(config, STATE_COOKIE, stateToken, STATE_TTL_S)
                });
            }

            if (p === '/auth/steam/return' && method === 'GET') {
                const cookies = parseCookies(req.headers.cookie);
                const st = readToken(config.secret, cookies[STATE_COOKIE]);
                const expectedState = st && st.t === 'state' ? st.s : null;
                const clearState = cookieHeader(config, STATE_COOKIE, '', 0);

                if (url.searchParams.get('openid.mode') === 'cancel') {
                    return redirect(res, '/?login=cancel', { 'Set-Cookie': clearState });
                }

                const result = await verifySteamAssertion(config, url.searchParams, expectedState, doFetch);
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
                    'Set-Cookie': [clearState, cookieHeader(config, SESSION_COOKIE, session, SESSION_TTL_S)]
                });
            }

            if (p === '/auth/logout' && method === 'POST') {
                if (!sameOrigin(req)) return sendJson(res, 403, { error: 'forbidden' });
                return sendJson(res, 200, { loggedIn: false }, {
                    'Set-Cookie': cookieHeader(config, SESSION_COOKIE, '', 0)
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

            if (p.startsWith('/auth/') || p.startsWith('/api/')) {
                return send(res, method === 'GET' || method === 'POST' ? 404 : 405, 'Not found');
            }

            if (method === 'GET' || method === 'HEAD') return await serveStatic(req, res, p);
            return send(res, 405, 'Method not allowed', { Allow: 'GET, HEAD' });
        } catch (e) {
            console.error('[server] Error:', e);
            if (!res.headersSent) send(res, 500, 'Internal server error');
            else res.destroy();
        }
    };
}

function start() {
    loadDotEnv(path.join(ROOT, '.env'));
    let config;
    try {
        config = buildConfig();
    } catch (e) {
        console.error(`[config] ${e.message}`);
        process.exit(1);
    }
    if (!config.steamApiKey) {
        console.warn('[auth] STEAM_API_KEY no definido: se mostrará "Steam XXXX" sin avatar.');
    }
    const server = http.createServer(createHandler(config));
    server.listen(config.port, () => {
        console.log(`SkinDrop escuchando en http://localhost:${config.port} (BASE_URL=${config.baseUrl})`);
    });
    return server;
}

if (require.main === module) start();

module.exports = {
    buildConfig,
    createHandler,
    verifySteamAssertion,
    buildSteamLoginUrl,
    createToken,
    readToken,
    resolveStatic,
    loadDotEnv
};
