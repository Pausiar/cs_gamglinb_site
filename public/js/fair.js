// SkinDrop · Provably Fair
//
// Part 1 (pure, no DOM): the algorithm, written with WebCrypto (SubtleCrypto) so anybody can run it in a
// browser or in Node (globalThis.crypto.subtle). The server uses node:crypto in lib/fair.js and
// test/fair.test.js checks both give the same floats.
//
//   serverSeed      secret 64-hex string (32 random bytes) until the player rotates it
//   serverSeedHash  SHA-256 of the serverSeed string (its 64 characters as UTF-8), lowercase hex
//   clientSeed      string chosen by the player
//   nonce           0, 1, 2 ... one per game action (open, sell, upgrade, battle, ...)
//   block(cursor)   = HMAC-SHA256(key = serverSeed as UTF-8 text, message = clientSeed + ":" + nonce + ":" + cursor)
//   float number k  = uint32_big_endian(block(floor(k / 8))[4 * (k % 8) .. +4]) / 2^32      (in [0, 1))
//
// The engine (engine.js) draws the floats of an action in order, so replaying an action with the same
// engine and the revealed seeds gives the same result as the server.
//
// Part 2 (browser only): the /provably-fair page, rendered into #fairRoot.
(function (root, factory) {
    'use strict';
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.SkinDropFair = api;
    if (typeof document !== 'undefined' && document.getElementById && document.getElementById('fairRoot')) {
        const start = () => api.mountPage(document.getElementById('fairRoot'));
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
        else start();
    }
})(typeof self !== 'undefined' ? self : this, function (root) {
    'use strict';

    const FLOATS_PER_BLOCK = 8;
    const DEFAULT_FLOATS = 1024;   // plenty for the biggest action (a 10-round 4-player battle needs ~550)
    const enc = new TextEncoder();

    function subtle() {
        const c = (typeof globalThis !== 'undefined' && globalThis.crypto) || (root && root.crypto);
        if (!c || !c.subtle) throw new Error('Este navegador no soporta WebCrypto (SubtleCrypto).');
        return c.subtle;
    }

    function toHex(bytes) {
        return Array.from(new Uint8Array(bytes)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function sha256Hex(text) {
        return toHex(await subtle().digest('SHA-256', enc.encode(String(text))));
    }

    async function hmacBlock(serverSeed, clientSeed, nonce, cursor) {
        const key = await subtle().importKey('raw', enc.encode(String(serverSeed)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const sig = await subtle().sign('HMAC', key, enc.encode(`${clientSeed}:${nonce}:${cursor}`));
        return new Uint8Array(sig);
    }

    // First `count` floats of the action (serverSeed, clientSeed, nonce)
    async function floats(serverSeed, clientSeed, nonce, count) {
        const out = [];
        const blocks = Math.ceil(count / FLOATS_PER_BLOCK);
        for (let cursor = 0; cursor < blocks; cursor++) {
            const block = await hmacBlock(serverSeed, clientSeed, nonce, cursor);
            const view = new DataView(block.buffer, block.byteOffset, block.byteLength);
            for (let i = 0; i < FLOATS_PER_BLOCK && out.length < count; i++) out.push(view.getUint32(i * 4, false) / 4294967296);
        }
        return out;
    }

    // Synchronous rng (what the engine needs) backed by precomputed floats
    async function createRng(serverSeed, clientSeed, nonce, count) {
        const list = await floats(serverSeed, clientSeed, nonce, count || DEFAULT_FLOATS);
        let k = 0;
        return function fairRng() {
            if (k >= list.length) throw new Error('Se agotaron los números precalculados.');
            return list[k++];
        };
    }

    // Replays one game action with the real engine on a synthetic account (rich, empty inventory).
    //   spec: { game: 'open' | 'upgrade' | 'battle', serverSeed, clientSeed, nonce, ...params }
    //     open:    { caseId }
    //     upgrade: { stake (EUR), targetId, mode: 'under' | 'over' }
    //     battle:  { mode, crazy, caseIds[], serverBots }   (serverBots: the request had no botNames)
    // Returns { result, floats: first floats drawn, drawn } or rejects with the engine's message.
    async function replay(engine, spec) {
        const rng = await createRng(spec.serverSeed, spec.clientSeed, spec.nonce, spec.count);
        let drawn = 0;
        const counted = () => { drawn++; return rng(); };
        const state = Object.assign(engine.defaultState(), { balance: 1000000 });
        const now = 0;
        let out;
        if (spec.game === 'open') {
            out = engine.openCase(state, { caseId: spec.caseId }, counted, now);
        } else if (spec.game === 'upgrade') {
            out = engine.upgrade(state, { uids: [], balanceStake: Number(spec.stake), targetId: spec.targetId, mode: spec.mode || 'under' }, counted, now);
        } else if (spec.game === 'battle') {
            const params = { mode: spec.mode, crazy: !!spec.crazy, caseIds: spec.caseIds };
            if (!spec.serverBots) {
                const seats = engine.constants.BATTLE_MODES[spec.mode];
                params.botNames = engine.constants.BOT_NAMES.slice(0, seats ? seats.seats - 1 : 0);
            }
            out = engine.battle(state, params, counted, now);
        } else {
            throw new Error('Tipo de juego desconocido.');
        }
        const head = await floats(spec.serverSeed, spec.clientSeed, spec.nonce, 5);
        return { result: out.result, floats: head, drawn };
    }

    // ================================================================ page
    const RARITY_NAMES = {
        consumer: 'Consumidor', industrial: 'Industrial', milspec: 'Mil-Spec', restricted: 'Restringido',
        classified: 'Clasificado', covert: 'Encubierto', gold: 'Especial (oro)'
    };

    function esc(v) {
        return String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    function money(n) { return Number(n).toFixed(2).replace('.', ',') + ' €'; }
    function randomHex(bytes) {
        const a = new Uint8Array(bytes);
        globalThis.crypto.getRandomValues(a);
        return toHex(a);
    }
    function fmtDate(ts) {
        try { return new Date(ts).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return ''; }
    }
    function toast(msg, type) {
        if (root.SkinDrop && typeof root.SkinDrop.showToast === 'function') root.SkinDrop.showToast(msg, type);
    }

    function pageHtml() {
        const caseOptions = (typeof cases !== 'undefined' ? cases : []).map(c =>
            `<option value="${c.id}">${esc(c.name)} · ${money(c.price)}</option>`).join('');
        const allSkins = [];
        if (typeof skins !== 'undefined') {
            Object.keys(skins).forEach(r => skins[r].forEach(s => allSkins.push({ id: s.id, name: s.name, price: s.price })));
        }
        allSkins.sort((a, b) => a.price - b.price);
        const defaultTarget = (allSkins.find(s => s.price >= 15) || {}).id;   // a sensible default for the 10 € stake
        const skinOptions = allSkins.map(s => `<option value="${s.id}"${s.id === defaultTarget ? ' selected' : ''}>${esc(s.name)} · ${money(s.price)}</option>`).join('');

        return `
<div class="fair">
  <div class="fair-intro">
    <p class="fair-lead">En SkinDrop no tienes que fiarte de nosotros: cada apertura, upgrade y batalla de una cuenta de Steam se decide con un sistema <strong>provably fair</strong> que puedes comprobar tú mismo.</p>
    <ol class="fair-steps">
      <li><span class="fair-step-n">1</span><div><strong>Compromiso</strong><p>Antes de jugar el servidor genera una <em>semilla de servidor</em> secreta y te enseña su <strong>hash SHA-256</strong>. Ese hash es un sello: ya no se puede cambiar la semilla sin que se note.</p></div></li>
      <li><span class="fair-step-n">2</span><div><strong>Tu semilla</strong><p>Tú eliges la <em>semilla de cliente</em>. El resultado depende de las dos semillas y de un contador (<em>nonce</em>) que sube una unidad en cada jugada, así que el servidor no puede preparar resultados a su favor.</p></div></li>
      <li><span class="fair-step-n">3</span><div><strong>Revelación</strong><p>Cuando pulsas «Cambiar semilla» revelamos la semilla de servidor anterior. Comprueba que su hash coincide con el que viste y repite cualquier jugada en el verificador.</p></div></li>
    </ol>
  </div>

  <section class="fair-card" id="fairPlayer" aria-live="polite">
    <h3><i class="fas fa-key"></i> Tus semillas</h3>
    <div id="fairPlayerBody"><p class="fair-muted">Cargando...</p></div>
  </section>

  <section class="fair-card" id="fairVerifier">
    <h3><i class="fas fa-magnifying-glass-chart"></i> Verificador</h3>
    <p class="fair-muted">Introduce una semilla de servidor ya revelada, tu semilla de cliente y el nonce de la jugada. Se recalcula con el mismo motor del juego, en tu navegador (WebCrypto), sin enviar nada al servidor.</p>
    <form id="fairForm" class="fair-form" autocomplete="off" novalidate>
      <label class="fair-field fair-wide">Semilla de servidor (revelada)
        <input type="text" id="fvServerSeed" spellcheck="false" placeholder="64 caracteres hexadecimales" required>
      </label>
      <label class="fair-field fair-wide">Hash publicado (opcional, para comprobar el sello)
        <input type="text" id="fvHash" spellcheck="false" placeholder="SHA-256 que viste antes de jugar">
      </label>
      <label class="fair-field">Semilla de cliente
        <input type="text" id="fvClientSeed" spellcheck="false" maxlength="64" required>
      </label>
      <label class="fair-field">Nonce
        <input type="number" id="fvNonce" min="0" step="1" value="0" required>
      </label>
      <label class="fair-field fair-wide">Juego
        <select id="fvGame">
          <option value="open">Apertura de caja</option>
          <option value="upgrade">Upgrade</option>
          <option value="battle">Batalla</option>
        </select>
      </label>

      <div class="fair-game" data-game="open">
        <label class="fair-field fair-wide">Caja
          <select id="fvCase">${caseOptions}</select>
        </label>
      </div>

      <div class="fair-game" data-game="upgrade" hidden>
        <label class="fair-field">Apuesta total (€)
          <input type="number" id="fvStake" min="0.01" step="0.01" value="10">
        </label>
        <label class="fair-field">Modo
          <select id="fvUpMode"><option value="under">Menos (roll &lt; probabilidad)</option><option value="over">Más (roll en el tramo final)</option></select>
        </label>
        <label class="fair-field fair-wide">Skin objetivo
          <select id="fvTarget">${skinOptions}</select>
        </label>
      </div>

      <div class="fair-game" data-game="battle" hidden>
        <label class="fair-field">Modo
          <select id="fvBMode"><option value="1v1">1v1</option><option value="1v1v1">1v1v1</option><option value="2v2">2v2</option><option value="1v1v1v1">1v1v1v1</option></select>
        </label>
        <label class="fair-check"><input type="checkbox" id="fvCrazy"> Modo Crazy (gana el total más bajo)</label>
        <label class="fair-check fair-wide"><input type="checkbox" id="fvServerBots"> Los bots los eligió el servidor (llamada directa a la API, sin <code>botNames</code>)</label>
        <div class="fair-field fair-wide">
          <span>Rondas (una caja por ronda, máx. 10)</span>
          <div class="fair-row">
            <select id="fvBCase">${caseOptions}</select>
            <button type="button" class="fair-btn" id="fvBAdd"><i class="fas fa-plus"></i> Añadir</button>
          </div>
          <div class="fair-chips" id="fvBChips"></div>
        </div>
      </div>

      <div class="fair-wide fair-actions">
        <button type="submit" class="cta-button fair-submit"><i class="fas fa-check-double"></i> Verificar</button>
      </div>
    </form>
    <div id="fairOut" class="fair-out" aria-live="polite"></div>
  </section>

  <section class="fair-card">
    <h3><i class="fas fa-code"></i> El algoritmo, paso a paso</h3>
    <ol class="fair-algo">
      <li><code>serverSeed</code>: 32 bytes aleatorios en hexadecimal (64 caracteres). <code>serverSeedHash = SHA-256(serverSeed)</code>, calculado sobre esos 64 caracteres como texto UTF-8.</li>
      <li>Por cada jugada, con <code>nonce</code> = 0, 1, 2... se calculan bloques de 32 bytes:<br><code>bloque(c) = HMAC-SHA256(clave = serverSeed, mensaje = clientSeed + ":" + nonce + ":" + c)</code></li>
      <li>Cada número aleatorio son 4 bytes del bloque (big-endian) divididos entre 2<sup>32</sup>, así que está en [0, 1). El número <em>k</em> usa los bytes <code>4·(k mod 8)</code> a <code>4·(k mod 8)+3</code> del bloque <code>floor(k / 8)</code>.</li>
      <li>El motor del juego consume esos números en orden: en una apertura el primero elige la skin (<code>tirada = n × 100</code> frente a las probabilidades de la caja), en un upgrade el primero es la tirada (<code>floor(n × 10000) / 100</code>), y en una batalla se usan en orden ronda a ronda y asiento a asiento (más un número extra solo si hay empate).</li>
      <li>Cada jugada con sesión iniciada gasta un nonce, también vender o canjear códigos. Al cambiar de semilla el nonce vuelve a 0 y se guardan hasta tus últimas 10 semillas reveladas.</li>
    </ol>
    <p class="fair-muted">Los identificadores internos de los objetos (<code>uid</code>) salen de los mismos números aleatorios, así que el verificador te muestra también el <code>uid</code> del objeto que ganaste. Como el juego como invitado se calcula localmente en tu navegador, solo las cuentas con sesión de Steam usan este sistema.</p>
    <pre class="fair-code"><code>// JavaScript (navegador o Node 20+)
async function float(serverSeed, clientSeed, nonce, k) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(serverSeed),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const block = new Uint8Array(await crypto.subtle.sign('HMAC', key,
    enc.encode(clientSeed + ':' + nonce + ':' + Math.floor(k / 8))));
  return new DataView(block.buffer).getUint32((k % 8) * 4) / 2 ** 32;
}</code></pre>
  </section>
</div>`;
    }

    function mountPage(rootEl) {
        rootEl.innerHTML = pageHtml();
        const $ = id => rootEl.querySelector('#' + id);
        const engine = root.SkinDropEngine;
        const ph = document.querySelector('[data-placeholder]');
        if (ph) ph.remove();

        // ---------------------------------------------------- player panel
        const body = $('fairPlayerBody');
        let fairState = null;

        function renderGuest(reason) {
            body.innerHTML = `
<div class="fair-note"><i class="fas fa-circle-info"></i>
  <div>${reason || 'Estás jugando como invitado.'} El juego como invitado se calcula localmente en tu navegador, por eso no tiene semillas ni hash que comprobar: <strong>Provably Fair se aplica al juego con sesión iniciada</strong>.
  <div class="fair-guest-cta"><a href="/auth/steam?next=/provably-fair" class="cta-button"><i class="fab fa-steam"></i> Iniciar sesión con Steam</a></div></div>
</div>
<p class="fair-muted">Aun así puedes usar el verificador de abajo y leer cómo funciona el algoritmo.</p>`;
        }

        async function renderPlayer() {
            const f = fairState;
            const revealed = Array.isArray(f.revealed) ? f.revealed : [];
            const rows = await Promise.all(revealed.map(async (r, i) => {
                let ok = false;
                try { ok = (await sha256Hex(r.serverSeed)) === r.serverSeedHash; } catch (e) { ok = false; }
                return `
<li class="fair-rev">
  <div class="fair-rev-head">
    <span class="fair-badge ${ok ? 'ok' : 'bad'}"><i class="fas ${ok ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i> ${ok ? 'El hash coincide' : 'El hash NO coincide'}</span>
    <span class="fair-muted">${r.nonces} jugada${r.nonces === 1 ? '' : 's'} · ${esc(fmtDate(r.revealedAt))}</span>
  </div>
  <dl class="fair-dl">
    <dt>Semilla de servidor</dt><dd class="fair-mono">${esc(r.serverSeed)}</dd>
    <dt>Hash</dt><dd class="fair-mono">${esc(r.serverSeedHash)}</dd>
    <dt>Semilla de cliente</dt><dd class="fair-mono">${esc(r.clientSeed)}</dd>
  </dl>
  <button type="button" class="fair-btn" data-verify="${i}"><i class="fas fa-magnifying-glass"></i> Verificar jugadas</button>
</li>`;
            }));
            body.innerHTML = `
<dl class="fair-dl fair-current">
  <dt>Hash de la semilla de servidor (sellada)</dt>
  <dd><span class="fair-mono" id="fairHash">${esc(f.serverSeedHash)}</span> <button type="button" class="fair-icon-btn" data-copy="${esc(f.serverSeedHash)}" title="Copiar" aria-label="Copiar hash"><i class="fas fa-copy"></i></button></dd>
  <dt>Siguiente nonce</dt>
  <dd class="fair-mono" id="fairNonce">${f.nonce}</dd>
</dl>
<form id="fairSeedForm" class="fair-seedform" autocomplete="off">
  <label class="fair-field">Semilla de cliente
    <div class="fair-row">
      <input type="text" id="fairClientSeed" value="${esc(f.clientSeed)}" maxlength="64" spellcheck="false" pattern="[A-Za-z0-9_\\-]{1,64}">
      <button type="button" class="fair-icon-btn" id="fairDice" title="Generar una semilla aleatoria" aria-label="Generar una semilla aleatoria"><i class="fas fa-dice"></i></button>
    </div>
  </label>
  <button type="submit" class="cta-button fair-submit" id="fairRotate"><i class="fas fa-rotate"></i> Cambiar semilla</button>
</form>
<p class="fair-muted">Al cambiar la semilla revelamos la de servidor actual (queda abajo), generamos otra nueva con su hash y el nonce vuelve a 0. Solo letras, números, «_» y «-» (1 a 64 caracteres).</p>
<div id="fairMsg" class="fair-msg" role="status"></div>
<h4>Semillas reveladas</h4>
${rows.length ? `<ul class="fair-revlist">${rows.join('')}</ul>` : '<p class="fair-muted">Aún no has revelado ninguna semilla. Cambia de semilla para poder verificar tus jugadas anteriores.</p>'}`;
        }

        async function loadPlayer() {
            let me = null;
            try {
                const r = await fetch('/api/me', { credentials: 'same-origin', cache: 'no-store' });
                if (r.ok) me = await r.json();
            } catch (e) { me = null; }
            if (!me || !me.loggedIn) {
                renderGuest(me ? 'No has iniciado sesión.' : 'No se pudo comprobar tu sesión (¿servidor sin conexión?).');
                return;
            }
            try {
                const r = await fetch('/api/fair', { credentials: 'same-origin', cache: 'no-store' });
                if (!r.ok) throw new Error('http ' + r.status);
                fairState = await r.json();
                await renderPlayer();
            } catch (e) {
                body.innerHTML = '<p class="fair-msg err">No se pudieron cargar tus semillas. Inténtalo de nuevo más tarde.</p>';
            }
        }

        async function rotate(clientSeed) {
            const msg = $('fairMsg');
            const btn = $('fairRotate');
            if (btn) btn.disabled = true;
            try {
                const r = await fetch('/api/fair/rotate', {
                    method: 'POST', credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clientSeed })
                });
                const j = await r.json().catch(() => ({}));
                if (!r.ok) throw new Error(j.error || 'No se pudo cambiar la semilla.');
                fairState = j.result;
                await renderPlayer();
                const m = $('fairMsg');
                m.className = 'fair-msg ok';
                m.textContent = 'Listo: la semilla anterior se ha revelado y hay una nueva. Nonce reiniciado a 0.';
                toast('Semilla cambiada', 'success');
            } catch (e) {
                if (msg) { msg.className = 'fair-msg err'; msg.textContent = e.message; }
                if (btn) btn.disabled = false;
            }
        }

        // ---------------------------------------------------- verifier form
        const game = $('fvGame');
        const battleCases = [];

        function showGame() {
            rootEl.querySelectorAll('.fair-game').forEach(el => { el.hidden = el.getAttribute('data-game') !== game.value; });
        }
        function renderChips() {
            const names = new Map((typeof cases !== 'undefined' ? cases : []).map(c => [c.id, c.name]));
            $('fvBChips').innerHTML = battleCases.length
                ? battleCases.map((id, i) => `<span class="fair-chip">${i + 1}. ${esc(names.get(id) || id)} <button type="button" data-rm="${i}" aria-label="Quitar ronda ${i + 1}">&times;</button></span>`).join('')
                : '<span class="fair-muted">Añade al menos una caja.</span>';
        }
        game.addEventListener('change', showGame);
        $('fvBAdd').addEventListener('click', () => {
            if (battleCases.length < 10) battleCases.push(Number($('fvBCase').value));
            renderChips();
        });
        $('fvBChips').addEventListener('click', e => {
            const b = e.target.closest('[data-rm]');
            if (b) { battleCases.splice(Number(b.getAttribute('data-rm')), 1); renderChips(); }
        });
        showGame();
        renderChips();

        function itemHtml(it, label) {
            const col = `var(--rarity-${esc(it.rarity)}, #fff)`;
            return `<div class="fair-item" style="--rc:${col}">
  <span class="fair-item-label">${label ? esc(label) : ''}</span>
  <strong>${esc(it.name)}</strong>
  <span>${esc(RARITY_NAMES[it.rarity] || it.rarity)} · ${money(it.price)}</span>
  ${it.uid ? `<span class="fair-muted fair-mono">uid ${esc(it.uid)}</span>` : ''}
</div>`;
        }

        function resultHtml(spec, out) {
            const r = out.result;
            const head = `<p class="fair-muted">Primeros números aleatorios: <span class="fair-mono">${out.floats.map(f => f.toFixed(8)).join(' · ')}</span></p>`;
            if (spec.game === 'open') {
                const caseName = (cases.find(c => c.id === r.caseId) || {}).name || '';
                return `<h4>Resultado de ${esc(caseName)}</h4>
<p class="fair-muted">Tirada: <span class="fair-mono">${(out.floats[0] * 100).toFixed(6)}</span> de 100</p>
${itemHtml(r.item, 'Skin obtenida')}${head}`;
            }
            if (spec.game === 'upgrade') {
                return `<h4>${r.win ? '¡Upgrade ganado!' : 'Upgrade perdido'}</h4>
<p>Tirada <span class="fair-mono">${r.roll.toFixed(2)}</span> · probabilidad <span class="fair-mono">${r.chance}%</span> · modo ${r.mode === 'over' ? 'más' : 'menos'} · apuesta ${money(r.stake)}</p>
<p class="fair-muted">${r.mode === 'over' ? 'Gana si la tirada es ≥ ' + (100 - r.chance).toFixed(2) : 'Gana si la tirada es < ' + r.chance}</p>
${itemHtml(Object.assign({ uid: r.item && r.item.uid }, r.target), r.win ? 'Skin ganada' : 'Objetivo (no conseguido)')}${head}`;
            }
            const cols = r.seats.map(s => `<th>${esc(s.name)}<br><span class="fair-muted">equipo ${s.team + 1}</span></th>`).join('');
            const rounds = r.rounds.map((row, i) => `<tr><td>${i + 1}</td>${row.map(d => `<td style="color:var(--rarity-${esc(d.rarity)}, #fff)">${esc(d.name)}<br><span class="fair-muted">${money(d.price)}</span></td>`).join('')}</tr>`).join('');
            const totals = r.totals.map(t => `<td><strong>${money(t)}</strong></td>`).join('');
            return `<h4>Batalla ${esc(r.mode)}${r.crazy ? ' · Crazy' : ''}: ${r.won ? 'ganó el equipo del jugador' : 'ganó otro equipo'}</h4>
<p class="fair-muted">Equipo ganador: ${r.winnerTeam + 1}${r.tiebreak ? ' (decidido por desempate con un número aleatorio)' : ''} · Bote ${money(r.pot)}</p>
<div class="fair-table-wrap"><table class="fair-table"><thead><tr><th>Ronda</th>${cols}</tr></thead><tbody>${rounds}</tbody><tfoot><tr><td>Total</td>${totals}</tr></tfoot></table></div>${head}`;
        }

        $('fairForm').addEventListener('submit', async e => {
            e.preventDefault();
            const out = $('fairOut');
            const serverSeed = $('fvServerSeed').value.trim();
            const clientSeed = $('fvClientSeed').value;
            const nonce = Number($('fvNonce').value);
            const fail = m => { out.innerHTML = `<p class="fair-msg err">${esc(m)}</p>`; };
            if (!serverSeed) return fail('Falta la semilla de servidor.');
            if (!clientSeed) return fail('Falta la semilla de cliente.');
            if (!Number.isInteger(nonce) || nonce < 0) return fail('El nonce debe ser un entero mayor o igual que 0.');
            if (!engine) return fail('No se cargó el motor del juego.');

            const spec = { game: game.value, serverSeed, clientSeed, nonce };
            if (spec.game === 'open') {
                spec.caseId = Number($('fvCase').value);
            } else if (spec.game === 'upgrade') {
                spec.stake = Number($('fvStake').value);
                spec.targetId = Number($('fvTarget').value);
                spec.mode = $('fvUpMode').value;
                if (!(spec.stake > 0)) return fail('La apuesta debe ser mayor que 0.');
            } else {
                if (!battleCases.length) return fail('Añade al menos una caja a la batalla.');
                spec.mode = $('fvBMode').value;
                spec.crazy = $('fvCrazy').checked;
                spec.serverBots = $('fvServerBots').checked;
                spec.caseIds = battleCases.slice();
            }

            let html = '';
            try {
                const hash = $('fvHash').value.trim().toLowerCase();
                const computed = await sha256Hex(serverSeed);
                if (hash) {
                    const ok = hash === computed;
                    html += `<p class="fair-badge ${ok ? 'ok' : 'bad'}"><i class="fas ${ok ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i> ${ok ? 'El hash coincide con la semilla de servidor.' : 'El hash NO coincide con la semilla de servidor.'}</p>`;
                } else {
                    html += `<p class="fair-muted">SHA-256 de la semilla de servidor: <span class="fair-mono">${esc(computed)}</span></p>`;
                }
                html += resultHtml(spec, await replay(engine, spec));
                out.innerHTML = html;
            } catch (err) {
                fail('No se pudo recalcular: ' + (err && err.message ? err.message : err));
            }
        });

        // ---------------------------------------------------- events (delegated)
        rootEl.addEventListener('click', async e => {
            const copy = e.target.closest('[data-copy]');
            if (copy) {
                try { await navigator.clipboard.writeText(copy.getAttribute('data-copy')); toast('Copiado', 'success'); } catch (err) { /* no clipboard */ }
                return;
            }
            if (e.target.closest('#fairDice')) {
                $('fairClientSeed').value = randomHex(8);
                return;
            }
            const v = e.target.closest('[data-verify]');
            if (v && fairState) {
                const r = fairState.revealed[Number(v.getAttribute('data-verify'))];
                if (!r) return;
                $('fvServerSeed').value = r.serverSeed;
                $('fvHash').value = r.serverSeedHash;
                $('fvClientSeed').value = r.clientSeed;
                $('fvNonce').value = 0;
                $('fairVerifier').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        rootEl.addEventListener('submit', e => {
            if (e.target.id !== 'fairSeedForm') return;
            e.preventDefault();
            const value = $('fairClientSeed').value.trim();
            if (!/^[A-Za-z0-9_-]{1,64}$/.test(value)) {
                const m = $('fairMsg');
                m.className = 'fair-msg err';
                m.textContent = 'La semilla de cliente debe tener entre 1 y 64 caracteres: letras, números, «_» o «-».';
                return;
            }
            rotate(value);
        });

        loadPlayer();
    }

    return {
        ALGORITHM_VERSION: 1,
        sha256Hex, hmacBlock, floats, createRng, replay, mountPage
    };
});
