// Upgrader: risk inventory skins (and/or balance) for a chance at a more valuable skin.
// Renders into #upgraderRoot. Depends on globals from data.js (skins, getRarity, getRarityColor)
// and on window.SkinDrop from app.js (state, actions.upgrade, showToast, ...).
// The outcome is decided by SkinDrop.actions.upgrade (server or local engine); this file only animates it.
(function () {
    'use strict';

    // ==================== CONFIG ====================
    const HOUSE_EDGE = 0.05;      // 5% house edge
    const MAX_CHANCE = 75;        // win chance is capped at 75%
    const MIN_CHANCE = 0.5;       // below this the upgrade is not allowed
    const SPIN_MS = 4200;         // needle animation length
    const MULTIPLIERS = [1.5, 2, 5, 10];
    const R = 82;                 // dial radius in SVG user units (viewBox 200x200)

    const RARITY_LABELS = {
        consumer: 'Consumer', industrial: 'Industrial', milspec: 'Mil-Spec',
        restricted: 'Restricted', classified: 'Classified', covert: 'Covert', gold: 'Rare Special'
    };

    // ==================== MODULE STATE ====================
    const ui = {
        selected: new Set(),     // uids of inventory items staked
        balanceStake: 0,         // extra balance staked (€)
        targetId: null,          // id of the chosen target skin
        mode: 'under',           // 'under' = win if roll < chance, 'over' = win if roll >= 100 - chance
        search: '',
        sort: 'asc',             // price order of the target list
        onlyPricier: true,       // hide targets not worth more than the stake
        spin: null,              // snapshot of the running upgrade (locks the UI)
        settling: false,
        needle: 0,               // accumulated needle rotation in degrees
        result: null,            // last result shown in the center panel
        hold: null               // dial numbers of the last upgrade, kept visible until the user changes the setup
    };

    let root = null;
    let els = {};
    let allTargets = [];

    // ==================== HELPERS ====================
    function sd() { return window.SkinDrop; }
    function st() { return window.SkinDrop.state; }

    // Escape any dynamic text before it goes into innerHTML / attributes
    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
    function money(n) { return round2(n).toFixed(2) + '€'; }

    function rarityOf(item) {
        return item.rarity || (typeof getRarity === 'function' ? getRarity(item) : 'consumer');
    }
    function colorOf(rarity) {
        return typeof getRarityColor === 'function' ? getRarityColor(rarity) : '#b0c3d9';
    }

    function buildTargets() {
        allTargets = [];
        Object.keys(skins).forEach(rarity => {
            skins[rarity].forEach(s => allTargets.push({ id: s.id, name: s.name, price: s.price, image: s.image, rarity }));
        });
    }

    function findTarget(id) {
        return allTargets.find(t => t.id === id) || null;
    }

    function inventoryItems() {
        return st().inventory.slice().sort((a, b) => b.price - a.price);
    }

    // Drop selections that no longer exist in the inventory (sold / removed elsewhere)
    function pruneSelection() {
        const uids = new Set(st().inventory.map(i => i.uid));
        ui.selected.forEach(uid => { if (!uids.has(uid)) ui.selected.delete(uid); });
    }

    function selectedItems() {
        return st().inventory.filter(i => ui.selected.has(i.uid));
    }

    function itemsValue() {
        return round2(selectedItems().reduce((sum, i) => sum + i.price, 0));
    }

    // chance (%) = stake / target * (1 - house edge), capped to MAX_CHANCE, floored to 2 decimals
    function computeChance(stake, targetPrice) {
        if (!(stake > 0) || !(targetPrice > 0)) return 0;
        const raw = (stake / targetPrice) * (1 - HOUSE_EDGE) * 100;
        return Math.floor(Math.min(raw, MAX_CHANCE) * 100) / 100;
    }

    function fmtPct(p) {
        return (p >= 10 ? p.toFixed(1) : p.toFixed(2)).replace(/\.0$/, '') + '%';
    }

    // Snapshot of what the UI should show: the locked upgrade while spinning, otherwise the live selection
    function view() {
        if (ui.spin) return ui.spin.view;
        const items = selectedItems();
        const itemsVal = itemsValue();
        const bal = round2(Math.max(0, ui.balanceStake));
        const stake = round2(itemsVal + bal);
        const target = findTarget(ui.targetId);
        const chance = target ? computeChance(stake, target.price) : 0;
        return {
            itemCount: items.length, itemsVal, bal, stake, target, chance,
            multiplier: target && stake > 0 ? target.price / stake : 0,
            mode: ui.mode
        };
    }

    // Returns null when the upgrade can start, otherwise {msg, kind}
    function validate(v) {
        if (!(v.stake > 0)) return { msg: 'Selecciona skins de tu inventario o añade saldo para apostar.', kind: 'hint' };
        if (v.bal > round2(st().balance) + 1e-9) return { msg: 'Saldo insuficiente para esa apuesta.', kind: 'error' };
        if (!v.target) return { msg: 'Elige una skin objetivo.', kind: 'hint' };
        if (v.target.price <= v.stake) return { msg: 'El objetivo debe valer más que tu apuesta.', kind: 'error' };
        if (v.chance < MIN_CHANCE) return { msg: 'Probabilidad demasiado baja (mínimo ' + MIN_CHANCE + '%). Elige un objetivo más barato o apuesta más.', kind: 'error' };
        return null;
    }

    // ==================== LAYOUT (built once) ====================
    function ticksSvg() {
        let out = '';
        for (let i = 0; i < 40; i++) {
            const a = (i / 40) * Math.PI * 2;
            const major = i % 10 === 0;
            const r1 = R + 11, r2 = R + (major ? 18 : 15);
            out += '<line x1="' + (100 + r1 * Math.sin(a)).toFixed(2) + '" y1="' + (100 - r1 * Math.cos(a)).toFixed(2) +
                '" x2="' + (100 + r2 * Math.sin(a)).toFixed(2) + '" y2="' + (100 - r2 * Math.cos(a)).toFixed(2) +
                '" class="upg-tick' + (major ? ' major' : '') + '"/>';
        }
        return out;
    }

    function dialLabels() {
        return [0, 25, 50, 75].map(p => {
            const a = p * 3.6 * Math.PI / 180;
            const r = R - 17;
            return '<text x="' + (100 + r * Math.sin(a)).toFixed(2) + '" y="' + (100 - r * Math.cos(a) + 3).toFixed(2) +
                '" class="upg-dial-label" text-anchor="middle">' + p + '</text>';
        }).join('');
    }

    function buildLayout() {
        root.innerHTML = `
        <div class="upg-grid" id="upgGrid">
            <div class="upg-panel upg-panel-stake">
                <div class="upg-panel-head">
                    <h3><i class="fas fa-briefcase"></i> Tu apuesta</h3>
                    <div class="upg-head-actions">
                        <button type="button" class="upg-mini-btn" data-act="select-all">Todo</button>
                        <button type="button" class="upg-mini-btn" data-act="select-none">Ninguno</button>
                    </div>
                </div>
                <div class="upg-inv" id="upgInv"></div>
                <div class="upg-balance-row">
                    <label for="upgBalanceInput"><i class="fas fa-wallet"></i> Añadir saldo</label>
                    <div class="upg-balance-input">
                        <input type="number" id="upgBalanceInput" min="0" step="0.01" inputmode="decimal" placeholder="0.00" data-field="balance">
                        <span class="upg-eur">€</span>
                        <button type="button" class="upg-mini-btn" data-act="balance-max">Máx</button>
                    </div>
                    <div class="upg-hint" id="upgBalanceHint"></div>
                </div>
                <div class="upg-stake-total" id="upgStakeTotal"></div>
            </div>

            <div class="upg-panel upg-panel-dial">
                <div class="upg-dial-wrap" id="upgDialWrap">
                    <svg class="upg-dial" viewBox="0 0 200 200" role="img" aria-label="Dial del upgrader" id="upgDial">
                        <circle cx="100" cy="100" r="${R + 8}" class="upg-dial-bg"/>
                        <circle cx="100" cy="100" r="${R}" class="upg-dial-lose"/>
                        <path id="upgArc" class="upg-dial-win" d="" fill="none"/>
                        ${ticksSvg()}
                        ${dialLabels()}
                        <g class="upg-needle" id="upgNeedle">
                            <line x1="100" y1="100" x2="100" y2="${100 - R - 10}" class="upg-needle-line"/>
                            <polygon points="100,${100 - R - 14} 95,${100 - R - 2} 105,${100 - R - 2}" class="upg-needle-tip"/>
                        </g>
                        <circle cx="100" cy="100" r="46" class="upg-hub"/>
                    </svg>
                    <div class="upg-center">
                        <div class="upg-pct" id="upgPct">--%</div>
                        <div class="upg-mult" id="upgMult">x--</div>
                    </div>
                    <div class="upg-confetti" id="upgConfetti"></div>
                </div>

                <div class="upg-mode" role="group" aria-label="Modo de tirada">
                    <button type="button" class="upg-mode-btn" data-act="mode" data-mode="under"><i class="fas fa-arrow-down"></i> Rodar por debajo</button>
                    <button type="button" class="upg-mode-btn" data-act="mode" data-mode="over"><i class="fas fa-arrow-up"></i> Rodar por encima</button>
                </div>

                <div class="upg-mults" id="upgMults">
                    ${MULTIPLIERS.map(m => '<button type="button" class="upg-mult-btn" data-act="mult" data-mult="' + m + '">x' + m + '</button>').join('')}
                </div>

                <div class="upg-info">
                    <div><span>Apuesta</span><b id="upgInfoStake">-</b></div>
                    <div><span>Objetivo</span><b id="upgInfoTarget">-</b></div>
                    <div><span>Probabilidad</span><b id="upgInfoChance">-</b></div>
                    <div><span>Zona ganadora</span><b id="upgInfoZone">-</b></div>
                </div>
                <div class="upg-msg" id="upgMsg" role="status"></div>
                <button type="button" class="upg-go" id="upgGo" data-act="go"><i class="fas fa-bolt"></i> <span>UPGRADE</span></button>
                <div class="upg-result" id="upgResult" aria-live="polite"></div>
            </div>

            <div class="upg-panel upg-panel-target">
                <div class="upg-panel-head">
                    <h3><i class="fas fa-bullseye"></i> Skin objetivo</h3>
                </div>
                <div class="upg-target-pick" id="upgTargetPick"></div>
                <div class="upg-toolbar">
                    <div class="upg-search"><i class="fas fa-search"></i>
                        <input type="search" id="upgSearch" placeholder="Buscar skin..." autocomplete="off" data-field="search">
                    </div>
                    <select id="upgSort" data-field="sort" aria-label="Ordenar por precio">
                        <option value="asc">Precio: menor a mayor</option>
                        <option value="desc">Precio: mayor a menor</option>
                    </select>
                </div>
                <label class="upg-check"><input type="checkbox" id="upgOnlyPricier" data-field="pricier" checked> Solo más caras que mi apuesta</label>
                <div class="upg-targets" id="upgTargets"></div>
            </div>
        </div>`;

        els = {
            grid: root.querySelector('#upgGrid'),
            inv: root.querySelector('#upgInv'),
            balInput: root.querySelector('#upgBalanceInput'),
            balHint: root.querySelector('#upgBalanceHint'),
            stakeTotal: root.querySelector('#upgStakeTotal'),
            dialWrap: root.querySelector('#upgDialWrap'),
            arc: root.querySelector('#upgArc'),
            needle: root.querySelector('#upgNeedle'),
            pct: root.querySelector('#upgPct'),
            mult: root.querySelector('#upgMult'),
            confetti: root.querySelector('#upgConfetti'),
            infoStake: root.querySelector('#upgInfoStake'),
            infoTarget: root.querySelector('#upgInfoTarget'),
            infoChance: root.querySelector('#upgInfoChance'),
            infoZone: root.querySelector('#upgInfoZone'),
            msg: root.querySelector('#upgMsg'),
            go: root.querySelector('#upgGo'),
            result: root.querySelector('#upgResult'),
            targetPick: root.querySelector('#upgTargetPick'),
            search: root.querySelector('#upgSearch'),
            sort: root.querySelector('#upgSort'),
            pricier: root.querySelector('#upgOnlyPricier'),
            targets: root.querySelector('#upgTargets')
        };
        els.sort.value = ui.sort;
        els.pricier.checked = ui.onlyPricier;
    }

    // ==================== RENDER ====================
    // innerHTML swap that keeps the scroll position of a scrolling list
    function setHtmlKeepScroll(el, html) {
        const top = el.scrollTop;
        el.innerHTML = html;
        el.scrollTop = top;
    }

    function renderInventory() {
        const items = inventoryItems();
        const locked = !!ui.spin;
        if (items.length === 0) {
            els.inv.innerHTML = `
                <div class="upg-empty">
                    <i class="fas fa-box-open"></i>
                    <p>Necesitas skins en tu inventario para usar el Upgrader.</p>
                    <p class="upg-empty-sub">Abre cajas para conseguirlas (o apuesta solo saldo).</p>
                    <a class="upg-link" href="#cases"><i class="fas fa-boxes"></i> Ir a Cajas</a>
                </div>`;
            return;
        }
        setHtmlKeepScroll(els.inv, items.map(item => {
            const rarity = rarityOf(item);
            const sel = ui.selected.has(item.uid);
            return `
            <button type="button" class="upg-item${sel ? ' selected' : ''}" data-act="toggle-item" data-uid="${esc(item.uid)}"
                    style="--rc:${esc(colorOf(rarity))}" ${locked ? 'disabled' : ''} aria-pressed="${sel}" title="${esc(item.name)}">
                <span class="upg-item-check"><i class="fas fa-check"></i></span>
                <img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy">
                <span class="upg-item-name">${esc(item.name)}</span>
                <span class="upg-item-price">${money(item.price)}</span>
            </button>`;
        }).join(''));
    }

    function renderStakeSummary() {
        const v = view();
        const bal = round2(st().balance);
        els.balHint.textContent = 'Saldo disponible: ' + money(bal);
        els.balHint.classList.toggle('error', v.bal > bal + 1e-9);
        if (v.stake > 0) {
            const parts = [];
            if (v.itemCount) parts.push(v.itemCount + (v.itemCount === 1 ? ' skin' : ' skins') + ' (' + money(v.itemsVal) + ')');
            if (v.bal > 0) parts.push(money(v.bal) + ' de saldo');
            els.stakeTotal.innerHTML = '<span>Apuesta total</span><b>' + money(v.stake) + '</b><small>' + esc(parts.join(' + ')) + '</small>';
        } else {
            els.stakeTotal.innerHTML = '<span>Apuesta total</span><b>0.00€</b>';
        }
    }

    function targetCardHtml(t, stake, locked) {
        const color = colorOf(t.rarity);
        const chance = stake > 0 && t.price > stake ? computeChance(stake, t.price) : 0;
        const badge = stake > 0 && t.price > stake
            ? '<span class="upg-target-chance' + (chance < MIN_CHANCE ? ' low' : '') + '">' + fmtPct(chance) + '</span>'
            : '';
        const dim = stake > 0 && t.price <= stake;
        return `
            <button type="button" class="upg-target${t.id === ui.targetId ? ' selected' : ''}${dim ? ' dim' : ''}" data-act="pick-target"
                    data-id="${esc(t.id)}" style="--rc:${esc(color)}" ${locked ? 'disabled' : ''} title="${esc(t.name)}">
                ${badge}
                <img src="${esc(t.image)}" alt="${esc(t.name)}" loading="lazy">
                <span class="upg-item-name">${esc(t.name)}</span>
                <span class="upg-item-price">${money(t.price)}</span>
            </button>`;
    }

    function renderTargets() {
        const v = view();
        const locked = !!ui.spin;
        const q = ui.search.trim().toLowerCase();
        let list = allTargets.filter(t => !q || t.name.toLowerCase().includes(q));
        if (ui.onlyPricier && v.stake > 0) list = list.filter(t => t.price > v.stake);
        list.sort((a, b) => ui.sort === 'asc' ? a.price - b.price : b.price - a.price);

        if (list.length === 0) {
            els.targets.innerHTML = '<div class="upg-empty small"><i class="fas fa-search"></i><p>No hay skins que coincidan.</p></div>';
        } else {
            setHtmlKeepScroll(els.targets, list.map(t => targetCardHtml(t, v.stake, locked)).join(''));
        }

        // Selected target preview
        const t = v.target;
        if (t) {
            const color = colorOf(t.rarity);
            els.targetPick.innerHTML = `
                <div class="upg-pick" style="--rc:${esc(color)}">
                    <img src="${esc(t.image)}" alt="${esc(t.name)}">
                    <div class="upg-pick-info">
                        <div class="upg-pick-name">${esc(t.name)}</div>
                        <div class="upg-pick-rarity">${esc(RARITY_LABELS[t.rarity] || t.rarity)}</div>
                    </div>
                    <div class="upg-pick-price">${money(t.price)}</div>
                </div>`;
        } else {
            els.targetPick.innerHTML = '<div class="upg-pick placeholder"><i class="fas fa-crosshairs"></i> Elige una skin objetivo o usa un multiplicador</div>';
        }
    }

    // SVG arc between two percentages of the dial (0 = top, clockwise)
    function arcPath(fromPct, toPct) {
        const a1 = fromPct * 3.6 * Math.PI / 180;
        const a2 = toPct * 3.6 * Math.PI / 180;
        const p = a => (100 + R * Math.sin(a)).toFixed(3) + ' ' + (100 - R * Math.cos(a)).toFixed(3);
        const large = (toPct - fromPct) > 50 ? 1 : 0;
        return 'M ' + p(a1) + ' A ' + R + ' ' + R + ' 0 ' + large + ' 1 ' + p(a2);
    }

    function zone(chance, mode) {
        return mode === 'over' ? [round2(100 - chance), 100] : [0, chance];
    }

    function renderDial() {
        const real = view();
        const err = validate(real);
        const locked = !!ui.spin;
        const valid = !err;
        // After an upgrade the stake is gone; keep showing its zone/numbers so the landing spot stays readable
        const v = ui.hold || real;

        // Win zone arc (only drawn when there is a meaningful chance)
        if (v.target && v.chance > 0 && v.target.price > v.stake) {
            const z = zone(v.chance, v.mode);
            els.arc.setAttribute('d', arcPath(z[0], z[1]));
            els.arc.style.display = '';
        } else {
            els.arc.setAttribute('d', '');
            els.arc.style.display = 'none';
        }

        const hasNumbers = v.target && v.stake > 0 && v.target.price > v.stake;
        els.pct.textContent = hasNumbers ? fmtPct(v.chance) : '--%';
        els.mult.textContent = hasNumbers ? 'x' + v.multiplier.toFixed(2) : 'x--';

        els.infoStake.textContent = v.stake > 0 ? money(v.stake) : '-';
        els.infoTarget.textContent = v.target ? money(v.target.price) : '-';
        els.infoChance.textContent = hasNumbers ? fmtPct(v.chance) : '-';
        if (hasNumbers) {
            const z = zone(v.chance, v.mode);
            els.infoZone.textContent = v.mode === 'over' ? z[0].toFixed(2) + ' - 100' : '0 - ' + z[1].toFixed(2);
        } else {
            els.infoZone.textContent = '-';
        }

        root.querySelectorAll('.upg-mode-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.mode === real.mode);
            b.disabled = locked;
        });
        root.querySelectorAll('.upg-mult-btn').forEach(b => { b.disabled = locked || !(real.stake > 0); });

        if (locked) {
            els.msg.textContent = '';
            els.msg.className = 'upg-msg';
        } else {
            els.msg.textContent = err ? err.msg : '';
            els.msg.className = 'upg-msg' + (err ? ' ' + err.kind : '');
        }
        els.go.disabled = locked || !valid;
        els.go.classList.toggle('busy', locked);
        els.go.querySelector('span').textContent = locked ? 'GIRANDO...' : 'UPGRADE';

        // Inputs are locked together with the rest of the controls
        els.balInput.disabled = locked;
        els.search.disabled = locked;
        els.sort.disabled = locked;
        els.pricier.disabled = locked;
        root.querySelectorAll('[data-act="select-all"],[data-act="select-none"],[data-act="balance-max"]').forEach(b => { b.disabled = locked; });
        els.grid.classList.toggle('upg-locked', locked);
    }

    function renderAll() {
        pruneSelection();
        renderInventory();
        renderStakeSummary();
        renderTargets();
        renderDial();
    }

    // Re-render the parts that depend on the stake / target without touching the inputs being typed in
    function refreshDerived() {
        renderStakeSummary();
        renderTargets();
        renderDial();
    }

    // ==================== ACTIONS ====================
    function toggleItem(uid) {
        if (ui.spin) return;
        ui.hold = null;
        if (ui.selected.has(uid)) ui.selected.delete(uid); else ui.selected.add(uid);
        pruneSelection();
        const card = els.inv.querySelector('.upg-item[data-uid="' + (window.CSS && CSS.escape ? CSS.escape(uid) : uid) + '"]');
        if (card) {
            card.classList.toggle('selected', ui.selected.has(uid));
            card.setAttribute('aria-pressed', String(ui.selected.has(uid)));
        }
        refreshDerived();
    }

    function setBalanceStake(value, writeInput) {
        const n = parseFloat(value);
        ui.balanceStake = isFinite(n) && n > 0 ? round2(n) : 0;
        if (writeInput) els.balInput.value = ui.balanceStake > 0 ? String(ui.balanceStake) : '';
    }

    function pickTarget(id) {
        if (ui.spin) return;
        ui.hold = null;
        const t = allTargets.find(x => String(x.id) === String(id));
        if (!t) return;
        ui.targetId = t.id;
        refreshDerived();
    }

    // Select the cheapest target worth at least stake * multiplier
    function quickMultiplier(mult) {
        if (ui.spin) return;
        ui.hold = null;
        const v = view();
        if (!(v.stake > 0)) {
            sd().showToast('Selecciona una apuesta primero', 'error');
            return;
        }
        const need = v.stake * mult - 1e-9;
        let best = null;
        allTargets.forEach(t => {
            if (t.price >= need && t.price > v.stake && (!best || t.price < best.price)) best = t;
        });
        if (!best) {
            sd().showToast('No hay ninguna skin para x' + mult + ' con esa apuesta', 'error');
            return;
        }
        ui.targetId = best.id;
        refreshDerived();
        const sel = els.targets.querySelector('.upg-target.selected');
        if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest' });
    }

    async function startUpgrade() {
        if (ui.spin || ui.settling) return;
        pruneSelection();
        const v = view();
        const err = validate(v);
        if (err) {
            sd().showToast(err.msg, 'error');
            renderDial();
            return;
        }
        const uids = selectedItems().map(i => i.uid);

        // Lock the UI while the outcome is decided (server for Steam users, local engine for guests).
        // The stake is taken and the outcome stored atomically by the action; the won skin stays
        // hidden until the needle stops (reveal), so a reload mid-spin cannot change anything.
        ui.spin = { view: Object.assign({}, v), roll: null, win: null };
        ui.hold = null;
        ui.result = null;
        els.result.innerHTML = '';
        els.dialWrap.classList.remove('upg-win', 'upg-lose');
        renderDial();

        let out;
        try {
            out = await sd().actions.upgrade({ uids, balanceStake: v.bal, targetId: v.target.id, mode: v.mode });
        } catch (e) {
            ui.spin = null;
            sd().showToast(e.message, 'error');
            renderAll();
            return;
        }
        const r = out.result;
        ui.spin.view.chance = r.chance;
        ui.spin.roll = r.roll;
        ui.spin.win = r.win;
        ui.spin.outcome = r;
        ui.spin.reveal = out.reveal;

        // Clear the picker selection (the staked skins are gone)
        ui.selected.clear();
        ui.balanceStake = 0;
        els.balInput.value = '';
        renderInventory();
        renderStakeSummary();
        renderTargets();
        renderDial();

        animateNeedle(r.roll);
        setTimeout(() => finishUpgrade(), SPIN_MS + 150);
    }

    function animateNeedle(roll) {
        // Always spin forward: land on roll*3.6 deg after 5-6 extra full turns from the current angle
        const base = Math.floor(ui.needle / 360) * 360;
        const turns = 5 + Math.floor(Math.random() * 2);
        const finalAngle = base + turns * 360 + roll * 3.6;
        ui.needle = finalAngle;
        els.needle.style.transition = 'transform ' + SPIN_MS + 'ms cubic-bezier(0.12, 0.62, 0.08, 1)';
        // force reflow so the transition runs from the current angle
        void els.needle.getBoundingClientRect();
        els.needle.style.transform = 'rotate(' + finalAngle + 'deg)';
    }

    function finishUpgrade() {
        const spin = ui.spin;
        if (!spin || !spin.outcome) { ui.spin = null; renderAll(); return; }
        const r = spin.outcome;
        ui.settling = true;
        try {
            spin.reveal();      // show the won skin in the inventory / history
        } finally {
            ui.settling = false;
        }
        ui.spin = null;
        const target = Object.assign({}, r.target, { image: sd().itemImage(r.target) });
        ui.hold = spin.view;
        ui.result = { win: r.win, roll: r.roll, target, stake: r.stake, itemCount: r.itemCount };
        renderAll();
        showResult(ui.result);
        celebrate(r.win, rarityOf(target));
        if (r.win) sd().showToast('¡Upgrade conseguido! Ganaste ' + target.name + ' (' + money(target.price) + ')', 'success');
        else sd().showToast('Upgrade fallido. Perdiste ' + money(r.stake) + ' apostados', 'error');
    }

    function showResult(r) {
        const color = colorOf(rarityOf(r.target));
        els.result.innerHTML = r.win ? `
            <div class="upg-result-card win" style="--rc:${esc(color)}">
                <div class="upg-result-title"><i class="fas fa-trophy"></i> ¡HAS GANADO!</div>
                <img src="${esc(r.target.image)}" alt="${esc(r.target.name)}">
                <div class="upg-result-name">${esc(r.target.name)}</div>
                <div class="upg-result-price">${money(r.target.price)} · añadida a tu inventario</div>
                <div class="upg-result-roll">Número: ${r.roll.toFixed(2)}</div>
            </div>` : `
            <div class="upg-result-card lose">
                <div class="upg-result-title"><i class="fas fa-skull-crossbones"></i> HAS PERDIDO</div>
                <div class="upg-result-price">Se han perdido ${money(r.stake)} de apuesta${r.itemCount ? ' (' + r.itemCount + (r.itemCount === 1 ? ' skin' : ' skins') + ' incluidas)' : ''}</div>
                <div class="upg-result-roll">Número: ${r.roll.toFixed(2)}</div>
            </div>`;
    }

    function celebrate(win, rarity) {
        els.dialWrap.classList.remove('upg-win', 'upg-lose');
        void els.dialWrap.offsetWidth;
        els.dialWrap.classList.add(win ? 'upg-win' : 'upg-lose');
        setTimeout(() => els.dialWrap.classList.remove('upg-win', 'upg-lose'), 1800);
        if (!win) return;
        const colors = ['#ffd700', '#ff6b35', '#f7c94b', colorOf(rarity), '#4ade80', '#ffffff'];
        let html = '';
        for (let i = 0; i < 46; i++) {
            const ang = Math.random() * Math.PI * 2;
            const dist = 90 + Math.random() * 130;
            html += '<i style="--dx:' + (Math.cos(ang) * dist).toFixed(0) + 'px;--dy:' + (Math.sin(ang) * dist).toFixed(0) +
                'px;--rot:' + Math.floor(Math.random() * 720) + 'deg;--d:' + (Math.random() * 0.25).toFixed(2) +
                's;background:' + colors[i % colors.length] + '"></i>';
        }
        els.confetti.innerHTML = html;
        setTimeout(() => { els.confetti.innerHTML = ''; }, 2200);
    }

    // ==================== EVENTS ====================
    function onClick(e) {
        const link = e.target.closest('a.upg-link');
        if (link) {
            const target = document.querySelector(link.getAttribute('href'));
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
            return;
        }
        const btn = e.target.closest('[data-act]');
        if (!btn || btn.disabled || ui.spin) return;
        switch (btn.dataset.act) {
            case 'toggle-item': toggleItem(btn.dataset.uid); break;
            case 'select-all':
                ui.hold = null;
                st().inventory.forEach(i => ui.selected.add(i.uid));
                renderInventory(); refreshDerived();
                break;
            case 'select-none':
                ui.hold = null;
                ui.selected.clear();
                renderInventory(); refreshDerived();
                break;
            case 'balance-max':
                ui.hold = null;
                setBalanceStake(Math.floor(st().balance * 100) / 100, true);
                refreshDerived();
                break;
            case 'mode':
                ui.hold = null;
                ui.mode = btn.dataset.mode === 'over' ? 'over' : 'under';
                renderDial();
                break;
            case 'mult': quickMultiplier(parseFloat(btn.dataset.mult)); break;
            case 'pick-target': pickTarget(btn.dataset.id); break;
            case 'go': startUpgrade(); break;
        }
    }

    function onInput(e) {
        const field = e.target.dataset && e.target.dataset.field;
        if (!field || ui.spin) return;
        if (field === 'balance') {
            ui.hold = null;
            setBalanceStake(e.target.value, false);
            refreshDerived();
        } else if (field === 'search') {
            ui.search = e.target.value;
            renderTargets();
        } else if (field === 'sort') {
            ui.sort = e.target.value === 'desc' ? 'desc' : 'asc';
            renderTargets();
        } else if (field === 'pricier') {
            ui.onlyPricier = e.target.checked;
            renderTargets();
        }
    }

    // Inventory / balance changed elsewhere: refresh the picker (but never mid-animation)
    function onStateChange() {
        if (!root || ui.spin || ui.settling) return;
        renderAll();
    }

    // Profile switched (login / logout): forget the selection of the old profile
    function onProfileChange() {
        if (!root) return;
        ui.selected.clear();
        ui.balanceStake = 0;
        if (els.balInput) els.balInput.value = '';
        ui.hold = null;
        if (!ui.spin) renderAll();
    }

    // ==================== INIT ====================
    function init() {
        root = document.getElementById('upgraderRoot');
        if (!root || !window.SkinDrop || typeof skins === 'undefined') return;
        buildTargets();
        buildLayout();
        root.addEventListener('click', onClick);
        root.addEventListener('input', onInput);
        root.addEventListener('change', onInput);
        document.addEventListener('skindrop:statechange', onStateChange);
        document.addEventListener('skindrop:profilechange', onProfileChange);
        renderAll();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
