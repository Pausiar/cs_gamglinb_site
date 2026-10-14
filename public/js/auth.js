// Steam login (server.js OpenID endpoints). Renders into #authContainer.
(function () {
    'use strict';

    const OFFLINE_HINT = 'El inicio de sesión con Steam requiere el servidor: ejecuta "npm start" y abre http://localhost:3000';

    let container = null;
    let currentUser = null;
    let menuOpen = false;

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
            } else if (!steamId && typeof sd.useGuestMode === 'function') {
                sd.useGuestMode();
            } else if (typeof sd.switchProfile === 'function') {
                sd.switchProfile(steamId);
            }
        } catch (e) {
            console.error('[auth] cambio de perfil falló', e);
        }
    }

    // ==================== RENDER ====================
    function renderLoading() {
        container.innerHTML = `
            <span class="auth-steam-btn auth-loading" aria-busy="true">
                <i class="fa-brands fa-steam"></i>
                <span class="auth-btn-text">Cargando...</span>
            </span>`;
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
            <a class="auth-steam-btn" href="/auth/steam" title="Iniciar sesión con Steam">
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
        currentUser = null;
        switchProfile(null);
        renderLoggedOut();
        toast('Sesión cerrada', 'success');
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

    async function init() {
        container = document.getElementById('authContainer');
        if (!container) return;

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

        if (window.location.protocol === 'file:') {
            renderOffline();
            return;
        }

        renderLoading();
        let me;
        try {
            me = await fetchMe();
        } catch (e) {
            renderOffline();
            return;
        }

        if (me && me.loggedIn && /^\d{17}$/.test(String(me.steamId))) {
            currentUser = me;
            switchProfile(me.steamId);
            renderLoggedIn(me);
        } else {
            renderLoggedOut();
        }
        handleLoginParam(me);
    }

    window.SkinDropAuth = {
        get user() { return currentUser; },
        logout
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
