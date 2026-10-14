// Sound effects synthesised with the Web Audio API (no audio files, no external hosts).
//
//   SkinDropSfx.tick()            roulette / needle tick
//   SkinDropSfx.reveal()          soft "pop" when a result lands
//   SkinDropSfx.soft()            light two-note chime (common drops)
//   SkinDropSfx.win()             win chime
//   SkinDropSfx.rare()            fanfare (covert / gold drops)
//   SkinDropSfx.lose()            low thud
//   SkinDropSfx.drop(rarity)      soft / win / rare depending on the rarity key
//   SkinDropSfx.watchTranslate(el, { axis:'x'|'y', step, offset })  -> stop()
//   SkinDropSfx.watchRotation(el, { step })                          -> stop()
//        tick every time a CSS-animated element moves one `step` (px / deg); returns a stop function
//   SkinDropSfx.isMuted() / setMuted(bool) / toggleMute() / unlock()
//
// Browsers only start an AudioContext after a user gesture: the first pointer / key / touch
// event unlocks audio, and sounds requested before that are silently skipped.
// The header mute button (#sfxToggle, injected by layout.js) is bound here; the choice is
// kept in localStorage ("skinDropMuted").
(function () {
    'use strict';

    var STORAGE_KEY = 'skinDropMuted';
    var MASTER_GAIN = 0.8;

    var muted = readMuted();
    var activated = false;   // a user gesture happened: the context may be created
    var ctx = null;
    var out = null;          // master gain -> compressor -> destination
    var lastTickAt = 0;

    function readMuted() {
        try { return window.localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { return false; }
    }

    function writeMuted(value) {
        try { window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0'); } catch (e) { /* storage unavailable */ }
    }

    // Returns a running AudioContext, or null (muted, no gesture yet, or unsupported)
    function audio() {
        if (muted || !activated) return null;
        if (!ctx) {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            try {
                ctx = new AC();
                var comp = ctx.createDynamicsCompressor();
                out = ctx.createGain();
                out.gain.value = MASTER_GAIN;
                out.connect(comp);
                comp.connect(ctx.destination);
            } catch (e) {
                ctx = null;
                return null;
            }
        }
        if (ctx.state === 'suspended' && ctx.resume) ctx.resume().catch(function () { /* needs a gesture */ });
        return ctx;
    }

    function unlock() {
        activated = true;
        audio();
    }

    ['pointerdown', 'keydown', 'touchstart'].forEach(function (name) {
        window.addEventListener(name, unlock, { once: true, passive: true, capture: true });
    });

    // ---------- building blocks ----------
    // One enveloped oscillator note. opts: type, gain, attack, release (s), to (end freq), lowpass (Hz)
    function note(c, freq, start, dur, opts) {
        opts = opts || {};
        var t = c.currentTime + start;
        var osc = c.createOscillator();
        var g = c.createGain();
        var peak = opts.gain === undefined ? 0.2 : opts.gain;
        var attack = opts.attack === undefined ? 0.006 : opts.attack;
        osc.type = opts.type || 'sine';
        osc.frequency.setValueAtTime(freq, t);
        if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t + dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        var node = osc;
        node.connect(g);
        if (opts.lowpass) {
            var f = c.createBiquadFilter();
            f.type = 'lowpass';
            f.frequency.setValueAtTime(opts.lowpass, t);
            if (opts.lowpassTo) f.frequency.exponentialRampToValueAtTime(opts.lowpassTo, t + dur);
            g.connect(f);
            f.connect(out);
        } else {
            g.connect(out);
        }
        osc.start(t);
        osc.stop(t + dur + 0.05);
    }

    // Short burst of filtered noise (clicks, thuds)
    function noise(c, start, dur, opts) {
        opts = opts || {};
        var t = c.currentTime + start;
        var len = Math.max(1, Math.floor(c.sampleRate * dur));
        var buf = c.createBuffer(1, len, c.sampleRate);
        var data = buf.getChannelData(0);
        for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
        var src = c.createBufferSource();
        src.buffer = buf;
        var f = c.createBiquadFilter();
        f.type = opts.filter || 'lowpass';
        f.frequency.value = opts.freq || 800;
        var g = c.createGain();
        g.gain.setValueAtTime(opts.gain === undefined ? 0.2 : opts.gain, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(f);
        f.connect(g);
        g.connect(out);
        src.start(t);
        src.stop(t + dur + 0.02);
    }

    // ---------- sounds ----------
    function tick(volume) {
        var c = audio();
        if (!c) return;
        var now = c.currentTime;
        if (now - lastTickAt < 0.025) return;   // fast spins: never stack more than ~40 ticks/s
        lastTickAt = now;
        var v = (volume === undefined ? 1 : volume);
        var base = 520 + Math.random() * 60;
        note(c, base * 2.4, 0, 0.045, { type: 'triangle', gain: 0.13 * v, attack: 0.002, to: base });
        noise(c, 0, 0.02, { filter: 'highpass', freq: 3200, gain: 0.05 * v });
    }

    function reveal() {
        var c = audio();
        if (!c) return;
        note(c, 360, 0, 0.14, { type: 'sine', gain: 0.18, attack: 0.003, to: 200 });
        noise(c, 0, 0.05, { freq: 1500, gain: 0.05 });
    }

    function soft() {
        var c = audio();
        if (!c) return;
        note(c, 659.25, 0, 0.35, { type: 'sine', gain: 0.13 });
        note(c, 880, 0.09, 0.45, { type: 'sine', gain: 0.12 });
    }

    function win() {
        var c = audio();
        if (!c) return;
        [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
            note(c, f, i * 0.09, 0.7, { type: 'sine', gain: 0.17 });
            note(c, f * 2, i * 0.09, 0.4, { type: 'triangle', gain: 0.05 });
        });
        note(c, 1568, 0.38, 0.9, { type: 'sine', gain: 0.07 });
    }

    function rare() {
        var c = audio();
        if (!c) return;
        // Brass-like swell: stacked saws through an opening low-pass filter
        [[196, 0], [293.66, 0], [392, 0.16], [493.88, 0.16], [587.33, 0.32], [783.99, 0.32]].forEach(function (n) {
            note(c, n[0], n[1], 1.5 - n[1], {
                type: 'sawtooth', gain: 0.075, attack: 0.07, lowpass: 700, lowpassTo: 4200
            });
        });
        note(c, 98, 0, 1.4, { type: 'sine', gain: 0.22, attack: 0.05 });
        // Sparkles on top
        [2093, 2637, 3136, 3951, 3136, 4186].forEach(function (f, i) {
            note(c, f, 0.45 + i * 0.1, 0.5, { type: 'sine', gain: 0.045, attack: 0.003 });
        });
        noise(c, 0, 0.35, { filter: 'highpass', freq: 5000, gain: 0.04 });
    }

    function lose() {
        var c = audio();
        if (!c) return;
        note(c, 150, 0, 0.45, { type: 'sine', gain: 0.5, attack: 0.004, to: 42 });
        noise(c, 0, 0.18, { freq: 420, gain: 0.3 });
        note(c, 196, 0.16, 0.5, { type: 'sawtooth', gain: 0.06, attack: 0.02, to: 110, lowpass: 600 });
    }

    function drop(rarity) {
        if (rarity === 'covert' || rarity === 'gold') rare();
        else if (rarity === 'classified' || rarity === 'restricted') win();
        else soft();
    }

    // ---------- tick while something animates ----------
    // `getPos` returns a monotonic position (px or deg); a tick plays every time it crosses a multiple of `step`.
    function watch(getPos, step, opts) {
        opts = opts || {};
        var stopped = false;
        var last = null;
        var raf = 0;
        var maxMs = opts.maxMs || 20000;
        var startedAt = Date.now();
        function frame() {
            if (stopped) return;
            if (Date.now() - startedAt > maxMs) { stopped = true; return; }
            var pos = getPos();
            if (typeof pos === 'number' && isFinite(pos) && step > 0) {
                var idx = Math.floor(pos / step);
                if (last === null) last = idx;
                else if (idx !== last) { last = idx; tick(opts.volume); }
            }
            raf = window.requestAnimationFrame(frame);
        }
        raf = window.requestAnimationFrame(frame);
        return function stop() {
            stopped = true;
            if (raf) window.cancelAnimationFrame(raf);
        };
    }

    function matrixOf(el) {
        var M = window.DOMMatrixReadOnly || window.WebKitCSSMatrix;
        var t = window.getComputedStyle(el).transform;
        if (!M || !t || t === 'none') return null;
        try { return new M(t); } catch (e) { return null; }
    }

    // Moving strip (roulette): position under the pointer = -translate + offset
    function watchTranslate(el, opts) {
        opts = opts || {};
        var vertical = opts.axis === 'y';
        var offset = opts.offset || 0;
        return watch(function () {
            var m = matrixOf(el);
            if (!m) return offset;
            return -(vertical ? m.m42 : m.m41) + offset;
        }, opts.step, opts);
    }

    // Spinning element (upgrader needle): accumulated rotation in degrees (handles full turns)
    function watchRotation(el, opts) {
        opts = opts || {};
        var prev = null;
        var total = 0;
        return watch(function () {
            var m = matrixOf(el);
            if (!m) return total;
            var ang = Math.atan2(m.m12, m.m11) * 180 / Math.PI;
            if (prev !== null) {
                var d = ang - prev;
                if (d > 180) d -= 360;
                if (d < -180) d += 360;
                if (d > 0) total += d;
            }
            prev = ang;
            return total;
        }, opts.step || 15, opts);
    }

    // ---------- mute ----------
    function syncToggles() {
        document.querySelectorAll('[data-sfx-toggle]').forEach(function (btn) {
            btn.classList.toggle('is-muted', muted);
            btn.setAttribute('aria-pressed', String(muted));
            btn.setAttribute('aria-label', muted ? 'Activar sonidos' : 'Silenciar sonidos');
            btn.setAttribute('title', muted ? 'Sonido desactivado' : 'Sonido activado');
            var icon = btn.querySelector('i');
            if (icon) icon.className = 'fas ' + (muted ? 'fa-volume-xmark' : 'fa-volume-high');
        });
    }

    function setMuted(value) {
        muted = !!value;
        writeMuted(muted);
        syncToggles();
        document.dispatchEvent(new CustomEvent('skindrop:mutechange', { detail: { muted: muted } }));
        if (!muted) { activated = true; reveal(); }
    }

    function bindToggles() {
        document.addEventListener('click', function (e) {
            if (e.target.closest && e.target.closest('[data-sfx-toggle]')) setMuted(!muted);
        });
        syncToggles();
    }

    window.SkinDropSfx = {
        tick: tick,
        reveal: reveal,
        soft: soft,
        win: win,
        rare: rare,
        lose: lose,
        drop: drop,
        watchTranslate: watchTranslate,
        watchRotation: watchRotation,
        unlock: unlock,
        isMuted: function () { return muted; },
        setMuted: setMuted,
        toggleMute: function () { setMuted(!muted); }
    };

    bindToggles();
})();
