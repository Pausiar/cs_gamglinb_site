// Case battles against other players ("Contra jugadores" tab of /batallas). Renders into #lobbiesRoot.
//
// Server side: lib/lobbies.js (money flow documented there). API:
//   GET  /api/lobbies           public list            GET /api/lobby?id=   detail (+ result once started)
//   POST /api/lobbies           create                 POST /api/lobbies/join {id, seat?}
//   POST /api/lobbies/bots {id} creator fills seats    POST /api/lobbies/cancel {id}
//
// Everybody watching a battle sees the same thing at the same time: the server stores the whole
// transcript and `startedAt`; the animation is a pure function of (server time - startedAt), so a
// late viewer jumps straight to the round that is being played. Server time = Date.now() + offset,
// where offset is refreshed from the `serverNow` of every response.
(function () {
    'use strict';

    const POLL_LIST_MS = 4000;
    const POLL_ROOM_MS = 2500;
    const POLL_ROOM_SLOW_MS = 5000;
    const SPIN_MS = 3400;
    const PAUSE_MS = 900;
    const ROUND_MS = SPIN_MS + PAUSE_MS;
    const REVEAL_AT = SPIN_MS + 60;
    const END_PAD_MS = 800;
    const REEL_LENGTH = 40;
    const MAX_ROUNDS = 10;
    const TAB_KEY = 'skinDropBattleTab';

    const MODES = {
        '1v1': { label: '1 vs 1', seats: 2, teams: [0, 1], icon: 'fa-user', desc: '2 jugadores' },
        '1v1v1': { label: '1 vs 1 vs 1', seats: 3, teams: [0, 1, 2], icon: 'fa-users', desc: '3 jugadores' },
        '2v2': { label: '2 vs 2', seats: 4, teams: [0, 0, 1, 1], icon: 'fa-people-group', desc: 'Equipos' },
        '1v1v1v1': { label: '1 vs 1 vs 1 vs 1', seats: 4, teams: [0, 1, 2, 3], icon: 'fa-user-group', desc: '4 jugadores' }
    };
    const TEAM_NAMES = ['Equipo Naranja', 'Equipo Azul'];
    const BOT_COLORS = ['#4cc9f0', '#b388ff', '#7fb069', '#e4572e', '#f7c94b', '#ff4d8d', '#3ddc97', '#5e98d9'];

    // ==================== STATE ====================
    const ui = {
        view: 'list',          // 'list' | 'create' | 'room'
        lobbies: [],
        loaded: false,
        error: null,
        listSig: '',
        selection: new Map(),  // caseId -> qty
        mode: '1v1',
        crazy: false,
        busy: false
    };
    let root = null;
    let tabsBound = false;
    let listTimer = null;
    let listBusy = false;
    let room = null;
    let tokenSeq = 0;

    // ==================== HELPERS ====================
    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function money(n) { return Math.round(n * 100) / 100; }
    function fmt(n) { return money(n).toFixed(2) + '€'; }
    function api() { return window.SkinDrop; }
    function sfx() { return window.SkinDropSfx || null; }
    function allCases() { return typeof cases !== 'undefined' ? cases : []; }
    function findCase(id) { return allCases().find(c => c.id === id); }
    function rarityOf(item) { return typeof getRarity === 'function' ? getRarity(item) : 'consumer'; }
    function safeUrl(u) { return typeof u === 'string' && /^https:\/\//i.test(u) ? u : ''; }

    function me() {
        const sd = api();
        return sd && sd.mode === 'server' && sd.steamId ? String(sd.steamId) : null;
    }

    function loginHref() {
        return '/auth/steam?next=/batallas';
    }

    function colorFor(name) {
        let h = 0;
        const s = String(name || '');
        for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
        return BOT_COLORS[h % BOT_COLORS.length];
    }

    function initials(name) {
        const parts = String(name || '?').replace(/[^A-Za-z0-9 _]/g, '').split(/[ _]+/).filter(Boolean);
        if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
        const caps = String(name || '').replace(/[^A-Z]/g, '');
        if (caps.length >= 2) return caps.slice(0, 2);
        return String(name || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || '?';
    }

    function avatarHtml(seat, cls) {
        const extra = cls ? ' ' + cls : '';
        if (seat.isBot) {
            return `<div class="battle-avatar${extra}" style="--avatar-color:${esc(colorFor(seat.name))}"><i class="fas fa-robot"></i></div>`;
        }
        const url = safeUrl(seat.avatar);
        if (url) {
            return `<img class="battle-avatar lb-avatar-img${extra}" src="${esc(url)}" alt="" loading="lazy" draggable="false" referrerpolicy="no-referrer">`;
        }
        return `<div class="battle-avatar${extra}" style="--avatar-color:${esc(colorFor(seat.name))}">${esc(initials(seat.name))}</div>`;
    }

    function itemImg(item, cls) {
        return `<img class="${cls}" src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy" draggable="false">`;
    }

    function toast(msg, type) {
        if (api() && api().showToast) api().showToast(msg, type || 'error');
    }

    function caseCounts(caseIds) {
        const counts = new Map();
        (caseIds || []).forEach(id => counts.set(id, (counts.get(id) || 0) + 1));
        return [...counts.entries()];
    }

    function caseThumbs(caseIds, limit) {
        const entries = caseCounts(caseIds);
        const shown = entries.slice(0, limit || 6).map(([id, qty]) => {
            const c = findCase(id);
            if (!c) return '';
            return `<span class="lb-case-thumb" title="${esc(c.name)} ×${qty}"><img src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy" draggable="false">${qty > 1 ? `<b>×${qty}</b>` : ''}</span>`;
        }).join('');
        const more = entries.length > (limit || 6) ? `<span class="lb-case-more">+${entries.length - (limit || 6)}</span>` : '';
        return shown + more;
    }

    function modeOf(l) { return MODES[l.mode] || MODES['1v1']; }
    function isTeamMode(l) { return l.mode === '2v2'; }

    function statusLabel(l) {
        if (l.status === 'open') return 'Abierta';
        if (l.status === 'running') return 'En curso';
        if (l.status === 'finished') return 'Finalizada';
        return 'Cancelada';
    }

    function seatAt(l, i) {
        return (l.seats || []).find(s => s.seat === i) || null;
    }

    function amSeated(l) {
        const id = me();
        return !!id && (l.seats || []).some(s => !s.isBot && s.steamId === id);
    }

    // ==================== API ====================
    function get(url) { return api().api.get(url); }
    function post(url, body) { return api().api.post(url, body); }

    function syncOffset(r, serverNow) {
        if (r && Number.isFinite(serverNow)) r.offset = serverNow - Date.now();
    }

    function serverNow(r) { return Date.now() + (r ? r.offset : 0); }

    // ==================== TABS ====================
    function botsBusy() {
        // the bots battle shows its "Saltar" button only while it is being played
        return !!document.querySelector('#battlesRoot [data-action="skip"]');
    }

    function readTab() {
        if (/^#(jugadores|players)$/.test(location.hash)) return 'players';
        if (/^#bots$/.test(location.hash)) return 'bots';
        try { return localStorage.getItem(TAB_KEY) === 'players' ? 'players' : 'bots'; } catch (e) { return 'bots'; }
    }

    function showTab(tab, remember) {
        const botsRoot = document.getElementById('battlesRoot');
        if (!botsRoot || !root) return;
        if (tab === 'players' && botsBusy()) {
            toast('Termina la batalla contra bots en curso antes de cambiar', 'error');
            return;
        }
        const players = tab === 'players';
        botsRoot.hidden = players;
        root.hidden = !players;
        document.querySelectorAll('[data-battles-tab]').forEach(btn => {
            const on = btn.dataset.battlesTab === tab;
            btn.classList.toggle('is-active', on);
            btn.setAttribute('aria-selected', String(on));
        });
        if (remember) {
            try { localStorage.setItem(TAB_KEY, tab); } catch (e) { /* storage unavailable */ }
            try { history.replaceState(null, '', location.pathname + location.search + (players ? '#jugadores' : '#bots')); } catch (e) { /* ignore */ }
        }
        if (players) activate(); else deactivate();
    }

    // ==================== LIST ====================
    function stopListPoll() {
        clearInterval(listTimer);
        listTimer = null;
    }

    async function loadList() {
        if (listBusy) return;
        listBusy = true;
        try {
            const out = await get('/api/lobbies');
            ui.lobbies = Array.isArray(out.lobbies) ? out.lobbies : [];
            ui.error = null;
            ui.loaded = true;
        } catch (e) {
            ui.error = e.message;
        } finally {
            listBusy = false;
        }
        if (ui.view === 'list' && !root.hidden) renderList();
    }

    function pollList() {
        stopListPoll();
        loadList();
        listTimer = setInterval(() => { if (!document.hidden) loadList(); }, POLL_LIST_MS);
    }

    function seatDots(l) {
        const slots = modeOf(l).seats;
        const out = [];
        for (let i = 0; i < slots; i++) {
            const s = seatAt(l, i);
            out.push(s
                ? `<span class="lb-dot${s.steamId && s.steamId === me() ? ' is-me' : ''}" title="${esc(s.name)}">${avatarHtml(s, 'lb-dot-avatar')}</span>`
                : '<span class="lb-dot lb-dot--empty" title="Plaza libre"><i class="fas fa-plus"></i></span>');
        }
        return out.join('');
    }

    function cardHtml(l) {
        const mode = modeOf(l);
        const taken = (l.seats || []).length;
        const mine = amSeated(l);
        const full = taken >= mode.seats;
        let action;
        if (l.status === 'open' && !mine && !full) {
            action = `<button type="button" class="battle-start-btn lb-join-btn" data-lb="quick-join" data-id="${esc(l.id)}"><i class="fas fa-right-to-bracket"></i> Unirse · ${fmt(l.cost)}</button>`;
        } else if (l.status === 'open') {
            action = `<button type="button" class="battle-secondary-btn lb-join-btn" data-lb="open" data-id="${esc(l.id)}"><i class="fas fa-door-open"></i> ${mine ? 'Entrar' : 'Ver'}</button>`;
        } else {
            action = `<button type="button" class="battle-secondary-btn lb-join-btn" data-lb="open" data-id="${esc(l.id)}"><i class="fas fa-eye"></i> ${l.status === 'running' ? 'Ver en directo' : 'Ver resultado'}</button>`;
        }
        const winners = l.status === 'finished' && Array.isArray(l.winners) && l.winners.length
            ? `<span class="lb-card-winner"><i class="fas fa-trophy"></i> ${esc(l.winners.join(' + '))} · ${fmt(l.pot || 0)}</span>` : '';
        const rounds = (l.caseIds || []).length;
        return `
            <article class="lb-card is-${esc(l.status)}${mine ? ' is-mine' : ''}" data-lb="open-card" data-id="${esc(l.id)}">
                <div class="lb-card-main">
                    <div class="lb-card-badges">
                        <span class="battle-badge"><i class="fas ${mode.icon}"></i> ${esc(mode.label)}</span>
                        ${l.crazy ? '<span class="battle-badge battle-badge--crazy"><i class="fas fa-shuffle"></i> Crazy</span>' : ''}
                        <span class="lb-status lb-status--${esc(l.status)}">${statusLabel(l)}</span>
                    </div>
                    <div class="lb-card-cases" aria-label="${rounds} ronda${rounds === 1 ? '' : 's'}">${caseThumbs(l.caseIds, 6)}</div>
                    ${winners}
                </div>
                <div class="lb-card-seats" aria-label="${taken} de ${mode.seats} jugadores">${seatDots(l)}</div>
                <div class="lb-card-side">
                    <div class="lb-card-cost"><span>Entrada</span><b>${fmt(l.cost)}</b></div>
                    ${action}
                </div>
            </article>`;
    }

    function renderList() {
        const sig = JSON.stringify([ui.lobbies, ui.error, ui.loaded, me()]);
        if (sig === ui.listSig && root.querySelector('.lb-toolbar')) return;
        ui.listSig = sig;
        const logged = !!me();
        let body;
        if (!ui.loaded && !ui.error) {
            body = '<p class="battle-empty"><i class="fas fa-spinner fa-spin"></i> Cargando batallas…</p>';
        } else if (ui.error && !ui.lobbies.length) {
            body = `<p class="battle-empty">No se pudieron cargar las batallas: ${esc(ui.error)}</p>`;
        } else if (!ui.lobbies.length) {
            body = '<div class="lb-empty"><i class="fas fa-ghost"></i><p>No hay batallas abiertas ahora mismo.</p><p class="lb-muted">Crea la primera y espera a que alguien se una.</p></div>';
        } else {
            body = `<div class="lb-list">${ui.lobbies.map(cardHtml).join('')}</div>`;
        }
        root.innerHTML = `
            <div class="battle-panel lb-toolbar">
                <div class="lb-toolbar-text">
                    <h3><i class="fas fa-users"></i> Batallas contra jugadores</h3>
                    <p class="battle-hint">Cada jugador paga su plaza. Gana el mejor total (el más bajo en Crazy) y se lleva los objetos; todos ven la misma apertura a la vez.</p>
                    ${logged ? '' : `<p class="lb-login-note"><i class="fas fa-lock"></i> Inicia sesión con Steam para jugar contra otros. <a href="${esc(loginHref())}">Iniciar sesión</a></p>`}
                </div>
                <button type="button" class="battle-start-btn lb-new-btn" data-lb="new" ${logged ? '' : 'disabled'}>
                    <i class="fas fa-plus"></i> Crear batalla
                </button>
            </div>
            <div class="battle-panel lb-lobbies">
                <div class="battle-panel-head"><h3><i class="fas fa-list"></i> Batallas</h3><span class="battle-rounds-count"><i class="fas fa-rotate"></i> En vivo</span></div>
                ${body}
            </div>`;
    }

    function showList() {
        scrollToSection();
        leaveRoom();
        ui.view = 'list';
        ui.listSig = '';
        renderList();
        pollList();
    }

    // ==================== CREATE ====================
    function selectionCount() {
        let n = 0;
        ui.selection.forEach(q => { n += q; });
        return n;
    }

    function selectionCost() {
        let total = 0;
        ui.selection.forEach((qty, id) => {
            const c = findCase(id);
            if (c) total += c.price * qty;
        });
        return money(total);
    }

    function roundList() {
        const list = [];
        ui.selection.forEach((qty, id) => { for (let i = 0; i < qty; i++) list.push(id); });
        return list;
    }

    function showCreate() {
        if (!me()) { toast('Inicia sesión con Steam para jugar contra otros', 'error'); return; }
        scrollToSection();
        leaveRoom();
        stopListPoll();
        ui.view = 'create';
        renderCreate();
    }

    function renderCreate() {
        const caseCards = allCases().map(c => {
            const qty = ui.selection.get(c.id) || 0;
            const color = (c.theme && c.theme.primary) || 'var(--accent-primary)';
            return `
                <div class="battle-case-card${qty ? ' is-selected' : ''}" data-case-id="${c.id}" style="--case-color:${esc(color)}">
                    <button type="button" class="battle-case-add" data-lb="inc" data-case-id="${c.id}" aria-label="Añadir ${esc(c.name)}">
                        <img src="${esc(c.image)}" alt="${esc(c.name)}" draggable="false">
                        <span class="battle-case-name">${esc(c.name)}</span>
                        <span class="battle-case-price">${fmt(c.price)}</span>
                    </button>
                    <div class="battle-qty">
                        <button type="button" data-lb="dec" data-case-id="${c.id}" aria-label="Quitar una" ${qty ? '' : 'disabled'}><i class="fas fa-minus"></i></button>
                        <span class="battle-qty-value">${qty}</span>
                        <button type="button" data-lb="inc" data-case-id="${c.id}" aria-label="Añadir una"><i class="fas fa-plus"></i></button>
                    </div>
                </div>`;
        }).join('');

        const modeButtons = Object.entries(MODES).map(([key, m]) => `
            <button type="button" class="battle-mode-btn${ui.mode === key ? ' is-active' : ''}" data-lb="mode" data-mode="${key}">
                <i class="fas ${m.icon}"></i>
                <span class="battle-mode-label">${m.label}</span>
                <span class="battle-mode-desc">${m.desc}</span>
            </button>`).join('');

        root.innerHTML = `
            <div class="lb-backbar">
                <button type="button" class="battle-link-btn lb-back" data-lb="list"><i class="fas fa-arrow-left"></i> Volver a la lista</button>
            </div>
            <div class="battle-creator">
                <div class="battle-panel battle-picker">
                    <div class="battle-panel-head">
                        <h3><i class="fas fa-box-open"></i> Elige las cajas</h3>
                        <span class="battle-rounds-count" id="lbRoundsCount"></span>
                    </div>
                    <p class="battle-hint">Cada caja es una ronda. Todos abren la misma caja a la vez (máx. ${MAX_ROUNDS} rondas).</p>
                    <div class="battle-case-grid">${caseCards}</div>
                </div>
                <aside class="battle-panel battle-setup">
                    <div class="battle-panel-head"><h3><i class="fas fa-sliders"></i> Configuración</h3></div>
                    <div class="battle-mode-grid">${modeButtons}</div>
                    <label class="battle-toggle">
                        <input type="checkbox" data-lb="crazy" ${ui.crazy ? 'checked' : ''}>
                        <span class="battle-toggle-slider"></span>
                        <span class="battle-toggle-text"><strong><i class="fas fa-shuffle"></i> Modo Crazy</strong> Gana el total más bajo</span>
                    </label>
                    <div class="battle-summary" id="lbSummary"></div>
                </aside>
            </div>`;
        renderCreateSummary();
    }

    function renderCreateSummary() {
        const summary = root && root.querySelector('#lbSummary');
        if (!summary) return;
        const count = selectionCount();
        const cost = selectionCost();
        const mode = MODES[ui.mode];
        const balance = api() ? api().state.balance : 0;

        const counter = root.querySelector('#lbRoundsCount');
        if (counter) counter.textContent = `${count}/${MAX_ROUNDS} rondas`;

        const chips = [];
        ui.selection.forEach((qty, id) => {
            const c = findCase(id);
            if (!c) return;
            chips.push(`<div class="battle-chip" title="${esc(c.name)}"><img src="${esc(c.image)}" alt=""><span>${esc(c.name)}</span><b>×${qty}</b></div>`);
        });

        let disabledReason = '';
        if (!me()) disabledReason = 'Inicia sesión para crear';
        else if (!count) disabledReason = 'Añade al menos una caja';
        else if (balance < cost) disabledReason = 'Saldo insuficiente';
        else if (ui.busy) disabledReason = 'Creando…';

        const note = ui.mode === '2v2'
            ? 'En 2v2 cada jugador del equipo ganador se queda con lo que abrió su plaza y os repartís los objetos del equipo rival por valor.'
            : 'Quien gane se lleva todos los objetos abiertos. Si cancelas antes de que empiece, se devuelve la entrada a todos.';

        summary.innerHTML = `
            <div class="battle-chips">${chips.length ? chips.join('') : '<p class="battle-empty">No has elegido ninguna caja</p>'}</div>
            ${count ? '<button type="button" class="battle-link-btn" data-lb="clear"><i class="fas fa-trash"></i> Vaciar</button>' : ''}
            <p class="battle-note"><i class="fas fa-circle-info"></i> ${note}</p>
            <div class="battle-cost-rows">
                <div class="battle-cost-row"><span>Rondas</span><b>${count}</b></div>
                <div class="battle-cost-row"><span>Jugadores</span><b>${mode.seats}</b></div>
                <div class="battle-cost-row"><span>Valor en juego</span><b>${fmt(cost * mode.seats)}</b></div>
                <div class="battle-cost-row battle-cost-total"><span>Tu entrada</span><b>${fmt(cost)}</b></div>
            </div>
            <button type="button" class="battle-start-btn" data-lb="create" ${disabledReason ? 'disabled' : ''}>
                <i class="fas fa-crosshairs"></i> ${disabledReason ? esc(disabledReason) : 'Crear batalla · ' + fmt(cost)}
            </button>`;
    }

    function changeQty(caseId, delta) {
        const current = ui.selection.get(caseId) || 0;
        if (delta > 0 && selectionCount() >= MAX_ROUNDS) {
            toast(`Máximo ${MAX_ROUNDS} rondas por batalla`, 'error');
            return;
        }
        const next = Math.max(0, current + delta);
        if (next === 0) ui.selection.delete(caseId); else ui.selection.set(caseId, next);
        const card = root.querySelector(`.battle-case-card[data-case-id="${caseId}"]`);
        if (card) {
            card.classList.toggle('is-selected', next > 0);
            card.querySelector('.battle-qty-value').textContent = next;
            card.querySelector('[data-lb="dec"]').disabled = next === 0;
        }
        renderCreateSummary();
    }

    async function createLobby() {
        if (ui.busy) return;
        ui.busy = true;
        renderCreateSummary();
        try {
            const out = await post('/api/lobbies', { caseIds: roundList(), mode: ui.mode, crazy: ui.crazy });
            api().applyServerState(out.state);
            toast('Batalla creada: esperando jugadores', 'success');
            enterRoom(out.lobby.id, out.lobby, out.serverNow);
        } catch (e) {
            toast(e.message, 'error');
        } finally {
            ui.busy = false;
            if (ui.view === 'create') renderCreateSummary();
        }
    }

    // ==================== JOIN / BOTS / CANCEL ====================
    async function joinLobby(id, seat) {
        if (!me()) { toast('Inicia sesión con Steam para jugar contra otros', 'error'); return; }
        if (ui.busy) return;
        ui.busy = true;
        markBusy(true);
        try {
            const body = { id };
            if (Number.isInteger(seat)) body.seat = seat;
            const out = await post('/api/lobbies/join', body);
            api().applyServerState(out.state);
            if (room && room.id === id) applyLobby(out.lobby, out.serverNow);
            else enterRoom(id, out.lobby, out.serverNow);
        } catch (e) {
            toast(e.message, 'error');
            if (room && room.id === id) pollRoom(true);
            else if (ui.view === 'list') loadList();
        } finally {
            ui.busy = false;
            markBusy(false);
        }
    }

    function markBusy(on) {
        if (!root) return;
        root.querySelectorAll('[data-lb="quick-join"], [data-lb="join-seat"], [data-lb="bots"], [data-lb="cancel"]').forEach(b => { b.disabled = on; });
    }

    async function fillBots() {
        if (!room || ui.busy) return;
        const id = room.id;
        ui.busy = true;
        markBusy(true);
        try {
            const out = await post('/api/lobbies/bots', { id });
            if (room && room.id === id) applyLobby(out.lobby, out.serverNow);
        } catch (e) {
            toast(e.message, 'error');
            pollRoom(true);
        } finally {
            ui.busy = false;
            markBusy(false);
        }
    }

    async function cancelLobby() {
        if (!room || ui.busy) return;
        const id = room.id;
        ui.busy = true;
        markBusy(true);
        try {
            const out = await post('/api/lobbies/cancel', { id });
            toast('Batalla cancelada: se ha devuelto la entrada', 'success');
            api().refreshState().catch(() => {});
            if (room && room.id === id) applyLobby(out.lobby, out.serverNow);
        } catch (e) {
            toast(e.message, 'error');
            pollRoom(true);
        } finally {
            ui.busy = false;
            markBusy(false);
        }
    }

    // ==================== ROOM ====================
    // Bring the top of the section into view after changing screens (the new one is usually shorter)
    function scrollToSection() {
        const section = document.getElementById('battles');
        if (section && section.getBoundingClientRect().top < -40) section.scrollIntoView({ behavior: 'smooth' });
    }

    function enterRoom(id, lobby, serverNowMs) {
        scrollToSection();
        leaveRoom();
        stopListPoll();
        room = {
            id, lobby: null, offset: 0, token: ++tokenSeq, pollTimer: null, stepTimer: null,
            arena: null, sig: '', wasSeated: false, refreshed: false, loadError: null, inflight: false
        };
        ui.view = 'room';
        syncOffset(room, serverNowMs);
        if (lobby) applyLobby(lobby, serverNowMs); else renderRoom();
        pollRoom(!lobby);
    }

    function leaveRoom() {
        if (!room) return;
        clearTimeout(room.pollTimer);
        clearTimeout(room.stepTimer);
        const a = room.arena;
        if (a && a.stopTicks) a.stopTicks();
        room.token = -1;
        room = null;
    }

    // now = true: fetch immediately; otherwise after the usual delay. One request in flight at a time.
    function pollRoom(now) {
        const r = room;
        if (!r) return;
        clearTimeout(r.pollTimer);
        if (r.inflight) return;   // the running request reschedules itself
        const run = async () => {
            if (room !== r) return;
            if (document.hidden && !now) { pollRoom(false); return; }
            r.inflight = true;
            try {
                const out = await get('/api/lobby?id=' + encodeURIComponent(r.id));
                if (room !== r) return;
                r.loadError = null;
                applyLobby(out.lobby, out.serverNow);
            } catch (e) {
                if (room !== r) return;
                r.loadError = e;
                if (e.status === 404) { renderRoom(); return; }
            } finally {
                r.inflight = false;
            }
            if (room !== r) return;
            const l = r.lobby;
            if (l && (l.status === 'finished' || l.status === 'cancelled')) { maybeRefreshBalance(); return; }
            pollRoom(false);
        };
        if (now) run();
        else r.pollTimer = setTimeout(run, r.lobby && r.lobby.result ? POLL_ROOM_SLOW_MS : POLL_ROOM_MS);
    }

    function lobbySig(l) {
        return JSON.stringify([l.status, l.cancelling, l.seats.map(s => [s.seat, s.steamId, s.name, s.paid, s.isBot]), !!l.result, me()]);
    }

    function applyLobby(l, serverNowMs) {
        const r = room;
        if (!r || !l) return;
        syncOffset(r, serverNowMs);
        r.lobby = l;
        if (amSeated(l)) r.wasSeated = true;
        const sig = lobbySig(l);
        if (l.result && (l.status === 'running' || l.status === 'finished')) {
            if (!r.arena) startArena();
            else {
                r.arena.lobby = l;
                if (l.status === 'finished') maybeRefreshBalance();
            }
            r.sig = sig;
            return;
        }
        if (sig === r.sig) return;
        r.sig = sig;
        renderRoom();
        if ((l.status === 'cancelled' || l.cancelling) && r.wasSeated) maybeRefreshBalance();
    }

    // Header balance catches up once the battle is over (not before: it would spoil the result)
    function maybeRefreshBalance() {
        const r = room;
        if (!r || r.refreshed || !r.wasSeated) return;
        const l = r.lobby;
        const over = l && (l.status === 'cancelled' || (l.status === 'finished' && r.arena && r.arena.finished));
        if (!over) return;
        r.refreshed = true;
        if (api() && api().refreshState) api().refreshState().catch(() => {});
    }

    function renderRoom() {
        const r = room;
        if (!r) return;
        const l = r.lobby;
        if (!l) {
            if (r.loadError && r.loadError.status === 404) {
                root.innerHTML = `
                    <div class="lb-backbar"><button type="button" class="battle-link-btn lb-back" data-lb="list"><i class="fas fa-arrow-left"></i> Volver a la lista</button></div>
                    <div class="battle-panel"><p class="battle-empty">Esta batalla no existe.</p></div>`;
            } else {
                root.innerHTML = '<div class="battle-panel"><p class="battle-empty"><i class="fas fa-spinner fa-spin"></i> Cargando batalla…</p></div>';
            }
            return;
        }
        if (l.status === 'cancelled' || l.cancelling) { renderCancelled(l); return; }
        renderWaiting(l);
    }

    function badgesHtml(l) {
        const mode = modeOf(l);
        return `
            <span class="battle-badge"><i class="fas ${mode.icon}"></i> ${esc(mode.label)}</span>
            ${l.crazy ? '<span class="battle-badge battle-badge--crazy"><i class="fas fa-shuffle"></i> Crazy</span>' : ''}`;
    }

    function renderCancelled(l) {
        root.innerHTML = `
            <div class="lb-backbar"><button type="button" class="battle-link-btn lb-back" data-lb="list"><i class="fas fa-arrow-left"></i> Volver a la lista</button></div>
            <div class="battle-panel lb-room-head">
                <div class="lb-room-badges">${badgesHtml(l)}<span class="lb-status lb-status--cancelled">Cancelada</span></div>
                <p class="battle-empty"><i class="fas fa-ban"></i> Esta batalla se ha cancelado. Las entradas se devuelven a los jugadores.</p>
                <div class="battle-result-actions"><button type="button" class="battle-start-btn" data-lb="list"><i class="fas fa-list"></i> Volver a la lista</button></div>
            </div>`;
    }

    function renderWaiting(l) {
        const mode = modeOf(l);
        const teams = isTeamMode(l);
        const myId = me();
        const mineSeated = amSeated(l);
        const isCreator = !!myId && l.createdBy === myId;
        const taken = (l.seats || []).length;
        const free = mode.seats - taken;

        const seatCards = [];
        for (let i = 0; i < mode.seats; i++) {
            const s = seatAt(l, i);
            const teamCls = teams ? ' battle-team-' + mode.teams[i] : '';
            const teamTag = teams ? ' · ' + (mode.teams[i] === 0 ? 'Naranja' : 'Azul') : '';
            if (s) {
                const mine = !s.isBot && s.steamId === myId;
                seatCards.push(`
                    <div class="battle-seat lb-seat${mine ? ' is-user' : ''}${teamCls}" data-seat="${i}">
                        <div class="battle-seat-head">
                            ${avatarHtml(s)}
                            <div class="battle-seat-id">
                                <span class="battle-seat-name">${esc(s.name)}</span>
                                <span class="battle-seat-tag">${s.isBot ? '<i class="fas fa-robot"></i> Bot' : (mine ? '<i class="fas fa-star"></i> Tú' : '<i class="fas fa-user"></i> Jugador')}${teamTag}</span>
                            </div>
                        </div>
                        <div class="lb-seat-status ${s.paid ? 'is-ready' : 'is-wait'}">
                            <i class="fas ${s.paid ? 'fa-circle-check' : 'fa-hourglass-half'}"></i> ${s.paid ? 'Listo' : 'Pagando…'}
                        </div>
                    </div>`);
            } else {
                let btn = '';
                if (l.status === 'open' && !mineSeated && myId) {
                    btn = `<button type="button" class="battle-start-btn lb-seat-join" data-lb="join-seat" data-seat="${i}"><i class="fas fa-right-to-bracket"></i> Unirse · ${fmt(l.cost)}</button>`;
                } else if (!myId) {
                    btn = `<a class="battle-secondary-btn lb-seat-join" href="${esc(loginHref())}"><i class="fa-brands fa-steam"></i> Inicia sesión</a>`;
                }
                seatCards.push(`
                    <div class="battle-seat lb-seat lb-seat--empty${teamCls}" data-seat="${i}">
                        <div class="lb-slot-big"><i class="fas fa-user-plus"></i></div>
                        <span class="lb-seat-wait">Esperando jugador…${teamTag ? '<small>' + teamTag.slice(3) + '</small>' : ''}</span>
                        ${btn}
                    </div>`);
            }
        }

        let controls = '';
        if (isCreator && l.status === 'open') {
            controls = `
                <div class="lb-room-actions">
                    ${free > 0 ? '<button type="button" class="battle-secondary-btn" data-lb="bots"><i class="fas fa-robot"></i> Llenar con bots</button>' : ''}
                    <button type="button" class="battle-secondary-btn lb-danger" data-lb="cancel"><i class="fas fa-ban"></i> Cancelar batalla</button>
                </div>
                <p class="battle-note"><i class="fas fa-circle-info"></i> Los bots no pagan: si gana un bot, nadie se lleva los objetos; si ganas tú, también son tuyos los suyos. Si cancelas, se devuelve la entrada.</p>`;
        } else if (mineSeated) {
            controls = '<p class="battle-note"><i class="fas fa-circle-info"></i> Ya tienes tu plaza. La batalla empieza en cuanto se llenen todas las plazas.</p>';
        } else if (!myId) {
            controls = `<p class="lb-login-note"><i class="fas fa-lock"></i> Inicia sesión con Steam para unirte. <a href="${esc(loginHref())}">Iniciar sesión</a></p>`;
        }

        root.innerHTML = `
            <div class="lb-backbar"><button type="button" class="battle-link-btn lb-back" data-lb="list"><i class="fas fa-arrow-left"></i> Volver a la lista</button></div>
            <div class="battle-panel lb-room-head">
                <div class="lb-room-badges">${badgesHtml(l)}<span class="lb-status lb-status--${esc(l.status)}">${statusLabel(l)}</span>
                    <span class="lb-room-count"><i class="fas fa-users"></i> ${taken}/${mode.seats}</span></div>
                <div class="lb-room-cases">${caseThumbs(l.caseIds, 10)}</div>
                <div class="lb-room-cost"><span>Entrada por plaza</span><b>${fmt(l.cost)}</b></div>
            </div>
            <div class="battle-seats battle-seats--${mode.seats}${teams ? ' battle-seats--teams' : ''} lb-waiting-seats">${seatCards.join('')}</div>
            <div class="battle-panel lb-room-foot">${controls}</div>`;
    }

    // ==================== ARENA (synchronised animation) ====================
    function startArena() {
        const r = room;
        const l = r.lobby;
        const res = l.result;
        const rolls = res.rounds.map(row => row.map(item => api().hydrate(item)));
        const cases = res.caseIds.map(findCase);
        if (cases.some(c => !c)) { toast('Hay cajas que esta versión no conoce', 'error'); return; }
        const a = {
            lobby: l,
            res,
            rolls,
            cases,
            seats: res.seats,
            teamsMode: isTeamMode(l),
            startAt: (l.startedAt || serverNow(r)) + (l.countdownMs || 3500),
            revealed: 0,
            spinning: -1,
            finished: false,
            silent: false,
            stopTicks: null
        };
        a.endT = (rolls.length - 1) * ROUND_MS + REVEAL_AT + END_PAD_MS;
        r.arena = a;
        ui.view = 'room';
        renderArena(a);
        step();
    }

    function renderArena(a) {
        const l = a.lobby;
        const res = a.res;
        const mode = modeOf(l);
        const myId = me();
        const roundThumbs = a.cases.map((c, i) => `
            <div class="battle-round-thumb" data-round="${i}" title="Ronda ${i + 1}: ${esc(c.name)}"><img src="${esc(c.image)}" alt=""></div>`).join('');

        const seats = a.seats.map((seat, i) => {
            const mine = !seat.isBot && seat.steamId && seat.steamId === myId;
            return `
            <div class="battle-seat${mine ? ' is-user' : ''}${a.teamsMode ? ' battle-team-' + seat.team : ''}" data-seat="${i}">
                <div class="battle-seat-head">
                    ${avatarHtml(seat)}
                    <div class="battle-seat-id">
                        <span class="battle-seat-name">${esc(seat.name)}</span>
                        <span class="battle-seat-tag">${seat.isBot ? '<i class="fas fa-robot"></i> Bot' : (mine ? '<i class="fas fa-star"></i> Tú' : '<i class="fas fa-user"></i> Jugador')}${a.teamsMode ? ' · ' + (seat.team === 0 ? 'Naranja' : 'Azul') : ''}</span>
                    </div>
                    <span class="battle-seat-total" data-total="${i}">0.00€</span>
                </div>
                <div class="battle-reel"><div class="battle-reel-track"></div><div class="battle-reel-marker"></div></div>
                <div class="battle-seat-drops" data-drops="${i}"></div>
            </div>`;
        }).join('');

        const scoreboard = a.teamsMode ? `
            <div class="battle-scoreboard">
                <div class="battle-score battle-team-0"><span>${TEAM_NAMES[0]}</span><b data-team-total="0">0.00€</b></div>
                <span class="battle-vs">VS</span>
                <div class="battle-score battle-team-1"><span>${TEAM_NAMES[1]}</span><b data-team-total="1">0.00€</b></div>
            </div>` : '';

        root.innerHTML = `
            <div class="lb-backbar"><button type="button" class="battle-link-btn lb-back" data-lb="list"><i class="fas fa-arrow-left"></i> Volver a la lista</button></div>
            <div class="battle-arena${res.crazy ? ' is-crazy' : ''}">
                <div class="battle-arena-bar">
                    <div class="battle-arena-info">
                        ${badgesHtml(l)}
                        <span class="battle-round-label">Ronda <b id="lbRoundNum">1</b>/${a.cases.length}</span>
                        <span class="battle-case-label" id="lbCaseLabel">${esc(a.cases[0].name)}</span>
                    </div>
                    <div class="battle-arena-controls" id="lbControls">
                        <button type="button" class="battle-ctrl-btn" data-lb="skip"><i class="fas fa-forward-fast"></i> Saltar</button>
                    </div>
                </div>
                <div class="lb-countdown" id="lbCountdown" role="timer" aria-live="polite"></div>
                <div class="battle-round-track">${roundThumbs}</div>
                <div class="battle-result" id="lbResult" hidden></div>
                ${scoreboard}
                <div class="battle-seats battle-seats--${mode.seats}${a.teamsMode ? ' battle-seats--teams' : ''}">${seats}</div>
            </div>`;
    }

    function seatEl(i) {
        return root.querySelector(`.battle-seat[data-seat="${i}"]`);
    }

    function reelItemHtml(item, extra) {
        return `<div class="battle-reel-item ${rarityOf(item)}${extra || ''}">${itemImg(item, 'battle-reel-img')}</div>`;
    }

    function updateRoundHeader(a, rIdx) {
        const num = root.querySelector('#lbRoundNum');
        if (num) num.textContent = Math.min(rIdx + 1, a.cases.length);
        const label = root.querySelector('#lbCaseLabel');
        if (label && a.cases[rIdx]) label.textContent = a.cases[rIdx].name;
        root.querySelectorAll('.battle-round-thumb').forEach(el => {
            const i = Number(el.dataset.round);
            el.classList.toggle('is-current', i === rIdx && !a.finished);
            el.classList.toggle('is-done', i < a.revealed);
        });
    }

    function spinRound(a, rIdx, duration) {
        a.spinning = rIdx;
        updateRoundHeader(a, rIdx);
        const c = a.cases[rIdx];
        a.seats.forEach((seat, i) => {
            const el = seatEl(i);
            if (!el) return;
            const track = el.querySelector('.battle-reel-track');
            const reel = el.querySelector('.battle-reel');
            const winIndex = REEL_LENGTH - 6 - Math.floor(Math.random() * 3);
            const html = [];
            for (let k = 0; k < REEL_LENGTH; k++) {
                const item = k === winIndex ? a.rolls[rIdx][i] : c.items[Math.floor(Math.random() * c.items.length)];
                html.push(reelItemHtml(item, k === winIndex ? ' is-target' : ''));
            }
            track.innerHTML = html.join('');
            track.style.transition = 'none';
            track.style.transform = 'translateY(0)';
            void track.offsetHeight;
            const target = track.children[winIndex];
            const itemH = target.offsetHeight;
            const jitter = (Math.random() - 0.5) * itemH * 0.5;
            const offset = target.offsetTop + itemH / 2 - reel.clientHeight / 2 + jitter;
            track.style.transition = `transform ${duration}ms cubic-bezier(0.12, 0.8, 0.18, 1)`;
            track.style.transform = `translateY(${-offset}px)`;
            el.classList.add('is-spinning');
            if (i === 0 && sfx()) {
                if (a.stopTicks) a.stopTicks();
                a.stopTicks = sfx().watchTranslate(track, { axis: 'y', step: itemH, offset: reel.clientHeight / 2, maxMs: duration + 500 });
            }
        });
    }

    function snapSeat(a, i, rIdx) {
        const el = seatEl(i);
        if (!el) return;
        const c = a.cases[rIdx];
        const rand = () => c.items[Math.floor(Math.random() * c.items.length)];
        const track = el.querySelector('.battle-reel-track');
        const reel = el.querySelector('.battle-reel');
        track.style.transition = 'none';
        track.innerHTML = reelItemHtml(rand()) + reelItemHtml(rand()) + reelItemHtml(a.rolls[rIdx][i], ' is-target is-hit') + reelItemHtml(rand()) + reelItemHtml(rand());
        const target = track.children[2];
        track.style.transform = `translateY(${-(target.offsetTop + target.offsetHeight / 2 - reel.clientHeight / 2)}px)`;
        el.classList.remove('is-spinning');
    }

    function seatTotals(a, upTo) {
        return a.seats.map((seat, i) => {
            let sum = 0;
            for (let k = 0; k < upTo; k++) sum += a.rolls[k][i].price;
            return money(sum);
        });
    }

    function teamTotals(a, totals) {
        const count = Math.max.apply(null, a.seats.map(s => s.team)) + 1;
        const out = new Array(count).fill(0);
        totals.forEach((t, i) => { out[a.seats[i].team] += t; });
        return out.map(money);
    }

    function updateTotalsUI(a) {
        const totals = seatTotals(a, a.revealed);
        totals.forEach((t, i) => {
            const el = root.querySelector(`[data-total="${i}"]`);
            if (el) el.textContent = fmt(t);
        });
        const teams = teamTotals(a, totals);
        teams.forEach((t, i) => {
            const el = root.querySelector(`[data-team-total="${i}"]`);
            if (el) el.textContent = fmt(t);
        });
        const best = a.res.crazy ? Math.min.apply(null, teams) : Math.max.apply(null, teams);
        const leaders = [];
        teams.forEach((t, i) => { if (Math.abs(t - best) < 0.005) leaders.push(i); });
        root.querySelectorAll('.battle-seat').forEach((el, i) => {
            el.classList.toggle('is-leading', a.revealed > 0 && leaders.length === 1 && leaders[0] === a.seats[i].team);
        });
    }

    // Shows round rIdx in the drops lists / totals. `animated` rounds snap their reel onto the drop.
    function revealRound(a, rIdx, animated) {
        if (rIdx !== a.revealed) return;
        a.revealed = rIdx + 1;
        if (a.spinning === rIdx) { a.spinning = -1; if (a.stopTicks) { a.stopTicks(); a.stopTicks = null; } }
        a.seats.forEach((seat, i) => {
            const el = seatEl(i);
            if (!el) return;
            const item = a.rolls[rIdx][i];
            el.classList.remove('is-spinning');
            if (animated) {
                const track = el.querySelector('.battle-reel-track');
                const reel = el.querySelector('.battle-reel');
                const target = track.querySelector('.is-target');
                if (target) {
                    track.style.transition = 'transform 180ms ease-out';
                    track.style.transform = `translateY(${-(target.offsetTop + target.offsetHeight / 2 - reel.clientHeight / 2)}px)`;
                    target.classList.add('is-hit');
                }
            }
            el.querySelector('.battle-seat-drops').insertAdjacentHTML('afterbegin', `
                <div class="battle-drop ${rarityOf(item)}" title="${esc(item.name)} · ${fmt(item.price)}">
                    ${itemImg(item, 'battle-drop-img')}
                    <span class="battle-drop-name">${esc(item.name)}</span>
                    <span class="battle-drop-price">${fmt(item.price)}</span>
                </div>`);
        });
        updateTotalsUI(a);
        updateRoundHeader(a, Math.min(a.revealed, a.cases.length - 1));
        if (animated && !a.silent && sfx()) sfx().reveal();
    }

    function setCountdown(text) {
        const el = root.querySelector('#lbCountdown');
        if (!el) return;
        el.hidden = !text;
        el.textContent = text || '';
    }

    // One tick of the timeline: everything is derived from (server time - startAt)
    function step() {
        const r = room;
        if (!r || !r.arena || r.arena.finished) return;
        const a = r.arena;
        clearTimeout(r.stepTimer);
        const n = a.rolls.length;
        const t = serverNow(r) - a.startAt;

        if (t < 0) {
            setCountdown(`La batalla empieza en ${Math.ceil(-t / 1000)}…`);
            r.stepTimer = setTimeout(step, Math.min(250, -t));
            return;
        }
        setCountdown('');
        if (t >= a.endT) { finishArena(a); return; }

        const cur = Math.min(n - 1, Math.floor(t / ROUND_MS));
        // rounds that already ended while we were away: reveal them without animation
        const catchUp = a.revealed < cur;
        while (a.revealed < cur) revealRound(a, a.revealed, false);
        if (catchUp) {
            for (let i = 0; i < a.seats.length; i++) snapSeat(a, i, cur - 1);
        }
        const phase = t - cur * ROUND_MS;
        let next;
        if (a.revealed === cur) {
            if (phase < REVEAL_AT) {
                if (a.spinning !== cur) spinRound(a, cur, Math.max(700, SPIN_MS - phase));
                next = REVEAL_AT - phase;
            } else {
                revealRound(a, cur, a.spinning === cur);
                if (a.spinning !== cur && a.revealed === cur + 1) for (let i = 0; i < a.seats.length; i++) snapSeat(a, i, cur);
                next = cur === n - 1 ? a.endT - t : ROUND_MS - phase;
            }
        } else {
            next = cur === n - 1 ? a.endT - t : ROUND_MS - phase;
        }
        r.stepTimer = setTimeout(step, Math.max(30, Math.min(next, 1000)));
    }

    function skipArena() {
        const r = room;
        if (!r || !r.arena || r.arena.finished) return;
        r.arena.silent = true;
        finishArena(r.arena);
    }

    function finishArena(a) {
        const r = room;
        if (!r || r.arena !== a || a.finished) return;
        clearTimeout(r.stepTimer);
        if (a.stopTicks) { a.stopTicks(); a.stopTicks = null; }
        setCountdown('');
        const last = a.rolls.length - 1;
        while (a.revealed < a.rolls.length) revealRound(a, a.revealed, false);
        for (let i = 0; i < a.seats.length; i++) snapSeat(a, i, last);
        a.finished = true;
        updateRoundHeader(a, last);
        renderResult(a);
        playOutcomeSound(a);
        maybeRefreshBalance();
    }

    function myPayout(a) {
        const id = me();
        return id ? (a.res.payouts || []).find(p => p.steamId === id) || null : null;
    }

    function playOutcomeSound(a) {
        if (!sfx() || a.silent) return;
        if (!a.lobby || !amSeated(a.lobby)) return;
        const mine = myPayout(a);
        if (!mine) { sfx().lose(); return; }
        const rare = mine.items.some(it => { const rr = rarityOf(it); return rr === 'covert' || rr === 'gold'; });
        if (rare) sfx().rare(); else sfx().win();
    }

    function renderResult(a) {
        const res = a.res;
        const l = a.lobby;
        const controls = root.querySelector('#lbControls');
        if (controls) controls.innerHTML = '<span class="battle-finished-tag"><i class="fas fa-flag-checkered"></i> Finalizada</span>';

        root.querySelectorAll('.battle-seat').forEach((el, i) => {
            const isWinner = a.seats[i].team === res.winnerTeam;
            el.classList.remove('is-leading', 'is-spinning');
            el.classList.toggle('is-winner', isWinner);
            el.classList.toggle('is-loser', !isWinner);
        });

        const winners = a.seats.filter(s => s.team === res.winnerTeam);
        const winnerLabel = a.teamsMode ? TEAM_NAMES[res.winnerTeam] : winners.map(s => s.name).join(', ');
        const seated = amSeated(l);
        const mine = myPayout(a);
        const botWon = winners.every(s => s.isBot);

        let tieText = '';
        if (res.tiebreak) {
            const names = res.leaders.map(t => a.teamsMode ? TEAM_NAMES[t] : (a.seats.find(s => s.team === t) || {}).name);
            tieText = `<p class="battle-result-tie"><i class="fas fa-dice"></i> Empate entre ${esc(names.join(', '))}: desempate aleatorio a favor de <strong>${esc(winnerLabel)}</strong>.</p>`;
        }
        const ruleText = res.crazy ? 'Modo Crazy: gana el total más bajo.' : 'Gana el total más alto.';

        let head;
        let cls;
        let icon;
        let stats = `<div><span>Bote</span><b>${fmt(res.pot)}</b></div>`;
        let extra = '';
        if (seated) {
            const value = mine ? mine.value : 0;
            const profit = money(value - l.cost);
            cls = mine ? 'is-win' : 'is-loss';
            icon = mine ? 'fa-trophy' : 'fa-skull-crossbones';
            head = mine ? '¡VICTORIA!' : 'DERROTA';
            stats += `<div><span>Entrada</span><b>${fmt(l.cost)}</b></div>
                      <div class="${profit >= 0 ? 'is-pos' : 'is-neg'}"><span>Balance</span><b>${profit >= 0 ? '+' : ''}${fmt(profit)}</b></div>`;
            if (mine) {
                const items = mine.items.map(it => api().hydrate(it)).sort((x, y) => y.price - x.price);
                extra = `
                    <div class="battle-won-grid">
                        ${items.map(item => `
                            <div class="battle-won-item ${rarityOf(item)}" title="${esc(item.name)}">
                                ${itemImg(item, 'battle-drop-img')}
                                <span class="battle-drop-name">${esc(item.name)}</span>
                                <span class="battle-drop-price">${fmt(item.price)}</span>
                            </div>`).join('')}
                    </div>
                    <p class="battle-result-sub"><i class="fas fa-briefcase"></i> ${items.length} objetos añadidos a tu inventario${a.teamsMode ? ' (tu parte del botín del equipo)' : ''}.</p>`;
            } else {
                extra = `<p class="battle-result-sub"><i class="fas fa-circle-info"></i> ${botWon ? 'Ha ganado un bot: los objetos no son de nadie.' : 'Los objetos se los queda el ganador.'}</p>`;
            }
        } else {
            cls = 'is-win';
            icon = 'fa-flag-checkered';
            head = 'BATALLA FINALIZADA';
            if (botWon) extra = '<p class="battle-result-sub"><i class="fas fa-circle-info"></i> Ha ganado un bot: los objetos no son de nadie.</p>';
        }

        const box = root.querySelector('#lbResult');
        const wasHidden = box.hidden;
        box.hidden = false;
        box.className = 'battle-result ' + cls;
        box.innerHTML = `
            <div class="battle-result-head">
                <div class="battle-result-icon"><i class="fas ${icon}"></i></div>
                <div class="battle-result-text">
                    <h3>${head}</h3>
                    <p>Ganador: <strong>${esc(winnerLabel)}</strong> · ${ruleText}</p>
                </div>
                <div class="battle-result-stats">${stats}</div>
            </div>
            ${tieText}
            ${extra}
            <div class="battle-result-actions">
                <button type="button" class="battle-start-btn" data-lb="list"><i class="fas fa-list"></i> Volver a la lista</button>
                ${seated ? '<button type="button" class="battle-secondary-btn" data-lb="new"><i class="fas fa-plus"></i> Nueva batalla</button>' : ''}
            </div>`;

        const rect = box.getBoundingClientRect();
        const headerH = (document.querySelector('.header') || { offsetHeight: 0 }).offsetHeight;
        if (wasHidden && !a.silent && (rect.top < headerH || rect.top > window.innerHeight * 0.8)) {
            window.scrollTo({ top: window.scrollY + rect.top - headerH - 16, behavior: 'smooth' });
        }
    }

    // ==================== EVENTS ====================
    function onClick(e) {
        const el = e.target.closest('[data-lb]');
        if (!el || !root.contains(el) || el.disabled) return;
        const action = el.dataset.lb;
        // a click on the card (not on its button) opens the room
        if (action === 'open-card') {
            if (e.target.closest('button, a')) return;
            enterRoom(el.dataset.id, null);
            return;
        }
        switch (action) {
            case 'list': showList(); break;
            case 'new': showCreate(); break;
            case 'open': enterRoom(el.dataset.id, null); break;
            case 'quick-join': joinLobby(el.dataset.id); break;
            case 'join-seat': if (room) joinLobby(room.id, Number(el.dataset.seat)); break;
            case 'bots': fillBots(); break;
            case 'cancel': cancelLobby(); break;
            case 'skip': skipArena(); break;
            case 'inc': changeQty(Number(el.dataset.caseId), 1); break;
            case 'dec': changeQty(Number(el.dataset.caseId), -1); break;
            case 'clear': ui.selection.clear(); renderCreate(); break;
            case 'mode':
                if (!MODES[el.dataset.mode]) return;
                ui.mode = el.dataset.mode;
                root.querySelectorAll('.battle-mode-btn').forEach(m => m.classList.toggle('is-active', m === el));
                renderCreateSummary();
                break;
            case 'create': createLobby(); break;
        }
    }

    function onChange(e) {
        if (e.target.matches('[data-lb="crazy"]')) ui.crazy = e.target.checked;
    }

    function onImageError(e) {
        const img = e.target;
        if (!img || img.tagName !== 'IMG' || img.dataset.fallback) return;
        img.dataset.fallback = '1';
        if (img.classList.contains('lb-avatar-img')) {
            const stand = document.createElement('div');
            stand.className = img.className.replace('lb-avatar-img', '').trim();
            stand.innerHTML = '<i class="fas fa-user"></i>';
            img.replaceWith(stand);
            return;
        }
        const isCase = !img.closest('.battle-reel, .battle-seat-drops, .battle-won-grid');
        const fallback = isCase
            ? (typeof CASE_PLACEHOLDER !== 'undefined' ? CASE_PLACEHOLDER : '')
            : (typeof SKIN_PLACEHOLDER !== 'undefined' ? SKIN_PLACEHOLDER : '');
        if (fallback) img.src = fallback;
    }

    function onStateChange() {
        if (!root || root.hidden) return;
        if (ui.view === 'create') renderCreateSummary();
    }

    // Login / logout: buttons depend on who we are
    function onProfileChange() {
        if (!root || root.hidden) return;
        ui.listSig = '';
        if (ui.view === 'list') renderList();
        else if (ui.view === 'create' && !me()) showList();
        else if (ui.view === 'room' && room) {
            room.sig = '';
            if (room.arena) { /* the animation keeps going; "Tú" labels refresh on the next load */ } else renderRoom();
        }
    }

    function onVisibility() {
        if (document.hidden || !root || root.hidden) return;
        if (ui.view === 'list') loadList();
        else if (ui.view === 'room' && room) {
            if (room.arena && !room.arena.finished) step();
            pollRoom(true);
        }
    }

    // ==================== LIFECYCLE ====================
    function activate() {
        if (ui.view === 'list') { renderList(); pollList(); }
        else if (ui.view === 'room' && room) {
            if (room.arena && !room.arena.finished) step();
            pollRoom(true);
        }
    }

    function deactivate() {
        stopListPoll();
        if (room) {
            clearTimeout(room.pollTimer);
            clearTimeout(room.stepTimer);
            if (room.arena && room.arena.stopTicks) { room.arena.stopTicks(); room.arena.stopTicks = null; }
        }
    }

    function bindTabs() {
        if (tabsBound) return;
        tabsBound = true;
        document.querySelectorAll('[data-battles-tab]').forEach(btn => {
            btn.addEventListener('click', () => showTab(btn.dataset.battlesTab, true));
        });
        window.addEventListener('hashchange', () => {
            const tab = readTab();
            if (tab === 'players' && root.hidden) showTab('players', false);
            else if (tab === 'bots' && !root.hidden) showTab('bots', false);
        });
    }

    function init() {
        root = document.getElementById('lobbiesRoot');
        if (!root || !api()) return;
        root.addEventListener('click', onClick);
        root.addEventListener('change', onChange);
        root.addEventListener('error', onImageError, true);
        document.addEventListener('skindrop:statechange', onStateChange);
        document.addEventListener('skindrop:profilechange', onProfileChange);
        document.addEventListener('visibilitychange', onVisibility);
        bindTabs();
        const tab = readTab();
        if (tab === 'players') showTab('players', false);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
