// Themed case artwork: one hand-written SVG per case.theme, assigned to case.image.
// Exposes window.CaseArt.render(theme, options) -> data URI. No external assets, no text.
(function () {
    'use strict';

    // ---------- helpers ----------
    function lg(id, stops, x2, y2) {
        return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (x2 || 0) + '" y2="' + (y2 === undefined ? 1 : y2) + '">' +
            stops.map(function (s, i) {
                return '<stop offset="' + (i / (stops.length - 1)) + '" stop-color="' + s + '"/>';
            }).join('') + '</linearGradient>';
    }
    function rg(id, inner, outer, op) {
        return '<radialGradient id="' + id + '"><stop offset="0" stop-color="' + inner + '" stop-opacity="' + (op || 1) +
            '"/><stop offset="1" stop-color="' + outer + '" stop-opacity="0"/></radialGradient>';
    }
    function star(cx, cy, R, r, n, rot) {
        var pts = [], a0 = (rot === undefined ? -90 : rot) * Math.PI / 180;
        for (var i = 0; i < n * 2; i++) {
            var rr = i % 2 ? r : R, a = a0 + i * Math.PI / n;
            pts.push((cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1));
        }
        return pts.join(' ');
    }
    function sparkle(x, y, s, fill, op) {
        return '<path d="M' + x + ' ' + (y - s) + 'Q' + x + ' ' + y + ' ' + (x + s) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y + s) +
            'Q' + x + ' ' + y + ' ' + (x - s) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y - s) + 'Z" fill="' + fill + '" opacity="' + (op || 1) + '"/>';
    }

    // ---------- generic crate (front view with lid, latches, handle) ----------
    // c: body[2], lid[2], top, edge, trim, plate
    function crate(k, c) {
        return '' +
            '<ellipse cx="100" cy="172" rx="66" ry="7" fill="#000" opacity=".4"/>' +
            // body
            '<rect x="38" y="92" width="124" height="78" rx="4" fill="url(#' + k + 'b)" stroke="' + c.edge + '" stroke-width="2"/>' +
            '<rect x="38" y="92" width="124" height="78" rx="4" fill="url(#' + k + 's)"/>' +
            '<path d="M46 98V164M154 98V164" stroke="#000" stroke-opacity=".25" stroke-width="2"/>' +
            '<path d="M44 160H58V167M156 160H142V167" fill="none" stroke="' + c.trim + '" stroke-width="3" stroke-linejoin="round"/>' +
            '<rect x="46" y="168" width="16" height="5" rx="1" fill="' + c.edge + '"/><rect x="138" y="168" width="16" height="5" rx="1" fill="' + c.edge + '"/>' +
            // handle
            '<path d="M78 58V51Q78 45 84 45H116Q122 45 122 51V58" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="7" stroke-linecap="round"/>' +
            '<path d="M78 58V51Q78 45 84 45H116Q122 45 122 51V58" fill="none" stroke="' + c.trim + '" stroke-width="4" stroke-linecap="round"/>' +
            // lid
            '<path d="M42 56H158L168 69H32Z" fill="' + c.top + '" stroke="' + c.edge + '" stroke-width="2" stroke-linejoin="round"/>' +
            '<rect x="30" y="68" width="140" height="28" rx="5" fill="url(#' + k + 'l)" stroke="' + c.edge + '" stroke-width="2"/>' +
            '<rect x="30" y="68" width="140" height="28" rx="5" fill="url(#' + k + 's)"/>' +
            '<rect x="31" y="92" width="138" height="4" fill="#000" opacity=".3"/>' +
            // latches
            [52, 134].map(function (x) {
                return '<rect x="' + x + '" y="86" width="14" height="20" rx="3" fill="' + c.trim + '" stroke="' + c.edge + '" stroke-width="1.6"/>' +
                    '<rect x="' + (x + 4) + '" y="99" width="6" height="3" rx="1" fill="' + c.edge + '"/>';
            }).join('') +
            // emblem plate
            '<rect x="58" y="108" width="84" height="54" rx="5" fill="' + c.plate + '" stroke="' + c.trim + '" stroke-opacity=".7" stroke-width="1.6"/>';
    }
    var SHADE = '<linearGradient id="@s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".2" stop-color="#fff" stop-opacity=".05"/><stop offset=".5" stop-color="#fff" stop-opacity=".12"/><stop offset=".8" stop-color="#000" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>';

    // ---------- themes ----------
    // Each returns { defs, bg, back (behind crate), c (crate colours), lid (lid deco), emb (emblem on plate) }
    var T = {};

    T.recruit = function (k) {
        var cam = '<path d="M-5 30Q30 10 55 38T70 80Q40 95 10 78T-5 30Z" fill="#2f5a2a" opacity=".55"/>' +
            '<path d="M120 10Q160 0 205 25V70Q170 90 140 60T120 10Z" fill="#3d6b34" opacity=".5"/>' +
            '<path d="M-5 130Q20 110 50 135T40 195H-5Z" fill="#2a4d24" opacity=".6"/>' +
            '<path d="M150 150Q185 125 205 150V205H160Q135 180 150 150Z" fill="#335f2e" opacity=".6"/>';
        return {
            defs: lg(k + 'g', ['#1d3318', '#0f1d0d'], 0, 1) + rg(k + 'r', '#9be07a', '#7fb069', .55) +
                lg(k + 'b', ['#5f8c47', '#34562a']) + lg(k + 'l', ['#76a45a', '#4a7539']) +
                '<pattern id="' + k + 'p" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="1" fill="#b8e6a0" opacity=".25"/></pattern>',
            bg: '<rect width="200" height="200" rx="18" fill="url(#' + k + 'g)"/>' + cam + '<rect width="200" height="200" rx="18" fill="url(#' + k + 'p)"/>' +
                '<circle cx="100" cy="100" r="100" fill="url(#' + k + 'r)"/>',
            // distant target stands
            back: '<g opacity=".8"><path d="M22 150V120M178 150V120" stroke="#1b2e17" stroke-width="3"/>' +
                '<circle cx="22" cy="112" r="11" fill="#e8efd8"/><circle cx="22" cy="112" r="7" fill="#3b5a2a"/><circle cx="22" cy="112" r="3" fill="#c0392b"/>' +
                '<circle cx="178" cy="112" r="11" fill="#e8efd8"/><circle cx="178" cy="112" r="7" fill="#3b5a2a"/><circle cx="178" cy="112" r="3" fill="#c0392b"/></g>',
            c: { edge: '#1b3015', trim: '#d6e6b0', top: '#8fbd70', plate: 'rgba(15,30,12,.45)' },
            lid: '<path d="M80 86L100 74L120 86M84 92L100 82L116 92" fill="none" stroke="#e6f2c4" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>',
            emb: '<circle cx="98" cy="136" r="23" fill="#f3f5e8"/><circle cx="98" cy="136" r="18" fill="#3b5a2a"/><circle cx="98" cy="136" r="13" fill="#f3f5e8"/>' +
                '<circle cx="98" cy="136" r="8" fill="#c0392b"/><circle cx="98" cy="136" r="3" fill="#f3f5e8"/>' +
                '<path d="M98 136L130 112" stroke="#6b4a2a" stroke-width="3" stroke-linecap="round"/><path d="M124 109L134 108L132 118M119 114L125 111" fill="none" stroke="#e6f2c4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
        };
    };

    T.arsenal = function (k) {
        function bullet(x, y, h) {
            return '<g transform="translate(' + x + ' ' + y + ')"><path d="M-6 0Q-6 -13 0 -19Q6 -13 6 0Z" fill="#b5651d"/>' +
                '<rect x="-6" y="0" width="12" height="' + h + '" rx="1.5" fill="#e0b04a"/><rect x="-6" y="0" width="12" height="' + h + '" fill="url(#' + k + 'y)"/>' +
                '<rect x="-6" y="' + (h - 5) + '" width="12" height="2" fill="#8a6a1c"/><rect x="-6" y="-1" width="12" height="2" fill="#7a4513"/></g>';
        }
        return {
            defs: lg(k + 'g', ['#34331f', '#171710']) + rg(k + 'r', '#c9c97a', '#a3a36b', .4) +
                lg(k + 'b', ['#7b7b45', '#4a4a2a']) + lg(k + 'l', ['#8d8d52', '#5c5c33']) +
                '<linearGradient id="' + k + 'y" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>' +
                '<pattern id="' + k + 'p" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="16" fill="#000" opacity=".12"/></pattern>',
            bg: '<rect width="200" height="200" rx="18" fill="url(#' + k + 'g)"/><rect width="200" height="200" rx="18" fill="url(#' + k + 'p)"/>' +
                '<circle cx="100" cy="100" r="100" fill="url(#' + k + 'r)"/>',
            // stacked sandbags + hazard band
            back: '<g fill="#6a6038" stroke="#2a2614" stroke-width="1.5"><rect x="4" y="150" width="44" height="18" rx="8"/><rect x="152" y="150" width="44" height="18" rx="8"/><rect x="14" y="136" width="36" height="16" rx="7"/><rect x="150" y="136" width="36" height="16" rx="7"/></g>' +
                '<path d="M0 176H200V200H0Z" fill="#c9a82a"/><path d="M-10 200L10 176H26L6 200ZM22 200L42 176H58L38 200ZM54 200L74 176H90L70 200ZM86 200L106 176H122L102 200ZM118 200L138 176H154L134 200ZM150 200L170 176H186L166 200ZM182 200L202 176V200Z" fill="#1c1a10"/>',
            c: { edge: '#1f1f10', trim: '#c9c47a', top: '#9d9d5c', plate: 'rgba(20,20,8,.4)' },
            lid: '<g fill="#e8e6c0" opacity=".9"><rect x="46" y="76" width="18" height="6"/><rect x="68" y="76" width="8" height="6"/><rect x="80" y="76" width="40" height="6"/><rect x="124" y="76" width="8" height="6"/><rect x="136" y="76" width="18" height="6"/></g>',
            emb: bullet(78, 140, 17) + bullet(100, 134, 23) + bullet(122, 140, 17) +
                '<path d="M66 157H134" stroke="#e8e6c0" stroke-width="2" stroke-dasharray="6 3" opacity=".7"/>'
        };
    };

    T.kalashnikov = function (k) {
        var gear = [];
        for (var i = 0; i < 12; i++) {
            gear.push('<rect x="95" y="-6" width="10" height="16" rx="2" transform="rotate(' + (i * 30) + ' 100 100)"/>');
        }
        return {
            defs: lg(k + 'g', ['#4a1c10', '#1a0a06']) + rg(k + 'r', '#ff6a3a', '#e4572e', .55) +
                lg(k + 'b', ['#a8401f', '#6b2310']) + lg(k + 'l', ['#bd4e28', '#80301a']),
            bg: '<rect width="200" height="200" rx="18" fill="url(#' + k + 'g)"/>' +
                '<g fill="#e4572e" opacity=".16"><circle cx="100" cy="100" r="82" fill="none" stroke="#e4572e" stroke-width="14"/>' +
                '<g transform="translate(0 0)">' + gear.join('').replace(/y="-6"/g, 'y="4"') + '</g></g>' +
                '<circle cx="100" cy="100" r="100" fill="url(#' + k + 'r)"/>',
            back: '<g fill="#2a0e07" opacity=".85"><rect x="6" y="140" width="22" height="42"/><rect x="172" y="130" width="22" height="52"/><rect x="2" y="120" width="30" height="8"/><rect x="168" y="112" width="30" height="8"/></g>' +
                '<path d="M17 118Q10 100 20 88M183 110Q190 92 180 80" stroke="#6b2310" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/>',
            c: { edge: '#2a0e07', trim: '#e8b27a', top: '#d0603a', plate: 'rgba(30,8,3,.45)' },
            lid: '<polygon points="' + star(100, 82, 12, 5, 5) + '" fill="#f7c94b" stroke="#6b2310" stroke-width="1.5" stroke-linejoin="round"/>' +
                '<path d="M52 82H80M120 82H148" stroke="#f0cfa8" stroke-width="3" stroke-linecap="round" opacity=".8"/>',
            emb: '<g fill="#f3dcb4" stroke="#2a0e07" stroke-width=".8" stroke-linejoin="round">' +
                '<path d="M62 124L82 126V134L70 143H60Z"/><rect x="80" y="124" width="36" height="9" rx="1"/><rect x="84" y="119" width="32" height="4"/>' +
                '<rect x="116" y="126" width="22" height="4"/><rect x="132" y="121" width="3" height="6"/><rect x="138" y="127" width="4" height="2"/>' +
                '<path d="M91 133H99L96 147H88Z"/><path d="M104 133H114Q119 143 115 152L107 150Q110 142 104 133Z"/></g>' +
                '<circle cx="92" cy="128.500" r="1.800" fill="#6b2310"/>'
        };
    };

    T.sniper = function (k) {
        return {
            defs: lg(k + 'g', ['#0e3a4c', '#051620']) + rg(k + 'r', '#4cc9f0', '#4cc9f0', .5) +
                lg(k + 'b', ['#2f5566', '#14303d']) + lg(k + 'l', ['#3e6b7e', '#1d414f']) +
                rg(k + 'e', '#1b6b86', '#04141c', 1) + lg(k + 'f', ['#fff', '#fff'], 1, 1),
            bg: '<rect width="200" height="200" rx="18" fill="url(#' + k + 'g)"/>' +
                '<circle cx="100" cy="100" r="100" fill="url(#' + k + 'r)"/>' +
                '<g fill="none" stroke="#4cc9f0" stroke-opacity=".28" stroke-width="1.5"><circle cx="100" cy="100" r="92"/><circle cx="100" cy="100" r="68"/><circle cx="100" cy="100" r="44"/><path d="M0 100H200M100 0V200"/></g>' +
                '<path d="M20 10L70 0L20 40Z" fill="#fff" opacity=".07"/>',
            back: '<path d="M12 168L50 150M188 168L150 150" stroke="#4cc9f0" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>' +
                '<path d="M8 40H26M174 40H192M100 4V16" stroke="#4cc9f0" stroke-opacity=".5" stroke-width="2"/>',
            c: { edge: '#04141c', trim: '#7fe0ff', top: '#5d93a8', plate: 'rgba(2,12,18,.55)' },
            lid: '<path d="M54 82H146" stroke="#bff3ff" stroke-width="2" opacity=".85"/><g stroke="#bff3ff" stroke-width="2"><path d="M54 77V87M70 79V85M86 79V85M100 75V89M114 79V85M130 79V85M146 77V87"/></g>',
            emb: '<circle cx="100" cy="135" r="25" fill="url(#' + k + 'e)" stroke="#7fe0ff" stroke-width="3"/>' +
                '<g stroke="#e8fbff" stroke-width="1.5"><path d="M78 135H92M108 135H122M100 113V127M100 143V157"/></g>' +
                '<circle cx="100" cy="135" r="1.800" fill="#ff4d4d"/><g fill="#9fe9ff"><circle cx="86" cy="135" r="1.500"/><circle cx="114" cy="135" r="1.500"/><circle cx="100" cy="121" r="1.500"/><circle cx="100" cy="149" r="1.500"/></g>' +
                '<circle cx="100" cy="135" r="12" fill="none" stroke="#7fe0ff" stroke-width="1" opacity=".7"/>' +
                '<path d="M84 122Q92 114 104 113" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".75"/><ellipse cx="114" cy="150" rx="5" ry="2" fill="#fff" opacity=".3" transform="rotate(-35 114 150)"/>'
        };
    };

    T.premium = function (k) {
        var sp = sparkle(26, 40, 8, '#f7c94b', .9) + sparkle(172, 58, 6, '#fff3b0', .9) + sparkle(160, 24, 4, '#f7c94b', .8) +
            sparkle(34, 112, 5, '#fff3b0', .7) + sparkle(176, 128, 7, '#f7c94b', .8);
        return {
            defs: lg(k + 'g', ['#2a2211', '#050403']) + rg(k + 'r', '#f7c94b', '#f7c94b', .38) +
                lg(k + 'b', ['#26231c', '#0b0a08']) + lg(k + 'l', ['#34302a', '#13110d']) +
                lg(k + 'd', ['#fffbe0', '#f7c94b', '#b8881c'], 1, 1),
            bg: '<rect width="200" height="200" rx="18" fill="url(#' + k + 'g)"/><circle cx="100" cy="96" r="100" fill="url(#' + k + 'r)"/>' +
                '<path d="M0 100L100 0L200 100L100 200Z" fill="none" stroke="#f7c94b" stroke-opacity=".18" stroke-width="2"/>' + sp,
            back: '<path d="M10 176H190" stroke="#f7c94b" stroke-opacity=".5" stroke-width="1.5"/>',
            c: { edge: '#b8881c', trim: '#f7c94b', top: '#4a4332', plate: 'rgba(0,0,0,.6)' },
            lid: '<path d="M44 82H150" stroke="#f7c94b" stroke-width="2" opacity=".8"/>' +
                '<polygon points="100,74 108,82 100,90 92,82" fill="#f7c94b" stroke="#6b4c0c" stroke-width="1"/><circle cx="62" cy="82" r="2.500" fill="#f7c94b"/><circle cx="138" cy="82" r="2.500" fill="#f7c94b"/>',
            emb: '<g stroke="#8a6612" stroke-width="1.200" stroke-linejoin="round"><path d="M74 124L86 112H114L126 124Z" fill="#fff7cc"/>' +
                '<path d="M74 124L100 124L100 112H86Z" fill="#fde9a0"/><path d="M126 124H100L100 112H114Z" fill="#ffffff" opacity=".9"/>' +
                '<path d="M74 124H100L100 156Z" fill="#f7c94b"/><path d="M126 124H100V156Z" fill="#c99a25"/><path d="M74 124H126" stroke-width="1.500" fill="none"/></g>' +
                '<path d="M92 118L96 114" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' + sparkle(128, 112, 7, '#fff', 1)
        };
    };

    T.blade = function (k) {
        var sl = '';
        [[30, 20, 90, 70], [20, 60, 70, 100], [120, 14, 178, 60], [140, 70, 190, 104]].forEach(function (s) {
            sl += '<path d="M' + s[0] + ' ' + s[1] + 'L' + s[2] + ' ' + s[3] + '" stroke="#e8f4f8" stroke-width="2" stroke-linecap="round" opacity=".35"/>';
        });
        return {
            defs: lg(k + 'g', ['#2c3d45', '#0f171b']) + rg(k + 'r', '#dff3fb', '#c0d6df', .4) +
                lg(k + 'b', ['#cfdce2', '#7d909a']) + lg(k + 'l', ['#e4eef2', '#97a9b3']) + lg(k + 'k', ['#fdfefe', '#b7c6ce', '#6e7f89'], 0, 1),
            bg: '<rect width="200" height="200" rx="18" fill="url(#' + k + 'g)"/><circle cx="100" cy="90" r="100" fill="url(#' + k + 'r)"/>' + sl,
            back: '',
            c: { edge: '#2d3a41', trim: '#5c6c75', top: '#f2f8fa', plate: 'rgba(15,25,30,.55)' },
            lid: '<g stroke="#2d3a41" stroke-opacity=".45" stroke-width="1"><path d="M40 74H160M40 80H160M40 86H160"/></g><path d="M62 90L138 72" stroke="#fff" stroke-width="2.500" stroke-linecap="round" opacity=".9"/>',
            emb: '<g transform="rotate(-28 100 136)"><rect x="56" y="130" width="30" height="12" rx="4" fill="#2b2118" stroke="#000" stroke-width="1"/><circle cx="64" cy="136" r="1.800" fill="#c0d6df"/><circle cx="76" cy="136" r="1.800" fill="#c0d6df"/>' +
                '<rect x="86" y="124" width="5" height="24" rx="2" fill="#8a9aa3"/>' +
                '<path d="M91 127H132Q148 129 156 138Q130 144 91 143Z" fill="url(#' + k + 'k)" stroke="#2d3a41" stroke-width="1"/><path d="M96 134H138" stroke="#4d5f69" stroke-width="2" stroke-linecap="round"/></g>' +
                '<path d="M66 118L134 156M72 114L96 128" stroke="#e8f4f8" stroke-width="1.500" opacity=".5" stroke-linecap="round"/>'
        };
    };

    T.legend = function (k) {
        var st = '';
        [[24, 36, 7], [170, 30, 9], [34, 124, 5], [176, 118, 6], [100, 18, 5], [16, 80, 4], [188, 76, 4]].forEach(function (s) {
            st += '<polygon points="' + star(s[0], s[1], s[2], s[2] * .42, 5) + '" fill="#ffd96a" opacity=".85"/>';
        });
        return {
            defs: lg(k + 'g', ['#3b1d6e', '#120824']) + rg(k + 'r', '#c9a4ff', '#b388ff', .55) +
                lg(k + 'b', ['#6a3bb8', '#34196a']) + lg(k + 'l', ['#7f4dd0', '#43217f']) + lg(k + 'c', ['#fff0a8', '#f2b705', '#b67a00']),
            bg: '<rect width="200" height="200" rx="18" fill="url(#' + k + 'g)"/><circle cx="100" cy="90" r="100" fill="url(#' + k + 'r)"/>' +
                '<path d="M100 0L118 90L100 100L82 90ZM0 100L90 82L100 100L90 118ZM200 100L110 82L100 100L110 118Z" fill="#ffd96a" opacity=".07"/>' + st,
            back: '',
            c: { edge: '#1c0a3c', trim: '#f2c230', top: '#a47aeb', plate: 'rgba(15,5,35,.55)' },
            lid: '<polygon points="' + star(100, 82, 11, 4.500, 5) + '" fill="#ffd96a" stroke="#7a4a00" stroke-width="1.200" stroke-linejoin="round"/>' +
                '<polygon points="' + star(66, 82, 6, 2.500, 5) + '" fill="#ffd96a"/><polygon points="' + star(134, 82, 6, 2.500, 5) + '" fill="#ffd96a"/>',
            emb: '<path d="M70 154L66 120L84 134L100 110L116 134L134 120L130 154Z" fill="url(#' + k + 'c)" stroke="#7a4a00" stroke-width="1.500" stroke-linejoin="round"/>' +
                '<rect x="70" y="146" width="60" height="9" rx="2" fill="#f2b705" stroke="#7a4a00" stroke-width="1.200"/>' +
                '<circle cx="66" cy="118" r="4" fill="#ff5e8a"/><circle cx="100" cy="108" r="5" fill="#4cc9f0"/><circle cx="134" cy="118" r="4" fill="#ff5e8a"/>' +
                '<circle cx="84" cy="150.500" r="2.500" fill="#b388ff"/><circle cx="100" cy="150.500" r="2.500" fill="#4cc9f0"/><circle cx="116" cy="150.500" r="2.500" fill="#b388ff"/>' +
                '<path d="M88 138L96 126" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"/>'
        };
    };

    T.dragon = function (k) {
        var wing = '<path d="M44 104L10 38Q4 26 12 24L34 38L26 14Q26 6 34 10L56 42L56 20Q58 12 64 18L72 70Z" fill="#8a1f10" stroke="#2a0805" stroke-width="2" stroke-linejoin="round"/>' +
            '<path d="M44 104Q22 80 14 36M44 104Q40 76 30 20M44 104Q52 70 60 24" stroke="#ff8a3d" stroke-width="2.200" fill="none" stroke-linecap="round"/>';
        var flames = '<path d="M20 172Q14 150 26 132Q28 148 38 146Q30 160 36 172ZM164 172Q160 156 170 140Q172 152 182 150Q176 162 180 172ZM60 176Q54 160 64 148Q66 160 74 158Q70 168 74 176Z" fill="#ff7a1c" opacity=".9"/>';
        return {
            defs: lg(k + 'g', ['#4a0d06', '#150302']) + rg(k + 'r', '#ff8a3d', '#ff3d3d', .55) +
                lg(k + 'b', ['#a3200e', '#5a0f06']) + lg(k + 'l', ['#bd2c14', '#6e140a']) + lg(k + 'e', ['#fff48a', '#ff9a1c', '#e03a0a'], 1, 1) +
                '<pattern id="' + k + 'p" width="14" height="10" patternUnits="userSpaceOnUse"><path d="M0 10Q7 0 14 10" fill="none" stroke="#ff6a2a" stroke-opacity=".22" stroke-width="1.400"/></pattern>',
            bg: '<rect width="200" height="200" rx="18" fill="url(#' + k + 'g)"/><rect width="200" height="200" rx="18" fill="url(#' + k + 'p)"/>' +
                '<circle cx="100" cy="110" r="100" fill="url(#' + k + 'r)"/>',
            back: '<g>' + wing + '</g><g transform="translate(200 0) scale(-1 1)">' + wing + '</g>' + flames,
            c: { edge: '#2a0805', trim: '#ff9a3c', top: '#d84a24', plate: 'rgba(30,4,2,.55)' },
            lid: '<path d="M32 69Q22 52 30 36Q40 50 50 60ZM168 69Q178 52 170 36Q160 50 150 60Z" fill="#f2e2c0" stroke="#2a0805" stroke-width="1.800" stroke-linejoin="round"/>' +
                '<path d="M76 90Q88 76 100 90Q112 76 124 90" fill="none" stroke="#ff9a3c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
            emb: '<path d="M62 135Q100 104 138 135Q100 166 62 135Z" fill="url(#' + k + 'e)" stroke="#2a0805" stroke-width="2.200"/>' +
                '<path d="M100 117Q94 135 100 153Q106 135 100 117Z" fill="#1a0402"/><circle cx="108" cy="128" r="3" fill="#fff" opacity=".7"/>' +
                '<path d="M98 108Q90 98 98 90Q96 100 104 100Q100 94 108 90Q108 100 102 108Z" fill="#ffb02e" opacity=".9"/>'
        };
    };

    T.neon = function (k) {
        var grid = '';
        for (var i = -7; i <= 7; i++) grid += '<path d="M' + (100 + i * 7) + ' 150L' + (100 + i * 36) + ' 200"/>';
        [158, 168, 180, 194].forEach(function (y) { grid += '<path d="M0 ' + y + 'H200"/>'; });
        var tube = function (x, c) {
            return '<path d="M' + x + ' 40V150" stroke="' + c + '" stroke-width="9" stroke-linecap="round" opacity=".25"/>' +
                '<path d="M' + x + ' 40V150" stroke="' + c + '" stroke-width="3.500" stroke-linecap="round"/>' +
                '<path d="M' + x + ' 40V150" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".8"/>';
        };
        return {
            defs: lg(k + 'g', ['#2b0a4a', '#0b0218']) + rg(k + 'r', '#ff2bd6', '#ff2bd6', .5) +
                lg(k + 'b', ['#2a1245', '#120620']) + lg(k + 'l', ['#3a1a5e', '#1c0a30']) +
                lg(k + 'n', ['#ffe14a', '#ff2bd6'], 0, 1) + lg(k + 'e', ['#6ef2ff', '#ffffff'], 0, 1),
            bg: '<rect width="200" height="200" rx="18" fill="url(#' + k + 'g)"/><circle cx="100" cy="50" r="38" fill="url(#' + k + 'n)" opacity=".8"/>' +
                '<g fill="#0b0218"><rect x="50" y="46" width="100" height="2.500"/><rect x="50" y="53" width="100" height="3.500"/><rect x="50" y="61" width="100" height="5"/></g>' +
                '<circle cx="100" cy="100" r="100" fill="url(#' + k + 'r)"/>' +
                '<g stroke="#ff2bd6" stroke-opacity=".55" fill="none" stroke-width="1">' + grid + '</g>',
            back: tube(16, '#6ef2ff') + tube(184, '#ff2bd6') + sparkle(34, 30, 6, '#fff', .9) + sparkle(168, 26, 5, '#6ef2ff', .9),
            c: { edge: '#12041f', trim: '#ff2bd6', top: '#4a2275', plate: 'rgba(8,2,18,.62)' },
            lid: '<path d="M48 82H152" stroke="#6ef2ff" stroke-width="7" stroke-linecap="round" opacity=".25"/><path d="M48 82H152" stroke="#6ef2ff" stroke-width="2.500" stroke-linecap="round"/>' +
                '<path d="M48 82H152" stroke="#fff" stroke-width=".8" opacity=".8"/>',
            emb: '<polygon points="110,110 80,138 98,138 88,162 122,126 104,126" fill="#ff2bd6" opacity=".35" stroke="#ff2bd6" stroke-width="6" stroke-linejoin="round"/>' +
                '<polygon points="110,110 80,138 98,138 88,162 122,126 104,126" fill="url(#' + k + 'e)" stroke="#fff" stroke-width="1.500" stroke-linejoin="round"/>'
        };
    };

    T.desert = function (k) {
        var cactus = function (x, y, s) {
            return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="#3f7d3a" stroke="#1f4a1d" stroke-width="1.500" stroke-linejoin="round">' +
                '<rect x="-5" y="-40" width="10" height="42" rx="5"/><path d="M-5 -14H-13Q-17 -14 -17 -18V-26Q-17 -30 -13 -30Q-9 -30 -9 -26V-20H-5Z"/>' +
                '<path d="M5 -22H11Q15 -22 15 -26V-32Q15 -36 11 -36Q7 -36 7 -32V-28H5Z"/></g>';
        };
        return {
            defs: lg(k + 'g', ['#5a2c14', '#e8a45a', '#f7d28a'], 0, 1) + rg(k + 'r', '#fff0b0', '#e0a458', .6) +
                lg(k + 'b', ['#d7a05c', '#9a6530']) + lg(k + 'l', ['#e8b974', '#b07a40']) + lg(k + 'd', ['#c98a4a', '#8a5528']),
            bg: '<rect width="200" height="200" rx="18" fill="url(#' + k + 'g)"/><circle cx="148" cy="52" r="24" fill="#fff4c4"/><circle cx="148" cy="52" r="34" fill="url(#' + k + 'r)"/>' +
                '<path d="M-5 150Q40 120 90 148T205 140V205H-5Z" fill="url(#' + k + 'd)"/><path d="M-5 172Q50 150 110 170T205 164V205H-5Z" fill="#7a4620" opacity=".7"/>' +
                '<path d="M20 136L34 112L48 136Z" fill="#b87a40" opacity=".5"/>',
            back: cactus(22, 168, 1.1) + cactus(180, 172, .85),
            c: { edge: '#3d2410', trim: '#f6e0a8', top: '#efc888', plate: 'rgba(60,30,10,.45)' },
            lid: '<path d="M46 90l8-9 8 9 8-9 8 9 8-9 8 9 8-9 8 9 8-9 8 9 8-9 8 9" fill="none" stroke="#fff3cf" stroke-width="2.500" stroke-linejoin="round" opacity=".9"/>',
            emb: '<circle cx="100" cy="140" r="21" fill="#ffd27a" stroke="#b9772c" stroke-width="2"/><path d="M100 112V104M80 120L74 114M120 120L126 114M72 140H64M128 140H136" stroke="#ffd27a" stroke-width="3" stroke-linecap="round"/>' +
                '<g fill="#3f7d3a" stroke="#1f4a1d" stroke-width="1.500" stroke-linejoin="round"><rect x="94" y="126" width="12" height="36" rx="6"/><path d="M94 146H84Q80 146 80 142V134Q80 130 84 130Q88 130 88 134V140H94Z"/><path d="M106 142H114Q118 142 118 138V132Q118 128 114 128Q110 128 110 132V136H106Z"/></g>'
        };
    };

    T.arctic = function (k) {
        var flake = '';
        for (var a = 0; a < 6; a++) {
            flake += '<g transform="rotate(' + (a * 60) + ' 100 136)"><path d="M100 136V112M100 122L94 116M100 122L106 116M100 130L96 126M100 130L104 126"/></g>';
        }
        var spikes = '<path d="M0 150L14 96L28 150ZM20 150L38 110L52 150Z" fill="#bfeaff" opacity=".6"/><path d="M200 150L186 90L172 150ZM182 150L164 114L150 150Z" fill="#bfeaff" opacity=".6"/>';
        return {
            defs: lg(k + 'g', ['#071a2e', '#16466b', '#1b5f86'], 0, 1) + rg(k + 'r', '#bff0ff', '#8fdcff', .45) +
                lg(k + 'b', ['#9fdcf5', '#4f95bc']) + lg(k + 'l', ['#bdeaff', '#6aaed0']) + lg(k + 'a', ['#7dffc8', '#4cc9f0'], 1, 0),
            bg: '<rect width="200" height="200" rx="18" fill="url(#' + k + 'g)"/>' +
                '<path d="M-5 40Q50 10 100 44T205 26V70Q150 90 100 64T-5 80Z" fill="url(#' + k + 'a)" opacity=".28"/>' +
                '<path d="M-5 70Q60 40 110 76T205 56V84Q150 104 100 90T-5 100Z" fill="url(#' + k + 'a)" opacity=".18"/>' +
                '<circle cx="100" cy="100" r="100" fill="url(#' + k + 'r)"/>' +
                '<g fill="#fff" opacity=".8"><circle cx="30" cy="22" r="1.500"/><circle cx="76" cy="14" r="1"/><circle cx="130" cy="20" r="1.500"/><circle cx="176" cy="12" r="1"/><circle cx="52" cy="60" r="1"/><circle cx="160" cy="62" r="1.200"/></g>' +
                '<path d="M-5 176Q40 160 90 174T205 168V205H-5Z" fill="#e8f7ff"/>',
            back: spikes,
            c: { edge: '#0c2a3d', trim: '#f0fbff', top: '#d4f2ff', plate: 'rgba(8,36,56,.5)' },
            lid: '<g fill="#f0fbff" stroke="#0c2a3d" stroke-width="1" stroke-linejoin="round"><path d="M46 96l5 11 5-11ZM64 96l4 8 4-8ZM128 96l4 8 4-8ZM144 96l5 11 5-11Z"/></g>' +
                '<path d="M52 76H148" stroke="#fff" stroke-width="2" opacity=".7" stroke-linecap="round"/>',
            emb: '<g stroke="#f0fbff" stroke-width="2.800" stroke-linecap="round" fill="none">' + flake + '</g><circle cx="100" cy="136" r="4" fill="#bff0ff" stroke="#f0fbff" stroke-width="1.500"/>'
        };
    };

    T.glock = function (k) {
        var stripes = '';
        for (var i = -2; i < 9; i++) stripes += '<path d="M' + (i * 30) + ' 200L' + (i * 30 + 70) + ' 0" />';
        return {
            defs: lg(k + 'g', ['#2a2a2f', '#0e0e10']) + rg(k + 'r', '#ffb703', '#ffb703', .4) +
                lg(k + 'b', ['#45454c', '#1c1c20']) + lg(k + 'l', ['#585860', '#26262b']) + lg(k + 'm', ['#4a4a52', '#16161a']),
            bg: '<rect width="200" height="200" rx="18" fill="url(#' + k + 'g)"/><g stroke="#ffb703" stroke-width="9" stroke-opacity=".12">' + stripes + '</g>' +
                '<circle cx="100" cy="100" r="100" fill="url(#' + k + 'r)"/>',
            back: '<g fill="#d9a02a" stroke="#6b4a08" stroke-width="1.200"><g transform="translate(22 150) rotate(-18)"><rect x="-5" y="-14" width="10" height="26" rx="1.500"/><rect x="-5" y="-14" width="10" height="5" fill="#a87a14"/></g>' +
                '<g transform="translate(178 152) rotate(22)"><rect x="-5" y="-14" width="10" height="26" rx="1.500"/><rect x="-5" y="-14" width="10" height="5" fill="#a87a14"/></g></g>',
            c: { edge: '#09090a', trim: '#ffb703', top: '#6a6a72', plate: 'rgba(0,0,0,.55)' },
            lid: '<path d="M46 78H154" stroke="#ffb703" stroke-width="2" opacity=".85"/><g fill="#ffb703"><rect x="48" y="86" width="10" height="3" transform="skewX(-30) translate(30 0)"/><rect x="64" y="86" width="10" height="3" transform="skewX(-30) translate(30 0)"/><rect x="80" y="86" width="10" height="3" transform="skewX(-30) translate(30 0)"/></g>',
            emb: '<g stroke="#ffb703" stroke-width="1.500" stroke-linejoin="round"><path d="M66 134H92L88 160H72Z" fill="#26262b"/><rect x="62" y="116" width="78" height="18" rx="3" fill="#16161a"/>' +
                '<path d="M92 134H124L120 144H100L97 150H92Z" fill="#26262b"/></g>' +
                '<path d="M101 144V148Q101 153 106 153H110Q114 153 114 149V144" fill="none" stroke="#ffb703" stroke-width="1.800"/>' +
                '<g stroke="#ffb703" stroke-width="1.500" stroke-linecap="round"><path d="M70 120V130M75 120V130M80 120V130"/></g>' +
                '<rect x="62" y="116" width="78" height="3" rx="1.500" fill="#fff" opacity=".35"/><rect x="132" y="112" width="4" height="4" fill="#ffb703"/><rect x="64" y="112" width="4" height="4" fill="#ffb703"/>' +
                '<path d="M140 125H146" stroke="#ffb703" stroke-width="3" stroke-linecap="round"/>'
        };
    };

    T.pistols = function (k) {
        var rays = '';
        for (var i = 0; i < 9; i++) rays += '<path d="M100 175L' + (-60 + i * 40) + ' -20"/>';
        var hole = function (x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="4" fill="#031512"/><circle cx="' + x + '" cy="' + y + '" r="6.500" fill="none" stroke="#2ec4b6" stroke-opacity=".35"/>'; };
        var ch = '';
        for (var a = 0; a < 6; a++) {
            var r = a * Math.PI / 3;
            ch += '<circle cx="' + (100 + 13 * Math.cos(r)).toFixed(1) + '" cy="' + (136 + 13 * Math.sin(r)).toFixed(1) + '" r="5.500" fill="#06201d" stroke="#8a9ba0" stroke-width="1.200"/>';
        }
        return {
            defs: lg(k + 'g', ['#0b3b38', '#031512']) + rg(k + 'r', '#ffe08a', '#2ec4b6', .55) +
                lg(k + 'b', ['#34a69d', '#1a5f5a']) + lg(k + 'l', ['#46bdb3', '#237068']) + lg(k + 'c', ['#eef3f4', '#8a9ba0'], 1, 1),
            bg: '<rect width="200" height="200" rx="18" fill="url(#' + k + 'g)"/><g stroke="#ffe08a" stroke-opacity=".1" stroke-width="12">' + rays + '</g>' +
                '<circle cx="100" cy="175" r="80" fill="url(#' + k + 'r)"/><path d="M-5 176Q50 160 100 174T205 168V205H-5Z" fill="#031512" opacity=".7"/>',
            back: hole(24, 52) + hole(176, 70) + hole(34, 120) + hole(168, 130),
            c: { edge: '#031512', trim: '#ffe08a', top: '#5ccfc4', plate: 'rgba(2,20,18,.55)' },
            lid: '<polygon points="' + star(100, 82, 12, 5.500, 6) + '" fill="#ffe08a" stroke="#7a5a10" stroke-width="1.200" stroke-linejoin="round"/>' +
                '<g fill="#ffe08a">' + [0, 1, 2, 3, 4, 5].map(function (n) { var t = -Math.PI / 2 + n * Math.PI / 3; return '<circle cx="' + (100 + 14.5 * Math.cos(t)).toFixed(1) + '" cy="' + (82 + 14.5 * Math.sin(t)).toFixed(1) + '" r="1.600"/>'; }).join('') + '</g>',
            emb: '<circle cx="100" cy="136" r="25" fill="url(#' + k + 'c)" stroke="#031512" stroke-width="2.500"/>' + ch +
                '<circle cx="100" cy="136" r="4.500" fill="#46606a" stroke="#031512" stroke-width="1.200"/>' +
                '<path d="M80 120Q92 112 106 113" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>'
        };
    };

    T.gloves = function (k) {
        var stitch = '';
        for (var i = 0; i < 8; i++) stitch += '<path d="M' + (i * 30 - 40) + ' 210L' + (i * 30 + 40) + ' -10"/>';
        return {
            defs: lg(k + 'g', ['#4a1024', '#17040b']) + rg(k + 'r', '#ff7ea0', '#ff5e8a', .5) +
                lg(k + 'b', ['#a33150', '#5a1226']) + lg(k + 'l', ['#bc4262', '#6d1a30']) + lg(k + 'p', ['#3a3a46', '#191920']),
            bg: '<rect width="200" height="200" rx="18" fill="url(#' + k + 'g)"/><g stroke="#ff9ab8" stroke-opacity=".2" stroke-width="1.200" stroke-dasharray="5 4" fill="none">' + stitch + '</g>' +
                '<circle cx="100" cy="100" r="100" fill="url(#' + k + 'r)"/>',
            back: sparkle(26, 44, 7, '#ffd0dc', .9) + sparkle(176, 60, 5, '#ff9ab8', .9) + sparkle(30, 128, 5, '#ff9ab8', .7) + sparkle(172, 132, 7, '#ffd0dc', .8),
            c: { edge: '#2a0612', trim: '#ffd0dc', top: '#cc5575', plate: 'rgba(30,2,10,.55)' },
            lid: '<path d="M44 90H156" stroke="#ffd0dc" stroke-width="1.800" stroke-dasharray="6 4" opacity=".9"/><path d="M44 74H156" stroke="#ffd0dc" stroke-width="1.800" stroke-dasharray="6 4" opacity=".6"/>',
            emb: '<g fill="url(#' + k + 'p)" stroke="#ff9ab8" stroke-width="1.800" stroke-linejoin="round">' +
                '<rect x="68" y="136" width="24" height="12" rx="6" transform="rotate(-32 76 142)"/>' +
                '<rect x="80" y="112" width="11" height="30" rx="5.500"/><rect x="91.500" y="106" width="11" height="34" rx="5.500"/><rect x="103" y="110" width="11" height="31" rx="5.500"/><rect x="114.500" y="118" width="10" height="23" rx="5"/>' +
                '<rect x="80" y="130" width="45" height="28" rx="9"/></g>' +
                '<rect x="82" y="156" width="41" height="8" rx="2" fill="#ffd0dc" stroke="#6d1a30" stroke-width="1.200"/>' +
                '<g stroke="#ff9ab8" stroke-width="1.200" stroke-dasharray="3 2.500" fill="none" stroke-linecap="round"><path d="M85.500 118V132M97 113V132M108.500 116V132M119.500 123V132"/></g>'
        };
    };

    T.cyber = function (k) {
        var trace = function (d) { return '<path d="' + d + '" fill="none" stroke="#fcee0a" stroke-width="1.500" stroke-opacity=".5"/>'; };
        var node = function (x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="3" fill="#0f0f06" stroke="#fcee0a" stroke-width="1.500"/>'; };
        var pins = '';
        for (var i = 0; i < 4; i++) {
            var p = 87 + i * 9;
            pins += '<rect x="' + (p - 1.5) + '" y="112" width="3" height="6"/><rect x="' + (p - 1.5) + '" y="154" width="3" height="6"/>' +
                '<rect x="75" y="' + (p - 1.5 + 12) + '" width="6" height="3"/><rect x="119" y="' + (p - 1.5 + 12) + '" width="6" height="3"/>';
        }
        return {
            defs: lg(k + 'g', ['#26240a', '#080803']) + rg(k + 'r', '#fcee0a', '#fcee0a', .35) +
                lg(k + 'b', ['#3b3a14', '#16160a']) + lg(k + 'l', ['#4c4b1c', '#201f0c']) +
                '<pattern id="' + k + 'p" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="2" fill="#fcee0a" opacity=".06"/></pattern>',
            bg: '<rect width="200" height="200" rx="18" fill="url(#' + k + 'g)"/><rect width="200" height="200" rx="18" fill="url(#' + k + 'p)"/>' +
                '<circle cx="100" cy="100" r="100" fill="url(#' + k + 'r)"/>' +
                trace('M0 40H30L44 54H70') + trace('M200 48H168L154 34H132') + trace('M0 150H20L34 164H60') + trace('M200 140H180L166 154H146') + node(70, 54) + node(132, 34) + node(60, 164) + node(146, 154),
            back: '<path d="M0 30H14M186 22H200" stroke="#fcee0a" stroke-width="3"/>',
            c: { edge: '#050503', trim: '#fcee0a', top: '#5a5820', plate: 'rgba(5,5,2,.65)' },
            lid: '<g fill="#fcee0a"><path d="M46 90L54 76H64L56 90ZM68 90L76 76H86L78 90ZM90 90L98 76H108L100 90ZM112 90L120 76H130L122 90ZM134 90L142 76H152L144 90Z" opacity=".9"/></g>',
            emb: '<g fill="#fcee0a">' + pins + '</g><rect x="81" y="118" width="38" height="38" rx="4" fill="#14140a" stroke="#fcee0a" stroke-width="2.500"/>' +
                '<rect x="89" y="126" width="22" height="22" rx="2" fill="none" stroke="#fcee0a" stroke-width="1.500"/><circle cx="100" cy="137" r="5" fill="#fcee0a"/>' +
                '<path d="M100 137H108V143M100 137L94 131" stroke="#14140a" stroke-width="1.500" fill="none" opacity=".0"/><path d="M85 122H93" stroke="#fff" stroke-width="2" opacity=".6" stroke-linecap="round"/>'
        };
    };

    T.halloween = function (k) {
        var bat = function (x, y, s) {
            return '<path transform="translate(' + x + ' ' + y + ') scale(' + s + ')" d="M0 0Q5 -7 10 -2Q13 -9 16 -2Q21 -7 26 0Q20 -1 17 6L13 1L9 6Q6 -1 0 0Z" fill="#0b0414"/>';
        };
        return {
            defs: lg(k + 'g', ['#1a0a2e', '#3b1560', '#5a2060'], 0, 1) + rg(k + 'r', '#ffb25a', '#ff7a00', .5) +
                lg(k + 'b', ['#5c3585', '#2a1342']) + lg(k + 'l', ['#6f43a0', '#351a52']) + rg(k + 'm', '#fff2c8', '#ffb25a', 1) + lg(k + 'o', ['#ffa726', '#e65100'], 1, 1),
            bg: '<rect width="200" height="200" rx="18" fill="url(#' + k + 'g)"/><circle cx="150" cy="44" r="26" fill="url(#' + k + 'm)"/><circle cx="150" cy="44" r="40" fill="url(#' + k + 'r)" opacity=".5"/>' +
                '<g fill="#fff" opacity=".7"><circle cx="30" cy="30" r="1.200"/><circle cx="64" cy="18" r="1"/><circle cx="100" cy="36" r="1.200"/><circle cx="20" cy="80" r="1"/></g>' +
                bat(120, 30, .9) + bat(34, 56, .7) + bat(70, 20, .5) +
                '<path d="M-5 168Q30 156 60 170T120 166T205 172V205H-5Z" fill="#0b0414"/>',
            back: '<g fill="#0b0414"><path d="M10 168V120Q10 112 18 112Q26 112 26 120V168Z"/><path d="M174 168V128Q174 120 182 120Q190 120 190 128V168Z"/>' +
                '<path d="M30 168L34 132L40 168ZM160 168L165 138L171 168Z"/></g><path d="M18 126V140M14 133H22" stroke="#5a2060" stroke-width="2" stroke-linecap="round"/>',
            c: { edge: '#12061f', trim: '#ff9a1f', top: '#8355b8', plate: 'rgba(12,4,22,.6)' },
            lid: '<path d="M44 90l7-10 7 10 7-10 7 10 7-10 7 10 7-10 7 10 7-10 7 10 7-10 7 10" fill="none" stroke="#ff9a1f" stroke-width="2.500" stroke-linejoin="round" opacity=".95"/>',
            emb: '<path d="M98 110Q96 104 102 100" stroke="#5aa832" stroke-width="4" fill="none" stroke-linecap="round"/>' +
                '<ellipse cx="100" cy="137" rx="25" ry="22" fill="url(#' + k + 'o)" stroke="#7a2e00" stroke-width="2"/><path d="M100 115Q90 137 100 159M100 115Q110 137 100 159" stroke="#b34700" stroke-width="1.500" fill="none" opacity=".7"/>' +
                '<path d="M83 129L92 129L87.500 121ZM108 129L117 129L112.500 121Z" fill="#2a0e00"/><path d="M86 143L91 148L96 143L100 148L104 143L109 148L114 143" stroke="#2a0e00" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>' +
                '<path d="M84 122Q90 114 100 114" stroke="#fff" stroke-width="2.500" fill="none" stroke-linecap="round" opacity=".5"/>'
        };
    };

    // ---------- fallback theme (unknown key): derive from primary/dark ----------
    T._generic = function (k, theme) {
        var p = theme.primary || '#ff6b35', d = theme.dark || '#222';
        return {
            defs: lg(k + 'g', [d, '#0a0a0f']) + rg(k + 'r', p, p, .45) + lg(k + 'b', [p, d]) + lg(k + 'l', [p, d]),
            bg: '<rect width="200" height="200" rx="18" fill="url(#' + k + 'g)"/><circle cx="100" cy="100" r="100" fill="url(#' + k + 'r)"/>',
            back: '', c: { edge: '#000', trim: '#ddd', top: p, plate: 'rgba(0,0,0,.4)' }, lid: '',
            emb: '<polygon points="' + star(100, 135, 22, 9, 5) + '" fill="#fff" opacity=".9"/>'
        };
    };

    // ---------- public API ----------
    function render(theme, options) {
        theme = theme || {};
        options = options || {};
        var key = String(theme.key || 'generic').replace(/[^a-z0-9]/gi, '');
        var k = 'ca' + key + '-';
        var d = (T[key] || T._generic)(k, theme);
        var size = options.size ? ' width="' + options.size + '" height="' + options.size + '"' : '';
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"' + size + '>' +
            '<defs>' + d.defs + '<clipPath id="' + k + 'q"><rect width="200" height="200" rx="18"/></clipPath>' + SHADE.replace(/@s/, k + 's') + '</defs>' +
            '<g clip-path="url(#' + k + 'q)">' + d.bg + (d.back || '') + '</g>' + crate(k, {
                edge: d.c.edge, trim: d.c.trim, top: d.c.top, plate: d.c.plate
            }) + d.lid + d.emb + '</svg>';
        return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }

    window.CaseArt = { render: render };

    // Assign themed art to every case (data.js runs before this file).
    try {
        if (typeof cases !== 'undefined' && Array.isArray(cases)) {
            cases.forEach(function (c) {
                if (c && c.theme) c.image = render(c.theme);
            });
        }
    } catch (e) {
        if (window.console) console.warn('CaseArt: could not assign case images', e);
    }
})();
