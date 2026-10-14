// Steam login (server.js OpenID endpoints). Renders into #authContainer.
(function () {
    'use strict';

    const OFFLINE_HINT = 'El inicio de sesión con Steam requiere el servidor: ejecuta "npm start" y abre http://localhost:3000';

    let container = null;
    let currentUser = null;
    let menuOpen = false;
    let ready = false;   // first /api/me answered

    // sd_hint=1 (non-HttpOnly, set by the server at login / cleared at logout): "a Steam session
    // probably exists". UX only - app.js shows a loading state instead of the guest profile, and
    // the signed HttpOnly session cookie stays the only real authentication.
    function hasHint() {
        try { return /(?:^|;\s*)sd_hint=1(?:;|$)/.test(document.cookie); } catch (e) { return false; }
    }

    function clearHint() {
        try { document.cookie = 'sd_hint=; Path=/; Max-Age=0; SameSite=Lax'; } catch (e) { /* ignore */ }
    }

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function safeUrl(url) {
        return typeof url === 'string' && /^https:\/\//i.test(url) ? url : '';
    }

    function toast(msg, type) {
        if (window.SkinDrop && typeof window.SkinDrop.showToast === 'function') {
            window.SkinDrop.showToast(msg, type);
        }
    }

    // Logged in: the economy runs on the server (/api/state + /api/*).
    // Logged out: back to the local guest profile (localStorage).
    function switchProfile(steamId) {
        const sd = window.SkinDrop;
        if (!sd) return;
        try {
            if (steamId && typeof sd.setServerMode === 'function') {
                sd.setServerMode(steamId);
                // Commit the provably-fair server seed (publish its hash) before the first play
                fetch('/api/fair', { credentials: 'same-origin' }).catch(() => {});
            } else if (!steamId && typeof sd.useGuestMode === 'function') {
                sd.useGuestMode();
            } else if (typeof sd.switchProfile === 'function') {
                sd.switchProfile(steamId);
            }
        } catch (e) {
            console.error('[auth] cambio de perfil falló', e);
        }
    }

    // After the Steam round trip the server sends the user back to the page they came from
    // (it only accepts simple page paths such as /cajas)
    function loginHref() {
        const path = window.location.pathname;
        return /^\/[a-z0-9-]+$/.test(path) ? '/auth/steam?next=' + encodeURIComponent(path) : '/auth/steam';
    }

    // ==================== RENDER ====================
    function renderLoading() {
        container.innerHTML = `
            <span class="auth-steam-btn auth-loading" aria-busy="true">
                <i class="fa-brands fa-steam"></i>
                <span class="auth-btn-text">Cargando...</span>
            </span>`;
    }

    // /api/me unreachable while a login hint exists: keep the loading state (never the guest
    // profile) and let the user retry
    function renderRetry() {
        container.innerHTML = `
            <button type="button" class="auth-steam-btn auth-retry" title="No se pudo cargar tu perfil">
                <i class="fas fa-rotate-right"></i>
                <span class="auth-btn-text">Reintentar</span>
            </button>`;
        container.querySelector('.auth-retry').addEventListener('click', () => { init(true); });
    }

    function renderOffline() {
        container.innerHTML = `
            <span class="auth-steam-btn auth-disabled" role="button" aria-disabled="true"
                  tabindex="0" title="${escapeHtml(OFFLINE_HINT)}">
                <i class="fa-brands fa-steam"></i>
                <span class="auth-btn-text">Iniciar sesión con Steam</span>
            </span>`;
        const btn = container.querySelector('.auth-steam-btn');
        btn.addEventListener('click', () => toast('Inicia el servidor con "npm start" para usar Steam', 'error'));
    }

    function renderLoggedOut() {
        container.innerHTML = `
            <a class="auth-steam-btn" href="${escapeHtml(loginHref())}" title="Iniciar sesión con Steam">
                <i class="fa-brands fa-steam"></i>
                <span class="auth-btn-text">Iniciar sesión con Steam</span>
            </a>`;
    }

    function renderLoggedIn(user) {
        const name = escapeHtml(user.name || 'Steam');
        const avatar = safeUrl(user.avatar);
        const profileUrl = safeUrl(user.profileUrl);
        const avatarHtml = avatar
            ? `<img class="auth-avatar" src="${escapeHtml(avatar)}" alt="" width="32" height="32" referrerpolicy="no-referrer">`
            : `<span class="auth-avatar auth-avatar-fallback" aria-hidden="true"><i class="fa-brands fa-steam"></i></span>`;

        container.innerHTML = `
            <div class="auth-user">
                <button type="button" class="auth-user-btn" aria-haspopup="true" aria-expanded="false"
                        title="${name}">
                    ${avatarHtml}
                    <span class="auth-user-name">${name}</span>
                    <i class="fas fa-chevron-down auth-caret"></i>
                </button>
                <div class="auth-menu" role="menu" hidden>
                    <div class="auth-menu-header">
                        <i class="fa-brands fa-steam"></i>
                        <span class="auth-menu-name">${name}</span>
                    </div>
                    ${profileUrl ? `
                    <a class="auth-menu-item" role="menuitem" href="${escapeHtml(profileUrl)}" target="_blank" rel="noopener noreferrer">
                        <i class="fas fa-user"></i> Perfil de Steam
                    </a>` : ''}
                    <button type="button" class="auth-menu-item auth-logout" role="menuitem">
                        <i class="fas fa-right-from-bracket"></i> Cerrar sesión
                    </button>
                </div>
            </div>`;

        const img = container.querySelector('img.auth-avatar');
        if (img) {
            img.addEventListener('error', () => {
                const span = document.createElement('span');
                span.className = 'auth-avatar auth-avatar-fallback';
                span.innerHTML = '<i class="fa-brands fa-steam"></i>';
                img.replaceWith(span);
            }, { once: true });
        }

        container.querySelector('.auth-user-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            setMenu(!menuOpen);
        });
        container.querySelector('.auth-logout').addEventListener('click', logout);
    }

    function setMenu(open) {
        const menu = container.querySelector('.auth-menu');
        const btn = container.querySelector('.auth-user-btn');
        if (!menu || !btn) return;
        menuOpen = open;
        menu.hidden = !open;
        btn.setAttribute('aria-expanded', String(open));
        container.classList.toggle('auth-open', open);
    }

    // ==================== ACTIONS ====================
    async function logout() {
        setMenu(false);
        try {
            const resp = await fetch('/auth/logout', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { Accept: 'application/json' }
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        } catch (e) {
            toast('No se pudo cerrar sesión', 'error');
            return;
        }
        showLoggedOut();
        toast('Sesión cerrada', 'success');
    }

    // Back to the guest profile on the same page: no navigation, no reload
    function showLoggedOut() {
        clearHint();
        currentUser = null;
        setMenu(false);
        switchProfile(null);
        renderLoggedOut();
    }

    async function fetchMe() {
        const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = ctrl ? setTimeout(() => ctrl.abort(), 8000) : null;
        try {
            const resp = await fetch('/api/me', {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' },
                cache: 'no-store',
                signal: ctrl ? ctrl.signal : undefined
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const type = resp.headers.get('content-type') || '';
            if (!type.includes('application/json')) throw new Error('Respuesta no JSON');
            return await resp.json();
        } finally {
            if (timer) clearTimeout(timer);
        }
    }

    // Show feedback for ?login=ok|error|cancel and clean the URL
    function handleLoginParam(me) {
        let params;
        try {
            params = new URLSearchParams(window.location.search);
        } catch (e) {
            return;
        }
        const status = params.get('login');
        if (!status) return;
        if (status === 'ok' && me && me.loggedIn) {
            toast(`¡Bienvenido, ${me.name}!`, 'success');
        } else if (status === 'error') {
            toast('No se pudo verificar el inicio de sesión con Steam', 'error');
        } else if (status === 'cancel') {
            toast('Inicio de sesión cancelado', 'error');
        }
        params.delete('login');
        const qs = params.toString();
        try {
            history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash);
        } catch (e) { /* ignore */ }
    }

    async function fetchMeWithRetry(attempts) {
        let lastError;
        for (let i = 0; i < attempts; i++) {
            try {
                return await fetchMe();
            } catch (e) {
                lastError = e;
                if (i < attempts - 1) await new Promise(r => setTimeout(r, 800 * (i + 1)));
            }
        }
        throw lastError;
    }

    let listenersBound = false;

    async function init(isRetry) {
        container = document.getElementById('authContainer');
        if (!container) return;

        if (!listenersBound) {
            listenersBound = true;
            document.addEventListener('click', (e) => {
                if (menuOpen && !container.contains(e.target)) setMenu(false);
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && menuOpen) {
                    setMenu(false);
                    const btn = container.querySelector('.auth-user-btn');
                    if (btn) btn.focus();
                }
            });
            // Logged in / out in another tab: follow it when this tab becomes visible again
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState !== 'visible' || !ready) return;
                if (currentUser && !hasHint()) showLoggedOut();
                else if (!currentUser && hasHint()) window.location.reload();
            });
        }

        if (window.location.protocol === 'file:') {
            renderOffline();
            return;
        }

        const hinted = hasHint();
        renderLoading();
        let me;
        try {
            me = await fetchMeWithRetry(hinted ? 3 : 1);
        } catch (e) {
            if (hinted) {
                renderRetry();
                if (isRetry !== true) toast('No se pudo cargar tu perfil. Comprueba tu conexión.', 'error');
            } else {
                renderOffline();
            }
            return;
        }
        ready = true;

        if (me && me.loggedIn && /^\d{17}$/.test(String(me.steamId))) {
            currentUser = me;
            switchProfile(me.steamId);
            renderLoggedIn(me);
        } else {
            // Stale hint (session expired / logged out elsewhere): leave the loading state
            if (hinted) {
                clearHint();
                switchProfile(null);
            }
            renderLoggedOut();
        }
        handleLoginParam(me);
    }

    window.SkinDropAuth = {
        get user() { return currentUser; },
        logout
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { init(); });
    } else {
        init();
    }
})();
