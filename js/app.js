// ==================== APP STATE ====================
let state = {
    balance: 0,
    inventory: [],
    stats: {
        casesOpened: 0,
        totalSpent: 0,
        totalWon: 0,
        rarityDrops: {
            consumer: 0,
            industrial: 0,
            milspec: 0,
            restricted: 0,
            classified: 0,
            covert: 0,
            gold: 0
        }
    },
    history: [],
    currentCase: null,
    isSpinning: false
};

// localStorage key; switches per Steam profile (see switchProfile)
let storageKey = 'skinDropState';

function defaultState() {
    return {
        balance: 0,
        inventory: [],
        stats: {
            casesOpened: 0,
            totalSpent: 0,
            totalWon: 0,
            rarityDrops: { consumer: 0, industrial: 0, milspec: 0, restricted: 0, classified: 0, covert: 0, gold: 0 }
        },
        history: [],
        currentCase: null,
        isSpinning: false
    };
}

// Load state from localStorage, filling in fields missing from older saves
function loadState() {
    const base = defaultState();
    let saved = null;
    try {
        saved = JSON.parse(localStorage.getItem(storageKey));
    } catch (e) {
        saved = null;
    }
    state = saved ? { ...base, ...saved, stats: { ...base.stats, ...saved.stats } } : base;
    state.stats.rarityDrops = { ...base.stats.rarityDrops, ...state.stats.rarityDrops };
    state.isSpinning = false;
    state.inventory.forEach(item => { if (!item.uid) item.uid = generateUid(); });
    updateUI();
}

// Save state to localStorage
function saveState() {
    try {
        localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
        // Storage unavailable (private mode, quota); state stays in memory
    }
}

// Switch to the saved state of a Steam user (null = guest)
function switchProfile(steamId) {
    storageKey = steamId ? `skinDropState:${steamId}` : 'skinDropState';
    loadState();
    renderCases(currentFilter);
}

function generateUid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

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

applyCodeBtn.addEventListener('click', () => {
    const code = promoCodeInput.value.toLowerCase().trim();
    
    if (code === 'test') {
        state.balance += 10000;
        saveState();
        updateUI();
        renderCases();
        showToast('¡Código aplicado! +10,000€', 'success');
        promoCodeInput.value = '';
        balanceModal.classList.remove('active');
    } else {
        showToast('Código inválido', 'error');
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
    if (!caseData) return;
    
    if (state.balance < caseData.price) {
        showToast('Saldo insuficiente', 'error');
        return;
    }
    
    state.currentCase = caseData;
    
    // Show modal
    openingModal.classList.add('active');
    wonItemDisplay.classList.remove('active');
    rouletteTrack.style.display = 'flex';
    
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

function startCaseOpening(caseData) {
    if (state.isSpinning) return;
    state.isSpinning = true;
    
    // Deduct balance
    state.balance -= caseData.price;
    state.stats.totalSpent += caseData.price;
    state.stats.casesOpened++;
    
    // Determine winner based on chances
    const winner = determineWinner(caseData.items);
    const winnerRarity = getRarity(winner);
    
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
        showWinner(winner, winnerRarity, caseData);
    }, 5200);
}

function determineWinner(items) {
    return rollItem(items);
}

function showWinner(winner, rarity, caseData) {
    state.isSpinning = false;
    
    // Update stats
    state.stats.totalWon += winner.price;
    state.stats.rarityDrops[rarity]++;
    
    // Add to history
    state.history.push({
        ...winner,
        rarity: rarity,
        caseName: caseData.name,
        timestamp: Date.now()
    });
    
    // Save state
    saveState();
    updateUI();
    renderCases();
    
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
    
    // Store winner data for buttons; the drop can be sold or kept only once
    wonItemDisplay.dataset.winner = JSON.stringify(winner);
    wonItemDisplay.dataset.rarity = rarity;
    wonItemDisplay.dataset.claimed = '';
}

// Winner action buttons
document.getElementById('sellBtn').addEventListener('click', () => {
    if (wonItemDisplay.dataset.claimed) return;
    wonItemDisplay.dataset.claimed = '1';
    const winner = JSON.parse(wonItemDisplay.dataset.winner);
    state.balance += winner.price;
    saveState();
    updateUI();
    renderCases();
    showToast(`Vendido por ${winner.price.toFixed(2)}€`, 'success');
});

document.getElementById('keepBtn').addEventListener('click', () => {
    if (wonItemDisplay.dataset.claimed) return;
    wonItemDisplay.dataset.claimed = '1';
    const winner = JSON.parse(wonItemDisplay.dataset.winner);
    addToInventory(winner);
    showToast('Guardado en inventario', 'success');
});

document.getElementById('openAgainBtn').addEventListener('click', () => {
    if (state.currentCase && state.balance >= state.currentCase.price) {
        // An unclaimed drop goes to the inventory instead of being lost
        if (!wonItemDisplay.dataset.claimed) {
            addToInventory(JSON.parse(wonItemDisplay.dataset.winner));
        }
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
            addToInventory(JSON.parse(wonItemDisplay.dataset.winner));
            showToast('Guardado en inventario', 'success');
        }
        openingModal.classList.remove('active');
    }
});

// ==================== INVENTORY ACTIONS ====================
// Adds a skin to the inventory (rarity resolved from data) and returns the stored entry
function addToInventory(item) {
    const entry = { id: item.id, name: item.name, price: item.price, image: item.image, rarity: getRarity(item), uid: generateUid() };
    state.inventory.push(entry);
    saveState();
    updateUI();
    return entry;
}

// Removes an inventory item by uid and returns it (or null)
function removeFromInventory(uid) {
    const index = state.inventory.findIndex(i => i.uid === uid);
    if (index === -1) return null;
    const [item] = state.inventory.splice(index, 1);
    saveState();
    updateUI();
    return item;
}

function sellInventoryItem(uid) {
    const index = state.inventory.findIndex(i => i.uid === uid);
    if (index === -1) return;
    const item = state.inventory[index];
    state.balance += item.price;
    state.inventory.splice(index, 1);
    saveState();
    updateUI();
    renderCases();
    showToast(`Vendido por ${item.price.toFixed(2)}€`, 'success');
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
    loadState();
    renderCases();
    initLiveFeed();
    
    // Update live feed periodically
    setInterval(initLiveFeed, 30000);
});

// Make sellInventoryItem globally accessible
window.sellInventoryItem = sellInventoryItem;

// Shared API for feature modules (upgrader.js, battles.js, auth.js)
window.SkinDrop = {
    get state() { return state; },
    saveState,
    updateUI,
    renderCases: () => renderCases(currentFilter),
    switchProfile,
    addToInventory,
    removeFromInventory,
    showToast,
    rollItem,
    getItemChances,
    formatChance,
    getRarity,
    getRarityColor
};
