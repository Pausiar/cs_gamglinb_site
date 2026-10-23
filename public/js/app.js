// ==================== APP STATE ====================
// Two copies of the profile:
//  - `auth`: the authoritative state (engine format, no images). For guests it
//    lives in localStorage; for Steam users it is whatever the server returned.
//  - `state`: what the UI shows (items hydrated with images). While an
//    animation is running, the items it is about to reveal are hidden (see holds).
const Engine = window.SkinDropEngine;
const GUEST_KEY = 'skinDropState';

let auth = Engine.defaultState();
let state = null;            // set right below, once the holds exist
let mode = 'guest';          // 'guest' | 'server'
let serverSteamId = null;
let profileSeq = 0;          // bumps on every profile switch (drops stale responses)
// Logged-in user whose server profile has not arrived yet: the balance shows "…" and actions are
// refused (never the guest profile). Triggered by the sd_hint cookie (see the boot code at the
// bottom) or by setServerMode(); cleared when the server state is in or guest mode starts.
let profileLoading = false;
let profileLoadError = '';   // set when the server profile could not be loaded

// ---------- images ----------
const skinImages = new Map();
Object.values(skins).forEach(list => list.forEach(s => skinImages.set(s.id, s.image)));

function itemImage(item) {
    return (item && skinImages.get(item.id)) || SKIN_PLACEHOLDER;
}

function hydrate(item) {
    return Object.assign({}, item, { image: itemImage(item) });
}

// ---------- holds: hide not-yet-revealed results ----------
const holds = new Map(); // token -> { uids:Set, stats, timer }
let holdSeq = 0;

function hiddenUids() {
    const out = new Set();
    holds.forEach(h => h.uids.forEach(u => out.add(u)));
    return out;
}

function addHold(uids, statsBefore) {
    const token = ++holdSeq;
    const hold = { uids: new Set(uids), stats: statsBefore, timer: null };
    // Safety net: never keep things hidden forever
    hold.timer = setTimeout(() => releaseHold(token), 120000);
    holds.set(token, hold);
    return () => releaseHold(token);
}

function releaseHold(token) {
    const h = holds.get(token);
    if (!h) return;
    clearTimeout(h.timer);
    holds.delete(token);
    refreshDisplay();
}

function clearHolds() {
    holds.forEach(h => clearTimeout(h.timer));
    holds.clear();
}

function displayFrom(src, prev) {
    const hidden = hiddenUids();
    const first = holds.size ? holds.values().next().value : null;
    const stats = first ? first.stats : src.stats;
    return {
        balance: src.balance,
        inventory: src.inventory.filter(i => !hidden.has(i.uid)).map(hydrate),
        stats: Object.assign({}, stats, { rarityDrops: Object.assign({}, stats.rarityDrops) }),
        history: src.history.filter(h => !h.uid || !hidden.has(h.uid)).map(hydrate),
        currentCase: prev ? prev.currentCase : null,
        isSpinning: prev ? prev.isSpinning : false
    };
}

state = displayFrom(auth, null);

function refreshDisplay() {
    state = displayFrom(auth, state);
    updateUI();
    renderCases(currentFilter);
}

// ---------- persistence ----------
// Guest saves from older versions may hold an unsettled upgrade: settle it once.
function settleLegacyPending(saved) {
    const p = saved && saved.pendingUpgrade;
    if (!p) return saved;
    delete saved.pendingUpgrade;
    const info = p.win && p.target ? Engine.skinInfo(Number(p.target.id)) : null;
    if (info) {
        saved.inventory = (Array.isArray(saved.inventory) ? saved.inventory : []).concat([{ id: info.id }]);
        saved.stats = saved.stats || {};
        saved.stats.totalWon = Engine.round2((Number(saved.stats.totalWon) || 0) + info.price);
        saved.history = (Array.isArray(saved.history) ? saved.history : []).concat([
            { id: info.id, price: info.price, caseName: 'Upgrader', timestamp: Date.now() }
        ]);
    }
    return saved;
}

function loadGuestState() {
    let saved = null;
    try {
        saved = JSON.parse(localStorage.getItem(GUEST_KEY));
    } catch (e) {
        saved = null;
    }
    const s = Engine.normalizeState(settleLegacyPending(saved), Math.random);
    return s;
}

// Only guests persist locally; Steam profiles live on the server
function saveState() {
    if (mode !== 'guest') return;
    try {
        localStorage.setItem(GUEST_KEY, JSON.stringify(auth));
    } catch (e) {
        // Storage unavailable (private mode, quota); state stays in memory
    }
}

function setAuth(next) {
    auth = next;
    saveState();
    refreshDisplay();
}

function resetSession() {
    profileSeq++;
    clearHolds();
    actionQueue = Promise.resolve();
    state.isSpinning = false;
    document.dispatchEvent(new CustomEvent('skindrop:profilechange', { detail: { mode, steamId: serverSteamId } }));
}

// The "…" balance + disabled actions state shown while a logged-in user's profile loads
function setProfileLoading(on) {
    profileLoading = on;
    if (on) profileLoadError = '';
    document.documentElement.classList.toggle('sd-loading', on);
    if (on) setText('balance', '…');
}

function useGuestMode() {
    mode = 'guest';
    serverSteamId = null;
    setProfileLoading(false);
    resetSession();
    auth = loadGuestState();
    saveState();
    refreshDisplay();
}

async function fetchServerState(seq) {
    const json = await api.get('/api/state');
    if (!json || !json.state) throw new Error('Respuesta del servidor no válida.');
    if (seq !== profileSeq) return;
    auth = Engine.normalizeState(json.state);
    refreshDisplay();
}

// Logged-in Steam user: the server is the source of truth
async function setServerMode(steamId) {
    if (!steamId) return useGuestMode();
    mode = 'server';
    serverSteamId = String(steamId);
    setProfileLoading(true);
    resetSession();
    auth = Engine.defaultState();
    refreshDisplay();
    const seq = profileSeq;
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            await fetchServerState(seq);
            if (seq === profileSeq) {
                setProfileLoading(false);
                refreshDisplay();   // real balance replaces the "…"
            }
            return true;
        } catch (e) {
            if (attempt === 0) await new Promise(r => setTimeout(r, 1500));
            else {
                // Stay in the loading state (never fall back to a made-up balance)
                profileLoadError = 'No se pudo cargar tu perfil. Recarga la página.';
                showToast('No se pudo cargar tu perfil: ' + e.message, 'error');
            }
        }
    }
    return false;
}

// Back-compat: null = guest, steamId = server profile
function switchProfile(steamId) {
    return steamId ? setServerMode(steamId) : useGuestMode();
}

// ==================== ACTIONS ====================
// Every economy change goes through here. Returns Promise<{state, result, reveal}>.
// Logged in -> server API (authoritative); guest -> same engine, locally.
// Results that an animation reveals later (opened item, upgrade win, battle
// winnings) stay hidden in the UI until reveal() is called.
const ACTION_ENDPOINTS = {
    openCase: '/api/open',
    sellItems: '/api/sell',
    upgrade: '/api/upgrade',
    battle: '/api/battle',
    redeemPromo: '/api/promo'
};
let actionQueue = Promise.resolve();

// JSON request to the same-origin server API. Rejects with an Error (message in Spanish) that
// also carries `status` and `code`. Feature scripts can use it through SkinDrop.api.
async function request(method, url, body) {
    const init = {
        method,
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
    };
    if (method === 'GET') {
        init.cache = 'no-store';
    } else {
        init.headers['Content-Type'] = 'application/json';
        init.body = JSON.stringify(body || {});
    }
    let resp;
    try {
        resp = await fetch(url, init);
    } catch (e) {
        throw new Error('Sin conexión con el servidor. Inténtalo de nuevo.');
    }
    const json = await resp.json().catch(() => null);
    if (!resp.ok || !json) {
        let message;
        if (resp.status === 401) message = 'Tu sesión ha caducado. Vuelve a iniciar sesión con Steam.';
        else message = (json && json.error) || 'Error del servidor (' + resp.status + ').';
        const err = new Error(message);
        err.status = resp.status;
        err.code = json && json.code;
        throw err;
    }
    return json;
}

const api = {
    get: url => request('GET', url),
    post: (url, body) => request('POST', url, body)
};

function callServer(name, params) {
    return api.post(ACTION_ENDPOINTS[name], params);
}

function revealUids(name, result) {
    if (name === 'openCase') return [result.item.uid];
    if (name === 'upgrade') return result.item ? [result.item.uid] : [];
    if (name === 'battle') return (result.items || []).map(i => i.uid);
    return [];
}

function runAction(name, params, opts) {
    const holdResult = !!(opts && opts.hold);
    const job = async () => {
        const seq = profileSeq;
        const statsBefore = auth.stats;
        let out;
        if (mode === 'server') {
            out = await callServer(name, params);
            if (seq !== profileSeq) throw new Error('El perfil ha cambiado.');
            out = { state: Engine.normalizeState(out.state), result: out.result };
        } else {
            try {
                out = Engine.actions[name](auth, params, Math.random);
            } catch (e) {
                throw new Error(e && e.message ? e.message : 'Acción no válida.');
            }
        }
        let reveal = () => {};
        if (holdResult) {
            const uids = revealUids(name, out.result);
            reveal = addHold(uids, statsBefore);
        }
        setAuth(out.state);
        return { state: out.state, result: out.result, reveal };
    };
    const run = actionQueue.then(job, job);
    actionQueue = run.catch(() => {});
    return run;
}

const actions = {
    openCase: params => runAction('openCase', params, { hold: true }),
    sell: params => runAction('sellItems', params),
    upgrade: params => runAction('upgrade', params, { hold: true }),
    battle: params => runAction('battle', params, { hold: true }),
    promo: params => runAction('redeemPromo', params)
};

// Replaces the profile with a state returned by the server (the `state` of an /api/* response,
// or the whole response) and redraws. Only meaningful for logged-in users: in guest mode it is
// ignored (returns false) so a stray server state never overwrites the local profile.
function applyServerState(next) {
    const raw = next && next.state ? next.state : next;
    if (mode !== 'server' || !raw || typeof raw !== 'object') return false;
    auth = Engine.normalizeState(raw);
    refreshDisplay();
    return true;
}

// Re-reads the profile (GET /api/state when logged in, localStorage for guests) and redraws.
// Runs in the action queue, so it never overtakes an action that is still in flight.
// Resolves with the display state; rejects if the server cannot be reached.
function refreshState() {
    const job = async () => {
        if (mode === 'server') {
            await fetchServerState(profileSeq);
        } else {
            auth = loadGuestState();
            refreshDisplay();
        }
        return state;
    };
    const run = actionQueue.then(job, job);
    actionQueue = run.catch(() => {});
    return run;
}


// ==================== UI HELPERS ====================
function byId(id) {
    return document.getElementById(id);
}

function setText(id, text) {
    const el = byId(id);
    if (el) el.textContent = text;
}

function escapeHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ==================== UI UPDATES ====================
// Every part below renders only if its elements exist on the current page
// (hero stats: index, stats/history/rarity: estadisticas, inventory: inventario,
// cases: cajas / index). The header balance exists on every page.
function updateUI() {
    setText('balance', state.balance.toFixed(2));

    updateHeroStats();
    updateStatsCards();
    updateRarityBars();
    updateHistory();
    updateInventory();

    // Let feature modules (upgrader, battles, auth, ...) re-render
    document.dispatchEvent(new CustomEvent('skindrop:statechange'));
}

function updateHeroStats() {
    if (!byId('totalOpened')) return;
    setText('totalOpened', state.stats.casesOpened);
    setText('totalWon', state.stats.totalWon.toFixed(2) + '€');

    let best = '-';
    if (state.history.length > 0) {
        const bestDrop = state.history.reduce((b, current) => current.price > b.price ? current : b);
        best = bestDrop.name.length > 18 ? bestDrop.name.substring(0, 15) + '...' : bestDrop.name;
    }
    setText('bestDrop', best);
}

function updateStatsCards() {
    const profitElement = byId('statProfit');
    if (!profitElement) return;
    setText('statCasesOpened', state.stats.casesOpened);
    setText('statTotalSpent', state.stats.totalSpent.toFixed(2) + '€');
    setText('statTotalWon', state.stats.totalWon.toFixed(2) + '€');

    const profit = state.stats.totalWon - state.stats.totalSpent;
    profitElement.textContent = (profit >= 0 ? '+' : '') + profit.toFixed(2) + '€';
    const profitCard = profitElement.closest('.stats-card');
    if (profitCard) profitCard.classList.toggle('negative', profit < 0);
}

function updateRarityBars() {
    if (!byId('rarityBars')) return;
    const total = Object.values(state.stats.rarityDrops).reduce((a, b) => a + b, 0);

    for (const [rarity, count] of Object.entries(state.stats.rarityDrops)) {
        const percentage = total > 0 ? (count / total) * 100 : 0;
        const bar = document.querySelector(`.bar-fill[data-rarity="${rarity}"]`);
        const countElement = byId(`count${rarity.charAt(0).toUpperCase() + rarity.slice(1)}`);

        if (bar) bar.style.width = percentage + '%';
        if (countElement) countElement.textContent = count;
    }
}

function updateHistory() {
    const historyList = byId('historyList');
    if (!historyList) return;

    if (state.history.length === 0) {
        historyList.innerHTML = '<p class="no-history">Aún no has abierto ninguna caja</p>';
        return;
    }

    historyList.innerHTML = state.history.slice().reverse().slice(0, 50).map(item => `
        <div class="history-item ${escapeHtml(item.rarity)}">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
            <div class="history-item-info">
                <div class="history-item-name">${escapeHtml(item.name)}</div>
                <div class="history-item-case">${escapeHtml(item.caseName)}</div>
            </div>
            <div class="history-item-price">${item.price.toFixed(2)}€</div>
            <div class="history-item-time">${formatTime(item.timestamp)}</div>
        </div>
    `).join('');
}

function updateInventory() {
    const inventoryGrid = byId('inventoryGrid');
    if (!inventoryGrid) return;

    const totalValue = state.inventory.reduce((sum, item) => sum + item.price, 0);
    setText('inventoryValue', totalValue.toFixed(2) + '€');

    if (state.inventory.length === 0) {
        inventoryGrid.innerHTML = '<p class="no-items">Tu inventario está vacío</p>';
        return;
    }

    inventoryGrid.innerHTML = state.inventory.map(item => `
        <div class="inventory-item ${escapeHtml(item.rarity)}">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
            <div class="inventory-item-name">${escapeHtml(item.name)}</div>
            <div class="inventory-item-price">${item.price.toFixed(2)}€</div>
            <button type="button" class="inventory-sell-btn" data-sell-uid="${escapeHtml(item.uid)}">
                <i class="fas fa-coins"></i> Vender
            </button>
        </div>
    `).join('');
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Ahora';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' min';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' h';
    return date.toLocaleDateString();
}

// ==================== CASES GRID ====================
// #casesGrid (cajas) shows every case with filters; #featuredCases (index) shows a
// short row of links to the cases page.
let currentFilter = 'all';
const FEATURED_CASE_IDS = [1, 3, 5, 7];

function caseCardHtml(caseItem, link) {
    const bestItem = caseItem.items.reduce((best, current) =>
        current.price > best.price ? current : best
    );
    const art = `
        <div class="case-image">
            <img src="${escapeHtml(caseItem.image)}" alt="${escapeHtml(caseItem.name)}">
            <div class="case-best-drop">
                <i class="fas fa-star"></i>
                ${bestItem.price.toFixed(2)}€
            </div>
        </div>`;
    if (link) {
        return `
            <a class="case-card" href="${escapeHtml(link)}">
                ${art}
                <div class="case-info">
                    <h3 class="case-name">${escapeHtml(caseItem.name)}</h3>
                    <div class="case-price">
                        <span class="price-value">${caseItem.price.toFixed(2)}€</span>
                        <span class="open-btn">VER</span>
                    </div>
                </div>
            </a>`;
    }
    return `
        <div class="case-card" data-case-id="${caseItem.id}" role="button" tabindex="0">
            ${art}
            <div class="case-info">
                <h3 class="case-name">${escapeHtml(caseItem.name)}</h3>
                <div class="case-price">
                    <span class="price-value">${caseItem.price.toFixed(2)}€</span>
                    <button type="button" class="open-btn" tabindex="-1" ${state.balance < caseItem.price ? 'disabled' : ''}>
                        ABRIR
                    </button>
                </div>
            </div>
        </div>`;
}

function renderCases(filter = currentFilter) {
    currentFilter = filter;
    const casesGrid = byId('casesGrid');
    if (!casesGrid) return;

    const filteredCases = filter === 'all'
        ? cases
        : cases.filter(c => c.category === filter);

    casesGrid.innerHTML = filteredCases.map(caseItem => caseCardHtml(caseItem)).join('');
}

function renderFeaturedCases() {
    const row = byId('featuredCases');
    if (!row) return;
    const casesPage = window.SkinDropLayout ? window.SkinDropLayout.href('cajas') : '/cajas';
    row.innerHTML = FEATURED_CASE_IDS
        .map(id => cases.find(c => c.id === id))
        .filter(Boolean)
        .map(c => caseCardHtml(c, casesPage))
        .join('');
}

// Live feed (index): real drops rendered by js/feed.js

// ==================== BALANCE MODAL (injected by layout.js on every page) ====================
const balanceModal = byId('balanceModal');
const addBalanceBtn = byId('addBalanceBtn');
const closeModalBtn = byId('closeModal');
const applyCodeBtn = byId('applyCode');
const promoCodeInput = byId('promoCode');
let promoBusy = false;

function initBalanceModal() {
    if (!balanceModal || !addBalanceBtn) return;

    addBalanceBtn.addEventListener('click', () => {
        balanceModal.classList.add('active');
        if (promoCodeInput) promoCodeInput.focus();
    });

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => balanceModal.classList.remove('active'));
    }

    balanceModal.addEventListener('click', (e) => {
        if (e.target === balanceModal) balanceModal.classList.remove('active');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') balanceModal.classList.remove('active');
    });

    if (!applyCodeBtn || !promoCodeInput) return;

    applyCodeBtn.addEventListener('click', async () => {
        const code = promoCodeInput.value.toLowerCase().trim();
        if (!code) {
            showToast('Código inválido', 'error');
            return;
        }
        if (promoBusy) return;
        promoBusy = true;
        applyCodeBtn.disabled = true;
        try {
            const { result } = await actions.promo({ code });
            showToast(`¡Código aplicado! +${result.amount.toLocaleString('es-ES')}€`, 'success');
            promoCodeInput.value = '';
            balanceModal.classList.remove('active');
        } catch (e) {
            showToast(e.message, 'error');
        } finally {
            promoBusy = false;
            applyCodeBtn.disabled = false;
        }
    });

    promoCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') applyCodeBtn.click();
    });
}

// ==================== CASE OPENING (cajas) ====================
const openingModal = byId('openingModal');
const closeOpeningBtn = byId('closeOpening');
const rouletteTrack = byId('rouletteTrack');
const wonItemDisplay = byId('wonItemDisplay');
const contentsGrid = byId('contentsGrid');
let stopRouletteTicks = null;

function sfx() {
    return window.SkinDropSfx || null;
}

function openCaseModal(caseId) {
    if (!openingModal) return;
    const caseData = cases.find(c => c.id === caseId);
    if (!caseData || state.isSpinning) return;

    if (state.balance < caseData.price) {
        showToast('Saldo insuficiente', 'error');
        return;
    }

    state.currentCase = caseData;

    // Show modal
    openingModal.classList.add('active');
    wonItemDisplay.classList.remove('active');
    rouletteTrack.style.display = 'flex';
    rouletteTrack.innerHTML = '';

    // Update case name
    byId('openingCaseName').textContent = caseData.name;

    // Show case contents
    showCaseContents(caseData);

    // Start opening
    startCaseOpening(caseData);
}

function showCaseContents(caseData) {
    const chances = getItemChances(caseData.items);
    const note = byId('contentsNote');
    if (note) {
        const updated = typeof priceSource !== 'undefined' && priceSource.updated ? priceSource.updated : '';
        note.textContent = 'Precios de referencia del mercado (Skinport, EUR' + (updated ? ', ' + updated : '') +
            '). No son precios de venta: las skins son virtuales y no se pueden retirar.';
    }
    contentsGrid.innerHTML = caseData.items.map((item, i) => {
        const rarity = getRarity(item);
        const chance = formatChance(chances[i]);

        return `
            <div class="content-item ${rarity}">
                <img src="${item.image}" alt="${item.name}">
                <div class="content-item-name">${item.name}</div>
                <div class="content-item-price">${item.price.toFixed(2)}€</div>
                <div class="content-item-chance">${chance}</div>
            </div>
        `;
    }).join('');
}

// The drop is decided (and persisted) by actions.openCase before the roulette
// spins; the animation only lands on it. The item stays hidden in the
// inventory/history until the roulette stops.
async function startCaseOpening(caseData) {
    if (state.isSpinning) return;
    state.isSpinning = true;

    let out;
    try {
        out = await actions.openCase({ caseId: caseData.id });
    } catch (e) {
        state.isSpinning = false;
        showToast(e.message, 'error');
        if (!wonItemDisplay.classList.contains('active')) openingModal.classList.remove('active');
        return;
    }
    const winner = hydrate(out.result.item);
    const winnerRarity = out.result.rarity;

    // Generate roulette items (100 items)
    const rouletteItems = [];
    for (let i = 0; i < 100; i++) {
        const randomItem = caseData.items[Math.floor(Math.random() * caseData.items.length)];
        rouletteItems.push(randomItem);
    }

    // Place winner at position 85-90
    const winnerPosition = 85 + Math.floor(Math.random() * 5);
    rouletteItems[winnerPosition] = winner;

    // Render roulette
    rouletteTrack.innerHTML = rouletteItems.map(item => {
        const rarity = getRarity(item);
        return `
            <div class="roulette-item ${rarity}">
                <img src="${item.image}" alt="${item.name}">
                <div class="roulette-item-name">${item.name}</div>
                <div class="roulette-item-price">${item.price.toFixed(2)}€</div>
            </div>
        `;
    }).join('');

    // Reset position
    rouletteTrack.style.transition = 'none';
    rouletteTrack.style.transform = 'translateX(0)';

    // Measure the real layout (item size changes with the viewport): land on the winner's centre
    const containerWidth = document.querySelector('.roulette-container').offsetWidth;
    const winnerEl = rouletteTrack.children[winnerPosition];
    const itemStep = rouletteTrack.children[1].offsetLeft - rouletteTrack.children[0].offsetLeft;
    const targetPosition = winnerEl.offsetLeft + winnerEl.offsetWidth / 2 - containerWidth / 2;

    // Add some randomness to final position
    const randomOffset = (Math.random() - 0.5) * 40;

    // Start animation after a small delay
    setTimeout(() => {
        rouletteTrack.style.transition = 'transform 5s cubic-bezier(0.15, 0.85, 0.2, 1)';
        rouletteTrack.style.transform = `translateX(-${targetPosition + randomOffset}px)`;
        if (stopRouletteTicks) stopRouletteTicks();
        if (sfx()) {
            stopRouletteTicks = sfx().watchTranslate(rouletteTrack, { axis: 'x', step: itemStep, offset: containerWidth / 2 });
        }
    }, 100);

    // Show winner after animation
    setTimeout(() => {
        showWinner(winner, winnerRarity, out.reveal);
    }, 5200);
}

function showWinner(winner, rarity, reveal) {
    state.isSpinning = false;
    if (stopRouletteTicks) { stopRouletteTicks(); stopRouletteTicks = null; }
    if (sfx()) sfx().drop(rarity);

    // The drop is already in the inventory: make it visible now
    reveal();

    // Hide roulette, show winner
    rouletteTrack.style.display = 'none';
    wonItemDisplay.classList.add('active');

    // Update winner display
    byId('wonItemImage').src = winner.image;
    byId('wonItemImage').alt = winner.name;
    byId('wonItemName').textContent = winner.name;
    byId('wonItemName').style.color = getRarityColor(rarity);
    byId('wonItemPrice').textContent = winner.price.toFixed(2) + '€';

    // Update glow color
    const glow = document.querySelector('.won-item-glow');
    glow.style.background = `radial-gradient(circle, ${getRarityColor(rarity)}40 0%, transparent 70%)`;

    // Buttons act on this drop once (sell, or keep = leave it in the inventory)
    wonItemDisplay.dataset.uid = winner.uid;
    wonItemDisplay.dataset.price = String(winner.price);
    wonItemDisplay.dataset.claimed = '';
}

function initCaseOpening() {
    if (!openingModal || !rouletteTrack || !wonItemDisplay) return;

    // Winner action buttons
    byId('sellBtn').addEventListener('click', async () => {
        if (wonItemDisplay.dataset.claimed) return;
        wonItemDisplay.dataset.claimed = '1';
        try {
            const { result } = await actions.sell({ uids: [wonItemDisplay.dataset.uid] });
            showToast(`Vendido por ${result.amount.toFixed(2)}€`, 'success');
        } catch (e) {
            showToast(e.message, 'error');
        }
    });

    byId('keepBtn').addEventListener('click', () => {
        if (!wonItemDisplay.dataset.claimed) {
            wonItemDisplay.dataset.claimed = '1';
            showToast('Guardado en inventario', 'success');
        }
        openingModal.classList.remove('active');
    });

    byId('openAgainBtn').addEventListener('click', () => {
        if (state.isSpinning) return;
        if (state.currentCase && state.balance >= state.currentCase.price) {
            // An unclaimed drop simply stays in the inventory
            wonItemDisplay.dataset.claimed = '1';
            wonItemDisplay.classList.remove('active');
            rouletteTrack.style.display = 'flex';
            startCaseOpening(state.currentCase);
        } else {
            showToast('Saldo insuficiente', 'error');
        }
    });

    closeOpeningBtn.addEventListener('click', () => {
        if (!state.isSpinning) {
            if (wonItemDisplay.classList.contains('active') && !wonItemDisplay.dataset.claimed) {
                wonItemDisplay.dataset.claimed = '1';
                showToast('Guardado en inventario', 'success');
            }
            openingModal.classList.remove('active');
        }
    });
}

function initCasesGrid() {
    const grid = byId('casesGrid');
    if (!grid) return;

    grid.addEventListener('click', (e) => {
        const card = e.target.closest('.case-card[data-case-id]');
        if (card) openCaseModal(Number(card.dataset.caseId));
    });
    grid.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const card = e.target.closest('.case-card[data-case-id]');
        if (!card || e.target !== card) return;
        e.preventDefault();
        openCaseModal(Number(card.dataset.caseId));
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderCases(btn.dataset.filter);
        });
    });
}

// ==================== INVENTORY ACTIONS (inventario) ====================
async function sellInventoryItem(uid) {
    if (!state.inventory.some(i => i.uid === uid)) return;
    try {
        const { result } = await actions.sell({ uids: [uid] });
        showToast(`Vendido por ${result.amount.toFixed(2)}€`, 'success');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function initInventory() {
    const grid = byId('inventoryGrid');
    if (!grid) return;
    grid.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-sell-uid]');
        if (btn) sellInventoryItem(btn.dataset.sellUid);
    });
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'success') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'status');
    const icon = document.createElement('i');
    icon.className = `toast-icon fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}`;
    const text = document.createElement('span');
    text.textContent = message;
    toast.append(icon, text);

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastSlideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================== INITIALIZATION ====================
initBalanceModal();
initCaseOpening();
initCasesGrid();
initInventory();

// ---------- logged-in user: loading state instead of the guest profile ----------
// The server sets the non-HttpOnly cookie sd_hint=1 at login (and clears it at logout). It only
// drives the UX - the real authentication is the signed HttpOnly session - so if it is stale,
// auth.js sees /api/me say "not logged in" and calls useGuestMode().
function hasLoginHint() {
    try {
        return /(?:^|;\s*)sd_hint=1(?:;|$)/.test(document.cookie);
    } catch (e) {
        return false;
    }
}

function loadingNotice() {
    showToast(profileLoadError || 'Cargando tu perfil…', profileLoadError ? 'error' : 'info');
}

// While the profile loads, clicks on anything that could act on the economy (buttons, case cards)
// outside the header are swallowed with a toast; programmatic callers get a rejected promise.
const LOADING_BLOCKED = 'button, [role="button"], input[type="submit"], .case-card[data-case-id]';
const LOADING_ALLOWED = '.header, #authContainer, .filter-btn, .close-modal, [data-allow-loading]';

function installLoadingGuards() {
    document.addEventListener('click', (e) => {
        if (!profileLoading || !e.target.closest) return;
        const hit = e.target.closest(LOADING_BLOCKED);
        if (!hit || hit.closest(LOADING_ALLOWED)) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        loadingNotice();
    }, true);
    document.addEventListener('keydown', (e) => {
        if (!profileLoading || (e.key !== 'Enter' && e.key !== ' ') || !e.target.closest) return;
        const hit = e.target.closest(LOADING_BLOCKED);
        if (!hit || hit.closest(LOADING_ALLOWED)) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        loadingNotice();
    }, true);
    // Anything redrawing the header balance meanwhile keeps showing "…"
    document.addEventListener('skindrop:statechange', () => {
        if (profileLoading) setText('balance', '…');
    });
    Object.keys(actions).forEach((name) => {
        const run = actions[name];
        actions[name] = (...args) => {
            if (!profileLoading) return run(...args);
            const err = new Error(profileLoadError || 'Cargando tu perfil…');
            err.code = 'profile_loading';
            return Promise.reject(err);
        };
    });
}

installLoadingGuards();
if (hasLoginHint()) {
    // Never show (or act on) the guest profile: start empty, balance "…", until setServerMode finishes
    mode = 'server';
    auth = Engine.defaultState();
    state = displayFrom(auth, state);
    setProfileLoading(true);
}

document.addEventListener('DOMContentLoaded', () => {
    // Guest state first (unless a login hint says the server profile is coming); auth.js switches
    // to the server profile after /api/me
    if (!profileLoading) auth = loadGuestState();
    refreshDisplay();
    renderFeaturedCases();
});

// Kept global for compatibility
window.sellInventoryItem = sellInventoryItem;
window.openCaseModal = openCaseModal;

// Shared API for feature modules (upgrader.js, battles.js, auth.js, and future pages).
// `state` is read-only for them: every change goes through `actions`, or through
// `applyServerState` / `refreshState` when a script calls its own endpoint (see `api`).
window.SkinDrop = {
    get state() { return state; },
    get mode() { return mode; },
    get steamId() { return serverSteamId; },
    actions,
    api,                 // api.get(url) / api.post(url, body) -> parsed JSON; throws Error with .status / .code
    updateUI,
    refreshState,        // () => Promise<state>: re-fetch /api/state (logged in) or re-read local data, then updateUI
    applyServerState,    // (state | {state}) => boolean: replace the profile with a server response, then updateUI
    renderCases: () => renderCases(currentFilter),
    switchProfile,
    setServerMode,
    useGuestMode,
    showToast,
    escapeHtml,
    itemImage,
    hydrate,
    rollItem,
    getItemChances,
    formatChance,
    getRarity,
    getRarityColor
};
