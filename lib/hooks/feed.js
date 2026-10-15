'use strict';

// afterAction listener: records notable drops in `drops` and keeps the player's `leaderboard` row
// up to date (see lib/feed.js for thresholds and the request budget).
const { feedFor } = require('../feed.js');

module.exports = {
    install(hooks, ctx) {
        const feed = feedFor(ctx);
        hooks.onAfterAction(ev => feed.onAfterAction(ev));
    }
};
