'use strict';

/*
 * Provably fair, server side (node:crypto). The browser twin of the pure functions lives in
 * public/js/fair.js (WebCrypto); test/fair.test.js asserts both give identical floats.
 *
 * ALGORITHM (v1)
 *   serverSeed      32 random bytes as 64 lowercase hex chars. Secret until rotated.
 *   serverSeedHash  SHA-256 of the serverSeed string (its 64 ASCII/UTF-8 characters), lowercase hex.
 *                   Published before any play.
 *   clientSeed      1-64 chars [A-Za-z0-9_-], chosen by the player (random 16 hex by default).
 *   nonce           integer starting at 0, +1 for every game action.
 *
 *   block(cursor)   = HMAC-SHA256(key = serverSeed (UTF-8 bytes of the hex string),
 *                                 msg = `${clientSeed}:${nonce}:${cursor}`)          32 bytes
 *   float number k  (k = 0, 1, 2 ... within one action)
 *                   = uint32_big_endian(block(floor(k / 8))[4 * (k % 8) .. 4 * (k % 8) + 4]) / 2^32
 *                   -> a float in [0, 1). The engine consumes these floats in order.
 *
 * ext.fair (stored server-only in the profile):
 *   { serverSeed, serverSeedHash, clientSeed, nonce,           nonce = nonce of the NEXT action
 *     revealed: [ { serverSeed, serverSeedHash, clientSeed, nonces, revealedAt } ] }   newest first
 *   `nonces` = number of actions played with that seed (valid nonces are 0 .. nonces - 1).
 */

const crypto = require('node:crypto');

const REVEALED_LIMIT = 10;
const CLIENT_SEED_RE = /^[A-Za-z0-9_-]{1,64}$/;
const HEX64_RE = /^[0-9a-f]{64}$/;

function sha256Hex(text) {
    return crypto.createHash('sha256').update(String(text), 'utf8').digest('hex');
}

function hmacBlock(serverSeed, clientSeed, nonce, cursor) {
    return crypto.createHmac('sha256', Buffer.from(String(serverSeed), 'utf8'))
        .update(`${clientSeed}:${nonce}:${cursor}`, 'utf8')
        .digest();
}

// Deterministic rng: the k-th call returns float number k of (serverSeed, clientSeed, nonce)
function createRng(serverSeed, clientSeed, nonce) {
    let k = 0;
    let block = null;
    let blockIndex = -1;
    return function fairRng() {
        const cursor = Math.floor(k / 8);
        if (cursor !== blockIndex) {
            block = hmacBlock(serverSeed, clientSeed, nonce, cursor);
            blockIndex = cursor;
        }
        const value = block.readUInt32BE((k % 8) * 4) / 4294967296;
        k++;
        return value;
    };
}

// First `count` floats of an action (handy for tests / the cross-check with the browser version)
function floats(serverSeed, clientSeed, nonce, count) {
    const rng = createRng(serverSeed, clientSeed, nonce);
    return Array.from({ length: count }, () => rng());
}

function newServerSeed() { return crypto.randomBytes(32).toString('hex'); }
function newClientSeed() { return crypto.randomBytes(8).toString('hex'); }
function isClientSeed(v) { return typeof v === 'string' && CLIENT_SEED_RE.test(v); }

function newState(clientSeed, revealed) {
    const serverSeed = newServerSeed();
    return {
        serverSeed,
        serverSeedHash: sha256Hex(serverSeed),
        clientSeed: isClientSeed(clientSeed) ? clientSeed : newClientSeed(),
        nonce: 0,
        revealed: Array.isArray(revealed) ? revealed.slice(0, REVEALED_LIMIT) : []
    };
}

// Is this a usable stored ext.fair? (hash must match the seed: the commitment is never "repaired")
function isValid(f) {
    return !!f && typeof f === 'object'
        && typeof f.serverSeed === 'string' && HEX64_RE.test(f.serverSeed)
        && f.serverSeedHash === sha256Hex(f.serverSeed)
        && isClientSeed(f.clientSeed)
        && Number.isInteger(f.nonce) && f.nonce >= 0;
}

// What the client may see: never the current serverSeed
function publicView(f) {
    return {
        serverSeedHash: f.serverSeedHash,
        clientSeed: f.clientSeed,
        nonce: f.nonce,
        revealed: (Array.isArray(f.revealed) ? f.revealed : []).map(r => ({
            serverSeed: r.serverSeed,
            serverSeedHash: r.serverSeedHash,
            clientSeed: r.clientSeed,
            nonces: r.nonces,
            revealedAt: r.revealedAt
        }))
    };
}

// Reveals the current server seed and commits to a fresh one (nonce back to 0)
function rotate(f, clientSeed, now) {
    const revealed = [{
        serverSeed: f.serverSeed,
        serverSeedHash: f.serverSeedHash,
        clientSeed: f.clientSeed,
        nonces: f.nonce,
        revealedAt: now
    }].concat(Array.isArray(f.revealed) ? f.revealed : []).slice(0, REVEALED_LIMIT);
    const next = newState(clientSeed === undefined || clientSeed === null ? f.clientSeed : clientSeed, revealed);
    return { fair: next, revealed: revealed[0] };
}

module.exports = {
    REVEALED_LIMIT, CLIENT_SEED_RE,
    sha256Hex, hmacBlock, createRng, floats,
    newServerSeed, newClientSeed, isClientSeed, newState, isValid, publicView, rotate
};
