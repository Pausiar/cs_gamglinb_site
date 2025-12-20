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

// Load state from localStorage
function loadState() {
    const saved = localStorage.getItem('skinDropState');
    if (saved) {
        state = JSON.parse(saved);
    }
    updateUI();
}

// Save state to localStorage
function saveState() {
    localStorage.setItem('skinDropState', JSON.stringify(state));
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
        document.getElementById('bestDrop').textContent = bestDrop.name.substring(0, 15) + '...';
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
    
    inventoryGrid.innerHTML = state.inventory.map((item, index) => `
        <div class="inventory-item ${item.rarity}">
            <img src="${item.image}" alt="${item.name}">
            <div class="inventory-item-name">${item.name}</div>
            <div class="inventory-item-price">${item.price.toFixed(2)}€</div>
            <button class="inventory-sell-btn" onclick="sellInventoryItem(${index})">
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
function renderCases(filter = 'all') {
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
    contentsGrid.innerHTML = caseData.items.map(item => {
        const rarity = getRarity(item);
        const chance = dropChances[rarity];
        
        return `
            <div class="content-item ${rarity}">
                <img src="${item.image}" alt="${item.name}">
                <div class="content-item-name">${item.name}</div>
                <div class="content-item-price">${item.price.toFixed(2)}€</div>
                <div class="content-item-chance">${chance}%</div>
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
    const rand = Math.random() * 100;
    let cumulative = 0;
    
    // Group items by rarity
    const itemsByRarity = {};
    items.forEach(item => {
        const rarity = getRarity(item);
        if (!itemsByRarity[rarity]) {
            itemsByRarity[rarity] = [];
        }
        itemsByRarity[rarity].push(item);
    });
    
    // Select rarity based on chances
    for (const [rarity, chance] of Object.entries(dropChances)) {
        cumulative += chance;
        if (rand <= cumulative && itemsByRarity[rarity] && itemsByRarity[rarity].length > 0) {
            // Select random item from this rarity
            return itemsByRarity[rarity][Math.floor(Math.random() * itemsByRarity[rarity].length)];
        }
    }
    
    // Fallback to random item
    return items[Math.floor(Math.random() * items.length)];
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
    
    // Store winner data for buttons
    wonItemDisplay.dataset.winner = JSON.stringify(winner);
    wonItemDisplay.dataset.rarity = rarity;
}

// Winner action buttons
document.getElementById('sellBtn').addEventListener('click', () => {
    const winner = JSON.parse(wonItemDisplay.dataset.winner);
    state.balance += winner.price;
    saveState();
    updateUI();
    renderCases();
    showToast(`Vendido por ${winner.price.toFixed(2)}€`, 'success');
});

document.getElementById('keepBtn').addEventListener('click', () => {
    const winner = JSON.parse(wonItemDisplay.dataset.winner);
    const rarity = wonItemDisplay.dataset.rarity;
    state.inventory.push({ ...winner, rarity });
    saveState();
    updateUI();
    showToast('Guardado en inventario', 'success');
});

document.getElementById('openAgainBtn').addEventListener('click', () => {
    if (state.currentCase && state.balance >= state.currentCase.price) {
        wonItemDisplay.classList.remove('active');
        rouletteTrack.style.display = 'flex';
        startCaseOpening(state.currentCase);
    } else {
        showToast('Saldo insuficiente', 'error');
    }
});

closeOpeningBtn.addEventListener('click', () => {
    if (!state.isSpinning) {
        openingModal.classList.remove('active');
    }
});

// ==================== INVENTORY ACTIONS ====================
function sellInventoryItem(index) {
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
