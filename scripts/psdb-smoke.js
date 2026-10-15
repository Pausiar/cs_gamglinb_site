'use strict';

/*
 * PS_Database smoke test: `npm run smoke` (needs PSDB_URL + PSDB_API_KEY, from
 * the environment or .env). Uses a throwaway steam id "test-<random>" and
 * prints EXACTLY what the API returns for every call, so the assumptions in
 * lib/store.js (section "PS_DATABASE") can be checked / fixed.
 * The test row is deleted at the end.
 */

const path = require('node:path');
const crypto = require('node:crypto');
const { loadDotEnv } = require('../lib/app.js');
const { createPsdbStore, _psdb } = require('../lib/store.js');

loadDotEnv(path.join(__dirname, '..', '.env'));

const cfg = _psdb.psdbConfig(process.env);
if (!cfg.baseUrl || !cfg.apiKey) {
    console.error('Faltan PSDB_URL y/o PSDB_API_KEY (entorno o .env).');
    process.exit(1);
}

const steamId = 'test-' + crypto.randomBytes(6).toString('hex');
const store = createPsdbStore(process.env);
const raw = store._request;
let failures = 0;

function show(title, r) {
    console.log(`\n=== ${title}`);
    console.log(`HTTP ${r.status}`);
    console.log(JSON.stringify(r.json, null, 2));
}

function check(label, ok, extra) {
    if (!ok) failures++;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}${extra !== undefined ? ' -> ' + JSON.stringify(extra) : ''}`);
}

function findRowId(json) {
    const rows = _psdb.asRows(_psdb.unwrap(json));
    const row = rows.find(r => (_psdb.rowToProfile(r) || {}).steamId === steamId) || rows[0];
    return row && (row.id || row._id || row.rowId || (row.data && row.data.id));
}

(async () => {
    console.log(`PS_Database: ${cfg.baseUrl}  proyecto=${cfg.project}  tabla=${cfg.table}`);
    console.log(`steam-id de prueba: ${steamId}`);
    const url = q => _psdb.tableUrl(cfg, q);
    const C = _psdb.COL;
    let rowId = null;

    try {
        // ---------- raw HTTP ----------
        let r = await raw('GET', url({ [C.steamId]: `eq.${steamId}`, limit: '1' }));
        show('GET filtrado (debería estar vacío)', r);
        check('lista vacía', r.ok && _psdb.asRows(_psdb.unwrap(r.json)).length === 0);

        r = await raw('POST', url(), {
            [C.steamId]: steamId, [C.name]: 'smoke', [C.balance]: 1.5, [C.inventory]: [{ uid: 'a', id: 1 }],
            [C.stats]: { casesOpened: 1 }, [C.history]: [], [C.promosUsed]: [], [C.version]: 0
        });
        show('POST insertar', r);
        check('insert ok', r.ok);
        rowId = findRowId(r.json);

        r = await raw('POST', url(), { [C.steamId]: steamId, [C.version]: 0 });
        show('POST duplicado (debería fallar por unique)', r);
        check('duplicado detectado como conflicto', _psdb.isUniqueConflict(r.status, r.json), r.status);

        r = await raw('GET', url({ [C.steamId]: `eq.${steamId}`, limit: '1' }));
        show('GET filtrado', r);
        const rows = _psdb.asRows(_psdb.unwrap(r.json));
        check('una fila', rows.length === 1, rows.length);
        rowId = rowId || findRowId(r.json);
        const parsed = _psdb.rowToProfile(rows[0]);
        console.log('rowToProfile ->', JSON.stringify(parsed));
        check('columnas leídas', parsed && parsed.steamId === steamId && parsed.version === 0 && parsed.data.balance === 1.5 &&
            Array.isArray(parsed.data.inventory) && parsed.data.inventory.length === 1);

        if (rowId) {
            r = await raw('GET', `${url()}/${encodeURIComponent(rowId)}`);
            show(`GET /<rowId> (${rowId})`, r);
        } else {
            console.log('\n(no se encontró id de fila en las respuestas)');
        }

        r = await raw('PATCH', url({ [C.steamId]: `eq.${steamId}`, [C.version]: 'eq.0' }), { [C.balance]: 2.5, [C.version]: 1 });
        show('PATCH condicional version=eq.0 (debería actualizar 1 fila)', r);
        check('affectedCount = 1', _psdb.affectedCount(r.json) === 1, _psdb.affectedCount(r.json));

        r = await raw('PATCH', url({ [C.steamId]: `eq.${steamId}`, [C.version]: 'eq.0' }), { [C.balance]: 999, [C.version]: 1 });
        show('PATCH condicional con versión obsoleta version=eq.0 (debería actualizar 0 filas)', r);
        check('affectedCount = 0 (o 404/409)', _psdb.affectedCount(r.json) === 0 || [404, 409, 412].includes(r.status), _psdb.affectedCount(r.json));

        r = await raw('GET', url({ [C.steamId]: `eq.${steamId}` }));
        show('GET tras los PATCH', r);
        const after = _psdb.rowToProfile(_psdb.asRows(_psdb.unwrap(r.json))[0]);
        check('balance=2.5 version=1 (el PATCH obsoleto no escribió)', after && after.data.balance === 2.5 && after.version === 1, after && { balance: after.data.balance, version: after.version });

        // ---------- through lib/store.js ----------
        console.log('\n=== lib/store.js');
        const p1 = await store.getProfile(steamId);
        check('store.getProfile', p1 && p1.version === 1, p1 && p1.version);
        const p2 = await store.createProfile(steamId, 'otra vez');
        check('store.createProfile sobre existente devuelve la fila', p2 && p2.version === 1);
        const data = { balance: 10, inventory: [], stats: { casesOpened: 2 }, history: [], promosUsed: ['test'] };
        check('store.updateProfile(v1) = true', (await store.updateProfile(steamId, 1, data)) === true);
        check('store.updateProfile(v1 obsoleta) = false', (await store.updateProfile(steamId, 1, data)) === false);

        // Two writers race on the same version: exactly one must win
        const race = await Promise.all([0, 1, 2, 3].map(i =>
            store.updateProfile(steamId, 2, Object.assign({}, data, { balance: 100 + i }))));
        check('carrera de 4 escrituras con la misma versión: exactamente 1 gana', race.filter(Boolean).length === 1, race);
        const final = await store.getProfile(steamId);
        console.log('perfil final ->', JSON.stringify(final));
        check('versión final = 3', final && final.version === 3, final && final.version);
    } catch (e) {
        failures++;
        console.error('\nERROR:', e);
    } finally {
        try {
            if (rowId) {
                const r = await raw('DELETE', `${url()}/${encodeURIComponent(rowId)}`);
                show(`DELETE /<rowId> (limpieza)`, r);
            } else {
                const r = await raw('DELETE', url({ [C.steamId]: `eq.${steamId}` }));
                show('DELETE filtrado (limpieza)', r);
            }
        } catch (e) {
            console.error(`\nNo se pudo borrar la fila de prueba ${steamId}: ${e.message}`);
        }
        console.log(`\n${failures ? failures + ' comprobación(es) fallida(s)' : 'Todo OK'}`);
        process.exitCode = failures ? 1 : 0;
    }
})();
