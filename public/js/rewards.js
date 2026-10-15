// Rewards page: the daily free case ("Caja Diaria"). Renders into #rewardsRoot.
//   GET  /api/rewards        -> { canClaim, nextClaimAt, streak, tier, serverNow }   (401 for guests)
//   POST /api/rewards/claim  -> { state, result: { item, streak, tier, nextClaimAt } }
(function () {
    'use strict';

    const root = document.getElementById('rewardsRoot');
    const sd = window.SkinDrop;
    if (!root || !sd) return;

    const STREAK_MAX = 7;
    const BONUS_FROM = 3;
    const ROLL_MS = 5000;
    const WINNER_INDEX = 38;
    const TRACK_LENGTH = 48;

    let status = null;       // last GET /api/rewards
    let clockOffset = 0;     // server time - browser time
    let tick = null;
    let claiming = false;
    let lastResult = null;   // last claimed item, kept on screen while the countdown runs
    let loginHref = '/auth/steam?next=/recompensas';

    const esc = sd.escapeHtml || (s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));

    function now() { return Date.now() + clockOffset; }

    function rarityColor(r) {
        return 'var(--rarity-' + (['consumer', 'industrial', 'milspec', 'restricted', 'classified', 'covert', 'gold'].indexOf(r) >= 0 ? r : 'consumer') + ')';
    }

    function fmtCountdown(ms) {
        const total = Math.max(0, Math.ceil(ms / 1000));
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = total % 60;
        return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
    }

    // ---------- views ----------
    function streakHtml(streak, tier) {
        let dots = '';
        for (let i = 1; i <= STREAK_MAX; i++) {
            const bonus = i === BONUS_FROM ? ' is-bonus' : '';
            dots += '<li class="rw-dot' + (i <= streak ? ' is-on' : '') + bonus + '" aria-label="Día ' + i + (i <= streak ? ' completado' : '') + '">' +
                (i === BONUS_FROM ? '<i class="fas fa-star" title="Desde aquí, caja mejorada"></i>' : i) + '</li>';
        }
        const hint = tier === 'bonus'
            ? 'Tu próxima caja es la <strong>caja mejorada</strong> por racha.'
            : 'Llega a ' + BONUS_FROM + ' días seguidos para desbloquear una caja mejorada.';
        return '<div class="rw-streak">' +
            '<div class="rw-streak-head"><span><i class="fas fa-fire"></i> Racha diaria</span><strong>' + streak + ' / ' + STREAK_MAX + '</strong></div>' +
            '<ol class="rw-dots">' + dots + '</ol>' +
            '<p class="rw-hint">' + hint + ' Reclama cada día (máximo 48 h entre cajas) para no perder la racha.</p>' +
            '</div>';
    }

    function resultHtml(item) {
        if (!item) return '';
        return '<div class="rw-result" style="--rw-color:' + rarityColor(item.rarity) + '">' +
            '<img src="' + esc(sd.itemImage(item)) + '" alt="' + esc(item.name) + '">' +
            '<div class="rw-result-text"><span class="rw-result-label">Has conseguido</span>' +
            '<strong class="rw-result-name">' + esc(item.name) + '</strong>' +
            '<span class="rw-result-price">' + Number(item.price).toFixed(2) + '€</span></div></div>';
    }

    function cardShell(inner) {
        return '<div class="rw-card"><div class="rw-icon"><i class="fas fa-gift"></i></div>' +
            '<h3 class="rw-title">Caja Diaria</h3>' +
            '<p class="rw-sub">Una caja gratuita cada 24 horas. Sin coste, con skins reales de CS2 (virtuales).</p>' +
            inner + '</div>';
    }

    function renderLoading() {
        root.innerHTML = cardShell('<p class="rw-hint"><i class="fas fa-spinner fa-spin"></i> Cargando…</p>');
    }

    function renderGuest() {
        root.innerHTML = cardShell(
            '<div class="rw-locked"><i class="fas fa-lock"></i>' +
            '<p>Inicia sesión con Steam para reclamar tu caja diaria.</p>' +
            '<a class="cta-button rw-login" href="' + esc(loginHref) + '"><i class="fa-brands fa-steam"></i> Iniciar sesión con Steam</a></div>');
    }

    function renderError(message) {
        root.innerHTML = cardShell('<div class="rw-locked is-error"><i class="fas fa-triangle-exclamation"></i><p>' + esc(message) + '</p>' +
            '<button type="button" class="cta-button rw-retry">Reintentar</button></div>');
        root.querySelector('.rw-retry').addEventListener('click', load);
    }

    function render() {
        clearInterval(tick);
        const ready = status.canClaim || now() >= status.nextClaimAt;
        const tierBadge = status.tier === 'bonus'
            ? '<span class="rw-badge"><i class="fas fa-star"></i> Caja mejorada</span>' : '';
        root.innerHTML = cardShell(
            tierBadge +
            '<div class="rw-stage" id="rwStage" hidden>' +
            '<div class="rw-roulette"><div class="rw-pointer"></div><div class="rw-track" id="rwTrack"></div></div></div>' +
            '<div id="rwResult" aria-live="polite">' + resultHtml(lastResult) + '</div>' +
            '<button type="button" class="rw-claim" id="rwClaim"' + (ready ? '' : ' disabled') + '>' +
            '<i class="fas fa-gift"></i> <span id="rwClaimText">RECLAMAR CAJA DIARIA</span></button>' +
            '<p class="rw-timer" id="rwTimer"></p>') + streakHtml(status.streak, status.tier);
        root.querySelector('#rwClaim').addEventListener('click', claim);
        updateTimer();
        if (!ready) tick = setInterval(updateTimer, 1000);
    }

    function updateTimer() {
        const btn = document.getElementById('rwClaim');
        const text = document.getElementById('rwClaimText');
        const timer = document.getElementById('rwTimer');
        if (!btn || claiming) return;
        const left = status.nextClaimAt - now();
        if (left > 0 && !status.canClaim) {
            btn.disabled = true;
            text.textContent = 'VUELVE EN ' + fmtCountdown(left);
            timer.innerHTML = '<i class="fas fa-clock"></i> Próxima caja disponible en <strong>' + fmtCountdown(left) + '</strong>';
            return;
        }
        // Cooldown over: confirm with the server once (it is the authority)
        if (!status.canClaim) {
            clearInterval(tick);
            load(true);
            return;
        }
        btn.disabled = false;
        text.textContent = 'RECLAMAR CAJA DIARIA';
        timer.innerHTML = '<i class="fas fa-circle-check"></i> ¡Tu caja diaria está lista!';
    }

    // ---------- roulette ----------
    function trackItems(winner) {
        const pools = [];
        if (typeof skins !== 'undefined') {
            ['consumer', 'industrial', 'milspec', 'restricted', 'classified'].forEach((r, i) => {
                (skins[r] || []).forEach(s => { for (let k = 0; k < Math.max(1, 5 - i); k++) pools.push(Object.assign({ rarity: r }, s)); });
            });
        }
        const list = [];
        for (let i = 0; i < TRACK_LENGTH; i++) {
            list.push(i === WINNER_INDEX ? winner : (pools.length ? pools[Math.floor(Math.random() * pools.length)] : winner));
        }
        return list;
    }

    function spin(item) {
        return new Promise(resolve => {
            const stage = document.getElementById('rwStage');
            const track = document.getElementById('rwTrack');
            if (!stage || !track) return resolve();
            stage.hidden = false;
            track.innerHTML = trackItems(item).map(it =>
                '<div class="rw-reel-item" style="--rw-color:' + rarityColor(it.rarity) + '">' +
                '<img src="' + esc(sd.itemImage(it)) + '" alt=""><span>' + esc(it.name) + '</span></div>').join('');
            track.style.transition = 'none';
            track.style.transform = 'translateX(0)';
            const box = stage.querySelector('.rw-roulette');
            const els = track.children;
            const step = els[1].offsetLeft - els[0].offsetLeft;
            const target = els[WINNER_INDEX].offsetLeft + els[WINNER_INDEX].offsetWidth / 2 - box.offsetWidth / 2 + (Math.random() - 0.5) * (els[0].offsetWidth * 0.6);
            const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const ms = reduce ? 300 : ROLL_MS;
            let stopTicks = null;
            setTimeout(() => {
                track.style.transition = 'transform ' + ms + 'ms cubic-bezier(0.15, 0.85, 0.2, 1)';
                track.style.transform = 'translateX(-' + Math.max(0, target) + 'px)';
                const sfx = window.SkinDropSfx;
                if (sfx && !reduce && typeof sfx.watchTranslate === 'function') {
                    stopTicks = sfx.watchTranslate(track, { axis: 'x', step, offset: box.offsetWidth / 2 });
                }
            }, 80);
            setTimeout(() => {
                if (stopTicks) stopTicks();
                resolve();
            }, ms + 250);
        });
    }

    // ---------- actions ----------
    async function claim() {
        if (claiming || !status || !status.canClaim) return;
        claiming = true;
        const btn = document.getElementById('rwClaim');
        const text = document.getElementById('rwClaimText');
        btn.disabled = true;
        text.textContent = 'ABRIENDO…';
        document.getElementById('rwResult').innerHTML = '';
        document.getElementById('rwTimer').textContent = '';
        let resp;
        try {
            resp = await sd.api.post('/api/rewards/claim', {});
        } catch (e) {
            claiming = false;
            sd.showToast(e.message, 'error');
            return load(true);
        }
        const r = resp.result;
        await spin(r.item);
        const sfx = window.SkinDropSfx;
        if (sfx && typeof sfx.drop === 'function') sfx.drop(r.item.rarity);
        sd.applyServerState(resp);   // header balance / inventory update only once the item is revealed
        claiming = false;
        lastResult = r.item;
        status = { canClaim: false, nextClaimAt: r.nextClaimAt, streak: r.streak, tier: Math.min(STREAK_MAX, r.streak + 1) >= BONUS_FROM ? 'bonus' : 'normal' };
        render();
    }

    async function load(quiet) {
        if (!quiet) renderLoading();
        try {
            const s = await sd.api.get('/api/rewards');
            clockOffset = Number(s.serverNow) ? Number(s.serverNow) - Date.now() : 0;
            status = s;
            render();
        } catch (e) {
            if (e.status === 401) return renderGuest();
            renderError(e.message || 'No se pudo cargar tu recompensa.');
        }
    }

    load();
})();
