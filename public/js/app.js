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

function useGuestMode() {
    mode = 'guest';
    serverSteamId = null;
    resetSession();
    auth = loadGuestState();
    saveState();
    refreshDisplay();
}

async function fetchServerState(seq) {
    const resp = await fetch('/api/state', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        cache: 'no-store'
    });
    const json = await resp.json().catch(() => null);
    if (!resp.ok || !json || !json.state) throw new Error((json && json.error) || 'HTTP ' + resp.status);
    if (seq !== profileSeq) return;
    auth = Engine.normalizeState(json.state);
    refreshDisplay();
}

// Logged-in Steam user: the server is the source of truth
async function setServerMode(steamId) {
    if (!steamId) return useGuestMode();
    mode = 'server';
    serverSteamId = String(steamId);
    resetSession();
    auth = Engine.defaultState();
    refreshDisplay();
    const seq = profileSeq;
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            await fetchServerState(seq);
            return true;
        } catch (e) {
            if (attempt === 0) await new Promise(r => setTimeout(r, 1500));
            else showToast('No se pudo cargar tu perfil: ' + e.message, 'error');
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

async function callServer(name, params) {
    let resp;
    try {
        resp = await fetch(ACTION_ENDPOINTS[name], {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(params || {})
        });
    } catch (e) {
        throw new Error('Sin conexión con el servidor. Inténtalo de nuevo.');
    }
    const json = await resp.json().catch(() => null);
    if (!resp.ok || !json) {
        if (resp.status === 401) throw new Error('Tu sesión ha caducado. Vuelve a iniciar sesión con Steam.');
        throw new Error((json && json.error) || 'Error del servidor (' + resp.status + ').');
    }
    return json;
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

// ==================== UI UPDATES ====================
function updateUI() {
    // Update balance
    document.getElementById('balance').textContent = state.balance.toFixed(2);
    
    // Update hero stats
    document.getElementById('totalOpened').textContent = state.stats.casesOpened;
    document.getElementById('totalWon').textContent = state.stats.totalWon.toFixed(2) + '€';
    
    // Find best drop
    if (state.history.length > 0) {
        const bestDrop = state.history.reduce((best, current) => 
            current.price > best.price ? current : best
        );
        document.getElementById('bestDrop').textContent = bestDrop.name.length > 18
            ? bestDrop.name.substring(0, 15) + '...'
            : bestDrop.name;
    } else {
        document.getElementById('bestDrop').textContent = '-';
    }
    
    // Update stats section
    document.getElementById('statCasesOpened').textContent = state.stats.casesOpened;
    document.getElementById('statTotalSpent').textContent = state.stats.totalSpent.toFixed(2) + '€';
    document.getElementById('statTotalWon').textContent = state.stats.totalWon.toFixed(2) + '€';
    
    const profit = state.stats.totalWon - state.stats.totalSpent;
    const profitElement = document.getElementById('statProfit');
    profitElement.textContent = (profit >= 0 ? '+' : '') + profit.toFixed(2) + '€';
    
    const profitCard = profitElement.closest('.stats-card');
    if (profit < 0) {
        profitCard.classList.add('negative');
    } else {
        profitCard.classList.remove('negative');
    }
    
    // Update rarity bars
    updateRarityBars();
    
    // Update history
    updateHistory();
    
    // Update inventory
    updateInventory();

    // Let feature modules (upgrader, battles, auth) re-render
    document.dispatchEvent(new CustomEvent('skindrop:statechange'));
}

function updateRarityBars() {
    const total = Object.values(state.stats.rarityDrops).reduce((a, b) => a + b, 0);
    
    for (const [rarity, count] of Object.entries(state.stats.rarityDrops)) {
        const percentage = total > 0 ? (count / total) * 100 : 0;
        const bar = document.querySelector(`.bar-fill[data-rarity="${rarity}"]`);
        const countElement = document.getElementById(`count${rarity.charAt(0).toUpperCase() + rarity.slice(1)}`);
        
        if (bar) bar.style.width = percentage + '%';
        if (countElement) countElement.textContent = count;
    }
}

function updateHistory() {
    const historyList = document.getElementById('historyList');
    
    if (state.history.length === 0) {
        historyList.innerHTML = '<p class="no-history">Aún no has abierto ninguna caja</p>';
        return;
    }
    
    historyList.innerHTML = state.history.slice().reverse().slice(0, 50).map(item => `
        <div class="history-item ${item.rarity}">
            <img src="${item.image}" alt="${item.name}">
            <div class="history-item-info">
                <div class="history-item-name">${item.name}</div>
                <div class="history-item-case">${item.caseName}</div>
            </div>
            <div class="history-item-price">${item.price.toFixed(2)}€</div>
            <div class="history-item-time">${formatTime(item.timestamp)}</div>
        </div>
    `).join('');
}

function updateInventory() {
    const inventoryGrid = document.getElementById('inventoryGrid');
    const inventoryValue = document.getElementById('inventoryValue');
    
    const totalValue = state.inventory.reduce((sum, item) => sum + item.price, 0);
    inventoryValue.textContent = totalValue.toFixed(2) + '€';
    
    if (state.inventory.length === 0) {
        inventoryGrid.innerHTML = '<p class="no-items">Tu inventario está vacío</p>';
        return;
    }
    
    inventoryGrid.innerHTML = state.inventory.map(item => `
        <div class="inventory-item ${item.rarity}">
            <img src="${item.image}" alt="${item.name}">
            <div class="inventory-item-name">${item.name}</div>
            <div class="inventory-item-price">${item.price.toFixed(2)}€</div>
            <button class="inventory-sell-btn" onclick="sellInventoryItem('${item.uid}')">
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
let currentFilter = 'all';

function renderCases(filter = currentFilter) {
    currentFilter = filter;
    const casesGrid = document.getElementById('casesGrid');
    
    const filteredCases = filter === 'all' 
        ? cases 
        : cases.filter(c => c.category === filter);
    
    casesGrid.innerHTML = filteredCases.map(caseItem => {
        const bestItem = caseItem.items.reduce((best, current) => 
            current.price > best.price ? current : best
        );
        
        return `
            <div class="case-card" onclick="openCaseModal(${caseItem.id})">
                <div class="case-image">
                    <img src="${caseItem.image}" alt="${caseItem.name}">
                    <div class="case-best-drop">
                        <i class="fas fa-star"></i>
                        ${bestItem.price.toFixed(2)}€
                    </div>
                </div>
                <div class="case-info">
                    <h3 class="case-name">${caseItem.name}</h3>
                    <div class="case-price">
                        <span class="price-value">${caseItem.price.toFixed(2)}€</span>
                        <button class="open-btn" ${state.balance < caseItem.price ? 'disabled' : ''}>
                            ABRIR
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== LIVE FEED ====================
function initLiveFeed() {
    const liveFeed = document.getElementById('liveFeed');
    const fakeUsers = ['xXDragonSlayerXx', 'ProGamer2024', 'SkinMaster', 'LuckyShot', 'CS2Legend', 'HeadshotKing', 'NightHunter', 'SilverFox', 'GoldenEagle', 'PhantomX'];
    
    // Generate random drops for live feed
    let feedItems = [];
    for (let i = 0; i < 20; i++) {
        const randomRarity = Object.keys(skins)[Math.floor(Math.random() * Object.keys(skins).length)];
        const randomSkin = skins[randomRarity][Math.floor(Math.random() * skins[randomRarity].length)];
        const randomUser = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
        
        feedItems.push({
            user: randomUser,
            skin: randomSkin,
            rarity: randomRarity
        });
    }
    
    // Duplicate for infinite scroll
    feedItems = [...feedItems, ...feedItems];
    
    liveFeed.innerHTML = feedItems.map(item => `
        <div class="live-item">
            <img src="${item.skin.image}" alt="${item.skin.name}">
            <span class="live-item-name">${item.user}</span>
            <span class="live-item-price" style="color: ${getRarityColor(item.rarity)}">${item.skin.price.toFixed(2)}€</span>
        </div>
    `).join('');
}

// ==================== BALANCE MODAL ====================
const balanceModal = document.getElementById('balanceModal');
const addBalanceBtn = document.getElementById('addBalanceBtn');
const closeModalBtn = document.getElementById('closeModal');
const applyCodeBtn = document.getElementById('applyCode');
const promoCodeInput = document.getElementById('promoCode');

addBalanceBtn.addEventListener('click', () => {
    balanceModal.classList.add('active');
});

closeModalBtn.addEventListener('click', () => {
    balanceModal.classList.remove('active');
});

balanceModal.addEventListener('click', (e) => {
    if (e.target === balanceModal) {
        balanceModal.classList.remove('active');
    }
});

let promoBusy = false;
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
    if (e.key === 'Enter') {
        applyCodeBtn.click();
    }
});

// ==================== CASE OPENING ====================
const openingModal = document.getElementById('openingModal');
const closeOpeningBtn = document.getElementById('closeOpening');
const rouletteTrack = document.getElementById('rouletteTrack');
const wonItemDisplay = document.getElementById('wonItemDisplay');
const contentsGrid = document.getElementById('contentsGrid');

function openCaseModal(caseId) {
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
    document.getElementById('openingCaseName').textContent = caseData.name;
    
    // Show case contents
    showCaseContents(caseData);
    
    // Start opening
    startCaseOpening(caseData);
}

function showCaseContents(caseData) {
    const chances = getItemChances(caseData.items);
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
    
    // Calculate scroll distance
    const itemWidth = 140; // 130px width + 10px margin
    const containerWidth = document.querySelector('.roulette-container').offsetWidth;
    const targetPosition = (winnerPosition * itemWidth) - (containerWidth / 2) + (itemWidth / 2);
    
    // Add some randomness to final position
    const randomOffset = (Math.random() - 0.5) * 40;
    
    // Start animation after a small delay
    setTimeout(() => {
        rouletteTrack.style.transition = 'transform 5s cubic-bezier(0.15, 0.85, 0.2, 1)';
        rouletteTrack.style.transform = `translateX(-${targetPosition + randomOffset}px)`;
    }, 100);
    
    // Show winner after animation
    setTimeout(() => {
        showWinner(winner, winnerRarity, out.reveal);
    }, 5200);
}

function showWinner(winner, rarity, reveal) {
    state.isSpinning = false;
    
    // The drop is already in the inventory: make it visible now
    reveal();
    
    // Hide roulette, show winner
    rouletteTrack.style.display = 'none';
    wonItemDisplay.classList.add('active');
    
    // Update winner display
    document.getElementById('wonItemImage').src = winner.image;
    document.getElementById('wonItemImage').alt = winner.name;
    document.getElementById('wonItemName').textContent = winner.name;
    document.getElementById('wonItemName').style.color = getRarityColor(rarity);
    document.getElementById('wonItemPrice').textContent = winner.price.toFixed(2) + '€';
    
    // Update glow color
    const glow = document.querySelector('.won-item-glow');
    glow.style.background = `radial-gradient(circle, ${getRarityColor(rarity)}40 0%, transparent 70%)`;
    
    // Buttons act on this drop once (sell, or keep = leave it in the inventory)
    wonItemDisplay.dataset.uid = winner.uid;
    wonItemDisplay.dataset.price = String(winner.price);
    wonItemDisplay.dataset.claimed = '';
}

// Winner action buttons
document.getElementById('sellBtn').addEventListener('click', async () => {
    if (wonItemDisplay.dataset.claimed) return;
    wonItemDisplay.dataset.claimed = '1';
    try {
        const { result } = await actions.sell({ uids: [wonItemDisplay.dataset.uid] });
        showToast(`Vendido por ${result.amount.toFixed(2)}€`, 'success');
    } catch (e) {
        showToast(e.message, 'error');
    }
});

document.getElementById('keepBtn').addEventListener('click', () => {
    if (!wonItemDisplay.dataset.claimed) {
        wonItemDisplay.dataset.claimed = '1';
        showToast('Guardado en inventario', 'success');
    }
    openingModal.classList.remove('active');
});

document.getElementById('openAgainBtn').addEventListener('click', () => {
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

// ==================== INVENTORY ACTIONS ====================
async function sellInventoryItem(uid) {
    if (!state.inventory.some(i => i.uid === uid)) return;
    try {
        const { result } = await actions.sell({ uids: [uid] });
        showToast(`Vendido por ${result.amount.toFixed(2)}€`, 'success');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// ==================== FILTERS ====================
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderCases(btn.dataset.filter);
    });
});

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'success') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="toast-icon fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastSlideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================== NAVIGATION ====================
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
            
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
    });
});

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    // Guest state first; auth.js switches to the server profile after /api/me
    auth = loadGuestState();
    refreshDisplay();
    initLiveFeed();
    
    // Update live feed periodically
    setInterval(initLiveFeed, 30000);
});

// Make sellInventoryItem globally accessible
window.sellInventoryItem = sellInventoryItem;

// Shared API for feature modules (upgrader.js, battles.js, auth.js).
// `state` is read-only for them: every change goes through `actions`.
window.SkinDrop = {
    get state() { return state; },
    get mode() { return mode; },
    get steamId() { return serverSteamId; },
    actions,
    updateUI,
    renderCases: () => renderCases(currentFilter),
    switchProfile,
    setServerMode,
    useGuestMode,
    showToast,
    itemImage,
    hydrate,
    rollItem,
    getItemChances,
    formatChance,
    getRarity,
    getRarityColor
};
