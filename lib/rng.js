'use strict';

const crypto = require('node:crypto');

const RNG_MAX = 2 ** 48 - 1;

// Uniform float in [0, 1) from the CSPRNG
function secureRng() {
    return crypto.randomInt(0, RNG_MAX) / RNG_MAX;
}

module.exports = { secureRng };
