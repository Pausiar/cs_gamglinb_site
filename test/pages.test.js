'use strict';

// The static site: every page is served (clean URLs), has its metadata and loads files that exist.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { buildConfig, createHandler, cleanUrlRedirect } = require('../lib/app.js');
const { createMemoryStore } = require('../lib/store.js');

const PUBLIC = path.join(__dirname, '..', 'public');
const SECRET = 'test-secret-0123456789abcdef0123456789abcdef';

// Pages the site must have (more *.html files are checked too, automatically)
const REQUIRED_PAGES = [
    'index', 'cajas', 'upgrader', 'batallas', 'inventario', 'estadisticas',
    'recompensas', 'ranking', 'provably-fair', 'terminos', 'privacidad', 'cookies',
    'aviso-legal', 'juego-responsable', 'contacto'
];
const PLACEHOLDER_ROOTS = { recompensas: 'rewardsRoot', ranking: 'leaderboardRoot', 'provably-fair': 'fairRoot' };

const pageFiles = () => fs.readdirSync(PUBLIC).filter(f => f.endsWith('.html')).map(f => f.replace(/\.html$/, '')).sort();

async function startServer() {
    const config = buildConfig({ PORT: '0', BASE_URL: 'http://localhost:3000', SESSION_SECRET: SECRET });
    const handler = createHandler(config, { store: createMemoryStore(), fetchImpl: async () => { throw new Error('offline'); } });
    const server = http.createServer(handler);
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    return { base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(r => server.close(r)) };
}

test('all required pages exist', () => {
    const have = pageFiles();
    for (const name of REQUIRED_PAGES) assert.ok(have.includes(name), `falta public/${name}.html`);
});

test('every page is served at its clean URL; .html and trailing slash redirect', async () => {
    const srv = await startServer();
    try {
        for (const name of pageFiles()) {
            const clean = name === 'index' ? '/' : '/' + name;
            const r = await fetch(srv.base + clean);
            assert.equal(r.status, 200, clean);
            assert.match(r.headers.get('content-type'), /^text\/html/, clean);
            const html = await r.text();
            assert.match(html, /<title>[^<]*SkinDrop[^<]*<\/title>/, `${clean}: title`);

            const old = await fetch(srv.base + `/${name}.html?x=1`, { redirect: 'manual' });
            assert.equal(old.status, 308, `/${name}.html`);
            assert.equal(old.headers.get('location'), clean + '?x=1');
        }
        const slash = await fetch(srv.base + '/cajas/', { redirect: 'manual' });
        assert.equal(slash.status, 308);
        assert.equal(slash.headers.get('location'), '/cajas');
        const head = await fetch(srv.base + '/cajas', { method: 'HEAD' });
        assert.equal(head.status, 200);
        // following the redirect ends on the page
        assert.equal((await fetch(srv.base + '/cajas.html')).status, 200);
        assert.equal((await fetch(srv.base + '/favicon.svg')).headers.get('content-type'), 'image/svg+xml');
    } finally {
        await srv.close();
    }
});

test('static allowlist: only pages and asset directories', async () => {
    const srv = await startServer();
    try {
        for (const p of ['/server', '/package', '/README', '/package.json', '/server.js', '/lib/app.js', '/lib/routes/index.js',
            '/test/api.test.js', '/api/nope', '/nope', '/css', '/js', '/.env', '/css/../server.js', '/%2e%2e/server.js',
            '/js/nope.js', '/Cajas', '/public/index.html', '/cajas.html/x']) {
            const r = await fetch(srv.base + p, { redirect: 'manual' });
            assert.ok(r.status === 404 || r.status === 308 || r.status === 400, `${p} -> ${r.status}`);
            if (r.status === 308) assert.notEqual(r.headers.get('location'), '/server', p);
        }
        assert.equal((await fetch(srv.base + '/api/nope')).status, 404);
        assert.equal((await fetch(srv.base + '/css/styles.css')).status, 200);
        assert.equal((await fetch(srv.base + '/js/layout.js')).status, 200);
        assert.equal((await fetch(srv.base + '/js/sfx.js')).status, 200);
    } finally {
        await srv.close();
    }
});

test('cleanUrlRedirect', () => {
    assert.equal(cleanUrlRedirect('/cajas.html'), '/cajas');
    assert.equal(cleanUrlRedirect('/index.html'), '/');
    assert.equal(cleanUrlRedirect('/cajas/'), '/cajas');
    assert.equal(cleanUrlRedirect('/cajas'), null);
    assert.equal(cleanUrlRedirect('/'), null);
    assert.equal(cleanUrlRedirect('/js/app.js'), null);
});

test('every page: metadata, layout placeholders, data-page, and referenced files exist', () => {
    for (const name of pageFiles()) {
        const html = fs.readFileSync(path.join(PUBLIC, name + '.html'), 'utf8');
        const where = name + '.html';
        assert.match(html, /<html lang="es">/, where);
        assert.match(html, /<meta name="description" content="[^"]{20,}">/, `${where}: meta description`);
        assert.match(html, /<link rel="icon" type="image\/svg\+xml" href="favicon\.svg">/, `${where}: favicon`);
        assert.match(html, /fonts\.googleapis\.com\/css2\?family=Rajdhani/, `${where}: fonts`);
        assert.match(html, /font-awesome\/6\.4\.0/, `${where}: font awesome`);
        assert.ok(html.includes('<div id="siteHeader"></div>'), `${where}: header placeholder`);
        assert.ok(html.includes('<div id="siteFooter"></div>'), `${where}: footer placeholder`);
        assert.match(html, new RegExp(`<body data-page="${name === 'index' ? 'inicio' : name}"`), `${where}: data-page`);
        assert.ok(!/soundjay|<audio/i.test(html), `${where}: no external audio`);

        // layout.js is loaded before every other script
        const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
        assert.equal(scripts[0], 'js/layout.js', `${where}: layout.js first`);
        for (const need of ['js/sfx.js', 'js/data.js', 'js/engine.js', 'js/app.js', 'js/auth.js']) {
            assert.ok(scripts.includes(need), `${where}: ${need}`);
        }
        assert.ok(scripts.indexOf('js/app.js') < scripts.indexOf('js/auth.js'), `${where}: app.js before auth.js`);

        const files = [...scripts, ...[...html.matchAll(/<link rel="stylesheet" href="(css\/[^"]+)"/g)].map(m => m[1])];
        for (const f of files) assert.ok(fs.existsSync(path.join(PUBLIC, f)), `${where}: ${f} existe`);
    }
});

test('placeholder pages have their empty root and a "Próximamente" note', () => {
    for (const [name, rootId] of Object.entries(PLACEHOLDER_ROOTS)) {
        const html = fs.readFileSync(path.join(PUBLIC, name + '.html'), 'utf8');
        assert.ok(html.includes(`<div id="${rootId}" data-root></div>`), `${name}: #${rootId} vacío`);
        assert.match(html, /data-placeholder/, name);
        assert.match(html, /Próximamente/, name);
    }
});

test('footer pages state the truth: no real money, virtual items, +18, Steam data', () => {
    const read = n => fs.readFileSync(path.join(PUBLIC, n + '.html'), 'utf8');
    const terms = read('terminos');
    assert.match(terms, /entretenimiento/i);
    assert.match(terms, /dinero real/i);
    assert.match(terms, /18 años/);
    assert.match(terms, /no se pueden retirar|no es posible[^.]*retirar/i);
    assert.match(terms, /no es un casino ni un sitio de apuestas/i);
    assert.match(terms, /valor de referencia/i);
    const privacy = read('privacidad');
    assert.match(privacy, /SteamID/);
    assert.match(privacy, /saldo virtual/i);
    assert.match(privacy, /contraseña/i);
    assert.match(privacy, /RGPD/);
    assert.match(privacy, /aepd\.es/);
    assert.match(read('contacto'), /mailto:contacto@skindrop\.example/);
    assert.ok(!/<form[\s>]/i.test(read('contacto')), 'contacto: sin formularios');
    assert.match(read('aviso-legal'), /LSSI/);
    assert.match(read('aviso-legal'), /NIF/);
    assert.match(read('cookies'), /sd_session/);
    assert.match(read('cookies'), /no usa cookies publicitarias/i);
    assert.match(read('juego-responsable'), /FEJAR/);
});

test('shared layout carries the legal notice and 18+ gate, and offers no payment methods', () => {
    const layout = fs.readFileSync(path.join(PUBLIC, 'js', 'layout.js'), 'utf8');
    assert.match(layout, /Simulación/);
    assert.match(layout, /sd_age_ok/);
    assert.match(layout, /Solo para mayores de 18 años/);
    assert.match(layout, /Sin dinero real/);
    assert.ok(!/Métodos de Pago/i.test(layout), 'no debe sugerir compras con dinero real');
    assert.ok(!/payment-methods/.test(layout), 'no debe quedar el bloque de pagos');
});

test('every nav / footer link of layout.js points to an existing page', () => {
    const layout = fs.readFileSync(path.join(PUBLIC, 'js', 'layout.js'), 'utf8');
    const hrefs = [...layout.matchAll(/href: '(\/[a-z-]*)'/g)].map(m => m[1]);
    assert.ok(hrefs.length >= 12);
    const have = pageFiles();
    for (const h of hrefs) assert.ok(have.includes(h === '/' ? 'index' : h.slice(1)), `layout.js: ${h}`);
    for (const label of ['Inicio', 'Cajas', 'Upgrader', 'Batallas', 'Recompensas', 'Ranking', 'Inventario', 'Estadísticas']) {
        assert.ok(layout.includes(`label: '${label}'`), label);
    }
});

test('no leftover in-page anchors for sections that became pages', () => {
    const files = [];
    (function walk(dir) {
        for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, f.name);
            if (f.isDirectory()) walk(p);
            else if (/\.(html|js)$/.test(f.name)) files.push(p);
        }
    })(PUBLIC);
    for (const f of files) {
        const text = fs.readFileSync(f, 'utf8');
        assert.ok(!/href="#(cases|upgrader|battles|inventory|stats)"/.test(text), `${path.relative(PUBLIC, f)}: enlace a ancla antigua`);
    }
});
