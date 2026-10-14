// Shared page chrome: header (logo, nav, balance, sound toggle, Steam login), balance
// modal and footer. Every page has two placeholders and loads this script right after them,
// BEFORE the other scripts, so the injected elements (#balance, #authContainer, ...) already
// exist when app.js / auth.js run:
//
//   <div id="siteHeader"></div>   ...page content...   <div id="siteFooter"></div>
//   <script src="js/layout.js"></script>
//
// The active nav link comes from <body data-page="cajas"> (falls back to the URL).
// To add a page to the menu, add one entry to NAV; footer links live in FOOTER_LINKS.
(function () {
    // Logged-in hint (set by the server, see auth): avoid painting a guest balance first
    var HAS_HINT = /(^|;\s*)sd_hint=1(;|$)/.test(document.cookie || '');
    if (HAS_HINT) document.documentElement.classList.add('sd-loading');

    'use strict';

    // key = value of <body data-page>; href = clean URL (see "cleanUrls" in vercel.json)
    var NAV = [
        { key: 'inicio', href: '/', label: 'Inicio', icon: 'fa-home' },
        { key: 'cajas', href: '/cajas', label: 'Cajas', icon: 'fa-boxes' },
        { key: 'upgrader', href: '/upgrader', label: 'Upgrader', icon: 'fa-arrow-up' },
        { key: 'batallas', href: '/batallas', label: 'Batallas', icon: 'fa-crosshairs' },
        { key: 'recompensas', href: '/recompensas', label: 'Recompensas', icon: 'fa-gift' },
        { key: 'ranking', href: '/ranking', label: 'Ranking', icon: 'fa-trophy' },
        { key: 'inventario', href: '/inventario', label: 'Inventario', icon: 'fa-briefcase' },
        { key: 'estadisticas', href: '/estadisticas', label: 'Estadísticas', icon: 'fa-chart-bar' }
    ];

    var FOOTER_LINKS = [
        { key: 'terminos', href: '/terminos', label: 'Términos de Servicio' },
        { key: 'privacidad', href: '/privacidad', label: 'Política de Privacidad' },
        { key: 'provably-fair', href: '/provably-fair', label: 'Provably Fair' },
        { key: 'contacto', href: '/contacto', label: 'Contacto' }
    ];

    var DRAWER_BREAKPOINT = 1320; // keep in sync with the @media rule in css/styles.css

    var isFile = window.location.protocol === 'file:';

    function pageKey() {
        var key = document.body && document.body.getAttribute('data-page');
        if (key) return key;
        var name = window.location.pathname.replace(/\/+$/, '').split('/').pop().replace(/\.html$/, '');
        return !name || name === 'index' ? 'inicio' : name;
    }

    // Opened from disk (file://) there is no server to resolve clean URLs: link the .html files
    function hrefFor(item) {
        if (!isFile) return item.href;
        return item.key === 'inicio' ? 'index.html' : item.key + '.html';
    }

    function hrefOfPage(key) {
        var all = NAV.concat(FOOTER_LINKS);
        for (var i = 0; i < all.length; i++) {
            if (all[i].key === key) return hrefFor(all[i]);
        }
        return isFile ? key + '.html' : '/' + key;
    }

    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function headerHtml(current) {
        var links = NAV.map(function (item) {
            var active = item.key === current;
            return '<a href="' + esc(hrefFor(item)) + '" class="nav-link' + (active ? ' active' : '') + '"' +
                (active ? ' aria-current="page"' : '') + '><i class="fas ' + item.icon + '"></i> ' + esc(item.label) + '</a>';
        }).join('');

        return '' +
            '<header class="header">' +
                '<div class="header-container">' +
                    '<a class="logo" href="' + esc(hrefOfPage('inicio')) + '" aria-label="SkinDrop - Inicio">' +
                        '<i class="fas fa-box-open"></i>' +
                        '<span>SKIN<span class="accent">DROP</span></span>' +
                    '</a>' +
                    '<nav class="nav-menu" id="siteNav" aria-label="Principal">' + links + '</nav>' +
                    '<div class="header-actions">' +
                        '<div class="balance-container" id="balanceContainer">' +
                            '<i class="fas fa-wallet"></i>' +
                            '<span class="balance" id="balance">' + (HAS_HINT ? '…' : '0.00') + '</span>€' +
                            '<button type="button" class="add-balance-btn" id="addBalanceBtn" aria-label="Añadir saldo">' +
                                '<i class="fas fa-plus"></i>' +
                            '</button>' +
                        '</div>' +
                        '<button type="button" class="sfx-toggle" id="sfxToggle" data-sfx-toggle aria-pressed="false" ' +
                            'aria-label="Silenciar sonidos" title="Sonido">' +
                            '<i class="fas fa-volume-high"></i>' +
                        '</button>' +
                        // Steam login / user menu (js/auth.js)
                        '<div class="auth-container" id="authContainer"></div>' +
                    '</div>' +
                    '<button type="button" class="nav-toggle" id="navToggle" aria-expanded="false" ' +
                        'aria-controls="siteNav" aria-label="Abrir menú">' +
                        '<i class="fas fa-bars"></i>' +
                    '</button>' +
                '</div>' +
            '</header>';
    }

    // Add-balance modal; behaviour lives in app.js (promo codes)
    function modalHtml() {
        return '' +
            '<div class="modal" id="balanceModal">' +
                '<div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="balanceModalTitle">' +
                    '<div class="modal-header">' +
                        '<h2 id="balanceModalTitle"><i class="fas fa-coins"></i> Añadir Saldo</h2>' +
                        '<button type="button" class="close-modal" id="closeModal" aria-label="Cerrar">&times;</button>' +
                    '</div>' +
                    '<div class="modal-body">' +
                        '<div class="promo-code-section">' +
                            '<label for="promoCode">Código Promocional</label>' +
                            '<div class="promo-input-wrapper">' +
                                '<input type="text" id="promoCode" placeholder="Introduce tu código..." autocomplete="off">' +
                                '<button type="button" class="apply-code-btn" id="applyCode">Aplicar</button>' +
                            '</div>' +
                            '<p class="promo-hint">* Introduce un código válido para recibir saldo</p>' +
                        '</div>' +
                        '<div class="payment-methods">' +
                            '<h3>Métodos de Pago</h3>' +
                            '<p class="coming-soon"><i class="fas fa-lock"></i> Próximamente...</p>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    function footerHtml() {
        var links = FOOTER_LINKS.map(function (item) {
            return '<a href="' + esc(hrefFor(item)) + '">' + esc(item.label) + '</a>';
        }).join('');
        return '' +
            '<footer class="footer">' +
                '<div class="footer-content">' +
                    '<div class="footer-logo">' +
                        '<i class="fas fa-box-open"></i>' +
                        '<span>SKIN<span class="accent">DROP</span></span>' +
                    '</div>' +
                    '<div class="footer-links">' + links + '</div>' +
                    '<div class="footer-disclaimer">' +
                        '<p>Este sitio es solo para entretenimiento. No se realizan transacciones reales.</p>' +
                        '<p>+18 | Juega con responsabilidad</p>' +
                    '</div>' +
                '</div>' +
            '</footer>';
    }

    // Replaces the placeholder (or inserts the markup when the page forgot it)
    function mount(id, html, fallback) {
        var el = document.getElementById(id);
        if (el) {
            el.outerHTML = html;
        } else if (fallback === 'start') {
            document.body.insertAdjacentHTML('afterbegin', html);
        } else {
            document.body.insertAdjacentHTML('beforeend', html);
        }
    }

    // ---------- mobile drawer ----------
    function initDrawer() {
        var toggle = document.getElementById('navToggle');
        var nav = document.getElementById('siteNav');
        var header = document.querySelector('.header');
        if (!toggle || !nav || !header) return;

        function setOpen(open) {
            nav.classList.toggle('is-open', open);
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
            toggle.firstElementChild.className = open ? 'fas fa-xmark' : 'fas fa-bars';
        }

        toggle.addEventListener('click', function (e) {
            e.stopPropagation();
            setOpen(!nav.classList.contains('is-open'));
        });
        nav.addEventListener('click', function (e) {
            if (e.target.closest('a')) setOpen(false);
        });
        document.addEventListener('click', function (e) {
            if (nav.classList.contains('is-open') && !header.contains(e.target)) setOpen(false);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && nav.classList.contains('is-open')) {
                setOpen(false);
                toggle.focus();
            }
        });
        if (window.matchMedia) {
            var mq = window.matchMedia('(min-width: ' + (DRAWER_BREAKPOINT + 1) + 'px)');
            var onChange = function (e) { if (e.matches) setOpen(false); };
            if (mq.addEventListener) mq.addEventListener('change', onChange);
            else if (mq.addListener) mq.addListener(onChange);
        }
    }

    // In-page links to other pages are written as clean URLs: <a href="/cajas" data-page-link="cajas">.
    // Opened from disk they are pointed at the .html file instead.
    function fixPageLinks() {
        if (!isFile) return;
        var links = document.querySelectorAll('a[data-page-link]');
        for (var i = 0; i < links.length; i++) {
            links[i].setAttribute('href', hrefOfPage(links[i].getAttribute('data-page-link')));
        }
    }

    var current = pageKey();
    mount('siteHeader', headerHtml(current) + modalHtml(), 'start');
    mount('siteFooter', footerHtml(), 'end');
    fixPageLinks();
    initDrawer();

    window.SkinDropLayout = {
        NAV: NAV,
        FOOTER_LINKS: FOOTER_LINKS,
        page: current,
        // URL of a page by key ('cajas' -> '/cajas', or 'cajas.html' when opened from disk)
        href: hrefOfPage
    };
})();
