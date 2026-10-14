#!/usr/bin/env node
'use strict';
/*
 * SkinDrop catalog generator.
 *
 *   node scripts/build-catalog.js            download the public CS2 skin catalog, rewrite the generated
 *                                            block of public/js/data.js (skins, images, cases, odds)
 *   node scripts/build-catalog.js --report   print the expected-value table of the catalog in data.js
 *                                            (exit 1 when a case is outside the house-edge range)
 *   node scripts/build-catalog.js --check    like the default but write nothing (validates the spec)
 *
 * Options: --skins <file>   use a local copy of skins.json instead of downloading it
 *          --refresh        ignore the download cache (os.tmpdir()/skindrop-catalog)
 *          --allow-changes  allow renaming / re-rarity of ids that already exist in data.js
 *
 * Data source: https://github.com/ByMykel/CSGO-API (public/api/en/skins.json, ~5 MB, never committed).
 * Only the image URL of each skin is taken from it (Steam CDN); names, rarity tiers, prices and case
 * contents are curated below. The real "contains" lists of crates.json are NOT used on purpose: the
 * site's cases are themed and priced by us, and their odds are computed here (see "ODDS").
 *
 * RULES FOR EDITING THIS FILE
 *   - ids are forever: players' inventories reference them. Never renumber or reuse an id; append new
 *     skins with the next free id. Ids 1-34 keep their exact name, rarity and price.
 *   - PRICES ARE APPROXIMATE (EUR, Field-Tested-ish market ballpark, hand-set; they are a game
 *     economy, not a price feed). Keep higher rarity generally pricier.
 *   - Case ids / names / themes of the first eight cases are referenced by history and stats: keep them.
 *
 * ODDS
 *   Every case item gets an explicit drop chance `odds` (in %). The tiers present in a case share the
 *   probability mass of the global drop chances (or the case's own `mass` override); inside a tier the
 *   chance of a skin is proportional to price^-c, with c solved per case so that the expected value of one
 *   opening is `ev` (default 0.88) x the case price (house edge). Pricier skins are rarer.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DATA_JS = path.join(ROOT, 'public', 'js', 'data.js');
const SKINS_URL = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json';
const CACHE_DIR = path.join(os.tmpdir(), 'skindrop-catalog');
const IMG_BASE = 'https://community.akamai.steamstatic.com/economy/image/';
const BEGIN = '// >>> GENERATED CATALOG';
const END = '// <<< GENERATED CATALOG';

const EV_MIN = 0.80;       // allowed expected-value range (fraction of the case price)
const EV_MAX = 0.95;
const DEFAULT_EV = 0.88;
// Base tier masses (%), same as dropChances in data.js
const DROP_CHANCES = { consumer: 40, industrial: 30, milspec: 18, restricted: 8, classified: 3, covert: 0.8, gold: 0.2 };

const RARITIES = ['consumer', 'industrial', 'milspec', 'restricted', 'classified', 'covert', 'gold'];
const CATALOG_RARITY = {
    'Consumer Grade': 'consumer', 'Industrial Grade': 'industrial', 'Mil-Spec Grade': 'milspec',
    'Restricted': 'restricted', 'Classified': 'classified', 'Covert': 'covert',
    'Contraband': 'covert', 'Extraordinary': 'gold'
};
// Case category thresholds for the /cajas filters (Económicas / Medias / Premium)
function categoryFor(price) { return price <= 3.5 ? 'cheap' : price <= 15 ? 'medium' : 'expensive'; }

// ==================== SKIN SPEC ====================
// [id, rarity, name, price, catalogName?]   (rarity pinned for the original 34)
const ORIGINAL = [
    [1, 'consumer', 'P250 | Sand Dune', 0.05],
    [2, 'consumer', 'MAC-10 | Silver', 0.08],
    [3, 'consumer', 'Negev | Army Sheen', 0.04],
    [4, 'consumer', 'PP-Bizon | Sand Dashed', 0.06],
    [5, 'industrial', 'UMP-45 | Urban DDPAT', 0.15],
    [6, 'industrial', 'G3SG1 | Safari Mesh', 0.12],
    [7, 'industrial', 'Five-SeveN | Forest Night', 0.18],
    [8, 'industrial', 'Dual Berettas | Contractor', 0.10],
    [9, 'milspec', 'M4A1-S | Boreal Forest', 0.50],
    [10, 'milspec', 'AK-47 | Safari Mesh', 0.80],
    [11, 'milspec', 'Glock-18 | Night', 0.45],
    [12, 'milspec', 'USP-S | Forest Leaves', 0.35],
    [13, 'milspec', 'FAMAS | Colony', 0.55],
    [14, 'restricted', 'AWP | Pit Viper', 3.50],
    [15, 'restricted', 'M4A4 | Magnesium', 2.80],
    [16, 'restricted', 'Desert Eagle | Cobalt', 4.20, 'Desert Eagle | Cobalt Disruption'],
    [17, 'restricted', 'P90 | Trigon', 2.10],
    [18, 'restricted', 'AK-47 | Blue Laminate', 3.00],
    [19, 'classified', 'AWP | Redline', 15.00],
    [20, 'classified', 'M4A1-S | Atomic Alloy', 12.50],
    [21, 'classified', 'AK-47 | Redline', 18.00],
    [22, 'classified', 'USP-S | Kill Confirmed', 25.00],
    [23, 'classified', 'Glock-18 | Water Elemental', 8.50],
    [24, 'covert', 'AWP | Asiimov', 80.00],
    [25, 'covert', 'AK-47 | Vulcan', 95.00],
    [26, 'covert', 'M4A4 | Howl', 1500.00],
    [27, 'covert', 'AWP | Dragon Lore', 3500.00],
    [28, 'covert', 'M4A1-S | Knight', 450.00],
    [29, 'gold', '★ Karambit | Doppler', 800.00, '★ Karambit | Doppler Phase 2'],
    [30, 'gold', '★ Butterfly Knife | Fade', 1200.00],
    [31, 'gold', '★ M9 Bayonet | Crimson Web', 950.00],
    [32, 'gold', '★ Sport Gloves | Pandora', 2500.00, "★ Sport Gloves | Pandora's Box"],
    [33, 'gold', '★ Skeleton Knife | Fade', 1800.00],
    [34, 'gold', '★ Bayonet | Tiger Tooth', 450.00]
];

// [id, name, price]  - rarity comes from the downloaded catalog (Extraordinary -> gold, Contraband -> covert)
const ADDED = [
    // consumer
    [39, "P250 | Boreal Forest", 0.05],
    [41, "P250 | Bone Mask", 0.08],
    [42, "R8 Revolver | Bone Mask", 0.12],
    // industrial
    [43, "Desert Eagle | Night", 0.25],
    [44, "Glock-18 | Groundwater", 0.1],
    [45, "Glock-18 | Sand Dune", 0.09],
    [47, "Sawed-Off | Rust Coat", 0.1],
    [48, "XM1014 | CaliCamo", 0.11],
    [49, "AK-47 | Predator", 0.45],
    [50, "AK-47 | Baroque Purple", 0.3],
    [51, "AWP | Safari Mesh", 0.4],
    [52, "AWP | Sun in Leo", 0.35],
    // milspec
    [53, "USP-S | Torque", 0.55],
    [55, "USP-S | Stainless", 0.8],
    [56, "Glock-18 | Bunsen Burner", 1.2],
    [57, "Glock-18 | Ironwork", 0.3],
    [58, "Five-SeveN | Capillary", 0.6],
    [59, "Desert Eagle | Oxide Blaze", 1],
    [61, "AK-47 | Elite Build", 1.5],
    [62, "AK-47 | Uncharted", 1.2],
    [63, "AK-47 | Black Laminate", 1.3],
    [64, "AWP | Acheron", 1.6],
    [66, "MP9 | Hot Rod", 1.2],
    [67, "MP7 | Whiteout", 0.3],
    [68, "Tec-9 | Ice Cap", 0.35],
    [69, "Tec-9 | Sandstorm", 0.35],
    [70, "P90 | Desert Warfare", 0.4],
    [71, "XM1014 | Frost Borre", 0.45],
    [72, "Sawed-Off | Yorick", 0.4],
    // restricted
    [73, "AK-47 | Rat Rod", 4.5],
    [74, "AK-47 | Orbit Mk01", 7.5],
    [75, "AK-47 | First Class", 10],
    [76, "AWP | Phobos", 3.5],
    [77, "AWP | Pink DDPAT", 9],
    [78, "USP-S | Cyrex", 5.5],
    [79, "USP-S | Overgrowth", 6.5],
    [80, "Glock-18 | Steel Disruption", 3.5],
    [81, "Glock-18 | Weasel", 6],
    [82, "Glock-18 | Dragon Tattoo", 10],
    [83, "Desert Eagle | Heirloom", 5.5],
    [84, "M4A4 | Evil Daimyo", 5.5],
    [85, "M4A4 | Spider Lily", 3],
    [86, "M4A1-S | Flashback", 6],
    [87, "M4A1-S | Night Terror", 4],
    [88, "M4A1-S | Icarus Fell", 14],
    [89, "P90 | Neoqueen", 3],
    [90, "P250 | Nuclear Threat", 10],
    [91, "Five-SeveN | Neon Kimono", 10],
    [92, "SSG 08 | Death's Head", 2.8],
    [93, "UMP-45 | Arctic Wolf", 2],
    [94, "MP7 | Neon Ply", 3.5],
    [95, "M249 | Emerald Poison Dart", 2.8],
    [96, "MP9 | Ruby Poison Dart", 4],
    [97, "Nova | Rising Skull", 3],
    // classified
    [98, "AK-47 | Jet Set", 25],
    [99, "AK-47 | Point Disarray", 15],
    [100, "AK-47 | Hydroponic", 55],
    [101, "AK-47 | Case Hardened", 45],
    [102, "AK-47 | Ice Coaled", 11],
    [103, "M4A4 | Desolate Space", 14],
    [104, "M4A4 | Cyber Security", 13],
    [105, "M4A4 | Hellfire", 50],
    [106, "M4A1-S | Control Panel", 10],
    [107, "M4A1-S | Decimator", 15],
    [108, "M4A1-S | Nightmare", 10],
    [109, "M4A1-S | Blue Phosphor", 25],
    [110, "AWP | Corticera", 20],
    [111, "AWP | Electric Hive", 55],
    [112, "AWP | Fever Dream", 15],
    [113, "AWP | Mortis", 8],
    [114, "AWP | Silk Tiger", 22],
    [115, "Glock-18 | Vogue", 7.5],
    [116, "Glock-18 | Twilight Galaxy", 18],
    [117, "Desert Eagle | Conspiracy", 6.5],
    [118, "Desert Eagle | Kumicho Dragon", 28],
    [119, "USP-S | Orion", 16],
    [120, "USP-S | Caiman", 12],
    [121, "USP-S | Cortex", 9],
    [122, "USP-S | Serum", 22],
    [123, "P2000 | Imperial Dragon", 22],
    [124, "P250 | Asiimov", 6.5],
    [125, "P250 | Muertos", 5],
    [126, "P90 | Cold Blooded", 10],
    [127, "P90 | Emerald Dragon", 60],
    [128, "Tec-9 | Fuel Injector", 12],
    [129, "Five-SeveN | Monkey Business", 15],
    [130, "R8 Revolver | Llama Cannon", 12],
    [131, "R8 Revolver | Skull Crusher", 4],
    [132, "SSG 08 | Bloodshot", 6],
    [133, "Nova | Hyper Beast", 8],
    // covert
    [134, "AK-47 | Asiimov", 45],
    [135, "AK-47 | Neon Rider", 50],
    [136, "AK-47 | Neon Revolution", 40],
    [137, "AK-47 | The Empress", 42],
    [138, "AK-47 | Fire Serpent", 700],
    [139, "AK-47 | Head Shot", 55],
    [140, "AK-47 | Gold Arabesque", 1100],
    [141, "M4A4 | Asiimov", 55],
    [142, "M4A4 | Neo-Noir", 22],
    [143, "M4A1-S | Hyper Beast", 45],
    [144, "M4A1-S | Printstream", 70],
    [145, "M4A1-S | Mecha Industries", 25],
    [146, "M4A1-S | Golden Coil", 70],
    [147, "AWP | Hyper Beast", 75],
    [148, "AWP | Neo-Noir", 30],
    [149, "AWP | Fade", 600],
    [150, "AWP | Lightning Strike", 120],
    [151, "AWP | Medusa", 1200],
    [152, "AWP | Gungnir", 6500],
    [153, "AWP | The Prince", 450],
    [154, "AWP | Desert Hydra", 350],
    [155, "Glock-18 | Gamma Doppler", 90],
    [156, "Glock-18 | Neo-Noir", 12],
    [157, "Desert Eagle | Printstream", 40],
    [158, "USP-S | Neo-Noir", 22],
    [159, "P90 | Death by Kitty", 40],
    [160, "SSG 08 | Dragonfire", 50],
    [161, "MAC-10 | Neon Rider", 22],
    [162, "Sawed-Off | The Kraken", 30],
    // gold
    [163, "★ Gut Knife | Safari Mesh", 30],
    [164, "★ Gut Knife | Night", 45],
    [165, "★ Gut Knife | Bright Water", 55],
    [166, "★ Flip Knife | Night", 75],
    [167, "★ Flip Knife | Doppler", 190],
    [168, "★ Flip Knife | Fade", 240],
    [169, "★ Flip Knife | Autotronic", 300],
    [170, "★ Falchion Knife | Forest DDPAT", 50],
    [171, "★ Falchion Knife | Fade", 170],
    [172, "★ Shadow Daggers | Night", 62],
    [173, "★ Huntsman Knife | Night", 95],
    [174, "★ Huntsman Knife | Blue Steel", 110],
    [175, "★ Bayonet | Blue Steel", 140],
    [176, "★ Bayonet | Slaughter", 380],
    [177, "★ Bayonet | Autotronic", 520],
    [178, "★ Skeleton Knife | Boreal Forest", 350],
    [179, "★ Karambit | Night", 260],
    [180, "★ Karambit | Fade", 1100],
    [183, "★ M9 Bayonet | Doppler", 600],
    [186, "★ Hand Wraps | Spruce DDPAT", 90],
    [187, "★ Hand Wraps | Desert Shamagh", 100],
    [188, "★ Hand Wraps | Duct Tape", 280],
    [189, "★ Hand Wraps | Cobalt Skulls", 350],
    [190, "★ Driver Gloves | Black Tie", 150],
    [191, "★ Driver Gloves | Lunar Weave", 250],
    [192, "★ Driver Gloves | Snow Leopard", 350],
    [193, "★ Driver Gloves | Crimson Weave", 600],
    [194, "★ Sport Gloves | Arid", 220],
    [195, "★ Sport Gloves | Slingshot", 300],
    [196, "★ Sport Gloves | Bronze Morph", 450],
    [197, "★ Sport Gloves | Superconductor", 1600],
    [198, "★ Sport Gloves | Vice", 1800],
    [199, "★ Sport Gloves | Hedge Maze", 3500],
    [200, "★ Specialist Gloves | Field Agent", 220],
    [201, "★ Specialist Gloves | Crimson Kimono", 700],
    [202, "★ Specialist Gloves | Emerald Web", 900],
    [203, "★ Specialist Gloves | Fade", 1500],
    [204, "★ Moto Gloves | Eclipse", 270],
    [205, "★ Moto Gloves | Spearmint", 450],
    [206, "★ Moto Gloves | Boom!", 800],
    [207, "★ Hydra Gloves | Emerald", 1200],
    [208, "★ Bloodhound Gloves | Charred", 170],
    [209, "★ Broken Fang Gloves | Jade", 330],
    // added for the Cyberpunk case
    [210, "P90 | Module", 0.5],
    [211, "MP5-SD | Gauss", 1.5],
    [212, "MP5-SD | Lab Rats", 2],
    [213, "MP5-SD | Kitbash", 3],
    [214, "P250 | Digital Architect", 3],
    [215, "MP5-SD | Phosphor", 8],
];

// ==================== CASE SPEC ====================
// pool: skin names (as written above). ev: target expected value / case price.
const T = (key, tagline, primary, dark) => ({ key, tagline, primary, dark });
const CASES = [
    { id: 1, name: 'Caja Principiante', theme: T('recruit', 'Campo de entrenamiento', '#7fb069', '#2d4a22'), price: 0.50, ev: 0.86, pool: [
        'P250 | Sand Dune', 'MAC-10 | Silver', 'Negev | Army Sheen', 'PP-Bizon | Sand Dashed', 'UMP-45 | Urban DDPAT',
        'G3SG1 | Safari Mesh', 'Five-SeveN | Forest Night', 'M4A1-S | Boreal Forest', 'AK-47 | Safari Mesh', 'AWP | Pit Viper',
        'Glock-18 | Bunsen Burner', 'USP-S | Torque'] },
    { id: 2, name: 'Caja de Armas', theme: T('arsenal', 'Arsenal militar', '#a3a36b', '#3b3b24'), price: 2.50, pool: [
        'MAC-10 | Silver', 'G3SG1 | Safari Mesh', 'UMP-45 | Urban DDPAT', 'Five-SeveN | Forest Night', 'Dual Berettas | Contractor',
        'AK-47 | Safari Mesh', 'Glock-18 | Night', 'USP-S | Forest Leaves', 'M4A1-S | Boreal Forest', 'AWP | Pit Viper', 'M4A4 | Magnesium',
        'Desert Eagle | Cobalt', 'P90 | Trigon', 'AK-47 | Blue Laminate', 'M4A1-S | Atomic Alloy', 'AK-47 | Redline', 'AWP | Redline',
        'M4A4 | Desolate Space', 'FAMAS | Colony'] },
    { id: 3, name: 'Caja AK-47', theme: T('kalashnikov', 'Fiebre del Kalashnikov', '#e4572e', '#4a1c10'), price: 5.00, pool: [
        'AK-47 | Safari Mesh', 'AK-47 | Predator', 'AK-47 | Baroque Purple', 'AK-47 | Black Laminate', 'AK-47 | Elite Build', 'AK-47 | Uncharted',
        'AK-47 | Blue Laminate', 'AK-47 | Rat Rod', 'AK-47 | Orbit Mk01', 'AK-47 | First Class', 'AK-47 | Ice Coaled', 'AK-47 | Point Disarray',
        'AK-47 | Redline', 'AK-47 | Jet Set', 'AK-47 | Case Hardened', 'AK-47 | Asiimov', 'AK-47 | Neon Rider', 'AK-47 | Head Shot',
        'AK-47 | Hydroponic', 'AK-47 | Vulcan', 'AK-47 | Fire Serpent', 'AK-47 | Gold Arabesque'] },
    { id: 4, name: 'Caja AWP', theme: T('sniper', 'Ojo de francotirador', '#4cc9f0', '#0b2a3a'), price: 8.00, pool: [
        'AWP | Safari Mesh', 'AWP | Sun in Leo', 'AWP | Acheron', 'AWP | Pit Viper', 'AWP | Phobos', 'AWP | Pink DDPAT', 'AWP | Mortis',
        'AWP | Fever Dream', 'AWP | Redline', 'AWP | Corticera', 'AWP | Silk Tiger', 'AWP | Neo-Noir', 'AWP | Electric Hive', 'AWP | Asiimov',
        'AWP | Hyper Beast', 'AWP | Lightning Strike', 'AWP | Fade', 'AWP | The Prince', 'AWP | Medusa', 'AWP | Dragon Lore', 'AWP | Gungnir'] },
    { id: 5, name: 'Caja Premium', theme: T('premium', 'Lujo negro y oro', '#f7c94b', '#1a1508'), price: 15.00, pool: [
        'M4A1-S | Boreal Forest', 'AK-47 | Safari Mesh', 'AWP | Pit Viper', 'M4A4 | Magnesium', 'Desert Eagle | Cobalt', 'M4A1-S | Icarus Fell', 'M4A1-S | Flashback',
        'AWP | Redline', 'M4A1-S | Atomic Alloy', 'AK-47 | Redline', 'USP-S | Orion', 'Glock-18 | Twilight Galaxy', 'USP-S | Serum',
        'Desert Eagle | Kumicho Dragon', 'M4A1-S | Blue Phosphor', 'AWP | Asiimov', 'AK-47 | Vulcan', 'AK-47 | Neon Rider', 'M4A1-S | Hyper Beast',
        'M4A1-S | Printstream', 'M4A1-S | Golden Coil', 'Desert Eagle | Printstream', '★ Gut Knife | Night', '★ Flip Knife | Night'] },
    { id: 6, name: 'Caja de Cuchillos', theme: T('blade', 'Filo de acero', '#c0d6df', '#1e2a30'), price: 25.00,
        mass: { restricted: 45, classified: 25, covert: 3, gold: 27 }, pool: [
        'Glock-18 | Weasel', 'AK-47 | Orbit Mk01', 'AWP | Pink DDPAT', 'AK-47 | First Class', 'Glock-18 | Dragon Tattoo', 'P250 | Nuclear Threat',
        'Five-SeveN | Neon Kimono', 'M4A1-S | Icarus Fell', 'AWP | Redline', 'M4A1-S | Atomic Alloy', 'AK-47 | Redline', 'AWP | Asiimov',
        'AK-47 | Vulcan', '★ Gut Knife | Safari Mesh', '★ Gut Knife | Night', '★ Gut Knife | Bright Water', '★ Falchion Knife | Forest DDPAT',
        '★ Shadow Daggers | Night', '★ Flip Knife | Night', '★ Huntsman Knife | Night', '★ Huntsman Knife | Blue Steel', '★ Bayonet | Blue Steel',
        '★ Falchion Knife | Fade', '★ Flip Knife | Fade', '★ Karambit | Night', '★ Bayonet | Slaughter', '★ Karambit | Doppler',
        '★ Bayonet | Tiger Tooth', '★ Flip Knife | Doppler'] },
    { id: 7, name: 'Caja Legendaria', theme: T('legend', 'Corona de los legendarios', '#b388ff', '#2a1450'), price: 50.00, pool: [
        'AWP | Pit Viper', 'M4A4 | Magnesium', 'AWP | Redline', 'M4A1-S | Atomic Alloy', 'AK-47 | Redline', 'USP-S | Kill Confirmed',
        'Glock-18 | Water Elemental', 'AWP | Asiimov', 'AK-47 | Vulcan', 'M4A4 | Howl', 'AWP | Dragon Lore', 'M4A1-S | Knight',
        '★ Karambit | Doppler', '★ Butterfly Knife | Fade', '★ M9 Bayonet | Crimson Web', '★ Sport Gloves | Pandora', '★ Skeleton Knife | Fade',
        '★ Bayonet | Tiger Tooth', 'AK-47 | Hydroponic', 'M4A4 | Hellfire', 'AWP | Electric Hive', 'AK-47 | Neon Revolution', 'AK-47 | The Empress', 'M4A4 | Asiimov', 'P90 | Death by Kitty', '★ M9 Bayonet | Doppler'] },
    { id: 8, name: 'Caja Dragon', theme: T('dragon', 'Aliento de dragón', '#ff3d3d', '#3a0a05'), price: 100.00, pool: [
        'Glock-18 | Dragon Tattoo', 'P2000 | Imperial Dragon', 'Desert Eagle | Kumicho Dragon', 'SSG 08 | Dragonfire', 'P90 | Emerald Dragon',
        'AWP | Asiimov', 'AK-47 | Vulcan', 'AWP | Hyper Beast', 'M4A1-S | Golden Coil', 'M4A1-S | Knight', 'AWP | Lightning Strike',
        'AK-47 | Fire Serpent', 'AWP | Dragon Lore', 'M4A4 | Howl', '★ Bayonet | Tiger Tooth', '★ Karambit | Doppler', '★ M9 Bayonet | Crimson Web',
        '★ Butterfly Knife | Fade', '★ Skeleton Knife | Fade', '★ Sport Gloves | Pandora', '★ Karambit | Fade'] },
    // ---- new cases (ids 9+) ----
    { id: 9, name: 'Caja Neón', theme: T('neon', 'Luces de neón', '#ff2bd6', '#1a0530'), price: 4.00, pool: [
        'MP9 | Hot Rod', 'Glock-18 | Bunsen Burner', 'P90 | Neoqueen', 'MP7 | Neon Ply', 'Nova | Hyper Beast', 'Five-SeveN | Neon Kimono',
        'P250 | Nuclear Threat', 'Tec-9 | Fuel Injector', 'Glock-18 | Neo-Noir', 'MAC-10 | Neon Rider', 'M4A4 | Neo-Noir', 'USP-S | Neo-Noir',
        'AWP | Neo-Noir', 'AK-47 | Neon Revolution', 'M4A1-S | Hyper Beast', 'AK-47 | Neon Rider', 'AWP | Hyper Beast'] },
    { id: 10, name: 'Caja Desierto', theme: T('desert', 'Dunas y espejismos', '#e0a458', '#3d2410'), price: 1.50, pool: [
        'P250 | Sand Dune', 'Glock-18 | Sand Dune', 'PP-Bizon | Sand Dashed', 'Tec-9 | Sandstorm', 'P90 | Desert Warfare', 'XM1014 | CaliCamo',
        'G3SG1 | Safari Mesh', 'AK-47 | Safari Mesh', 'AWP | Safari Mesh', 'Sawed-Off | Rust Coat', 'Desert Eagle | Oxide Blaze', 'AWP | Sun in Leo',
        'Desert Eagle | Heirloom', 'AWP | Desert Hydra', '★ Hand Wraps | Desert Shamagh'] },
    { id: 11, name: 'Caja Ártica', theme: T('arctic', 'Hielo eterno', '#8fdcff', '#0c2230'), price: 4.50, pool: [
        'P250 | Boreal Forest', 'M4A1-S | Boreal Forest', 'MP7 | Whiteout', 'Tec-9 | Ice Cap', 'XM1014 | Frost Borre', 'UMP-45 | Arctic Wolf',
        'Glock-18 | Steel Disruption', 'M4A1-S | Icarus Fell', 'AK-47 | Ice Coaled', 'M4A4 | Desolate Space', '★ Gut Knife | Bright Water',
        '★ Huntsman Knife | Blue Steel', '★ Skeleton Knife | Boreal Forest', '★ Driver Gloves | Snow Leopard'] },
    { id: 12, name: 'Caja Glock', theme: T('glock', 'Ráfaga de polímero', '#ffb703', '#1c1c1f'), price: 3.00, pool: [
        'Glock-18 | Sand Dune', 'Glock-18 | Groundwater', 'Glock-18 | Night', 'Glock-18 | Ironwork', 'Glock-18 | Bunsen Burner',
        'Glock-18 | Steel Disruption', 'Glock-18 | Weasel', 'Glock-18 | Dragon Tattoo', 'Glock-18 | Vogue', 'Glock-18 | Water Elemental',
        'Glock-18 | Twilight Galaxy', 'Glock-18 | Neo-Noir', 'Glock-18 | Gamma Doppler'] },
    { id: 13, name: 'Caja Pistolas', theme: T('pistols', 'Duelo al amanecer', '#2ec4b6', '#06302c'), price: 7.00, pool: [
        'USP-S | Torque', 'USP-S | Stainless', 'Desert Eagle | Night', 'Desert Eagle | Oxide Blaze', 'Five-SeveN | Capillary', 'USP-S | Cyrex',
        'USP-S | Overgrowth', 'Desert Eagle | Heirloom', 'P250 | Asiimov', 'P250 | Muertos', 'Glock-18 | Vogue', 'Glock-18 | Water Elemental',
        'Desert Eagle | Conspiracy', 'Five-SeveN | Neon Kimono', 'P250 | Nuclear Threat', 'USP-S | Caiman', 'Tec-9 | Fuel Injector',
        'Five-SeveN | Monkey Business', 'USP-S | Orion', 'Glock-18 | Twilight Galaxy', 'R8 Revolver | Llama Cannon', 'USP-S | Serum',
        'P2000 | Imperial Dragon', 'USP-S | Kill Confirmed', 'Desert Eagle | Kumicho Dragon', 'Desert Eagle | Printstream'] },
    { id: 14, name: 'Caja Guantes', theme: T('gloves', 'Guantes de élite', '#ff5e8a', '#3a0a1a'), price: 150.00, pool: [
        '★ Hand Wraps | Spruce DDPAT', '★ Hand Wraps | Desert Shamagh', '★ Driver Gloves | Black Tie', '★ Sport Gloves | Arid',
        '★ Specialist Gloves | Field Agent', '★ Bloodhound Gloves | Charred', '★ Moto Gloves | Eclipse', '★ Driver Gloves | Lunar Weave',
        '★ Hand Wraps | Duct Tape', '★ Sport Gloves | Slingshot', '★ Broken Fang Gloves | Jade', '★ Hydra Gloves | Emerald',
        '★ Hand Wraps | Cobalt Skulls', '★ Driver Gloves | Snow Leopard', '★ Moto Gloves | Spearmint', '★ Sport Gloves | Bronze Morph',
        '★ Driver Gloves | Crimson Weave', '★ Specialist Gloves | Crimson Kimono', '★ Moto Gloves | Boom!', '★ Specialist Gloves | Emerald Web',
        '★ Specialist Gloves | Fade', '★ Sport Gloves | Superconductor', '★ Sport Gloves | Vice', '★ Sport Gloves | Pandora',
        '★ Sport Gloves | Hedge Maze'] },
    { id: 15, name: 'Caja Cyberpunk', theme: T('cyber', 'Futuro en circuito', '#fcee0a', '#1a1800'), price: 12.00, pool: [
        'P90 | Module', 'MP5-SD | Gauss', 'MP5-SD | Lab Rats', 'MP5-SD | Kitbash', 'P250 | Digital Architect', 'MP5-SD | Phosphor',
        'P250 | Asiimov', 'USP-S | Cortex', 'M4A1-S | Control Panel', 'Tec-9 | Fuel Injector', 'M4A4 | Cyber Security', 'M4A4 | Desolate Space',
        'M4A1-S | Decimator', 'M4A1-S | Blue Phosphor', 'M4A1-S | Mecha Industries', 'M4A4 | Neo-Noir', 'Desert Eagle | Printstream',
        'AWP | Electric Hive', 'M4A1-S | Printstream', 'M4A1-S | Golden Coil', 'Glock-18 | Gamma Doppler', '★ Flip Knife | Autotronic',
        '★ Bayonet | Autotronic'] },
    { id: 16, name: 'Caja Halloween', theme: T('halloween', 'Noche de brujas', '#ff7a00', '#1a0a2e'), price: 6.00, pool: [
        'P250 | Bone Mask', 'R8 Revolver | Bone Mask', 'Sawed-Off | Yorick', 'SSG 08 | Death\'s Head', 'Nova | Rising Skull', 'M249 | Emerald Poison Dart',
        'M4A4 | Spider Lily', 'MP9 | Ruby Poison Dart', 'M4A1-S | Night Terror', 'R8 Revolver | Skull Crusher', 'M4A4 | Evil Daimyo', 'P250 | Muertos',
        'SSG 08 | Bloodshot', 'AWP | Mortis', 'M4A1-S | Nightmare', 'P90 | Cold Blooded', 'AK-47 | Head Shot', 'Sawed-Off | The Kraken',
        'M4A4 | Hellfire', '★ Gut Knife | Night', '★ Shadow Daggers | Night', '★ Huntsman Knife | Night', '★ Karambit | Night'] }
];

// ==================== CATALOG LOADING ====================
function download(url, file) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    return fetch(url, { signal: AbortSignal.timeout(120000) })
        .then(res => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.arrayBuffer();
        })
        .then(buf => fs.writeFileSync(file, Buffer.from(buf)))
        .catch(err => {
            // Node's fetch ignores HTTPS_PROXY: fall back to curl, which honours it
            console.error('fetch failed (' + err.message + '), trying curl...');
            execFileSync('curl', ['-fsSL', '--max-time', '180', '-o', file, url], { stdio: 'inherit' });
        });
}

async function loadSkinsJson(args) {
    let file = args.skins;
    if (!file) {
        file = path.join(CACHE_DIR, 'skins.json');
        if (args.refresh || !fs.existsSync(file)) {
            console.error('Downloading ' + SKINS_URL);
            await download(SKINS_URL, file);
        }
    }
    const list = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(list) || !list.length) throw new Error('skins.json: unexpected format');
    const byName = new Map();
    list.forEach(s => {
        const keys = [s.name];
        if (s.phase) keys.unshift(s.name + ' ' + s.phase);
        keys.forEach(k => { if (!byName.has(k)) byName.set(k, s); });
    });
    return byName;
}

// ==================== SKIN TABLE ====================
function imageToken(url) {
    if (typeof url !== 'string' || !/^https:\/\/community\.(akamai|cloudflare)\.steamstatic\.com\/economy\/image\/[A-Za-z0-9_-]+$/.test(url)) {
        throw new Error('unexpected image URL: ' + url);
    }
    return url.replace(/^https:\/\/community\.(akamai|cloudflare)\.steamstatic\.com\/economy\/image\//, '');
}

function buildSkinTable(catalog) {
    const errors = [];
    const rows = [];
    const ids = new Set(), names = new Set();
    function add(id, rarity, name, price, catalogName) {
        if (ids.has(id)) errors.push('duplicate id ' + id);
        if (names.has(name)) errors.push('duplicate name ' + name);
        ids.add(id); names.add(name);
        const entry = catalog.get(catalogName || name);
        if (!entry) { errors.push('not in the public catalog: ' + (catalogName || name)); return; }
        // knives are 'Covert' in the public catalog and gloves 'Extraordinary': both are our gold tier
        const real = name.startsWith('★') ? 'gold' : CATALOG_RARITY[entry.rarity && entry.rarity.name];
        if (!rarity) rarity = real;
        if (!rarity) { errors.push('unknown rarity for ' + name); return; }
        if (!(price > 0)) errors.push('bad price for ' + name);
        let token;
        try { token = imageToken(entry.image); } catch (e) { errors.push(name + ': ' + e.message); return; }
        rows.push({ id, rarity, name, price, token, real });
    }
    ORIGINAL.forEach(r => add(r[0], r[1], r[2], r[3], r[4]));
    ADDED.forEach(r => add(r[0], null, r[1], r[2]));
    const seenImg = new Map();
    rows.forEach(r => {
        if (seenImg.has(r.token)) errors.push('same image for "' + r.name + '" and "' + seenImg.get(r.token) + '"');
        seenImg.set(r.token, r.name);
    });
    rows.sort((a, b) => a.id - b.id);
    return { rows, errors };
}

// ==================== ODDS ====================
// Two levels: every tier present in the case gets a probability mass (the global drop chances,
// renormalised, unless the case spec overrides them with `mass`), and inside a tier the weight of a skin
// is price^-c. The exponent c (0 = uniform) is solved per case so that EV = target.
function tierEv(items, mass, c) {
    let ev = 0;
    Object.keys(mass).forEach(t => {
        const its = items.filter(i => i.rarity === t);
        const m = Math.min.apply(null, its.map(i => i.price));
        let num = 0, den = 0;
        its.forEach(i => { const w = Math.pow(i.price / m, -c); num += w * i.price; den += w; });
        ev += mass[t] * num / den;
    });
    return ev;
}

function massFor(items, massSpec, sharp) {
    const present = {};
    items.forEach(i => { present[i.rarity] = true; });
    const missing = Object.keys(massSpec || {}).filter(t => !present[t]);
    if (missing.length) throw new Error('mass for tiers not in the pool: ' + missing.join(', '));
    const raw = {};
    Object.keys(present).forEach(t => {
        raw[t] = massSpec && massSpec[t] !== undefined ? massSpec[t] : Math.pow(DROP_CHANCES[t], sharp);
    });
    const total = Object.keys(raw).reduce((a, t) => a + raw[t], 0);
    const mass = {};
    Object.keys(raw).forEach(t => { mass[t] = raw[t] / total; });
    return mass;
}

function bisect(fn, target, lo, hi) {      // fn decreasing; returns x with fn(x) ~ target, or null when out of range
    if (!(target < fn(lo)) || !(target > fn(hi))) return null;
    for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2;
        if (fn(mid) > target) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
}

// spec.mass: fixed tier masses (then only c is solved); spec.c: fixed within-tier exponent (default 1);
// otherwise the tier masses are D^s with s solved, falling back to solving c at s = 1.
function solveOdds(items, target, spec) {
    spec = spec || {};
    let mass, c, sharp = 1;
    if (spec.mass) {
        mass = massFor(items, spec.mass, 1);
        c = bisect(x => tierEv(items, mass, x), target, 0, 40);
    } else {
        c = spec.c !== undefined ? spec.c : 1;
        sharp = bisect(x => tierEv(items, massFor(items, null, x), c), target, 0, 6);
        if (sharp !== null) mass = massFor(items, null, sharp);
        else {
            sharp = 1;
            mass = massFor(items, null, 1);
            c = bisect(x => tierEv(items, mass, x), target, 0, 40);
        }
    }
    if (c === null) {
        const lo = tierEv(items, mass, 40), hi = tierEv(items, mass, 0);
        throw new Error('target EV ' + target.toFixed(2) + ' is out of reach (' + lo.toFixed(2) + '..' + hi.toFixed(2) + '): add cheaper/pricier items');
    }
    const odds = new Array(items.length);
    Object.keys(mass).forEach(t => {
        const idx = items.map((it, i) => i).filter(i => items[i].rarity === t);
        const m = Math.min.apply(null, idx.map(i => items[i].price));
        const w = idx.map(i => Math.pow(items[i].price / m, -c));
        const sum = w.reduce((a, x) => a + x, 0);
        idx.forEach((i, k) => { odds[i] = mass[t] * 100 * w[k] / sum; });
    });
    const rounded = odds.map(o => Number(o.toFixed(5)));
    // fix rounding so the odds add up to exactly 100
    const diff = Number((100 - rounded.reduce((a, x) => a + x, 0)).toFixed(5));
    let big = 0;
    rounded.forEach((o, i) => { if (o > rounded[big]) big = i; });
    rounded[big] = Number((rounded[big] + diff).toFixed(5));
    return { odds: rounded, c, sharp };
}

function buildCases(rows) {
    const byName = new Map(rows.map(r => [r.name, r]));
    const errors = [];
    const used = new Set();
    const out = [];
    CASES.forEach(c => {
        const items = [];
        const seen = new Set();
        let ok = true;
        c.pool.forEach(n => {
            const r = byName.get(n);
            if (!r) { errors.push('case "' + c.name + '": unknown skin ' + n); ok = false; return; }
            if (seen.has(n)) { errors.push('case "' + c.name + '": duplicate skin ' + n); ok = false; return; }
            seen.add(n); used.add(r.id); items.push(r);
        });
        if (!ok) return;
        items.sort((a, b) => b.price - a.price || a.id - b.id);
        let solved;
        try { solved = solveOdds(items, c.price * (c.ev || DEFAULT_EV), c); } catch (e) {
            errors.push('case "' + c.name + '": ' + e.message); return;
        }
        out.push({
            id: c.id, name: c.name, theme: c.theme, price: c.price, category: categoryFor(c.price),
            items: items.map((it, i) => [it.id, solved.odds[i]]), c: solved.c, sharp: solved.sharp
        });
    });
    out.sort((a, b) => a.price - b.price || a.id - b.id);
    const orphans = rows.filter(r => !used.has(r.id));
    return { cases: out, errors, orphans };
}

// ==================== GENERATION ====================
const q = s => JSON.stringify(s);
const num = n => String(Number(n));

function generate(rows, cases) {
    const L = [];
    L.push(BEGIN + ' (scripts/build-catalog.js) - do not edit by hand, edit the spec there and re-run it');
    L.push('// Prices are approximate EUR (Field-Tested-ish market ballpark), not a live price feed.');
    L.push('// Images: Steam CDN URLs taken from the public CS2 catalog (ByMykel/CSGO-API); a failing image falls');
    L.push('// back to SKIN_PLACEHOLDER (see the error handler at the end of this file).');
    L.push('const STEAM_IMG = ' + q(IMG_BASE) + ';');
    L.push('const steamImg = token => STEAM_IMG + token;');
    L.push('');
    L.push('const skins = {');
    RARITIES.forEach((rar, ri) => {
        L.push('    ' + rar + ': [');
        rows.filter(r => r.rarity === rar).forEach(r => {
            L.push('        { id: ' + r.id + ', name: ' + q(r.name) + ', price: ' + num(r.price) + ', image: steamImg(' + q(r.token) + ') },');
        });
        L.push('    ]' + (ri < RARITIES.length - 1 ? ',' : ''));
    });
    L.push('};');
    L.push('');
    L.push('// Drop chances are explicit per case item (`odds`, in %, summing to 100): see getItemChances.');
    L.push('const skinById = {};');
    L.push('Object.values(skins).forEach(list => list.forEach(s => { skinById[s.id] = s; }));');
    L.push('function caseItems(pairs) {');
    L.push('    return pairs.map(p => Object.assign({}, skinById[p[0]], { odds: p[1] }));');
    L.push('}');
    L.push('');
    L.push('const cases = [');
    cases.forEach((c, i) => {
        L.push('    {');
        L.push('        id: ' + c.id + ',');
        L.push('        name: ' + q(c.name) + ',');
        L.push('        theme: { key: ' + q(c.theme.key) + ', tagline: ' + q(c.theme.tagline) + ', primary: ' + q(c.theme.primary) + ', dark: ' + q(c.theme.dark) + ' },');
        L.push('        price: ' + num(c.price) + ',');
        L.push('        category: ' + q(c.category) + ',');
        L.push('        image: CASE_PLACEHOLDER,');
        L.push('        items: caseItems([');
        for (let j = 0; j < c.items.length; j += 6) {
            L.push('            ' + c.items.slice(j, j + 6).map(p => '[' + p[0] + ', ' + num(p[1]) + ']').join(', ') + ',');
        }
        L.push('        ])');
        L.push('    }' + (i < cases.length - 1 ? ',' : ''));
    });
    L.push('];');
    L.push(END);
    return L.join('\n');
}

function splice(source, block) {
    const a = source.indexOf(BEGIN);
    const e = source.indexOf(END);
    if (a < 0 || e < a) throw new Error('data.js has no "' + BEGIN + '" ... "' + END + '" markers');
    const endOfLine = source.indexOf('\n', e);
    return source.slice(0, a) + block + (endOfLine < 0 ? '' : source.slice(endOfLine));
}

// ==================== REPORT ====================
function loadData() {
    delete require.cache[require.resolve(DATA_JS)];
    return require(DATA_JS);
}

function evTable(data) {
    return data.cases.map(c => {
        const chances = data.getItemChances(c.items);
        let ev = 0, win = 0;
        const byRarity = {};
        c.items.forEach((it, i) => {
            ev += chances[i] / 100 * it.price;
            if (it.price >= c.price) win += chances[i];
            const r = data.getRarity(it);
            byRarity[r] = (byRarity[r] || 0) + chances[i];
        });
        const top = c.items.reduce((m, it) => it.price > m.price ? it : m, c.items[0]);
        const topChance = chances[c.items.indexOf(top)];
        return { id: c.id, name: c.name, price: c.price, category: c.category, items: c.items.length, ev, ratio: ev / c.price, win, top, topChance, byRarity, sum: chances.reduce((a, b) => a + b, 0) };
    });
}

function printReport(data) {
    const rows = evTable(data);
    const pad = (s, n) => String(s).padEnd(n);
    const rpad = (s, n) => String(s).padStart(n);
    console.log(pad('id', 3) + pad('case', 20) + rpad('price', 8) + rpad('items', 6) + rpad('EV', 9) + rpad('EV/price', 9) + rpad('P(>=price)', 11) + '  best item (chance)');
    let bad = 0;
    rows.forEach(r => {
        const flag = r.ratio < EV_MIN || r.ratio > EV_MAX || Math.abs(r.sum - 100) > 0.01 ? '  <-- OUT OF RANGE' : '';
        if (flag) bad++;
        console.log(pad(r.id, 3) + pad(r.name, 20) + rpad(r.price.toFixed(2), 8) + rpad(r.items, 6) + rpad(r.ev.toFixed(3), 9) +
            rpad((r.ratio * 100).toFixed(1) + '%', 9) + rpad(r.win.toFixed(1) + '%', 11) + '  ' + r.top.name + ' ' + r.top.price + ' EUR (' + r.topChance.toFixed(4) + '%)' + flag);
    });
    console.log('\nChance by rarity (%):');
    console.log(pad('case', 20) + RARITIES.map(r => rpad(r.slice(0, 8), 10)).join(''));
    rows.forEach(r => console.log(pad(r.name, 20) + RARITIES.map(k => rpad((r.byRarity[k] || 0).toFixed(3), 10)).join('')));
    const counts = RARITIES.map(r => r + ': ' + data.skins[r].length).join(', ');
    const total = RARITIES.reduce((n, r) => n + data.skins[r].length, 0);
    console.log('\nSkins: ' + total + ' (' + counts + '), cases: ' + data.cases.length);
    console.log('Mean skin price per tier: ' + RARITIES.map(r => r + ' ' + (data.skins[r].reduce((a, s) => a + s.price, 0) / data.skins[r].length).toFixed(2)).join(', '));
    return bad;
}

// ==================== MAIN ====================
async function main() {
    const argv = process.argv.slice(2);
    const args = { report: false, check: false, refresh: false, allowChanges: false, skins: null };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--report') args.report = true;
        else if (a === '--check') args.check = true;
        else if (a === '--refresh') args.refresh = true;
        else if (a === '--allow-changes') args.allowChanges = true;
        else if (a === '--skins') args.skins = path.resolve(argv[++i] || '');
        else { console.error('unknown option ' + a); process.exit(2); }
    }

    if (args.report) {
        process.exit(printReport(loadData()) ? 1 : 0);
    }

    const catalog = await loadSkinsJson(args);
    const table = buildSkinTable(catalog);
    const built = buildCases(table.rows);
    const errors = table.errors.concat(built.errors);

    // ids that already exist must keep their identity (inventories reference them)
    let before = null;
    try { before = loadData(); } catch (e) { /* first run */ }
    if (before && !args.allowChanges) {
        const now = new Map(table.rows.map(r => [r.id, r]));
        Object.keys(before.skins).forEach(rar => before.skins[rar].forEach(s => {
            const n = now.get(s.id);
            if (!n) errors.push('id ' + s.id + ' (' + s.name + ') disappeared');
            else if (n.name !== s.name || n.rarity !== rar) errors.push('id ' + s.id + ' changed: ' + s.name + '/' + rar + ' -> ' + n.name + '/' + n.rarity);
        }));
        before.cases.forEach(c => {
            const n = built.cases.find(x => x.id === c.id);
            if (!n) errors.push('case ' + c.id + ' (' + c.name + ') disappeared');
            else if (n.name !== c.name || n.theme.key !== c.theme.key) errors.push('case ' + c.id + ' changed name/theme');
        });
    }
    if (errors.length) {
        console.error('Catalog errors:\n  ' + errors.join('\n  '));
        process.exit(1);
    }

    // soft checks
    const tierRange = {};
    table.rows.forEach(r => {
        const t = tierRange[r.rarity] || (tierRange[r.rarity] = { min: Infinity, max: 0 });
        t.min = Math.min(t.min, r.price); t.max = Math.max(t.max, r.price);
    });
    table.rows.filter(r => r.id > 34 && r.rarity !== (r.real || r.rarity)).forEach(r => console.warn('warn: ' + r.name + ' rarity ' + r.rarity + ' != catalog ' + r.real));
    built.orphans.forEach(r => console.warn('warn: ' + r.name + ' (#' + r.id + ') is in no case (it is still an upgrader target)'));
    built.cases.forEach(c => c.items.forEach(p => { if (p[1] < 0.0005) console.warn('warn: ' + c.name + ': item #' + p[0] + ' has odds ' + p[1] + '%'); }));
    console.log('Price range per tier: ' + RARITIES.map(r => r + ' ' + tierRange[r].min + '-' + tierRange[r].max).join(' | '));

    const out = splice(fs.readFileSync(DATA_JS, 'utf8'), generate(table.rows, built.cases));
    if (args.check) { console.log('OK (--check: nothing written)'); return; }
    fs.writeFileSync(DATA_JS, out);
    console.log('Wrote ' + path.relative(ROOT, DATA_JS) + ': ' + table.rows.length + ' skins, ' + built.cases.length + ' cases');
    const bad = printReport(loadData());
    if (bad) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
