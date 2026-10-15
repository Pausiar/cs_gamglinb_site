// Ranking page: renders into #leaderboardRoot from GET /api/leaderboard (public, cached by the CDN).
// The current user's row is highlighted by comparing the row's Steam profile URL with /api/me.
(function () {
    'use strict';

    const root = document.getElementById('leaderboardRoot');
    if (!root) return;

    const TABS = [
        { by: 'total-won', label: 'Más ganado', icon: 'fa-coins', field: 'totalWon', head: 'Total ganado' },
        { by: 'profit', label: 'Mayor beneficio', icon: 'fa-chart-line', field: 'profit', head: 'Beneficio' },
        { by: 'best-drop-price', label: 'Mejor drop', icon: 'fa-gem', field: 'bestDropPrice', head: 'Mejor drop' }
    ];
    const MEDALS = ['🥇', '🥈', '🥉'];
    const CLIENT_CACHE_MS = 15000;

    let active = TABS[0].by;
    let myId = null;
    let seq = 0;
    const cache = {};

    function esc(str) {
        return String(str == null ? '' : str).replace(/[&<>"']/g, c =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function eur(n) {
        const v = Number(n) || 0;
        return (v < 0 ? '-' : '') + Math.abs(v).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€';
    }

    function skinInfo(id) {
        return window.SkinDropEngine ? window.SkinDropEngine.skinInfo(Number(id)) : null;
    }

    function skinImage(id) {
        const sd = window.SkinDrop;
        return sd && typeof sd.itemImage === 'function' ? sd.itemImage({ id: Number(id) }) : '';
    }

    function isYou(row) {
        return !!(myId && row.profileUrl && row.profileUrl.endsWith('/profiles/' + myId));
    }

    function avatar(row) {
        if (row.avatar && /^https:\/\//i.test(row.avatar)) {
            return '<img class="lb-avatar" src="' + esc(row.avatar) + '" alt="" width="40" height="40" loading="lazy" referrerpolicy="no-referrer">';
        }
        return '<span class="lb-avatar lb-avatar-fallback" aria-hidden="true">' + esc((row.name || '?').trim().charAt(0).toUpperCase() || '?') + '</span>';
    }

    function valueHtml(tab, row) {
        const v = row[tab.field];
        const cls = tab.field === 'profit' ? (v >= 0 ? ' is-pos' : ' is-neg') : '';
        return '<span class="lb-value' + cls + '">' + (tab.field === 'profit' && v > 0 ? '+' : '') + eur(v) + '</span>';
    }

    function bestHtml(row) {
        const info = skinInfo(row.bestDropItemId);
        if (!info || !(row.bestDropPrice > 0)) return '<span class="lb-best lb-best-none">—</span>';
        return '<span class="lb-best" title="' + esc(info.name) + '">' +
            '<img src="' + esc(skinImage(info.id)) + '" alt="" loading="lazy">' +
            '<span class="lb-best-text"><span class="lb-best-name">' + esc(info.name) + '</span>' +
            '<span class="lb-best-price" style="color:var(--rarity-' + esc(info.rarity) + ')">' + eur(row.bestDropPrice) + '</span></span>' +
            '</span>';
    }

    function rowHtml(tab, row) {
        const medal = MEDALS[row.rank - 1];
        const you = isYou(row);
        const name = row.profileUrl
            ? '<a class="lb-name" href="' + esc(row.profileUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(row.name) + '</a>'
            : '<span class="lb-name">' + esc(row.name) + '</span>';
        return '<li class="lb-row' + (you ? ' is-you' : '') + (row.rank <= 3 ? ' top-' + row.rank : '') + '"' + (you ? ' aria-current="true"' : '') + '>' +
            '<span class="lb-rank">' + (medal ? '<span class="lb-medal" aria-label="Puesto ' + row.rank + '">' + medal + '</span>' : row.rank) + '</span>' +
            '<span class="lb-player">' + avatar(row) + '<span class="lb-player-text"><span class="lb-name-row">' + name +
            (you ? '<span class="lb-you">Tú</span>' : '') + '</span>' +
            '<span class="lb-sub">' + (row.casesOpened || 0) + (row.casesOpened === 1 ? ' caja abierta' : ' cajas abiertas') + '</span></span></span>' +
            '<span class="lb-cell lb-cell-value" data-label="' + esc(tab.head) + '">' + valueHtml(tab, row) + '</span>' +
            '<span class="lb-cell lb-cell-best" data-label="Mejor drop">' + bestHtml(row) + '</span>' +
            '</li>';
    }

    function shell() {
        root.innerHTML =
            '<div class="lb-tabs" role="tablist" aria-label="Clasificación">' +
            TABS.map(t => '<button type="button" class="lb-tab" role="tab" data-by="' + t.by + '" aria-selected="false">' +
                '<i class="fas ' + t.icon + '"></i> ' + esc(t.label) + '</button>').join('') +
            '</div>' +
            '<div class="lb-board" id="lbBoard" role="tabpanel" aria-live="polite"></div>';
        root.querySelector('.lb-tabs').addEventListener('click', e => {
            const btn = e.target.closest('.lb-tab');
            if (btn && btn.dataset.by !== active) select(btn.dataset.by);
        });
        root.querySelector('.lb-tabs').addEventListener('keydown', e => {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            const i = TABS.findIndex(t => t.by === active);
            const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
            select(next.by);
            root.querySelector('.lb-tab[data-by="' + next.by + '"]').focus();
        });
    }

    function board() {
        return document.getElementById('lbBoard');
    }

    function message(html, cls) {
        board().innerHTML = '<div class="lb-message' + (cls ? ' ' + cls : '') + '">' + html + '</div>';
    }

    function paint(tab, rows) {
        if (!rows.length) {
            return message('<i class="fas fa-trophy"></i><p>Aún no hay jugadores en el ranking.<br>Inicia sesión con Steam, abre cajas y sé el primero.</p>');
        }
        board().innerHTML =
            '<div class="lb-head" aria-hidden="true"><span>#</span><span>Jugador</span><span>' + esc(tab.head) + '</span><span>Mejor drop</span></div>' +
            '<ol class="lb-list">' + rows.map(r => rowHtml(tab, r)).join('') + '</ol>';
    }

    async function fetchRows(by) {
        const hit = cache[by];
        if (hit && Date.now() - hit.at < CLIENT_CACHE_MS) return hit.rows;
        const resp = await fetch('/api/leaderboard?by=' + encodeURIComponent(by) + '&limit=50', { credentials: 'omit', headers: { Accept: 'application/json' } });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const json = await resp.json();
        const rows = Array.isArray(json.rows) ? json.rows : [];
        cache[by] = { at: Date.now(), rows };
        return rows;
    }

    async function select(by) {
        active = by;
        const tab = TABS.find(t => t.by === by);
        root.querySelectorAll('.lb-tab').forEach(b => {
            const on = b.dataset.by === by;
            b.classList.toggle('active', on);
            b.setAttribute('aria-selected', String(on));
            b.tabIndex = on ? 0 : -1;
        });
        const mine = ++seq;
        if (!cache[by]) message('<i class="fas fa-spinner fa-spin"></i><p>Cargando clasificación…</p>');
        try {
            const rows = await fetchRows(by);
            if (mine === seq) paint(tab, rows);
        } catch (e) {
            if (mine === seq) {
                message('<i class="fas fa-triangle-exclamation"></i><p>No se pudo cargar el ranking.</p>' +
                    '<button type="button" class="lb-retry">Reintentar</button>', 'is-error');
                const retry = board().querySelector('.lb-retry');
                if (retry) retry.addEventListener('click', () => select(by));
            }
        }
    }

    async function loadMe() {
        try {
            const resp = await fetch('/api/me', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
            const me = resp.ok ? await resp.json() : null;
            if (me && me.loggedIn && /^\d{17}$/.test(String(me.steamId))) myId = String(me.steamId);
        } catch (e) { /* guest */ }
    }

    shell();
    // Show the board right away; /api/me only decides which row gets highlighted
    select(active);
    loadMe().then(() => {
        if (myId && cache[active]) paint(TABS.find(t => t.by === active), cache[active].rows);
    });
})();
