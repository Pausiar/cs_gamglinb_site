// Case battles against bots. Renders into #battlesRoot.
// Every seat opens the same case each round; the highest total (lowest in
// "Modo Crazy") wins every item opened in the battle. The whole battle is
// decided and paid out by SkinDrop.actions.battle (server for Steam users, the
// local engine for guests) before the first reel spins; the reels only reveal it.
(function () {
    'use strict';

    const MAX_ROUNDS = 10;
    const SPIN_MS = 3400;
    const SPIN_FAST_MS = 1100;
    const PAUSE_MS = 900;
    const PAUSE_FAST_MS = 350;
    const REEL_LENGTH = 40;
    const RECENT_LIMIT = 8;
    const FAST_KEY = 'skinDropBattleFast';

    const MODES = {
        '1v1': { label: '1 vs 1', seats: 2, teams: [0, 1], icon: 'fa-user', desc: '2 jugadores' },
        '1v1v1': { label: '1 vs 1 vs 1', seats: 3, teams: [0, 1, 2], icon: 'fa-users', desc: '3 jugadores' },
        '2v2': { label: '2 vs 2', seats: 4, teams: [0, 0, 1, 1], icon: 'fa-people-group', desc: 'Equipos' },
        '1v1v1v1': { label: '1 vs 1 vs 1 vs 1', seats: 4, teams: [0, 1, 2, 3], icon: 'fa-user-group', desc: '4 jugadores' }
    };

    const TEAM_NAMES = ['Equipo Naranja', 'Equipo Azul'];

    const BOT_NAMES = [
        'NightHunter', 'xXSniperXx', 'LuckyBot', 'HeadshotKing', 'SilverFox', 'PhantomX',
        'GoldenEagle', 'ToxicRush', 'ClutchMaster', 'AceHunter', 'FragMachine', 'RushB_Bot',
        'DeagleDiva', 'SprayControl', 'FlashBang', 'EcoRoundEddie'
    ];
    const BOT_COLORS = ['#4cc9f0', '#b388ff', '#7fb069', '#e4572e', '#f7c94b', '#ff4d8d', '#3ddc97', '#5e98d9'];

    // ==================== STATE ====================
    const ui = {
        view: 'creator', // 'creator' | 'arena'
        selection: new Map(), // caseId -> qty (insertion order = round order)
        mode: '1v1',
        crazy: false,
        fast: readFast(),
        starting: false
    };
    let battle = null; // current or last battle
    const recent = []; // battles finished this session

    let root = null;

    // ==================== HELPERS ====================
    function esc(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function money(n) {
        return Math.round(n * 100) / 100;
    }

    function fmt(n) {
        return money(n).toFixed(2) + '€';
    }

    function api() {
        return window.SkinDrop;
    }

    function sfx() {
        return window.SkinDropSfx || null;
    }

    function allCases() {
        return typeof cases !== 'undefined' ? cases : [];
    }

    function findCase(id) {
        return allCases().find(c => c.id === id);
    }

    function rarityOf(item) {
        return typeof getRarity === 'function' ? getRarity(item) : 'consumer';
    }

    function readFast() {
        try {
            return localStorage.getItem(FAST_KEY) === '1';
        } catch (e) {
            return false;
        }
    }

    function writeFast(on) {
        try {
            localStorage.setItem(FAST_KEY, on ? '1' : '0');
        } catch (e) { /* storage unavailable */ }
    }

    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function initials(name) {
        const parts = name.replace(/[^A-Za-z0-9 _]/g, '').split(/[ _]+/).filter(Boolean);
        if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
        const caps = name.replace(/[^A-Z]/g, '');
        if (caps.length >= 2) return caps.slice(0, 2);
        return name.slice(0, 2).toUpperCase();
    }

    function roundList(selection) {
        const list = [];
        selection.forEach((qty, id) => {
            for (let i = 0; i < qty; i++) list.push(id);
        });
        return list;
    }

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

    function isRunning() {
        return !!(battle && !battle.settled);
    }

    function makeBots(count) {
        const names = shuffle(BOT_NAMES).slice(0, count);
        const colors = shuffle(BOT_COLORS);
        return names.map((name, i) => ({ name, color: colors[i % colors.length] }));
    }

    function avatarHtml(seat) {
        if (seat.isUser) {
            return '<div class="battle-avatar battle-avatar--user"><i class="fas fa-user"></i></div>';
        }
        return `<div class="battle-avatar" style="--avatar-color:${esc(seat.color)}">${esc(initials(seat.name))}</div>`;
    }

    function itemImg(item, cls) {
        return `<img class="${cls}" src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy" draggable="false">`;
    }

    // ==================== CREATOR ====================
    function renderCreator() {
        const caseCards = allCases().map(c => {
            const qty = ui.selection.get(c.id) || 0;
            const color = (c.theme && c.theme.primary) || 'var(--accent-primary)';
            return `
                <div class="battle-case-card${qty ? ' is-selected' : ''}" data-case-id="${c.id}" style="--case-color:${esc(color)}">
                    <button type="button" class="battle-case-add" data-action="inc" data-case-id="${c.id}" aria-label="Añadir ${esc(c.name)}">
                        <img src="${esc(c.image)}" alt="${esc(c.name)}" draggable="false">
                        <span class="battle-case-name">${esc(c.name)}</span>
                        <span class="battle-case-price">${fmt(c.price)}</span>
                    </button>
                    <div class="battle-qty">
                        <button type="button" data-action="dec" data-case-id="${c.id}" aria-label="Quitar una" ${qty ? '' : 'disabled'}><i class="fas fa-minus"></i></button>
                        <span class="battle-qty-value">${qty}</span>
                        <button type="button" data-action="inc" data-case-id="${c.id}" aria-label="Añadir una"><i class="fas fa-plus"></i></button>
                    </div>
                </div>`;
        }).join('');

        const modeButtons = Object.entries(MODES).map(([key, m]) => `
            <button type="button" class="battle-mode-btn${ui.mode === key ? ' is-active' : ''}" data-action="mode" data-mode="${key}">
                <i class="fas ${m.icon}"></i>
                <span class="battle-mode-label">${m.label}</span>
                <span class="battle-mode-desc">${m.desc}</span>
            </button>`).join('');

        root.innerHTML = `
            <div class="battle-creator">
                <div class="battle-panel battle-picker">
                    <div class="battle-panel-head">
                        <h3><i class="fas fa-box-open"></i> Elige las cajas</h3>
                        <span class="battle-rounds-count" id="battleRoundsCount"></span>
                    </div>
                    <p class="battle-hint">Cada caja es una ronda. Todos los jugadores abren la misma caja a la vez (máx. ${MAX_ROUNDS} rondas).</p>
                    <div class="battle-case-grid">${caseCards}</div>
                </div>
                <aside class="battle-panel battle-setup">
                    <div class="battle-panel-head">
                        <h3><i class="fas fa-sliders"></i> Configuración</h3>
                    </div>
                    <div class="battle-mode-grid">${modeButtons}</div>
                    <label class="battle-toggle">
                        <input type="checkbox" data-action="crazy" ${ui.crazy ? 'checked' : ''}>
                        <span class="battle-toggle-slider"></span>
                        <span class="battle-toggle-text"><strong><i class="fas fa-shuffle"></i> Modo Crazy</strong> Gana el total más bajo</span>
                    </label>
                    <div class="battle-summary" id="battleSummary"></div>
                </aside>
            </div>
            <div class="battle-panel battle-recent" id="battleRecent"></div>`;

        renderSummary();
        renderRecent();
    }

    function renderSummary() {
        const summary = root && root.querySelector('#battleSummary');
        if (!summary) return;
        const count = selectionCount();
        const cost = selectionCost();
        const mode = MODES[ui.mode];
        const balance = api() ? api().state.balance : 0;
        const enough = balance >= cost;

        const counter = root.querySelector('#battleRoundsCount');
        if (counter) counter.textContent = `${count}/${MAX_ROUNDS} rondas`;

        const chips = [];
        ui.selection.forEach((qty, id) => {
            const c = findCase(id);
            if (!c) return;
            chips.push(`
                <div class="battle-chip" title="${esc(c.name)}">
                    <img src="${esc(c.image)}" alt="">
                    <span>${esc(c.name)}</span>
                    <b>×${qty}</b>
                </div>`);
        });

        let note = '';
        if (ui.mode === '2v2') {
            note = '<p class="battle-note"><i class="fas fa-circle-info"></i> En 2v2 juegas con un bot de compañero. Si vuestro equipo gana, <strong>todos los objetos de la batalla son para ti</strong>.</p>';
        } else {
            note = '<p class="battle-note"><i class="fas fa-circle-info"></i> Quien gane se lleva todos los objetos abiertos por todos los jugadores.</p>';
        }

        let disabledReason = '';
        if (!count) disabledReason = 'Añade al menos una caja';
        else if (!enough) disabledReason = 'Saldo insuficiente';

        summary.innerHTML = `
            <div class="battle-chips">${chips.length ? chips.join('') : '<p class="battle-empty">No has elegido ninguna caja</p>'}</div>
            ${count ? '<button type="button" class="battle-link-btn" data-action="clear"><i class="fas fa-trash"></i> Vaciar</button>' : ''}
            ${note}
            <div class="battle-cost-rows">
                <div class="battle-cost-row"><span>Rondas</span><b>${count}</b></div>
                <div class="battle-cost-row"><span>Jugadores</span><b>${mode.seats}</b></div>
                <div class="battle-cost-row"><span>Valor en juego</span><b>${fmt(cost * mode.seats)}</b></div>
                <div class="battle-cost-row battle-cost-total"><span>Tu entrada</span><b>${fmt(cost)}</b></div>
            </div>
            <button type="button" class="battle-start-btn" data-action="start" ${disabledReason ? 'disabled' : ''}>
                <i class="fas fa-crosshairs"></i> ${disabledReason ? esc(disabledReason) : 'Crear batalla · ' + fmt(cost)}
            </button>`;
    }

    function renderRecent() {
        const box = root && root.querySelector('#battleRecent');
        if (!box) return;
        if (!recent.length) {
            box.innerHTML = `
                <div class="battle-panel-head"><h3><i class="fas fa-clock-rotate-left"></i> Batallas recientes</h3></div>
                <p class="battle-empty">Aún no has jugado ninguna batalla en esta sesión.</p>`;
            return;
        }
        box.innerHTML = `
            <div class="battle-panel-head"><h3><i class="fas fa-clock-rotate-left"></i> Batallas recientes</h3></div>
            <div class="battle-recent-list">
                ${recent.map(r => `
                    <div class="battle-recent-item ${r.won ? 'is-win' : 'is-loss'}">
                        <span class="battle-recent-result"><i class="fas ${r.won ? 'fa-trophy' : 'fa-skull'}"></i> ${r.won ? 'Victoria' : 'Derrota'}</span>
                        <span class="battle-recent-mode">${esc(MODES[r.mode].label)}${r.crazy ? ' · Crazy' : ''}</span>
                        <span class="battle-recent-rounds">${r.rounds} ronda${r.rounds === 1 ? '' : 's'}</span>
                        <span class="battle-recent-cost">-${fmt(r.cost)}</span>
                        <span class="battle-recent-won">${r.won ? '+' + fmt(r.value) : '0.00€'}</span>
                    </div>`).join('')}
            </div>`;
    }

    function changeQty(caseId, delta) {
        const current = ui.selection.get(caseId) || 0;
        if (delta > 0 && selectionCount() >= MAX_ROUNDS) {
            api().showToast(`Máximo ${MAX_ROUNDS} rondas por batalla`, 'error');
            return;
        }
        const next = Math.max(0, current + delta);
        if (next === 0) ui.selection.delete(caseId);
        else ui.selection.set(caseId, next);

        const card = root.querySelector(`.battle-case-card[data-case-id="${caseId}"]`);
        if (card) {
            card.classList.toggle('is-selected', next > 0);
            card.querySelector('.battle-qty-value').textContent = next;
            card.querySelector('[data-action="dec"]').disabled = next === 0;
        }
        renderSummary();
    }

    // ==================== BATTLE START ====================
    // Builds the client-side battle from the authoritative transcript
    function createBattle(res, bots, reveal) {
        const mode = MODES[res.mode];
        const caseList = res.caseIds.map(findCase);
        const colorOf = new Map(bots.map(b => [b.name, b.color]));
        const fallback = shuffle(BOT_COLORS);
        const seats = res.seats.map((s, i) => ({
            name: s.name,
            isUser: !!s.isUser,
            team: s.team,
            color: s.isUser ? null : (colorOf.get(s.name) || fallback[i % fallback.length])
        }));
        const rolls = res.rounds.map(row => row.map(item => api().hydrate(item)));

        return {
            config: { mode: res.mode, crazy: res.crazy, rounds: res.caseIds.slice() },
            bots: seats.filter(s => !s.isUser).map(s => ({ name: s.name, color: s.color })),
            mode,
            cases: caseList,
            seats,
            rolls,
            outcome: res,
            reveal,
            cost: res.cost,
            revealed: 0,
            timer: null,
            settled: false,
            result: null
        };
    }

    async function startBattle(config, bots) {
        const sd = api();
        if (!sd) return;
        if (isRunning() || ui.starting) {
            sd.showToast('Ya hay una batalla en curso', 'error');
            return;
        }
        if (sd.state.isSpinning) {
            sd.showToast('Espera a que termine la apertura actual', 'error');
            return;
        }
        if (!config.rounds.length) {
            sd.showToast('Añade al menos una caja', 'error');
            return;
        }
        const mode = MODES[config.mode];
        const caseList = config.rounds.map(findCase).filter(Boolean);
        if (!mode || caseList.length !== config.rounds.length) {
            sd.showToast('No se pudo crear la batalla', 'error');
            return;
        }
        if (sd.state.balance < money(caseList.reduce((s, c) => s + c.price, 0))) {
            sd.showToast('Saldo insuficiente', 'error');
            return;
        }
        const botList = bots && bots.length === mode.seats - 1 ? bots : makeBots(mode.seats - 1);

        // The battle is rolled, paid and settled by the action; winnings stay hidden until revealed
        ui.starting = true;
        root.querySelectorAll('[data-action="start"], [data-action="rematch"]').forEach(b => { b.disabled = true; });
        let out;
        try {
            out = await sd.actions.battle({
                caseIds: caseList.map(c => c.id),
                mode: config.mode,
                crazy: !!config.crazy,
                botNames: botList.map(b => b.name)
            });
        } catch (e) {
            sd.showToast(e.message, 'error');
            root.querySelectorAll('[data-action="start"], [data-action="rematch"]').forEach(b => { b.disabled = false; });
            if (ui.view === 'creator') renderSummary();
            return;
        } finally {
            ui.starting = false;
        }

        const b = createBattle(out.result, botList, out.reveal);
        battle = b;

        ui.view = 'arena';
        renderArena();
        const section = document.getElementById('battles');
        if (section && section.getBoundingClientRect().top < -40) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
        // Let the layout settle before measuring reels
        b.timer = setTimeout(() => playRound(b, 0), 250);
    }

    // ==================== ARENA ====================
    function renderArena() {
        const b = battle;
        const isTeams = b.config.mode === '2v2';
        const roundThumbs = b.cases.map((c, i) => `
            <div class="battle-round-thumb" data-round="${i}" title="Ronda ${i + 1}: ${esc(c.name)}">
                <img src="${esc(c.image)}" alt="">
            </div>`).join('');

        const seats = b.seats.map((seat, i) => `
            <div class="battle-seat${seat.isUser ? ' is-user' : ''}${isTeams ? ' battle-team-' + seat.team : ''}" data-seat="${i}">
                <div class="battle-seat-head">
                    ${avatarHtml(seat)}
                    <div class="battle-seat-id">
                        <span class="battle-seat-name">${esc(seat.name)}</span>
                        <span class="battle-seat-tag">${seat.isUser ? '<i class="fas fa-star"></i> Tú' : '<i class="fas fa-robot"></i> Bot'}${isTeams ? ' · ' + (seat.team === 0 ? 'Naranja' : 'Azul') : ''}</span>
                    </div>
                    <span class="battle-seat-total" data-total="${i}">0.00€</span>
                </div>
                <div class="battle-reel">
                    <div class="battle-reel-track"></div>
                    <div class="battle-reel-marker"></div>
                </div>
                <div class="battle-seat-drops" data-drops="${i}"></div>
            </div>`).join('');

        const scoreboard = isTeams ? `
            <div class="battle-scoreboard">
                <div class="battle-score battle-team-0"><span>${TEAM_NAMES[0]}</span><b data-team-total="0">0.00€</b></div>
                <span class="battle-vs">VS</span>
                <div class="battle-score battle-team-1"><span>${TEAM_NAMES[1]}</span><b data-team-total="1">0.00€</b></div>
            </div>` : '';

        root.innerHTML = `
            <div class="battle-arena${b.config.crazy ? ' is-crazy' : ''}">
                <div class="battle-arena-bar">
                    <div class="battle-arena-info">
                        <span class="battle-badge"><i class="fas ${b.mode.icon}"></i> ${esc(b.mode.label)}</span>
                        ${b.config.crazy ? '<span class="battle-badge battle-badge--crazy"><i class="fas fa-shuffle"></i> Crazy</span>' : ''}
                        <span class="battle-round-label">Ronda <b id="battleRoundNum">1</b>/${b.cases.length}</span>
                        <span class="battle-case-label" id="battleCaseLabel">${esc(b.cases[0].name)}</span>
                    </div>
                    <div class="battle-arena-controls" id="battleControls">
                        <button type="button" class="battle-ctrl-btn${ui.fast ? ' is-active' : ''}" data-action="fast" aria-pressed="${ui.fast}">
                            <i class="fas fa-forward"></i> Rápido
                        </button>
                        <button type="button" class="battle-ctrl-btn" data-action="skip">
                            <i class="fas fa-forward-fast"></i> Saltar
                        </button>
                    </div>
                </div>
                <div class="battle-round-track">${roundThumbs}</div>
                <div class="battle-result" id="battleResult" hidden></div>
                ${scoreboard}
                <div class="battle-seats battle-seats--${b.seats.length}${isTeams ? ' battle-seats--teams' : ''}">${seats}</div>
            </div>`;
    }

    function seatEl(i) {
        return root.querySelector(`.battle-seat[data-seat="${i}"]`);
    }

    function reelItemHtml(item, extra) {
        const rarity = rarityOf(item);
        return `<div class="battle-reel-item ${rarity}${extra || ''}">${itemImg(item, 'battle-reel-img')}</div>`;
    }

    function updateRoundHeader(b, r) {
        const num = root.querySelector('#battleRoundNum');
        if (num) num.textContent = Math.min(r + 1, b.cases.length);
        const label = root.querySelector('#battleCaseLabel');
        if (label && b.cases[r]) label.textContent = b.cases[r].name;
        root.querySelectorAll('.battle-round-thumb').forEach(el => {
            const i = Number(el.dataset.round);
            el.classList.toggle('is-current', i === r && !b.settled);
            el.classList.toggle('is-done', i < b.revealed);
        });
    }

    function playRound(b, r) {
        if (b !== battle || b.settled || r !== b.revealed) return;
        const c = b.cases[r];
        updateRoundHeader(b, r);
        const duration = ui.fast ? SPIN_FAST_MS : SPIN_MS;

        b.seats.forEach((seat, i) => {
            const el = seatEl(i);
            if (!el) return;
            const track = el.querySelector('.battle-reel-track');
            const reel = el.querySelector('.battle-reel');
            const winIndex = REEL_LENGTH - 6 - Math.floor(Math.random() * 3);
            const html = [];
            for (let k = 0; k < REEL_LENGTH; k++) {
                const item = k === winIndex ? b.rolls[r][i] : c.items[Math.floor(Math.random() * c.items.length)];
                html.push(reelItemHtml(item, k === winIndex ? ' is-target' : ''));
            }
            track.innerHTML = html.join('');
            track.style.transition = 'none';
            track.style.transform = 'translateY(0)';
            void track.offsetHeight; // apply the reset before animating

            const target = track.children[winIndex];
            const itemH = target.offsetHeight;
            const jitter = (Math.random() - 0.5) * itemH * 0.5;
            const offset = target.offsetTop + itemH / 2 - reel.clientHeight / 2 + jitter;
            track.style.transition = `transform ${duration}ms cubic-bezier(0.12, 0.8, 0.18, 1)`;
            track.style.transform = `translateY(${-offset}px)`;
            el.classList.add('is-spinning');
            // One ticking reel is enough (all seats spin together)
            if (i === 0 && sfx()) {
                if (b.stopTicks) b.stopTicks();
                b.stopTicks = sfx().watchTranslate(track, {
                    axis: 'y', step: itemH, offset: reel.clientHeight / 2, maxMs: duration + 500
                });
            }
        });

        b.timer = setTimeout(() => {
            if (b.stopTicks) { b.stopTicks(); b.stopTicks = null; }
            // Snap exactly onto the drop before revealing it
            b.seats.forEach((seat, i) => {
                const el = seatEl(i);
                if (!el) return;
                const track = el.querySelector('.battle-reel-track');
                const reel = el.querySelector('.battle-reel');
                const target = track.querySelector('.is-target');
                if (!target) return;
                track.style.transition = 'transform 180ms ease-out';
                track.style.transform = `translateY(${-(target.offsetTop + target.offsetHeight / 2 - reel.clientHeight / 2)}px)`;
            });
            revealRound(b, r);
            if (b.revealed < b.cases.length) {
                b.timer = setTimeout(() => playRound(b, b.revealed), ui.fast ? PAUSE_FAST_MS : PAUSE_MS);
            } else {
                b.timer = setTimeout(() => finishBattle(b), ui.fast ? 250 : 600);
            }
        }, duration + 60);
    }

    function seatTotals(b, upTo) {
        return b.seats.map((seat, i) => {
            let sum = 0;
            for (let r = 0; r < upTo; r++) sum += b.rolls[r][i].price;
            return money(sum);
        });
    }

    function teamTotals(b, totals) {
        const teamCount = Math.max.apply(null, b.mode.teams) + 1;
        const out = new Array(teamCount).fill(0);
        totals.forEach((t, i) => { out[b.seats[i].team] += t; });
        return out.map(money);
    }

    // Reveals round r in the UI (drops list, totals, highlight)
    function revealRound(b, r) {
        if (r !== b.revealed) return;
        b.revealed = r + 1;
        b.seats.forEach((seat, i) => {
            const el = seatEl(i);
            if (!el) return;
            const item = b.rolls[r][i];
            const rarity = rarityOf(item);
            el.classList.remove('is-spinning');
            const target = el.querySelector('.battle-reel-item.is-target');
            if (target) target.classList.add('is-hit');
            const drops = el.querySelector('.battle-seat-drops');
            drops.insertAdjacentHTML('afterbegin', `
                <div class="battle-drop ${rarity}" title="${esc(item.name)} · ${fmt(item.price)}">
                    ${itemImg(item, 'battle-drop-img')}
                    <span class="battle-drop-name">${esc(item.name)}</span>
                    <span class="battle-drop-price">${fmt(item.price)}</span>
                </div>`);
        });
        updateTotalsUI(b);
        updateRoundHeader(b, Math.min(b.revealed, b.cases.length - 1));
        if (sfx() && !b.silent) sfx().reveal();
    }

    function updateTotalsUI(b) {
        const totals = seatTotals(b, b.revealed);
        totals.forEach((t, i) => {
            const el = root.querySelector(`[data-total="${i}"]`);
            if (el) el.textContent = fmt(t);
        });
        const teams = teamTotals(b, totals);
        teams.forEach((t, i) => {
            const el = root.querySelector(`[data-team-total="${i}"]`);
            if (el) el.textContent = fmt(t);
        });
        // Highlight who is currently ahead
        const leader = pickLeaders(b, teams);
        root.querySelectorAll('.battle-seat').forEach((el, i) => {
            el.classList.toggle('is-leading', b.revealed > 0 && leader.length === 1 && leader[0] === b.seats[i].team);
        });
    }

    // Indexes of the best scores (highest, or lowest in crazy mode)
    function pickLeaders(b, scores) {
        const best = b.config.crazy ? Math.min.apply(null, scores) : Math.max.apply(null, scores);
        const out = [];
        scores.forEach((s, i) => { if (Math.abs(s - best) < 0.005) out.push(i); });
        return out;
    }

    // Shows the final drop of every seat without animation
    function snapReelsToEnd(b) {
        const last = b.cases.length - 1;
        b.seats.forEach((seat, i) => {
            const el = seatEl(i);
            if (!el) return;
            const c = b.cases[last];
            const rand = () => c.items[Math.floor(Math.random() * c.items.length)];
            const track = el.querySelector('.battle-reel-track');
            const reel = el.querySelector('.battle-reel');
            track.style.transition = 'none';
            track.innerHTML = reelItemHtml(rand()) + reelItemHtml(rand()) + reelItemHtml(b.rolls[last][i], ' is-target is-hit') + reelItemHtml(rand()) + reelItemHtml(rand());
            const target = track.children[2];
            track.style.transform = `translateY(${-(target.offsetTop + target.offsetHeight / 2 - reel.clientHeight / 2)}px)`;
            el.classList.remove('is-spinning');
        });
    }

    function skipBattle() {
        const b = battle;
        if (!b || b.settled) return;
        clearTimeout(b.timer);
        if (b.stopTicks) { b.stopTicks(); b.stopTicks = null; }
        b.silent = true;   // no pops for the rounds that are skipped
        while (b.revealed < b.cases.length) revealRound(b, b.revealed);
        snapReelsToEnd(b);
        finishBattle(b);
    }

    // ==================== SETTLEMENT ====================
    // The outcome was settled when the battle was created; this only reveals it (once).
    function settle(b) {
        if (!b || b.settled) return;
        b.settled = true;
        clearTimeout(b.timer);

        const res = b.outcome;
        b.reveal();   // winnings become visible in the inventory / history
        b.result = {
            totals: res.totals,
            teams: res.teams,
            winnerTeam: res.winnerTeam,
            tiebreak: res.tiebreak,
            tied: res.leaders,
            won: res.won,
            pot: res.pot
        };
        recent.unshift({
            mode: b.config.mode,
            crazy: b.config.crazy,
            rounds: b.cases.length,
            cost: b.cost,
            won: res.won,
            value: res.pot
        });
        if (recent.length > RECENT_LIMIT) recent.length = RECENT_LIMIT;
    }

    // Final jingle: fanfare for a win that includes a covert / gold item, chime for a win, thud for a loss
    function playOutcomeSound(b) {
        if (!sfx()) return;
        const res = b.result;
        if (!res.won) { sfx().lose(); return; }
        const rare = b.rolls.some(row => row.some(item => {
            const r = rarityOf(item);
            return r === 'covert' || r === 'gold';
        }));
        if (rare) sfx().rare(); else sfx().win();
    }

    function finishBattle(b) {
        if (b !== battle) return;
        if (!b.settled) {
            settle(b);
            playOutcomeSound(b);
        }
        if (ui.view === 'arena' && root.querySelector('.battle-arena')) renderResult(b);
    }

    function renderResult(b) {
        const res = b.result;
        updateRoundHeader(b, b.cases.length - 1);
        const controls = root.querySelector('#battleControls');
        if (controls) controls.innerHTML = '<span class="battle-finished-tag"><i class="fas fa-flag-checkered"></i> Finalizada</span>';

        const isTeams = b.config.mode === '2v2';
        root.querySelectorAll('.battle-seat').forEach((el, i) => {
            const isWinner = b.seats[i].team === res.winnerTeam;
            el.classList.remove('is-leading', 'is-spinning');
            el.classList.toggle('is-winner', isWinner);
            el.classList.toggle('is-loser', !isWinner);
        });

        let winnerLabel;
        if (isTeams) winnerLabel = TEAM_NAMES[res.winnerTeam];
        else winnerLabel = b.seats[res.winnerTeam].name;

        let tieText = '';
        if (res.tiebreak) {
            const names = res.tied.map(t => isTeams ? TEAM_NAMES[t] : b.seats[t].name);
            tieText = `<p class="battle-result-tie"><i class="fas fa-dice"></i> Empate entre ${esc(names.join(', '))}: desempate aleatorio a favor de <strong>${esc(winnerLabel)}</strong>.</p>`;
        }

        const ruleText = b.config.crazy ? 'Modo Crazy: gana el total más bajo.' : 'Gana el total más alto.';
        const profit = money((res.won ? res.pot : 0) - b.cost);

        let wonGrid = '';
        if (res.won) {
            const all = [];
            b.rolls.forEach(row => row.forEach(item => all.push(item)));
            all.sort((x, y) => y.price - x.price);
            wonGrid = `
                <div class="battle-won-grid">
                    ${all.map(item => `
                        <div class="battle-won-item ${rarityOf(item)}" title="${esc(item.name)}">
                            ${itemImg(item, 'battle-drop-img')}
                            <span class="battle-drop-name">${esc(item.name)}</span>
                            <span class="battle-drop-price">${fmt(item.price)}</span>
                        </div>`).join('')}
                </div>
                <p class="battle-result-sub"><i class="fas fa-briefcase"></i> ${all.length} objetos añadidos a tu inventario${isTeams ? ' (las ganancias del equipo son para ti)' : ''}.</p>`;
        }

        const box = root.querySelector('#battleResult');
        const wasHidden = box.hidden;
        box.hidden = false;
        box.className = 'battle-result ' + (res.won ? 'is-win' : 'is-loss');
        box.innerHTML = `
            <div class="battle-result-head">
                <div class="battle-result-icon"><i class="fas ${res.won ? 'fa-trophy' : 'fa-skull-crossbones'}"></i></div>
                <div class="battle-result-text">
                    <h3>${res.won ? '¡VICTORIA!' : 'DERROTA'}</h3>
                    <p>Ganador: <strong>${esc(winnerLabel)}</strong> · ${ruleText}</p>
                </div>
                <div class="battle-result-stats">
                    <div><span>Bote</span><b>${fmt(res.pot)}</b></div>
                    <div><span>Entrada</span><b>${fmt(b.cost)}</b></div>
                    <div class="${profit >= 0 ? 'is-pos' : 'is-neg'}"><span>Balance</span><b>${profit >= 0 ? '+' : ''}${fmt(profit)}</b></div>
                </div>
            </div>
            ${tieText}
            ${res.won ? '' : '<p class="battle-result-sub"><i class="fas fa-circle-info"></i> Has perdido la batalla: los objetos se los queda el ganador.</p>'}
            ${wonGrid}
            <div class="battle-result-actions">
                <button type="button" class="battle-start-btn" data-action="rematch"><i class="fas fa-rotate-right"></i> Revancha · ${fmt(b.cost)}</button>
                <button type="button" class="battle-secondary-btn" data-action="new"><i class="fas fa-plus"></i> Nueva batalla</button>
            </div>`;

        // Bring the result into view if the player scrolled down to the reels
        const rect = box.getBoundingClientRect();
        const headerH = (document.querySelector('.header') || { offsetHeight: 0 }).offsetHeight;
        if (wasHidden && (rect.top < headerH || rect.top > window.innerHeight * 0.8)) {
            window.scrollTo({ top: window.scrollY + rect.top - headerH - 16, behavior: 'smooth' });
        }
    }

    // ==================== EVENTS ====================
    function onClick(e) {
        const btn = e.target.closest('[data-action]');
        if (!btn || !root.contains(btn) || btn.disabled) return;
        const action = btn.dataset.action;
        switch (action) {
            case 'inc':
                changeQty(Number(btn.dataset.caseId), 1);
                break;
            case 'dec':
                changeQty(Number(btn.dataset.caseId), -1);
                break;
            case 'clear':
                ui.selection.clear();
                renderCreator();
                break;
            case 'mode':
                if (!MODES[btn.dataset.mode]) return;
                ui.mode = btn.dataset.mode;
                root.querySelectorAll('.battle-mode-btn').forEach(m => m.classList.toggle('is-active', m === btn));
                renderSummary();
                break;
            case 'start':
                startBattle({ mode: ui.mode, crazy: ui.crazy, rounds: roundList(ui.selection) });
                break;
            case 'fast':
                ui.fast = !ui.fast;
                writeFast(ui.fast);
                btn.classList.toggle('is-active', ui.fast);
                btn.setAttribute('aria-pressed', String(ui.fast));
                break;
            case 'skip':
                skipBattle();
                break;
            case 'rematch':
                if (battle && battle.settled) startBattle(battle.config, battle.bots);
                break;
            case 'new':
                if (isRunning()) return;
                if (battle) {
                    ui.mode = battle.config.mode;
                    ui.crazy = battle.config.crazy;
                }
                ui.view = 'creator';
                renderCreator();
                break;
        }
    }

    function onChange(e) {
        if (e.target.matches('[data-action="crazy"]')) {
            ui.crazy = e.target.checked;
        }
    }

    function onStateChange() {
        if (!root) return;
        if (ui.view === 'creator') renderSummary();
    }

    // Login / logout mid-battle: the battle is already settled on the old
    // profile, just finish the animation right away
    function onProfileChange() {
        if (root && isRunning()) skipBattle();
    }

    // Broken skin/case images fall back to the site's placeholder art
    function onImageError(e) {
        const img = e.target;
        if (!img || img.tagName !== 'IMG' || img.dataset.fallback) return;
        img.dataset.fallback = '1';
        const isCase = !img.closest('.battle-reel, .battle-seat-drops, .battle-won-grid');
        const fallback = isCase
            ? (typeof CASE_PLACEHOLDER !== 'undefined' ? CASE_PLACEHOLDER : '')
            : (typeof SKIN_PLACEHOLDER !== 'undefined' ? SKIN_PLACEHOLDER : '');
        if (fallback) img.src = fallback;
    }

    function init() {
        root = document.getElementById('battlesRoot');
        if (!root || !api()) return;
        root.addEventListener('click', onClick);
        root.addEventListener('change', onChange);
        root.addEventListener('error', onImageError, true);
        document.addEventListener('skindrop:statechange', onStateChange);
        document.addEventListener('skindrop:profilechange', onProfileChange);

        renderCreator();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
