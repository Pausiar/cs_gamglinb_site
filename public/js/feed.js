// Home page live strip: real drops from GET /api/feed (guests' local drops are never shown).
// Renders into #liveFeed, scrolls smoothly and forever (the list is repeated until it is wider
// than the strip, then doubled: css/home.css animates the container by -50%), polls every 20 s.
(function () {
    'use strict';

    const FEED_URL = '/api/feed?limit=20';
    const POLL_MS = 20000;
    const PX_PER_SECOND = 55;
    const MIN_DURATION_S = 20;

    const root = document.getElementById('liveFeed');
    if (!root) return;

    let lastKey = null;
    let timer = null;

    function esc(str) {
        return String(str == null ? '' : str).replace(/[&<>"']/g, c =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function rarityColor(rarity) {
        const known = ['consumer', 'industrial', 'milspec', 'restricted', 'classified', 'covert', 'gold'];
        return 'var(--rarity-' + (known.indexOf(rarity) >= 0 ? rarity : 'consumer') + ')';
    }

    function skinImage(itemId) {
        const sd = window.SkinDrop;
        if (sd && typeof sd.itemImage === 'function') return sd.itemImage({ id: itemId });
        return window.SKIN_PLACEHOLDER || '';
    }

    function skinName(itemId) {
        const info = window.SkinDropEngine && window.SkinDropEngine.skinInfo(itemId);
        return info ? info.name : 'Skin';
    }

    function avatarHtml(d) {
        if (d.avatar && /^https:\/\//i.test(d.avatar)) {
            return '<img class="live-avatar" src="' + esc(d.avatar) + '" alt="" width="24" height="24" loading="lazy" referrerpolicy="no-referrer">';
        }
        const initial = (d.name || '?').trim().charAt(0).toUpperCase() || '?';
        return '<span class="live-avatar live-avatar-fallback" aria-hidden="true">' + esc(initial) + '</span>';
    }

    function itemHtml(d) {
        const name = skinName(d.itemId);
        const title = d.name + ' ha conseguido ' + name + (d.caseName ? ' (' + d.caseName + ')' : '');
        return '<div class="live-item" title="' + esc(title) + '">' +
            avatarHtml(d) +
            '<span class="live-user">' + esc(d.name) + '</span>' +
            '<img class="live-skin" src="' + esc(skinImage(d.itemId)) + '" alt="' + esc(name) + '" loading="lazy">' +
            '<span class="live-item-price" style="color:' + rarityColor(d.rarity) + '">' + Number(d.price).toFixed(2) + '€</span>' +
            '</div>';
    }

    function renderEmpty() {
        root.classList.add('is-empty');
        root.style.animationDuration = '';
        root.innerHTML = '<div class="live-item live-empty"><i class="fas fa-box-open"></i>' +
            '<span class="live-user">Aún no hay drops — ¡sé el primero!</span></div>';
    }

    // Current position of the running scroll animation as a fraction of one loop (0..1)
    function currentPhase() {
        try {
            const m = new DOMMatrixReadOnly(getComputedStyle(root).transform);
            const half = root.scrollWidth / 2;
            if (half > 0 && m.m41 <= 0) return Math.min(0.999, -m.m41 / half);
        } catch (e) { /* no transform yet */ }
        return 0;
    }

    function render(drops) {
        const key = drops.map(d => d.id).join(',');
        if (key === lastKey) return;
        lastKey = key;

        if (!drops.length) return renderEmpty();
        const phase = root.classList.contains('is-empty') ? 0 : currentPhase();
        root.classList.remove('is-empty');

        const one = drops.map(itemHtml).join('');
        // Measure one set, repeat it until it fills the strip, then double it for the seamless loop
        root.style.animation = 'none';
        root.innerHTML = one;
        const strip = root.parentElement ? root.parentElement.clientWidth : window.innerWidth;
        const setWidth = Math.max(1, root.scrollWidth);
        const repeats = Math.max(1, Math.ceil((strip + 40) / setWidth));
        const set = new Array(repeats + 1).join(one);
        root.innerHTML = set + set;
        const loopPx = root.scrollWidth / 2;
        const duration = Math.max(MIN_DURATION_S, loopPx / PX_PER_SECOND);
        root.style.animation = '';
        root.style.animationDuration = duration.toFixed(1) + 's';
        root.style.animationDelay = '-' + (phase * duration).toFixed(2) + 's';
    }

    async function load() {
        try {
            const resp = await fetch(FEED_URL, { credentials: 'omit', headers: { Accept: 'application/json' } });
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const json = await resp.json();
            render(Array.isArray(json.drops) ? json.drops : []);
        } catch (e) {
            if (lastKey === null) renderEmpty();   // first load failed: show the friendly empty strip
        }
    }

    function schedule() {
        clearTimeout(timer);
        if (document.hidden) return;
        timer = setTimeout(async () => { await load(); schedule(); }, POLL_MS);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) return clearTimeout(timer);
        load().then(schedule);
    });

    load().then(schedule);
})();
