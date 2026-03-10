// ==================== SKINS DATA ====================
// Using placeholder images that work without external dependencies
const SKIN_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect fill='%231a1a25' width='200' height='150'/%3E%3Cpath d='M70 45 L130 45 L145 75 L130 105 L70 105 L55 75 Z' fill='%232a2a35' stroke='%23444' stroke-width='2'/%3E%3Crect x='75' y='70' width='50' height='8' rx='2' fill='%23555'/%3E%3Crect x='65' y='60' width='15' height='30' rx='2' fill='%23444'/%3E%3C/svg%3E";

const BASE_WEAPON_IMAGES = {
    "P250": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwjFU0OGvZqBSLPmUBnPelesn5-RrSXDlwRhx5TjSwtmocCifPwQpDpshReBfsxPrk4DhNu3jshue1dy8VcXxuA",
    "MAC-10": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8n5WxrR1a4c29Yah7JeKsAm6Xyfo44-UwS32xwkUjsGzSwtqoJCjCOABxD8AkFu5bsha7wdGyM-rn4wzWjpUFk3tFRcHXeg",
    "Negev": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL_m5Hl6x1a4s2veql0H-ObB2mV_uJ_t-l9AXrikxgk6z-EyYytcHLGbAclC8EhE-QJthjplN2yZO3gtVbcjIsXzSzgznQeWdeDBGI",
    "PP-Bizon": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzl4zv8x1I_826abRoH-ObAXWE_v13vuVWQyC0nQlp62XcyNygJCrDawR1WZIlQ7QL4xS_wNblPu_h7gOP3oJHynr8iHhK6zErvbioPrlsUA",
    "UMP-45": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkk4a0qB1T9s2qbLRsNM-GHGWvzedxuPUnGS3hwBxxtm6Am4yreH2TP1N0A5EhROBb5Ba5k9TjYuLrtQWMjdhCyTK-0H2MxuWOFg",
    "G3SG1": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2zYXnrB1I_82jbbdlH-SSAFicyOl-pK8-Tn3qwkgi5j7Wm9z7dy6fbFMoWcZ0RucOshK5l4DkZr_l5ACNgtpM02yg2YL7CXWd",
    "Five-SeveN": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3l4Dl7idN6vyRYL1SJv-BC3SE_uB_t-l9cCW6khUz_T7Untv9cXmfPAEnCZFwRLUJtEXtxN3iN-mz7gffjtkRnir-2nkauyx1o7FVpfrK-Xo",
    "Dual Berettas": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL0kp_0-B1I4M2-ZadSLPmUBnPekb8g5LI8Hyi2l01z42Tdmdj9cXiRaA4jXJp4E7YJ4Ra8lILmP-7itBue1dzkV1WWjA",
    "M4A1-S": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_iKMWGf0-tlpN5rQDu2lBEYvzSCkpu3dyqVZgF1CJAhF7NYtULrlIa2M-Lh4wKMiYlDmyqrhygduCZs6-xXV71lpPMY7TF_eA",
    "AK-47": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wjFL0P-re6xSNPGdMWuZxuZi_rIxSirkkElyt2qEzI2heXiTaVIiX5siROQJtxnul4XnYbvgswOMgolbjXKpnRk9Yjk",
    "Glock-18": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1I4M2gYaNlNM-fB2CY1aAmtOU-S33jwEwhtWvdzIr4cHvCPwR1DZdxQrFZt0bsloLjP7jg4VGMlcsbmvNarNNc",
    "USP-S": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSM-CsAmKR1-tlj-1gSCGn2xgh5W3Rwo2gcH6eP1IhWcYmTeYO4xTsw9TmY-mx5Q3a3ogQmSqsiCtXrnE8utrnVdI",
    "FAMAS": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3n5vh7h1I4M29eKVuJc-eD3WZz-tJvOhuRz39xExw5GXTw4qod3uUaQ91ApZ3QbMItxDrxtK2ZbuxtAaLg4hDxS76hjQJsHgze9LmZw",
    "AWP": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf9Ttk_PyvY6F-K_mdMWuZxuZi_rQ_GS3mxRwk4jvTyNv6eC-RPQV1W5AlTOZb4xLtw9fuNriw51Hd3otbjXKp4cSTTIs",
    "M4A4": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiVI0P_6afBSI_icHneV09FxuO56Wxa_nBovp3OAzo2vdHPFPFUmCJRxRbNZ4xewx9W1Nb7j4gzXg99Ayy73iC1Aun1q_a9cBiEfMG3G",
    "Desert Eagle": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7v-RbKB9IeSXC2mDxNFmteBqQCq4qhEutDWR1I36c3OVbFQjDcRwR7EO4EW-x4HvMumzswfWjd8XnCn2iShM53s5t-0cEf1ycu8KccY",
    "P90": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf_jdk_6v-V7B_KfecAFicyOl-pK9vGi3nlEt24GnSwoypc3rFbQ52XsN0EOFcshfuwYa1NbzktVTZ3ohN02yg2RSFidN_",
    "Karambit": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Q7uCvZaZkNM-SA1iSze91u_FsTju_qhAmoT-Jn4bjJC_4Ml93UtZuRLQPsBawkNfiMbnl5AKMiopCnin7iCJBv31j4rkBBKEg-6zUjV3GY6p9v8dpLWT3Fg",
    "Butterfly Knife": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Z-ua6bbZrLOmsD2avx-9ytd5lRi67gVNwsDvSwtqqc3iXZg4kCZYjReYLtRbum9XgYuvm5wbWjtgUzCn3iSsf8G81tFEeH9rw",
    "M9 Bayonet": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Wts2sab1iLvWHMW-J_vlzsvJWQyC0nQlp4GrWzYuqeHjDZlN1XJohTecO5xawwdDvNuLm5wPcjY0QzyX83Xsd7zErvbgxKe4lfw",
    "Sport Gloves": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk5UvzWCL2kpn2-DFk_OKherB0H-CGHHecxNF6ueZhW2exk01w4j7cmYn4eHPCbAMhApdwTOIN5BPsx9yyYu605FTeid0Uy3j3kGoXueKyz5wo",
    "Skeleton Knife": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1I5PeibbBiLs-SD1iWwOpzj-1gSCGn20kjt2-En9mpcCmQag8hXsciQeJYthW9kILkMLji4g3Ygo8Uznj6jX9XrnE8raC5r1M",
    "Bayonet": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzn4_v8ydP0POgV7BkJ_WBMWiCwOBxtd5lRi67gVMhsGrTntn4ci-ROAYlXMBwE7YL5BaxxIHjY-vq7w3X398RxS78iylK8G81tBow9RWL"
};

function getWeaponImageFromSkinName(skinName) {
    const weaponName = skinName.replace(/^★\s*/, "").split("|")[0].trim();
    return BASE_WEAPON_IMAGES[weaponName] || SKIN_PLACEHOLDER;
}

const skins = {
    // Consumer Grade (Gris)
    consumer: [
        { id: 1, name: "P250 | Sand Dune", price: 0.05, image: SKIN_PLACEHOLDER },
        { id: 2, name: "MAC-10 | Silver", price: 0.08, image: SKIN_PLACEHOLDER },
        { id: 3, name: "Negev | Army Sheen", price: 0.04, image: SKIN_PLACEHOLDER },
        { id: 4, name: "PP-Bizon | Sand Dashed", price: 0.06, image: SKIN_PLACEHOLDER },
    ],
    // Industrial Grade (Azul claro)
    industrial: [
        { id: 5, name: "UMP-45 | Urban DDPAT", price: 0.15, image: SKIN_PLACEHOLDER },
        { id: 6, name: "G3SG1 | Safari Mesh", price: 0.12, image: SKIN_PLACEHOLDER },
        { id: 7, name: "Five-SeveN | Forest Night", price: 0.18, image: SKIN_PLACEHOLDER },
        { id: 8, name: "Dual Berettas | Contractor", price: 0.10, image: SKIN_PLACEHOLDER },
    ],
    // Mil-Spec (Azul)
    milspec: [
        { id: 9, name: "M4A1-S | Boreal Forest", price: 0.50, image: SKIN_PLACEHOLDER },
        { id: 10, name: "AK-47 | Safari Mesh", price: 0.80, image: SKIN_PLACEHOLDER },
        { id: 11, name: "Glock-18 | Night", price: 0.45, image: SKIN_PLACEHOLDER },
        { id: 12, name: "USP-S | Forest Leaves", price: 0.35, image: SKIN_PLACEHOLDER },
        { id: 13, name: "FAMAS | Colony", price: 0.55, image: SKIN_PLACEHOLDER },
    ],
    // Restricted (Morado)
    restricted: [
        { id: 14, name: "AWP | Pit Viper", price: 3.50, image: SKIN_PLACEHOLDER },
        { id: 15, name: "M4A4 | Magnesium", price: 2.80, image: SKIN_PLACEHOLDER },
        { id: 16, name: "Desert Eagle | Cobalt", price: 4.20, image: SKIN_PLACEHOLDER },
        { id: 17, name: "P90 | Trigon", price: 2.10, image: SKIN_PLACEHOLDER },
        { id: 18, name: "AK-47 | Blue Laminate", price: 3.00, image: SKIN_PLACEHOLDER },
    ],
    // Classified (Rosa)
    classified: [
        { id: 19, name: "AWP | Redline", price: 15.00, image: SKIN_PLACEHOLDER },
        { id: 20, name: "M4A1-S | Atomic Alloy", price: 12.50, image: SKIN_PLACEHOLDER },
        { id: 21, name: "AK-47 | Redline", price: 18.00, image: SKIN_PLACEHOLDER },
        { id: 22, name: "USP-S | Kill Confirmed", price: 25.00, image: SKIN_PLACEHOLDER },
        { id: 23, name: "Glock-18 | Water Elemental", price: 8.50, image: SKIN_PLACEHOLDER },
    ],
    // Covert (Rojo)
    covert: [
        { id: 24, name: "AWP | Asiimov", price: 80.00, image: SKIN_PLACEHOLDER },
        { id: 25, name: "AK-47 | Vulcan", price: 95.00, image: SKIN_PLACEHOLDER },
        { id: 26, name: "M4A4 | Howl", price: 1500.00, image: SKIN_PLACEHOLDER },
        { id: 27, name: "AWP | Dragon Lore", price: 3500.00, image: SKIN_PLACEHOLDER },
        { id: 28, name: "M4A1-S | Knight", price: 450.00, image: SKIN_PLACEHOLDER },
    ],
    // Gold (Dorado - Cuchillos/Guantes)
    gold: [
        { id: 29, name: "★ Karambit | Doppler", price: 800.00, image: SKIN_PLACEHOLDER },
        { id: 30, name: "★ Butterfly Knife | Fade", price: 1200.00, image: SKIN_PLACEHOLDER },
        { id: 31, name: "★ M9 Bayonet | Crimson Web", price: 950.00, image: SKIN_PLACEHOLDER },
        { id: 32, name: "★ Sport Gloves | Pandora", price: 2500.00, image: SKIN_PLACEHOLDER },
        { id: 33, name: "★ Skeleton Knife | Fade", price: 1800.00, image: SKIN_PLACEHOLDER },
        { id: 34, name: "★ Bayonet | Tiger Tooth", price: 450.00, image: SKIN_PLACEHOLDER },
    ]
};

Object.values(skins).forEach(rarityItems => {
    rarityItems.forEach(item => {
        item.image = getWeaponImageFromSkinName(item.name);
    });
});

// Case placeholder
const CASE_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%231a1a25' width='200' height='200'/%3E%3Crect x='40' y='50' width='120' height='100' rx='8' fill='%232a2a35' stroke='%23ff6b35' stroke-width='3'/%3E%3Crect x='50' y='60' width='100' height='20' rx='4' fill='%23ff6b35' opacity='0.3'/%3E%3Ccircle cx='100' cy='110' r='20' fill='none' stroke='%23ff6b35' stroke-width='3'/%3E%3Cpath d='M100 95 L100 125 M85 110 L115 110' stroke='%23ff6b35' stroke-width='3'/%3E%3C/svg%3E";

// ==================== CASES DATA ====================
const cases = [
    {
        id: 1,
        name: "Caja Principiante",
        price: 0.50,
        category: "cheap",
        image: CASE_PLACEHOLDER,
        items: [
            ...skins.consumer.slice(0, 4),
            ...skins.industrial.slice(0, 3),
            ...skins.milspec.slice(0, 2),
            { ...skins.restricted[0], chance: 5 }
        ]
    },
    {
        id: 2,
        name: "Caja de Armas",
        price: 2.50,
        category: "cheap",
        image: CASE_PLACEHOLDER,
        items: [
            ...skins.consumer.slice(0, 2),
            ...skins.industrial.slice(0, 3),
            ...skins.milspec.slice(0, 3),
            ...skins.restricted.slice(0, 2)
        ]
    },
    {
        id: 3,
        name: "Caja AK-47",
        price: 5.00,
        category: "medium",
        image: CASE_PLACEHOLDER,
        items: [
            skins.milspec[1], // AK Safari
            ...skins.restricted.slice(4, 5), // AK Blue Laminate
            ...skins.classified.slice(2, 3), // AK Redline
            skins.covert[1] // AK Vulcan
        ]
    },
    {
        id: 4,
        name: "Caja AWP",
        price: 8.00,
        category: "medium",
        image: CASE_PLACEHOLDER,
        items: [
            skins.restricted[0], // AWP Pit Viper
            skins.classified[0], // AWP Redline
            skins.covert[0], // AWP Asiimov
            skins.covert[3] // AWP Dragon Lore
        ]
    },
    {
        id: 5,
        name: "Caja Premium",
        price: 15.00,
        category: "medium",
        image: CASE_PLACEHOLDER,
        items: [
            ...skins.milspec.slice(0, 2),
            ...skins.restricted.slice(0, 3),
            ...skins.classified.slice(0, 3),
            ...skins.covert.slice(0, 2)
        ]
    },
    {
        id: 6,
        name: "Caja de Cuchillos",
        price: 25.00,
        category: "expensive",
        image: CASE_PLACEHOLDER,
        items: [
            ...skins.classified.slice(0, 3),
            ...skins.covert.slice(0, 3),
            ...skins.gold.slice(0, 4)
        ]
    },
    {
        id: 7,
        name: "Caja Legendaria",
        price: 50.00,
        category: "expensive",
        image: CASE_PLACEHOLDER,
        items: [
            ...skins.restricted.slice(0, 2),
            ...skins.classified,
            ...skins.covert,
            ...skins.gold
        ]
    },
    {
        id: 8,
        name: "Caja Dragon",
        price: 100.00,
        category: "expensive",
        image: CASE_PLACEHOLDER,
        items: [
            ...skins.covert,
            ...skins.gold
        ]
    }
];

// ==================== DROP CHANCES ====================
const dropChances = {
    consumer: 40,      // 40%
    industrial: 30,    // 30%
    milspec: 18,       // 18%
    restricted: 8,     // 8%
    classified: 3,     // 3%
    covert: 0.8,       // 0.8%
    gold: 0.2          // 0.2%
};

// Function to get rarity from item
function getRarity(item) {
    for (const [rarity, items] of Object.entries(skins)) {
        if (items.find(i => i.id === item.id)) {
            return rarity;
        }
    }
    return 'consumer';
}

// Function to get rarity color
function getRarityColor(rarity) {
    const colors = {
        consumer: '#b0c3d9',
        industrial: '#5e98d9',
        milspec: '#4b69ff',
        restricted: '#8847ff',
        classified: '#d32ce6',
        covert: '#eb4b4b',
        gold: '#ffd700'
    };
    return colors[rarity] || colors.consumer;
}
