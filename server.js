'use strict';

/*
 * Local server: `npm start`. Serves public/ plus the auth + game API from
 * lib/app.js. On Vercel the same handler runs as api/index.js and public/ is
 * served by the CDN.
 */

const http = require('node:http');
const path = require('node:path');
const { buildConfig, createHandler, loadDotEnv } = require('./lib/app.js');
const { createStore } = require('./lib/store.js');

function start() {
    loadDotEnv(path.join(__dirname, '.env'));
    let config;
    let store;
    try {
        config = buildConfig();
        store = createStore(process.env);
    } catch (e) {
        console.error(`[config] ${e.message}`);
        process.exit(1);
    }
    if (!config.steamApiKey) {
        console.warn('[auth] STEAM_API_KEY no definido: se mostrará "Steam XXXX" sin avatar.');
    }
    if (store.kind === 'memory') {
        console.warn('[store] PSDB_URL/PSDB_API_KEY no definidos: perfiles en memoria (se pierden al reiniciar).');
    } else {
        console.log(`[store] PS_Database: ${store._cfg.baseUrl} (${store._cfg.project}/${store._cfg.table})`);
    }
    const server = http.createServer(createHandler(config, {
        store,
        staticRoot: path.join(__dirname, 'public')
    }));
    server.listen(config.port, () => {
        console.log(`SkinDrop escuchando en http://localhost:${config.port} (BASE_URL=${config.baseUrl})`);
    });
    return server;
}

if (require.main === module) start();

module.exports = { start, ...require('./lib/app.js') };
