'use strict';

/*
 * Profile storage with optimistic concurrency.
 *
 * Interface (both implementations):
 *   getProfile(steamId)                 -> Promise<Profile|null>
 *   createProfile(steamId, name)        -> Promise<Profile>   (insert; on unique conflict -> read)
 *   updateProfile(steamId, version, data, name?, ext?) -> Promise<boolean>
 *        conditional write "where steam-id = X and version = N", sets version N+1.
 *        Resolves false when no row matched (someone else wrote first).
 *        `ext` (optional) replaces the server-only fields given in it (see EXT_KEYS).
 *   updateProfileEx(...same args)       -> Promise<{ ok, profile|null }>   (PS_Database only, optional)
 *        like updateProfile, plus the stored row when the PATCH response returned it.
 *   kind                                -> 'memory' | 'psdb'
 *
 * PS_Database requests answer 429/503 under load: they are retried twice (Retry-After honored,
 * capped at 2 s, with jitter) and then fail with a 503 error { code: 'busy', expose: true }.
 *
 * Profile = { steamId, name, version, data: { balance, inventory, stats, history, promosUsed }, ext }
 *
 * `data` is the game state (sent to the client). `ext` holds server-only
 * per-player fields that must never reach the client as-is:
 *   ext.fair    provably-fair seeds / nonce
 *   ext.rewards daily reward bookkeeping
 *   ext.avatar  Steam avatar URL
 *
 * createStore(env) picks PS_Database when PSDB_URL and PSDB_API_KEY are set,
 * otherwise an in-memory store (dev / tests; data is lost on restart and, on
 * serverless, is per-instance).
 */

const crypto = require('node:crypto');

function emptyData() {
    return { balance: 0, inventory: [], stats: {}, history: [], promosUsed: [] };
}

const EXT_KEYS = ['fair', 'rewards', 'avatar'];

function emptyExt() {
    return { fair: {}, rewards: {}, avatar: null };
}

// Only known ext keys, so a hook can't write arbitrary columns
function pickExt(ext) {
    const out = {};
    if (!ext || typeof ext !== 'object') return out;
    EXT_KEYS.forEach(k => { if (Object.prototype.hasOwnProperty.call(ext, k)) out[k] = ext[k]; });
    return out;
}

function copy(v) {
    return v === undefined ? undefined : JSON.parse(JSON.stringify(v));
}

// ==================== MEMORY ====================
function createMemoryStore({ latencyMs = 0 } = {}) {
    const rows = new Map(); // steamId -> { steamId, name, version, data }
    // Yield to the event loop like a network round-trip would, so concurrent
    // requests really interleave in tests.
    const tick = () => new Promise(r => (latencyMs ? setTimeout(r, latencyMs) : setImmediate(r)));

    return {
        kind: 'memory',
        table: createMemoryTables(),
        async getProfile(steamId) {
            await tick();
            const row = rows.get(steamId);
            return row ? copy(row) : null;
        },
        async createProfile(steamId, name) {
            await tick();
            if (!rows.has(steamId)) {
                rows.set(steamId, { steamId, name: name || null, version: 0, data: emptyData(), ext: emptyExt() });
            }
            return copy(rows.get(steamId));
        },
        async updateProfile(steamId, version, data, name, ext) {
            await tick();
            const row = rows.get(steamId);
            if (!row || row.version !== version) return false;
            row.version = version + 1;
            row.data = copy(data);
            if (name) row.name = name;
            Object.assign(row.ext, copy(pickExt(ext)));
            return true;
        },
        _rows: rows
    };
}

// ==================== PS_DATABASE ====================
/*
 * ALL assumptions about the PS_Database HTTP API live in this section.
 * Verified with `npm run smoke` (scripts/psdb-smoke.js) against the real API.
 *
 *  - Base URL: PSDB_URL (e.g. https://psdatabase.vercel.app), project PSDB_PROJECT
 *    (default "skindrop"), table PSDB_TABLE (default "profiles").
 *  - Routes: /api/v1/<project>/<table>  and  /api/v1/<project>/<table>/<rowId>
 *  - Auth: "Authorization: Bearer <key>" (also sent as "x-api-key").
 *  - Responses are wrapped: { "data": ... }.
 *  - Filters: PostgREST-style query params, e.g. ?steam-id=eq.123&version=eq.4
 *  - Columns: steam-id (unique), name, balance, inventory, stats, history,
 *    promos-used, version  (+ built-in id, created_at, updated_at).
 */
const COL = {
    steamId: 'steam-id',
    name: 'name',
    balance: 'balance',
    inventory: 'inventory',
    stats: 'stats',
    history: 'history',
    promosUsed: 'promos-used',
    version: 'version',
    fair: 'fair',
    rewards: 'rewards',
    avatar: 'avatar'
};

function psdbConfig(env) {
    return {
        baseUrl: String(env.PSDB_URL || '').trim().replace(/\/+$/, ''),
        apiKey: String(env.PSDB_API_KEY || '').trim(),
        project: String(env.PSDB_PROJECT || 'skindrop').trim(),
        table: String(env.PSDB_TABLE || 'profiles').trim(),
        timeoutMs: parseInt(env.PSDB_TIMEOUT_MS, 10) || 8000,
        retries: Number.isFinite(parseInt(env.PSDB_RETRIES, 10)) ? Math.max(0, parseInt(env.PSDB_RETRIES, 10)) : 2
    };
}

// ASSUMPTION: collection URL shape
function tableUrl(cfg, query) {
    const base = `${cfg.baseUrl}/api/v1/${encodeURIComponent(cfg.project)}/${encodeURIComponent(cfg.table)}`;
    const qs = query ? new URLSearchParams(query).toString() : '';
    return qs ? `${base}?${qs}` : base;
}

// ASSUMPTION: auth headers
function authHeaders(cfg) {
    return {
        Authorization: `Bearer ${cfg.apiKey}`,
        'x-api-key': cfg.apiKey,
        Accept: 'application/json'
    };
}

// ASSUMPTION: PostgREST-style equality filter
function eq(value) {
    return `eq.${value}`;
}

// ASSUMPTION: every response body is { data: ... }; tolerate a bare body too
function unwrap(json) {
    if (json && typeof json === 'object' && !Array.isArray(json) && 'data' in json) return json.data;
    return json;
}

// ASSUMPTION: list endpoints return an array in data (or data.rows / data.items)
function asRows(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === 'object') {
        for (const k of ['rows', 'items', 'records', 'data']) {
            if (Array.isArray(payload[k])) return payload[k];
        }
        if (payload[COL.steamId] !== undefined) return [payload]; // single row
    }
    return [];
}

// ASSUMPTION: a row is flat { "steam-id": ..., balance: ... }; tolerate the
// columns being nested under row.data / row.values (JSONB-backed tables).
function rowColumns(row) {
    if (!row || typeof row !== 'object') return null;
    if (row[COL.steamId] !== undefined) return row;
    for (const k of ['data', 'values', 'fields']) {
        if (row[k] && typeof row[k] === 'object' && row[k][COL.steamId] !== undefined) return row[k];
    }
    return null;
}

// ASSUMPTION: json columns may come back as JSON strings
function jsonCol(v, fallback) {
    if (typeof v === 'string') {
        try { return JSON.parse(v); } catch (e) { return fallback; }
    }
    return v === undefined || v === null ? fallback : v;
}

function rowToProfile(row) {
    const c = rowColumns(row);
    if (!c) return null;
    const version = Number(c[COL.version]);
    return {
        steamId: String(c[COL.steamId]),
        name: c[COL.name] == null ? null : String(c[COL.name]),
        version: Number.isFinite(version) ? version : 0,
        data: {
            balance: Number(c[COL.balance]) || 0,
            inventory: jsonCol(c[COL.inventory], []),
            stats: jsonCol(c[COL.stats], {}),
            history: jsonCol(c[COL.history], []),
            promosUsed: jsonCol(c[COL.promosUsed], [])
        },
        ext: {
            fair: jsonCol(c[COL.fair], {}) || {},
            rewards: jsonCol(c[COL.rewards], {}) || {},
            avatar: c[COL.avatar] == null ? null : String(c[COL.avatar])
        }
    };
}

function profileToColumns(data) {
    return {
        [COL.balance]: data.balance,
        [COL.inventory]: data.inventory,
        [COL.stats]: data.stats,
        [COL.history]: data.history,
        [COL.promosUsed]: data.promosUsed
    };
}

// ASSUMPTION: number of rows touched by a filtered PATCH. Accepts data.count,
// count, data.updated/affected/rowCount, or the length of a returned array.
// Returns null when the response does not say.
function affectedCount(json) {
    const d = unwrap(json);
    const pick = o => {
        if (!o || typeof o !== 'object') return null;
        for (const k of ['count', 'updated', 'affected', 'rowCount', 'updatedCount', 'affectedRows']) {
            if (Number.isFinite(Number(o[k])) && o[k] !== null && o[k] !== '' && typeof o[k] !== 'boolean') return Number(o[k]);
        }
        return null;
    };
    if (Array.isArray(d)) return d.length;
    let n = pick(d);
    if (n !== null) return n;
    if (d && typeof d === 'object') {
        const rows = ['rows', 'items', 'records'].map(k => d[k]).find(Array.isArray);
        if (rows) return rows.length;
    }
    n = pick(json);
    if (n !== null) return n;
    return null;
}

// The PATCH answer may carry the updated row(s) ({ data: { count, rows: [...] } }). Trust a row only
// when it is this profile at the version we wrote and holds our write token.
function trustedRow(json, steamId, version, wid) {
    const d = unwrap(json);
    const rows = Array.isArray(d) ? d : d && typeof d === 'object'
        ? ['rows', 'items', 'records'].map(k => d[k]).find(Array.isArray) : null;
    if (!rows) return null;
    for (const row of rows) {
        const p = rowToProfile(row);
        if (p && p.steamId === steamId && p.version === version && p.data.stats && p.data.stats._wid === wid) return p;
    }
    return null;
}

// ASSUMPTION: a duplicate insert on a unique column answers 409 (or 400/422/500
// with a message mentioning unique/duplicate).
function isUniqueConflict(status, json) {
    if (status === 409) return true;
    const text = JSON.stringify(json || '').toLowerCase();
    return status >= 400 && /unique|duplicate|already exists|23505/.test(text);
}

// Rate limit / overload resilience: PS_Database answers 429 (>120 requests/min per IP
// and project) or 503. Retry up to PSDB_RETRIES (2) times honoring Retry-After (capped), then
// surface a clean 503 { code: 'busy' } instead of an internal error.
const RETRY_AFTER_CAP_MS = 2000;
const BUSY_MESSAGE = 'Servidor ocupado, inténtalo en unos segundos.';

function busyError(op) {
    const err = new Error(BUSY_MESSAGE);
    err.status = 503;
    err.code = 'busy';
    err.expose = true;   // lib/app.js sends { error, code } as-is
    err.detail = op;
    return err;
}

// Retry-After: delta-seconds or an HTTP date. Returns ms or null.
function parseRetryAfter(value) {
    if (value === null || value === undefined || value === '') return null;
    const secs = Number(value);
    if (Number.isFinite(secs)) return Math.max(0, secs * 1000);
    const at = Date.parse(String(value));
    return Number.isFinite(at) ? Math.max(0, at - Date.now()) : null;
}

function createPsdbStore(env = process.env, { fetchImpl, sleep, random } = {}) {
    const cfg = psdbConfig(env);
    if (!cfg.baseUrl || !cfg.apiKey) throw new Error('PSDB_URL y PSDB_API_KEY son obligatorios para PS_Database');
    const doFetch = fetchImpl || ((...a) => globalThis.fetch(...a));
    const wait = sleep || ((ms) => new Promise(r => setTimeout(r, ms)));
    const rand = random || Math.random;

    async function requestOnce(method, url, body) {
        const headers = authHeaders(cfg);
        if (body !== undefined) headers['Content-Type'] = 'application/json';
        let resp;
        try {
            resp = await doFetch(url, {
                method,
                headers,
                body: body === undefined ? undefined : JSON.stringify(body),
                signal: AbortSignal.timeout(cfg.timeoutMs)
            });
        } catch (e) {
            const err = new Error(`PS_Database no responde (${method}): ${e.message}`);
            err.status = 503;
            throw err;
        }
        const text = await resp.text();
        let json = null;
        try { json = text ? JSON.parse(text) : null; } catch (e) { json = { raw: text.slice(0, 500) }; }
        const retryAfter = resp.headers && typeof resp.headers.get === 'function' ? resp.headers.get('retry-after') : null;
        return { status: resp.status, ok: resp.ok, json, retryAfterMs: parseRetryAfter(retryAfter) };
    }

    // -> { status, ok, json, ambiguous }. `ambiguous`: a 503 was seen and retried, so an earlier
    // attempt of a write may have been applied (429 is always rejected before processing).
    async function request(method, url, body) {
        let ambiguous = false;
        for (let attempt = 0; ; attempt++) {
            const r = await requestOnce(method, url, body);
            if (r.status !== 429 && r.status !== 503) {
                r.ambiguous = ambiguous;
                return r;
            }
            if (r.status === 503) ambiguous = true;
            if (attempt >= cfg.retries) throw busyError(`${method} HTTP ${r.status}`);
            const base = r.retryAfterMs === null ? 250 * (attempt + 1) : Math.min(r.retryAfterMs, RETRY_AFTER_CAP_MS);
            await wait(Math.round(base + rand() * 250));
        }
    }

    function httpError(op, r) {
        const err = new Error(`PS_Database ${op} HTTP ${r.status}: ${JSON.stringify(r.json).slice(0, 300)}`);
        err.status = 502;
        return err;
    }

    async function getProfile(steamId) {
        const r = await request('GET', tableUrl(cfg, { [COL.steamId]: eq(steamId), limit: '1' }));
        if (r.status === 404) return null;
        if (!r.ok) throw httpError('get', r);
        const rows = asRows(unwrap(r.json)).map(rowToProfile).filter(p => p && p.steamId === steamId);
        return rows[0] || null;
    }

    async function createProfile(steamId, name) {
        // ASSUMPTION: POST <table> with a single flat object inserts one row
        const r = await request('POST', tableUrl(cfg), {
            [COL.steamId]: steamId,
            [COL.name]: name || null,
            [COL.version]: 0,
            ...profileToColumns(emptyData())
        });
        if (!r.ok && !isUniqueConflict(r.status, r.json)) throw httpError('insert', r);
        const p = await getProfile(steamId);
        if (!p) throw httpError('insert/read', r);
        return p;
    }

    /*
     * Conditional write. Resolves { ok, profile }: `profile` is the stored row when the API
     * returned it in the PATCH response (and it carries our write token), otherwise null and the
     * caller keeps the state it computed.
     */
    async function updateProfileEx(steamId, version, data, name, ext) {
        // Write token: lets us tell whether the conditional PATCH was ours even
        // if the API does not report an affected-row count.
        const wid = crypto.randomBytes(9).toString('base64url');
        const stats = Object.assign({}, data.stats, { _wid: wid });
        const body = { ...profileToColumns({ ...data, stats }), [COL.version]: version + 1 };
        if (name) body[COL.name] = name;
        const extCols = pickExt(ext);
        Object.keys(extCols).forEach(k => { body[COL[k]] = extCols[k]; });

        const checkToken = async () => {
            const now = await getProfile(steamId);
            const ok = !!(now && now.version === version + 1 && now.data.stats && now.data.stats._wid === wid);
            return { ok, profile: ok ? now : null };
        };

        const url = tableUrl(cfg, { [COL.steamId]: eq(steamId), [COL.version]: eq(version) });
        const r = await request('PATCH', url, body);
        if (r.status === 404 || r.status === 409 || r.status === 412) {
            // After a retried 503 the first attempt may have been the one that applied
            return r.ambiguous ? checkToken() : { ok: false, profile: null };
        }
        if (!r.ok) throw httpError('update', r);
        const n = affectedCount(r.json);
        if (n === 0 && r.ambiguous) return checkToken();
        if (n !== null) {
            if (n <= 0) return { ok: false, profile: null };
            return { ok: true, profile: trustedRow(r.json, steamId, version + 1, wid) };
        }
        // Unknown response shape: read back and check our token
        return checkToken();
    }

    async function updateProfile(steamId, version, data, name, ext) {
        return (await updateProfileEx(steamId, version, data, name, ext)).ok;
    }

    return { kind: 'psdb', getProfile, createProfile, updateProfile, updateProfileEx, table: createPsdbTables(cfg, request), _cfg: cfg, _request: request };
}

// ==================== GENERIC TABLES ====================
/*
 * store.table(slug) -> small CRUD helper for the other PS_Database tables
 * (drops, leaderboard, lobbies...). Rows are returned flat:
 *   { id, createdAt, updatedAt, ...columns }   (column keys are the slugs, e.g. "steam-id")
 * Filters use PostgREST syntax: { 'steam-id': 'eq.123', price: 'gte.10', status: 'in.(open,running)' }.
 *
 *   list({ filters, order: 'created_at.desc', limit: 50, offset }) -> Promise<row[]>
 *   get(id)                       -> Promise<row|null>
 *   insert(columns)               -> Promise<row>      (throws err.status 409 on unique conflict)
 *   update(filters, patch)        -> Promise<number>   rows changed (filters required; use
 *                                    { id: 'eq.<id>', version: 'eq.N' } for optimistic writes)
 * The API key has read+write only (no delete): mark rows instead of deleting them.
 * PS_Database limit: 120 requests/min per IP and project, so keep polling and writes modest.
 */
const TABLE_SLUG_RE = /^[a-z0-9-]{1,64}$/;

function flatRow(row) {
    if (!row || typeof row !== 'object') return null;
    const cols = row.data && typeof row.data === 'object' && !Array.isArray(row.data) ? row.data : row;
    const out = Object.assign({}, cols);
    out.id = row.id != null ? String(row.id) : out.id;
    out.createdAt = row.createdAt || row.created_at || out.createdAt || null;
    out.updatedAt = row.updatedAt || row.updated_at || out.updatedAt || null;
    delete out.created_at;
    delete out.updated_at;
    return out;
}

function parseFilterValue(raw) {
    const s = String(raw);
    const neg = s.startsWith('not.');
    const body = neg ? s.slice(4) : s;
    const dot = body.indexOf('.');
    const op = dot === -1 ? 'eq' : body.slice(0, dot);
    const val = dot === -1 ? body : body.slice(dot + 1);
    return { neg, op, val };
}

function matchesFilter(value, raw) {
    const { neg, op, val } = parseFilterValue(raw);
    const num = v => (typeof v === 'number' ? v : Number(v));
    const cmp = (a, b) => (Number.isFinite(num(a)) && Number.isFinite(num(b)) ? num(a) - num(b) : String(a).localeCompare(String(b)));
    let ok;
    switch (op) {
        case 'eq': ok = String(value) === val; break;
        case 'neq': ok = String(value) !== val; break;
        case 'gt': ok = value != null && cmp(value, val) > 0; break;
        case 'gte': ok = value != null && cmp(value, val) >= 0; break;
        case 'lt': ok = value != null && cmp(value, val) < 0; break;
        case 'lte': ok = value != null && cmp(value, val) <= 0; break;
        case 'in': ok = val.replace(/^\(|\)$/g, '').split(',').includes(String(value)); break;
        case 'is': ok = val === 'null' ? value == null : String(value) === val; break;
        default: throw new Error(`Filtro no soportado: ${op}`);
    }
    return neg ? !ok : ok;
}

function sortRows(rows, order) {
    if (!order) return rows;
    const keys = String(order).split(',').map(part => {
        const [col, dir] = part.split('.');
        const key = col === 'created_at' ? 'createdAt' : col === 'updated_at' ? 'updatedAt' : col;
        return { key, desc: dir === 'desc' };
    });
    return rows.sort((a, b) => {
        for (const { key, desc } of keys) {
            const x = a[key], y = b[key];
            if (x === y) continue;
            const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
            return desc ? -c : c;
        }
        return 0;
    });
}

function createMemoryTables() {
    const tables = new Map();
    let seq = 0;
    return function table(slug) {
        if (!TABLE_SLUG_RE.test(slug)) throw new Error(`Tabla inválida: ${slug}`);
        if (!tables.has(slug)) tables.set(slug, new Map());
        const rows = tables.get(slug);
        const select = filters => [...rows.values()].filter(r =>
            Object.entries(filters || {}).every(([k, f]) => matchesFilter(r[k], f)));
        return {
            async list({ filters, order = 'created_at.desc', limit = 50, offset = 0 } = {}) {
                await new Promise(r => setImmediate(r));
                return sortRows(select(filters), order).slice(offset, offset + limit).map(copy);
            },
            async get(id) {
                await new Promise(r => setImmediate(r));
                return rows.has(String(id)) ? copy(rows.get(String(id))) : null;
            },
            async insert(columns) {
                await new Promise(r => setImmediate(r));
                const now = new Date(Date.now() + (seq % 1000)).toISOString();
                const row = Object.assign({}, copy(columns), { id: `mem-${++seq}`, createdAt: now, updatedAt: now });
                rows.set(row.id, row);
                return copy(row);
            },
            async update(filters, patch) {
                if (!filters || !Object.keys(filters).length) throw new Error('update necesita filtros');
                await new Promise(r => setImmediate(r));
                const hit = select(filters);
                hit.forEach(r => Object.assign(r, copy(patch), { updatedAt: new Date().toISOString() }));
                return hit.length;
            }
        };
    };
}

function createPsdbTables(cfg, request) {
    return function table(slug) {
        if (!TABLE_SLUG_RE.test(slug)) throw new Error(`Tabla inválida: ${slug}`);
        const url = query => tableUrl(Object.assign({}, cfg, { table: slug }), query);
        const fail = (op, r) => {
            const err = new Error(`PS_Database ${slug} ${op} HTTP ${r.status}: ${JSON.stringify(r.json).slice(0, 300)}`);
            err.status = r.status === 409 || isUniqueConflict(r.status, r.json) ? 409 : 502;
            return err;
        };
        return {
            async list({ filters, order = 'created_at.desc', limit = 50, offset } = {}) {
                const q = Object.assign({}, filters, { order, limit: String(limit) });
                if (offset) q.offset = String(offset);
                const r = await request('GET', url(q));
                if (!r.ok) throw fail('list', r);
                return asRowsAny(unwrap(r.json)).map(flatRow).filter(Boolean);
            },
            async get(id) {
                const r = await request('GET', `${url()}/${encodeURIComponent(id)}`);
                if (r.status === 404) return null;
                if (!r.ok) throw fail('get', r);
                return flatRow(unwrap(r.json));
            },
            async insert(columns) {
                const r = await request('POST', url(), columns);
                if (!r.ok) throw fail('insert', r);
                const d = unwrap(r.json);
                return flatRow(Array.isArray(d) ? d[0] : d);
            },
            async update(filters, patch) {
                if (!filters || !Object.keys(filters).length) throw new Error('update necesita filtros');
                const r = await request('PATCH', url(filters), patch);
                if (r.status === 404 || r.status === 409 || r.status === 412) return 0;
                if (!r.ok) throw fail('update', r);
                const n = affectedCount(r.json);
                return n === null ? 0 : n;
            }
        };
    };
}

// Like asRows but without the profiles-specific single-row check
function asRowsAny(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === 'object') {
        for (const k of ['rows', 'items', 'records', 'data']) {
            if (Array.isArray(payload[k])) return payload[k];
        }
    }
    return [];
}

function createStore(env = process.env, opts = {}) {
    if (env.PSDB_URL && env.PSDB_API_KEY) return createPsdbStore(env, opts);
    return createMemoryStore(opts);
}

module.exports = {
    createStore,
    createMemoryStore,
    createPsdbStore,
    EXT_KEYS,
    // exported for tests / smoke script
    _psdb: { trustedRow, parseRetryAfter, BUSY_MESSAGE, tableUrl, authHeaders, unwrap, asRows, rowToProfile, affectedCount, isUniqueConflict, psdbConfig, COL }
};
