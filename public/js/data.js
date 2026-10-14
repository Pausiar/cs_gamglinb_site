// ==================== SKINS & CASES DATA ====================
// The catalog (skins with real per-skin Steam images, cases and their drop odds) lives between the
// GENERATED CATALOG markers below and is produced by scripts/build-catalog.js. Everything else in this
// file is hand-written. Shared by the browser (globals) and Node (module.exports at the end).

// Generic skin / case art, used when an image is missing or fails to load
const SKIN_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect fill='%231a1a25' width='200' height='150'/%3E%3Cpath d='M70 45 L130 45 L145 75 L130 105 L70 105 L55 75 Z' fill='%232a2a35' stroke='%23444' stroke-width='2'/%3E%3Crect x='75' y='70' width='50' height='8' rx='2' fill='%23555'/%3E%3Crect x='65' y='60' width='15' height='30' rx='2' fill='%23444'/%3E%3C/svg%3E";

const CASE_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%231a1a25' width='200' height='200'/%3E%3Crect x='40' y='50' width='120' height='100' rx='8' fill='%232a2a35' stroke='%23ff6b35' stroke-width='3'/%3E%3Crect x='50' y='60' width='100' height='20' rx='4' fill='%23ff6b35' opacity='0.3'/%3E%3Ccircle cx='100' cy='110' r='20' fill='none' stroke='%23ff6b35' stroke-width='3'/%3E%3Cpath d='M100 95 L100 125 M85 110 L115 110' stroke='%23ff6b35' stroke-width='3'/%3E%3C/svg%3E";

// >>> GENERATED CATALOG (scripts/build-catalog.js) - do not edit by hand, edit the spec there and re-run it
// Prices are approximate EUR (Field-Tested-ish market ballpark), not a live price feed.
// Images: Steam CDN URLs taken from the public CS2 catalog (ByMykel/CSGO-API); a failing image falls
// back to SKIN_PLACEHOLDER (see the error handler at the end of this file).
const STEAM_IMG = "https://community.akamai.steamstatic.com/economy/image/";
const steamImg = token => STEAM_IMG + token;

const skins = {
    consumer: [
        { id: 1, name: "P250 | Sand Dune", price: 0.05, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwjFU0OGvZqBSLPmUBnPelesn5-RrSXDlwRhx5TjSwtmocCifPwQpDpshReBfsxPrk4DhNu3jshue1dy8VcXxuA") },
        { id: 2, name: "MAC-10 | Silver", price: 0.08, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8n5WxrR1a4c29Yah7JeKsAm6Xyfo44-UwS32xwkUjsGzSwtqoJCjCOABxD8AkFu5bsha7wdGyM-rn4wzWjpUFk3tFRcHXeg") },
        { id: 3, name: "Negev | Army Sheen", price: 0.04, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL_m5Hl6x1a4s2veql0H-ObB2mV_uJ_t-l9AXrikxgk6z-EyYytcHLGbAclC8EhE-QJthjplN2yZO3gtVbcjIsXzSzgznQeWdeDBGI") },
        { id: 4, name: "PP-Bizon | Sand Dashed", price: 0.06, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzl4zv8x1I_826abRoH-ObAXWE_v13vuVWQyC0nQlp62XcyNygJCrDawR1WZIlQ7QL4xS_wNblPu_h7gOP3oJHynr8iHhK6zErvbioPrlsUA") },
        { id: 39, name: "P250 | Boreal Forest", price: 0.05, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwipC0PSheqF-NM-RAXWVwOJJvOhuRz39wEsm4WXRz4urcXvEZw8pXJp1RrEIuhC_lNfiYeLj51TXg4JAyyT_jTQJsHgo2RMlUQ") },
        { id: 41, name: "P250 | Bone Mask", price: 0.08, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwjFL0OaveKFSLPmUBnPekL0l47g9TXuylE916mrRy9-vdS6VZgQpWJJ5F-8OsRawl4DhNbix4Rue1dyhzdnPWw") },
        { id: 42, name: "R8 Revolver | Bone Mask", price: 0.12, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLjm4Dv8TRe_c29eJt5IeCWMWuZxuZi_rNtHX_hwh91sWjXm9qreSqfaAIgD5d3RLNbt0Pqx4e2Mrjn5wHbi99bjXKpUIbZI8w") },
    ],
    industrial: [
        { id: 5, name: "UMP-45 | Urban DDPAT", price: 0.15, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkk4a0qB1T9s2qbLRsNM-GHGWvzedxuPUnGS3hwBxxtm6Am4yreH2TP1N0A5EhROBb5Ba5k9TjYuLrtQWMjdhCyTK-0H2MxuWOFg") },
        { id: 6, name: "G3SG1 | Safari Mesh", price: 0.12, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2zYXnrB1I_82jbbdlH-SSAFicyOl-pK8-Tn3qwkgi5j7Wm9z7dy6fbFMoWcZ0RucOshK5l4DkZr_l5ACNgtpM02yg2YL7CXWd") },
        { id: 7, name: "Five-SeveN | Forest Night", price: 0.18, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3l4Dl7idN6vyRYL1SJv-BC3SE_uB_t-l9cCW6khUz_T7Untv9cXmfPAEnCZFwRLUJtEXtxN3iN-mz7gffjtkRnir-2nkauyx1o7FVpfrK-Xo") },
        { id: 8, name: "Dual Berettas | Contractor", price: 0.1, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL0kp_0-B1I4M2-ZadSLPmUBnPekb8g5LI8Hyi2l01z42Tdmdj9cXiRaA4jXJp4E7YJ4Ra8lILmP-7itBue1dzkV1WWjA") },
        { id: 43, name: "Desert Eagle | Night", price: 0.25, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk_P2RZq1qKOSsAm6Xyfo4seVrHHjmzRhz42XUm4mgIC6TaQYkXpMjTLIIsRawl9HhYbzktFPfgpUFk3u310nzMg") },
        { id: 44, name: "Glock-18 | Groundwater", price: 0.1, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1I4M2hZK17Jc-fB2CY1aBzseQ4GXG1lEwk4mWHmd39dC7BOwImD8F2QedeshjrkYKyML-z4Q3flcsbmqxtqryL") },
        { id: 45, name: "Glock-18 | Sand Dune", price: 0.09, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1I4M29aappH_KBD3Gf_uJ_t-l9AS_gwE4i4GTdyIn6IinEalUhC5t5FOMN5BK7xobiPung7wbWiolNzS_gznQeDKgSRyc") },
        { id: 47, name: "Sawed-Off | Rust Coat", price: 0.1, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLin4Hl-S1d6c2veZt-NPWWAlicyOl-pK87TC2ylB534jiGzNv6dCjFPQR2XpJ4RuQPtRbqx9znYujitFPZ3oJC02yg2T-LVFiK") },
        { id: 48, name: "XM1014 | CaliCamo", price: 0.11, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLpk8ewrHZk5-uRfqV_KfOSA2ivxetltfN9cCW6khUz_TuGmI2odiqUaVN2A5IkFuJZtRjrldDkNLiw4ADc2o1Emyj72yxM5ix1o7FV5bllY3w") },
        { id: 49, name: "AK-47 | Predator", price: 0.45, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wjFL0OirarZsI_GeMWuZxuZi_uMwF3i3xkh25W_VzNevICqTP1QoXpJ2E-MM40bpldXvY7yw4wXb3olbjXKpy8jW9Xo") },
        { id: 50, name: "AK-47 | Baroque Purple", price: 0.3, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wipC0OSrZqF5L8-DG3WAzetJvOhuRz39wEgl6jyBwtqtJS6QbFRzApIkR-YLsRe6wdDvZung4gHbjd4XyH7_iTQJsHhGzMbuTA") },
        { id: 51, name: "AWP | Safari Mesh", price: 0.4, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf7jJk4ve9YJt5If6sAm6Xyfo45uU7HS_nzU914z_dzImtdXyQZlMjCJIkFOUI5ES9k9PkPriz71bdiJUFk3tlgygeXw") },
        { id: 52, name: "AWP | Sun in Leo", price: 0.35, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf9Ttk9f2qYaVucs-fB2CY1aAnteVqHCzgkRsh4TnXyY2vIH-QaVcpA5F3TOdct0S_wNO0Zri05wbXlcsbmn9hB4gb") },
    ],
    milspec: [
        { id: 9, name: "M4A1-S | Boreal Forest", price: 0.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_iKMWGf0-tlpN5rQDu2lBEYvzSCkpu3dyqVZgF1CJAhF7NYtULrlIa2M-Lh4wKMiYlDmyqrhygduCZs6-xXV71lpPMY7TF_eA") },
        { id: 10, name: "AK-47 | Safari Mesh", price: 0.8, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wjFL0P-re6xSNPGdMWuZxuZi_rIxSirkkElyt2qEzI2heXiTaVIiX5siROQJtxnul4XnYbvgswOMgolbjXKpnRk9Yjk") },
        { id: 11, name: "Glock-18 | Night", price: 0.45, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1I4M2gYaNlNM-fB2CY1aAmtOU-S33jwEwhtWvdzIr4cHvCPwR1DZdxQrFZt0bsloLjP7jg4VGMlcsbmvNarNNc") },
        { id: 12, name: "USP-S | Forest Leaves", price: 0.35, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSM-CsAmKR1-tlj-1gSCGn2xgh5W3Rwo2gcH6eP1IhWcYmTeYO4xTsw9TmY-mx5Q3a3ogQmSqsiCtXrnE8utrnVdI") },
        { id: 13, name: "FAMAS | Colony", price: 0.55, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3n5vh7h1I4M29eKVuJc-eD3WZz-tJvOhuRz39xExw5GXTw4qod3uUaQ91ApZ3QbMItxDrxtK2ZbuxtAaLg4hDxS76hjQJsHgze9LmZw") },
        { id: 53, name: "USP-S | Torque", price: 0.55, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSI-WsG3SA_v5kv-Z7SjqgnAsYvzSCkpu3cH2eZgcgD5cmTOQK5BftlobvY-zk4gCN2I4UyX-s3XhI7S4_supXA71lpPNCDDeLhA") },
        { id: 55, name: "USP-S | Stainless", price: 0.8, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSIeGsG3SA_v1isehnQyyghiIrujqNjsGqcHuVa1VxCcciR7MP50a5ktLuP-rr5ATXioJNyij93y0a7nlstboAT-N7rU1N1uE6") },
        { id: 56, name: "Glock-18 | Bunsen Burner", price: 1.2, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1a_s2pZKtuK6HLMWGcwONzo95rQzy2qhEutDWR1Nb7IC-TOw4hCZF5FOJe40W5lILlZLvktAHXiIJMyST_3XlIv3k94escEf1yWue1sjU") },
        { id: 57, name: "Glock-18 | Ironwork", price: 0.3, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1a_s2pZKtuK8-XD3WbjOh3vO1WQyC0nQlp5jmEmNaodH6VbwMnApshEOcPskOww4e0N-qz5lPZ2YlGyCSviika6zErvbhhWFzqpw") },
        { id: 58, name: "Five-SeveN | Capillary", price: 0.6, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3l4Dl7idN6vyRa7FSJvmFC3SV1-t4j_dsRieMmRQguynLmY79IinFbA90CZN2Q-Bc4UW6x9KyZLnjtQCMjo8WyXr7jy1O6Ck_sfFCD_SqR6qLvA") },
        { id: 59, name: "Desert Eagle | Oxide Blaze", price: 1, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7OeRbKF-JeKHMWKRxuJzj-JmXTu8kRgpjDGMnYftb32UPwJxDJokRuUIsRi_lNPhM7izsgXZi49GySiq2nxNuCdttbtUB_A7uvqAjSk2l_c") },
        { id: 61, name: "AK-47 | Elite Build", price: 1.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSLfGAGmKC2NF6ueZhW2e2wh9y5GjTztirdSqfP1dyCpclR7FZ5xe9wNbhZei25FGPjokXxC2vkGoXuQLr5jvs") },
        { id: 62, name: "AK-47 | Uncharted", price: 1.2, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSIeqHC2SvzedxuPUnFnCwwBl_5D_Syon8dnyUaQUlD5oiQ7ECuxW7l920ZL-w4AfX2IlByTK-0H0PRM7cOA") },
        { id: 63, name: "AK-47 | Black Laminate", price: 1.3, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wipC0POlPPNhIf2sDHCvzedxuPUnGnzjlh51sTyAzomrICnEbQByWcciTOQIsBG_m9LiZOLh7wfdi91DnzK-0H1Z7oynag") },
        { id: 64, name: "AWP | Acheron", price: 1.6, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf9Ttk4eetZKFsMs-ABXKczf1JouRtTSWmkCIrujqNjsH4eC-ROFMkDccjR7EDsBCxlN2xZu7jtlaNj4pMxSr8hiIc53tt67kHT-N7rafi4HxI") },
        { id: 66, name: "MP9 | Hot Rod", price: 1.2, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8js_f_Cxk_feqV6hkJ_iHQD7Cl7ou5rlsGyi2wBgh4WyDytmqcC6fbQAhC8chEeZZtRLrw4LlNLz8p1uJeM3XA-E") },
        { id: 67, name: "MP7 | Whiteout", price: 0.3, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8jsHf7i1k-PqnfKFiNeSsAm6Xyfo4teU9Hirmx0gh4GXdy9atInqfOAcgCscmRrNetxewl9HjP7_jsgfei5UFk3u-0OOK7w") },
        { id: 68, name: "Tec-9 | Ice Cap", price: 0.35, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLlm5W5wiNW0Oara5s0H-OWD1iDwOJij-1gSCGn2xtz5TjdyNquJX-XaVV0CMd3EOUP5Bjsw93uP77jsVHejohEyH6t339XrnE8zMglqPs") },
        { id: 69, name: "Tec-9 | Sandstorm", price: 0.35, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLlm5W5wiFO0Oara_1SM_GdCnSEzvx7j-1gSCGn2xsi52XSyIqueCifOAMnD8YkQ-YMtUPpwIK2N-jq4QSK2ohCm36q239XrnE8IX2h_4o") },
        { id: 70, name: "P90 | Desert Warfare", price: 0.4, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XuWbwcuyMESA4Fdl-4nnpU7iQA3-kKnwpHIVvfOsPfI9dqDCWDDGkb4j5OU_Fy_kx0l1tj6DnoqseC2TP1cpAsF2QPlK7EcMYXqtDg") },
        { id: 71, name: "XM1014 | Frost Borre", price: 0.45, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLpk8ewrHZk7v-RY6piNOOsHW6c1-tkj-1gSCGn20V05W2Dw9v8ICjGbQMkWJd4TedZtRGxkNDnNOjqsgGN34MXxX76jH9XrnE82FMLyIU") },
        { id: 72, name: "Sawed-Off | Yorick", price: 0.4, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLin4Hl-S1d6c2pe5t-IeeWCmiWx9F4teJ7QCSymx4ioQKJk4jxNWWTaQEnXsR1QOUItBC9mtTgMenntVCKjY4RyS79jy8b6iw5susEBfYs5OSJ2HUgdoR1") },
        { id: 210, name: "P90 | Module", price: 0.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf_Cxk_f23aahvLPWWClicyOl-pK8_Sn_rwE1x5z6AyY6qeXmRb1cgWMNwR7Ff4Bm_m9y0Przq4A3b348Q02yg2QQMyM9M") },
    ],
    restricted: [
        { id: 14, name: "AWP | Pit Viper", price: 3.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf9Ttk_PyvY6F-K_mdMWuZxuZi_rQ_GS3mxRwk4jvTyNv6eC-RPQV1W5AlTOZb4xLtw9fuNriw51Hd3otbjXKp4cSTTIs") },
        { id: 15, name: "M4A4 | Magnesium", price: 2.8, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiVI0P_6afBSI_icHneV09FxuO56Wxa_nBovp3OAzo2vdHPFPFUmCJRxRbNZ4xewx9W1Nb7j4gzXg99Ayy73iC1Aun1q_a9cBiEfMG3G") },
        { id: 16, name: "Desert Eagle | Cobalt", price: 4.2, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7v-RbKB9IeSXC2mDxNFmteBqQCq4qhEutDWR1I36c3OVbFQjDcRwR7EO4EW-x4HvMumzswfWjd8XnCn2iShM53s5t-0cEf1ycu8KccY") },
        { id: 17, name: "P90 | Trigon", price: 2.1, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf_jdk_6v-V7B_KfecAFicyOl-pK9vGi3nlEt24GnSwoypc3rFbQ52XsN0EOFcshfuwYa1NbzktVTZ3ohN02yg2RSFidN_") },
        { id: 18, name: "AK-47 | Blue Laminate", price: 3, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wipC0POlPPNhIf2sDGuFxNF6ueZhW2fhzE5_5G7dnt_7JXufa1J0DZAkE-cKtBaxl9WzPuyz5lDY3YpAzCn9kGoXuZPu7T4u") },
        { id: 73, name: "AK-47 | Rat Rod", price: 4.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiVI0POlPPNSLvmRDGuV09F6ueZhW2fklBx362TTnN36dHiRa1AmW5QlQuVftxO9k4HhZuvksVDc398Rzy32kGoXuR34FNLu") },
        { id: 74, name: "AK-47 | Orbit Mk01", price: 7.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiVI0POlV6diLP-dFzfB_vxztN5lRi67gVMk4TmEn9n_c3PGPwZyDMckTO8JsEPuktG1ZOrjsgPX2IwUyiyv3S0f8G81tLnuvOvF") },
        { id: 75, name: "AK-47 | First Class", price: 10, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0PW8baFjH_yWD3OYxPxJseo9GBa_nBovp3PXmNmpdymUZwMnX8EhEeBbtBnrk4LjZLzi7wbe3opNmCn8iH8YvX5i_a9cBikeWj5H") },
        { id: 76, name: "AWP | Phobos", price: 3.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf-jFk7uW-V7RlL_KcHVicyOl-pK84GXHmwk115D6GzdqudHyUbwRxW5R3ROZbtEG8wYDiY7-x5VOKgotB02yg2bdJjfAf") },
        { id: 77, name: "AWP | Pink DDPAT", price: 9, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf9Ttk6_a-abBSMPmdBVicyOl-pK9qHXC2zUpz5DiBn9arJCmXOFd0DZpxQOUDtBC6wNK0MOzl4wXWjYpG02yg2c9nQ1pb") },
        { id: 78, name: "USP-S | Cyrex", price: 5.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSI-WsG3SA_u1vouRxcCW6khUz_TjdzdmsJyiTZg8kX8N4ELUP5EPsw9G1YeLn5VTXjY0WxS6rhiIYuCd1o7FV2N83Spg") },
        { id: 79, name: "USP-S | Overgrowth", price: 6.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSKOmsHW6VxutJsvNoWSaMmRQguynLytyqdy2eaVUgAsB0QeIIsxfuldy2MO3gtFSI2ooRzSiq3HxA7SlvtfFCD_RGjmYWyQ") },
        { id: 80, name: "Glock-18 | Steel Disruption", price: 3.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1a4s2qbLRsNPSWAHSV_v1_vPdsXRa_nBovp3PWmYuhdnyebAdyWJUjE7ResBC6xoXhZe_j7w3Zid1Aziio3SlI5iw__a9cBqG4HP4O") },
        { id: 81, name: "Glock-18 | Weasel", price: 6, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1Y-s2pZKtuK6HLMXCVwP1zvN5lRi67gVN_4j7Qzdj8dimQblQkX8YkTeNe5Bmxkd2zNr_j5QbdjthCzX-qjylI8G81tDMJpR5Y") },
        { id: 82, name: "Glock-18 | Dragon Tattoo", price: 10, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1a4s2qeqVqL_6sCWufwuVJvOhuRz39xUl-6miDzI37dHyXOlIkA8MmROVfshO9w9G1Ye-ztgPX34tEyi74jjQJsHi_DRfxVg") },
        { id: 83, name: "Desert Eagle | Heirloom", price: 5.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7uORbapqMvGFC2Ovxet3t-1scCW6khUz_W3czNegeXueO1N2WZIkE-RY4EGxlNSxZLnn5gfai4oTniSoiStA6y91o7FVItTkIhw") },
        { id: 84, name: "M4A4 | Evil Daimyo", price: 5.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afBSJeaaAliUwOd7qe5WQyC0nQlp4GqGz42ucCqXaQMhDpd4R-AIsxK6ktXgZePltVPXitoRn3-tjCgd6zErvbijVJZd2Q") },
        { id: 85, name: "M4A4 | Spider Lily", price: 3, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiVI0P_6V6JhL-eWHHSvzedxuPUnHXiwlk4lsTvUz477ICiRPw52WJNxROICtxK-wYDhZejm5gCP2I9MzjK-0H1trtkVHA") },
        { id: 86, name: "M4A1-S | Flashback", price: 6, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_OGMWrEwL9Jtu1oXCGxlB4sjDGMnYftb3yVPQFyDMB3EbJZ5xC4kNPvMOO35AHW3d1AnC_3iHlNuytqtuYDVfI7uvqAZWXE-YM") },
        { id: 87, name: "M4A1-S | Night Terror", price: 4, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_eAMWrEwL9lj-hnXCa-mxQmjDGMnYftby3FPFVxA5ZwRecOtUXuxtPiNL_jsQLc2NkTzS38jC5L7ydj5u8EUKo7uvqAgGSM4LM") },
        { id: 88, name: "M4A1-S | Icarus Fell", price: 14, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_iKMW6TwPxjo95lRi67gVN_smmHyor9eHyUZwImDpJzEeZf4xS6kN2zY77i7wPdjtgXn3msin4b8G81tDwr8lc2") },
        { id: 89, name: "P90 | Neoqueen", price: 3, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf-jFk_6v-V6poL-GGC2Ke_uJ_t-l9ASyyxhl04zuDn4muInOXPAF2W5shQOAMs0G7xNfkZOuwswbej4JDnyvgznQe6S6_YqA") },
        { id: 90, name: "P250 | Nuclear Threat", price: 10, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwjFL0Py7Y6F-NOKaHmKvxvxzte9WQyC0nQlp5mrRztyuIy3GbQF1WMN2QbFetBfulNbnPruz7lGKit4UyS6vjn9K5jErvbiRPSOzZg") },
        { id: 91, name: "Five-SeveN | Neon Kimono", price: 10, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3l4Dl7idN6vyRYL1SK_meAWmf_up_sexmQS2gqhEutDWR1In4di-TagIkXMMiF-Vcthm5kNbvML604Ffdgt4WzCj22ikau35q4OwcEf1ySWJgvKc") },
        { id: 92, name: "SSG 08 | Death's Head", price: 2.8, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLijZGwpR1Y-s29e6M9eM-XC2aEyf1-teBtcCW6khUz_WTXyNipeX-QOlQhXpJwFuYO4xLqxobuN7vn4QaNgthBnHn7iSJPv351o7FVSPuLyfc") },
        { id: 93, name: "UMP-45 | Arctic Wolf", price: 2, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkk4a0qB1Y-s27ZbQ5dc-EBm6ExNFwse9ucCW6khUz_WiGzY6pJyjCZwN1A5p5Q-MCuxa7ldW0Ne3ntQHW2YpFmSv63S1B73t1o7FVFkKgM50") },
        { id: 94, name: "MP7 | Neon Ply", price: 3.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8jsHf_jdk4uL5V7ZoMPyaDWavzedxuPUnGS2wzBglsm6AnNyqJHLBOAdyCZV0ELIN5xC6kNThY-jqslbbid4WyjK-0H0WWbSZ_g") },
        { id: 95, name: "M249 | Emerald Poison Dart", price: 2.8, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8zMK5wjFL0P_8PP1SJuKcCVif0-dxue9oQxa_nBovp3PRzNb8JX2VO1IpDsclRrEPtxXtxNSxYuuw4QHai9gWyCT2j3gYuHlt_a9cBlcR8wa2") },
        { id: 96, name: "MP9 | Ruby Poison Dart", price: 4, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8js_f_C9k4uL3V6pkNOKcCWKe_uJ_t-l9AXzhkEsm527Xy9r_JynEP1IiWJZ3FOYP4xTqmtznNO-34VCKiYJExSjgznQeVzj6siQ") },
        { id: 97, name: "Nova | Rising Skull", price: 3, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL_kYDhwiFO0OGlfahhH_6cGGavzedxuPUnSSy3wEV-4miHyt__eHKSOA4pA5JxE7UJ5kO9l4HmZuixtgHZgoMTyDK-0H1FVu2S0A") },
        { id: 211, name: "MP5-SD | Gauss", price: 1.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8jsPz-R1c_M2jePF-JM-SHXOCzuN3pOhqcCW6khUz_WzTzYmhJXuSaANzW8EkQ7JZ4BjsxtSzYezr5lbfidlEzC-vjnxK7ih1o7FVYPX5q0o") },
        { id: 212, name: "MP5-SD | Lab Rats", price: 2, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8jsPz-R1T9s2iaaZ_IeSsA3fF_uJ_t-l9AXrhxh4l5G_Um9eoJX6WaAVyXMN1RbYM5Bi4wN21Yuq0swTdidhMzSTgznQed7nbwhE") },
        { id: 213, name: "MP5-SD | Kitbash", price: 3, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8jsPz-R1c_M2jePF-JM-ED3SExOJ3vuVWQyy0lB4-jDGMnYftb32XZ1NyX5B5QuJcthi7k9K0Ye6zsQeP2IMRyiX4iSJLvC5q6-4HUaY7uvqAsG-atjE") },
        { id: 214, name: "P250 | Digital Architect", price: 3, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwiNa0OSrerBkJ_-UC2ivz-t5vt5lRi67gVMk4mXQntr7JC_GPQNxApFxF7NethXqktfvMuLktAaKjd9Cyy_9iH8f8G81tGeD0jsi") },
    ],
    classified: [
        { id: 19, name: "AWP | Redline", price: 15, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6diIuKSMWuZxuZi_rUxHS3lzUwm5DjWy976dSiRagd1WJB1RLQP4RK-mtazM-3itQeL2INbjXKpw2eVIZ0") },
        { id: 20, name: "M4A1-S | Atomic Alloy", price: 12.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_GeMWrEwL87o95oQyW8jCIooTyLnYrGLSLANkI-D5d2FrENtRG7wNDvZe-3slfci9pFmHj8jSof6yZjtugEB6QtrKTXhxaBb-PhITXxPA") },
        { id: 21, name: "AK-47 | Redline", price: 18, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSI_-RHGavzedxuPUnFniykEtzsWWBzoyuIiifaAchDZUjTOZe4RC_w4buM-6z7wzbgokUyzK-0H08hRGDMA") },
        { id: 22, name: "USP-S | Kill Confirmed", price: 25, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSI-WsG3SA_uV_vO1WTCa9kxQ1vjiBpYPwJiPTcFB2Xpp5TO5cskG9lYCxZu_jsVCL3o4Xnij23ClO5ik9tegFA_It8qHJz1aWe-uc160") },
        { id: 23, name: "Glock-18 | Water Elemental", price: 8.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1Y-s2pZKtuK72fB3aFxP11te99cCW6khUz_TjVyompc3-QOFR2DJQkFOMJtBbqk9LlY-7n5QLZjtkTxCWqhixPv311o7FVIf8eASQ") },
        { id: 98, name: "AK-47 | Jet Set", price: 25, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0OWrZKhSNOKSGGKcxOpJseo9GBa_nBovp3ODydescy_FbVcoDZMkReYP4xC8w93jY7u35AeK2IhMmC__2itN73pv_a9cBpGGBr1j") },
        { id: 99, name: "AK-47 | Point Disarray", price: 15, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSMP-aAHOvxedlsfN7TjCMmRQguynLnIz_dXnEbFcoDsNzQLMN40S7mte0Zuzl5gbY34JEnnr52ChA7ytisPFCD_Rw7udDlA") },
        { id: 100, name: "AK-47 | Hydroponic", price: 55, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiNW0PCvZaZiL8-ZG2mXzetJvOhuRz39lk0m4Dncztz7Jy2fagIoC5t5QeNbskW6xNLgZu-24AXZgt4Xyi_4izQJsHjOr8RS6A") },
        { id: 101, name: "AK-47 | Case Hardened", price: 45, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiNK0P2nZKFpH_yaCW-Ej7sk5bE8Sn-2lEpz4zndzoyvdHuUPwFzWZYiE7EK4Bi4k9TlY-y24FbAy9USGSiZd5Q") },
        { id: 102, name: "AK-47 | Ice Coaled", price: 11, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSI_-UGm-Zz-llj-1gSCGn2x4l5z_RyNj6JXnEbgFzXMYjEOUIsBe5m9exP-zg4leMj4pGxXn7jCJXrnE84asPq_0") },
        { id: 103, name: "M4A4 | Desolate Space", price: 14, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afBSJPWAAWuR1etJo_FoTCyMmRQguynLnNepJXPEaQJyDZJ0QOdbsxi7ktS0Y-Li4ADegthGn32ojCJJ7CxosfFCD_SyjfEkHg") },
        { id: 104, name: "M4A4 | Cyber Security", price: 13, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afBSI-mRC3WA1OB9j-1gSCGn2x9-527Tyt-pcnyUagQlW5JxEOIOuhjrw9XlMrixtQTd2NhNmH_5jCNXrnE8Cu1wa6c") },
        { id: 105, name: "M4A4 | Hellfire", price: 50, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afBSKPWfAmGZ0-tJvOhuRz39zEp24GTXmImsInqWP1AkXpBwE7FetUTswdfkPu7h5QXXithBy32t2DQJsHhDPmtuAA") },
        { id: 106, name: "M4A1-S | Control Panel", price: 10, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_eAMWrEwL9lj-55SjuygRI1jDGMnYftbynDbQBzDcR3ROMI40Hpmt3kP-y271OK3tpFmy7633hJ73xit70GBPE7uvqArjH2yek") },
        { id: 107, name: "M4A1-S | Decimator", price: 15, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_eAMWrEwL9JtORqRiSygRI1jDGMnYftb3iUb1dxW5ImFLNftxCxktflZLm2tgaP2otGyn_-hytOvy9q5elQV_A7uvqA6CRSoZY") },
        { id: 108, name: "M4A1-S | Nightmare", price: 10, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_OGMWrEwL9lj-9gSCGnmBw1tgKJk4jxNWXCbAUpXpp0FrYPthC7k4fnZOm04laMjYxHn3r52HxJ6i065e0FVKV05OSJ2IHiKyzQ") },
        { id: 109, name: "M4A1-S | Blue Phosphor", price: 25, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_GeMWrEwL9lj-NlWiygmBIstgKJk4jxNWWeOg5xDJR2Q-5b5BGwxIDuP7uw4ALa3ohMz3n3iypLvyc55-pQUKct5OSJ2OKlF5Nn") },
        { id: 110, name: "AWP | Corticera", price: 20, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk6fO4bahsH_GEHlicyOl-pK8xTSzqwU1-5jjWno6hJHyeOg91A5R2TOEOtRS-kIG2ZeO25lDYg90U02yg2USK57Qn") },
        { id: 111, name: "AWP | Electric Hive", price: 55, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf9Ttk5_u4bZthKfebGinElLtytLVtG362x05wsWyByt2scHrGOgd1WZJ1ROBc4xi_ld3gNO7g-UWA3Kwc2RVq") },
        { id: 112, name: "AWP | Fever Dream", price: 15, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V7R-OfObAXeR1eZJvOhuRz39kE1w4jiAzNiod3qTOgcgXpAlQ-ML5hjqxtHjZOrrtlHWit9EyCj9iDQJsHhCZP-wUg") },
        { id: 113, name: "AWP | Mortis", price: 8, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf-jFk7uW-V6BoIeSbMWuZxuZi_rNtHiuwwRwismWEnNn8JymSZgUiDpd3Ru9ZsxG-xNy2NLzn41DWg41bjXKp5oOAt0A") },
        { id: 114, name: "AWP | Silk Tiger", price: 22, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_C9k-_upbbZ-H_KfG2KvzedxuPUnTXywkU1x4DvXztz_dH2WZlQkXMEhFrFY5BDrm9HhMurq4AfdiYxAnDK-0H0fPMTeBA") },
        { id: 115, name: "Glock-18 | Vogue", price: 7.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1Y-s2pZKtuK8-WF2KTzuBiseJ9cCW6khUz_T-GyNavdCqRawN1CMFwTOcO5hO7loXiY-zmsQKPi44QzHj22ikcvy11o7FVfFOBmfY") },
        { id: 116, name: "Glock-18 | Twilight Galaxy", price: 18, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1a4s2vebFsH_afC2Sb0tF6ueZhW2e3zR9-5mjcztv8cnjBbQMiA8ZzFLUKtBbsl4LuY77q4AHdj4pNmCz-kGoXudhVSAZp") },
        { id: 117, name: "Desert Eagle | Conspiracy", price: 6.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7OeRbKFsJ_yWMWaF0-tjo95lRi67gVMk4WTSm9moI3-QPVBxDJByQOJe40O6k4fnM-zgsQXci4gUyH3_3CMa8G81tJHuULJI") },
        { id: 118, name: "Desert Eagle | Kumicho Dragon", price: 28, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7uORbKF-JeKHC2aXzetJu_RkRiq7mhk1sjqKlLD1KCzPKhh0CcBwQLVe5BHrloKyZOnr5w3XiYhDnC39iCpK7X1psrlUWaFw8qXekUifZlV_fDVZ") },
        { id: 119, name: "USP-S | Orion", price: 16, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XuWbwcuyMESA4Fdl-4nnpU7iQA3-kKn17jJk_PuibapuJeLdWGLFwL8i4eVsFiqxxUt34jmHnoysJ3qVOAYgCJZwQrRb5EPul4XlYvSiuVIHgy4Xvg") },
        { id: 120, name: "USP-S | Caiman", price: 12, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSI-WsBWaZzO94j-1gSCGn20t-4WyBn4mocC6XbVN0CMB2RLYMsUG5x9DgN-20tQSNiI1GzS2q3XtXrnE8NAiGp64") },
        { id: 121, name: "USP-S | Cortex", price: 9, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSI-WsG3SA_u1jpN5lRi67gVNz4G7Qm938cS_Da1AhXpB1EeVb4xm4mtDjN7vj4A3b2NpGyCr52i4Y8G81tMzdoYZ7") },
        { id: 122, name: "USP-S | Serum", price: 22, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSIf2sC2uVwvpkueJWXSy3qhEutDWR1I34J3uXOwFyCsF4TeAJt0bpw9OxNrzh7gyI3t1DmHiq3y5M6HxqsrwcEf1yfEp4lzc") },
        { id: 123, name: "P2000 | Imperial Dragon", price: 22, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL5lYayrXIL0PW9V7Q_cKDDMW6d0etkueBlcC2hlBoovQKJk4jxNWXEbAQmDsQmRbNYsxGwxoC1YrvrsQXXg40QxCX533tJ7Xs-4eYKWKAl5OSJ2JuLIVNl") },
        { id: 124, name: "P250 | Asiimov", price: 6.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwiFO0OL8PfRSIeOaB2qf19F6ueZhW2fixx53tWqEm4ugeXuebQN0CZJyRrMJuxm4loCyPr_i51TfjtgXzi79kGoXuUXmUJzm") },
        { id: 125, name: "P250 | Muertos", price: 5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwiFO0OL8PfRSLfGdCmacwNF6ueZhW2e1lh51sm3UmN37cHuUbQQhXJtwQO4C4BXsxtHjM-624A3a2IoWySiskGoXuSIJMqiP") },
        { id: 126, name: "P90 | Cold Blooded", price: 10, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf_C9k_P6nfKxoMs-DVzevzedxuPUnSivqkBt_5m7Rw9v8cXmTZ1UjX5Z5EOEIuhK8koHuNe7r51fYjt4XyDK-0H2E4aJrDg") },
        { id: 127, name: "P90 | Emerald Dragon", price: 60, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf_jdk6-Cvb6tjH-DKXliS0-9gv95lRi67gVMm4m3Vzdmqci-SO1clX8Z1QeYO5xi5mtTuPu7l4FDc2o4TmH32jC1P8G81tLxM49od") },
        { id: 128, name: "Tec-9 | Fuel Injector", price: 12, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLlm5W5wiVI0Oara_1SM-WDC3WTye9kt-RtcCW6khUz_Wvcy9qgdCnEPQ8hApBzRrQJ4RW7moDgMLzktFDZiI5HnyWr3ChN5yp1o7FVg4hNKG8") },
        { id: 129, name: "Five-SeveN | Monkey Business", price: 15, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3l4Dl7idN6vyRa7FSJvmFC3SV1-t4j-NoQSi9lCIrujqNjsGheXmXPQcoWMFzEO5ZtUOwkILjY7yzsg3ci91DySiohn4buCht4eYET-N7rZVO80Su") },
        { id: 130, name: "R8 Revolver | Llama Cannon", price: 12, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLjm4Dv8TRe_c2pe5t_eM-fAmadwO13vu9mQRa_nBovp3OEz9n7JH-UPwEoA5t2TLFYtBmxlNzhYuOztgHZjo9Mzyqq3C9O63o5_a9cBr5nn1G8") },
        { id: 131, name: "R8 Revolver | Skull Crusher", price: 4, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLjm4Dv8TRe_c2tfZt_JeacAnGV09F5oPF7Sjqgmg8YvjiBk5r0b3uSaQUiCsZ2E-EI5EKwldW2NOzqslffgopHxHj-jHxLvH4_tbwHWaQ7uvqApie1xz8") },
        { id: 132, name: "SSG 08 | Bloodshot", price: 6, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLijZGwpR1Y-s29e6M9eM-HB2Sbzetkj-1gSCGn201wsjnUm9qrI3OXaAQnDsZwTbIDtxnpl9W0P7i35FfW3toTzC6q2ixXrnE8w4eIHZQ") },
        { id: 133, name: "Nova | Hyper Beast", price: 8, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL_kYDhwiFO0PyhfqVSKOmDC3WSxO9lpN5lRi67gVMhsGrTmd2seH6XbA4pDZR1EbMCtES8m4fiNenl4FDcid1Az32ri3tM8G81tMCTwFwB") },
        { id: 215, name: "MP5-SD | Phosphor", price: 8, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8jsPz-R1c_M2jePFSJvWAGm6GwOJJtPNgXxa_nBovp3PRzd-vdCqQOgYgCMYkRrECskLuwdfkZeqz5QKMjYwUnHj33SlI630__a9cBl0Wy4S-") },
    ],
    covert: [
        { id: 24, name: "AWP | Asiimov", price: 80, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6V-Kf2cGFidxOp_pewnF3nhxEt0sGnSzN76dH3GOg9xC8FyEORftRe-x9PuYurq71bW3d8UnjK-0H0YSTpMGQ") },
        { id: 25, name: "AK-47 | Vulcan", price: 95, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSMuWRDGKC_uJ_t-l9AXCxxEh14zjTztivci2ePQZ2W8NzTecD4BKwloLiYeqxtAOIj9gUyyngznQeF7I6QE8") },
        { id: 26, name: "M4A4 | Howl", price: 1500, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afVSKP-EAm6extF6ueZhW2exwkl2tmTXwt39eCiUPQR2DMN4TOVetUK8xoLgM-K341eM2otDnC6okGoXufBz_TAB") },
        { id: 27, name: "AWP | Dragon Lore", price: 3500, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk4veqYaF7IfysCnWRxuF4j-B-Xxa_nBovp3Pdwtj9cC_GaAd0DZdwQu9fuhS4kNy0NePntVTbjYpCyyT_3CgY5i9j_a9cBkcCWUKV") },
        { id: 28, name: "M4A1-S | Knight", price: 450, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_GeMWqV1e96o95lRi67gVNwsWTQzdn4JHyQZ1QhWMZyQe5YsxK-ktPnZOiwtVDcjo9ExS393ytB8G81tGXpYjdX") },
        { id: 134, name: "AK-47 | Asiimov", price: 45, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSIeOaB2qf19F6ueZhW2e2wEt-t2jcytf6dymSO1JxA5oiRecLsRa5kIfkYr-241aLgotHz3-rkGoXuUp8oX57") },
        { id: 135, name: "AK-47 | Neon Rider", price: 50, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlV6poL_6sHG6UxPxJvOhuRz39xkQhsTnVzoygdy7Ea1UoCZQkRe9bs0brl9TvN-m0tVHYjY5CyS35jjQJsHhk4o5zcA") },
        { id: 136, name: "AK-47 | Neon Revolution", price: 40, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSIf6SHGSY2NF6ueZhW2e3w0524mjQzomreXqVbAAhWJF3RuZfuxC5x920Yurh7gONjY0RxHr4kGoXuT5bpI-V") },
        { id: 137, name: "AK-47 | The Empress", price: 42, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiVI0POlPPNSJf2DHGKD0tF6ueZhW2exxEt152rWzI7_Ii-Ubw90DMB0Ee4C5xOwx9GxZbjk71PXgogWn36tkGoXudZeYvlo") },
        { id: 138, name: "AK-47 | Fire Serpent", price: 700, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0PSneqF-JeKDC2mE_u995LZWTTuygxIYvzSCkpu3cnvFPQB2DpUkROFY4Rntw93lP7i241DbiI1BxSuviHlKunk_6-sHU71lpPMTRLyP4Q") },
        { id: 139, name: "AK-47 | Head Shot", price: 55, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlV6xoIfSsHW-f1dF-v-1mcCW6khUz_TzRnNigd3-SOg4lAsF1QOQN4xS4wdHnMu-0swaMjIxExSSoiyof6ih1o7FVGHIdVhw") },
        { id: 140, name: "AK-47 | Gold Arabesque", price: 1100, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiVI0POlPPNSJ_-fCliR0-90tfJ4WiyMmRQguynLntmvICieOARzCpMhF-BYsRe-xoHvYu_g5lSNj4NDyy2viCwY6Hlu5_FCD_Q1jEqYuQ") },
        { id: 141, name: "M4A4 | Asiimov", price: 55, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6V6V-Kf2cGFidxOp_pewnTii3w0x_tmTRnt2qdHyWaFAjA5UlQOYI5BO5k9bhZunm41OI34NDnjK-0H3pAWw_Rw") },
        { id: 142, name: "M4A4 | Neo-Noir", price: 22, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afBSLvWcMWmfyPxJvOhuRz39wE1142vSztmvInvBOgV0W5R1FLYNuxW4wIbgNrmx4g2Kj4tMmCX93zQJsHgJr0dqFw") },
        { id: 143, name: "M4A1-S | Hyper Beast", price: 45, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_OGMWrEwL9JuPh5SjuMlxgmoCm6lob-KT-JbwF1WZEjR-YJskK9k9XiYePltAeNjYlAxSn5j34dvCZstb4LB6Ut-7qX0V8Xkv5_2A") },
        { id: 144, name: "M4A1-S | Printstream", price: 70, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_OGMWrEwL9lj_F7Rienhgk1tjyIpYPwJiPTcAAoCpsiEO5ZsUbpm9C2Zuni4VHW3o5EzSX62HxP7Sg96-hWVqYi_6TJz1aW0nxrkGs") },
        { id: 145, name: "M4A1-S | Mecha Industries", price: 25, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_eAMWrEwL9JveRqRyiMnBMjpi6RiIb8MhTLN1F4TowiE7EMtRW7ltzlMbvi5wPej4pDmCT2i3tKuHo4sOoEWKFz8qPS3F7BL_Rjtn0I4s52") },
        { id: 146, name: "M4A1-S | Golden Coil", price: 70, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_eAMWrEwL9lj_JnTiK2lxQztgKClYP9HifOOV5kFJclQ-Jb5xW-m9CxPuLq4QTfjd0XzyX6jCpL6X5o5OgDVfYn_a2Ci1rfcepqgV49FrE") },
        { id: 147, name: "AWP | Hyper Beast", price: 75, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6x0MPWBMWWVwP1ij-1gSCGn20pxtm_WzNuoeHKeaFAnCZUiTe5bt0HqxofmZOrm5Q2IjoMQzS_5iShXrnE8NzWs__c") },
        { id: 148, name: "AWP | Neo-Noir", price: 30, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6poL_6cB3WvzedxuPUnHirrxR4l423SyI39I3KXPwdxWZclQeNZ5EXskYfnNeyw71OMi9lNzDK-0H3r66pOTw") },
        { id: 149, name: "AWP | Fade", price: 600, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_CNk7uW-V6JsJPWsAm6Xyfo45-c5GXDnwB534DuEwtuoIHOfaAYiAsYjF-QItUaxmoC0MO_h5ALcjJUFk3sEzfdk4w") },
        { id: 150, name: "AWP | Lightning Strike", price: 120, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_C9k4_upYLBjKf6UMWaH0dF6ueZhW2frwU1_sW2EmNyvc32RZwMpCpcjQ-EJ4xbtmt3gYezk4wzb3tpAy3mrkGoXubsGIfVN") },
        { id: 151, name: "AWP | Medusa", price: 1200, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk4veqfbdsH_GEHlicyOl-pK85TC23wk12tWSGnNr6JXqRPVUnA5J5RLIKshS-l4HuYbji7lfajdgU02yg2bOcOBD3") },
        { id: 152, name: "AWP | Gungnir", price: 6500, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf-jFk7uW-V6N4LvedB3WvzedxuPUnHnjnzUl0sWrdztitI3rDZgJzAsZ1QOFY4UPqldDgMO_l41HXit9AmTK-0H227dAsvQ") },
        { id: 153, name: "AWP | The Prince", price: 450, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf-jFk7uW-V6FjIf2WAlicyOl-pK9qHXHkw093sGvTw4uqJSnDPQAkCsNyEbZcshiwxtK0Yumz4gbX2o9C02yg2f5NtC8l") },
        { id: 154, name: "AWP | Desert Hydra", price: 350, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf-jFk7uW-V6x0JOKSMWuZxuZi_uA7Syu2w0Ry4mqGzYypeH3DaAEnCpt0FuAK4RjrkoDgMb7mtFfcit5bjXKpX4RFZcA") },
        { id: 155, name: "Glock-18 | Gamma Doppler", price: 90, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1a4s2rZaF_IfyXMWqR0-x6tehzSi2MkhEosDa6lob-KT-JPwZzA5J4F-8Mt0a-ktTvNeyws1PfjIsQyiX9h3gYvSpr5bwFWash-7qX0V9IgS2WPw") },
        { id: 156, name: "Glock-18 | Neo-Noir", price: 12, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1Y-s2pZKtuK8-dAW6C_uJ_t-l9AXznwh9zsjjSn9j9dH-eb1V0CsF3QrNZ4xW8ltPlM-7h4QbYit5NzyzgznQecekkTuo") },
        { id: 157, name: "Desert Eagle | Printstream", price: 40, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7OeRbKFsJ8-DHG6e1f1iouRoQha_nBovp3OGmdeqInyVP1V0XsYlRbEI50a5wNyzZr605AyI3t5MmCSohylAuC89_a9cBoMY9UkV") },
        { id: 158, name: "USP-S | Neo-Noir", price: 22, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSI-WsG3SA0tF4v-h7cCW6khUz_WXdmd-vI3uRPwEkApR4QuBcu0Xrk4biYr_mtQXdidlCz3r63Ska7Hx1o7FVWuokIcU") },
        { id: 159, name: "P90 | Death by Kitty", price: 40, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf_jdk7PO6e694LPyAMXfJkdF6ueZhW2fgkUh042jUnN2geSqTaFN2CcQmQuRfsBXtxtfkN7mztASIg91Bniv8kGoXucYQxgOQ") },
        { id: 160, name: "SSG 08 | Dragonfire", price: 50, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLijZGwpR1Y-s29e6M9eM-XHGaXzuBwufNscDqwmg0ijDGMnYftbyrFPVAoWcQjELQOuxO4k4e1N-nnsQfW2I5Mz3ivi3wb7Stj5ukAUKY7uvqAqS55_Pw") },
        { id: 161, name: "MAC-10 | Neon Rider", price: 22, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8n5WxrR1Y-s2jaac8cM-dC2ie0-dytfNWQyC0nQlp5DzTntmgdC7COABxX5NxQrUOtUS5w4LgMu6zsVCK2IJCmyisjitM6DErvbicsEA0SQ") },
        { id: 162, name: "Sawed-Off | The Kraken", price: 30, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLin4Hl-S1d6c2tfZt-IeeWCmiWx9F5s_VmXzy-hSIrujqNjsH_eXmWaVRyXpF3EOZe5Bm8w93gMbzn4waPg98Tzir8jHwbuC5p4uZUT-N7rZ8ILI16") },
    ],
    gold: [
        { id: 29, name: "★ Karambit | Doppler", price: 800, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Q7uCvZaZkNM-SA1iUzv5mvOR7cDm7lA4i4QKJk4jxNWWXawUgA8dxRLEO40KwkobnMbnj5QKL348Qmy-sji5K7i466uxUUKQn5OSJ2KBZjkQR") },
        { id: 30, name: "★ Butterfly Knife | Fade", price: 1200, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Z-ua6bbZrLOmsD2avx-9ytd5lRi67gVNwsDvSwtqqc3iXZg4kCZYjReYLtRbum9XgYuvm5wbWjtgUzCn3iSsf8G81tFEeH9rw") },
        { id: 31, name: "★ M9 Bayonet | Crimson Web", price: 950, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Wts2sab1iLvWHMW-J_vlzsvJWQyC0nQlp4GrWzYuqeHjDZlN1XJohTecO5xawwdDvNuLm5wPcjY0QzyX83Xsd7zErvbgxKe4lfw") },
        { id: 32, name: "★ Sport Gloves | Pandora", price: 2500, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk5UvzWCL2kpn2-DFk_OKherB0H-CGHHecxNF6ueZhW2exk01w4j7cmYn4eHPCbAMhApdwTOIN5BPsx9yyYu605FTeid0Uy3j3kGoXueKyz5wo") },
        { id: 33, name: "★ Skeleton Knife | Fade", price: 1800, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1I5PeibbBiLs-SD1iWwOpzj-1gSCGn20kjt2-En9mpcCmQag8hXsciQeJYthW9kILkMLji4g3Ygo8Uznj6jX9XrnE8raC5r1M") },
        { id: 34, name: "★ Bayonet | Tiger Tooth", price: 450, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzn4_v8ydP0POgV7BkJ_WBMWiCwOBxtd5lRi67gVMhsGrTntn4ci-ROAYlXMBwE7YL5BaxxIHjY-vq7w3X398RxS78iylK8G81tBow9RWL") },
        { id: 163, name: "★ Gut Knife | Safari Mesh", price: 30, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1c-uaRe7RSLfWABliEwOBJvOhuRz39wU12sWnczIyuI3mQbFAnD8RyTLVc4BHukIfmZbjq4Vba2IlMzyT43DQJsHjApBIhpw") },
        { id: 164, name: "★ Gut Knife | Night", price: 45, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1c-uaRe6tSLvmUBnOvzedxuPUnF3C3l0p25mvQz4r7c3ueag91DpclRrFc5kaxk4e2Y7zi4VOIg4hFmTK-0H3lwmjDRw") },
        { id: 165, name: "★ Gut Knife | Bright Water", price: 55, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1c-uaRYL1SL_OWD2mvyuB_tuRWQyC0nQlp4TiDntmtIiqeblAmDsB2QLMNukSxwNDkZOrg4wbajItNzXn4in9LvDErvbi4dh8COQ") },
        { id: 166, name: "★ Flip Knife | Night", price: 75, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1d4_u-V7diH_6aCW-E_uJ_t-l9ASzgk09_tW_Qy9mocXLCbgQgWJQiReEI50SxldbiMuzn4gDd3oJCyi7gznQeD7v_WUw") },
        { id: 167, name: "★ Flip Knife | Doppler", price: 190, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1d4_u-V6VgH_KfD2Sb0et3ou1WQiihlxEiuieAnrD1KCzPKhh0CpN4FuICtEK4xoKxNbjq4gaM3dhCzSn-2i5I7346sesBVqF3_a3SkUifZq_j0qfR") },
        { id: 168, name: "★ Flip Knife | Fade", price: 240, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1d4_u-V6VsH_aSCmKvzedxuPUnTXywzR9-427Qyd34d3iUb1RyDJMlQbQL5xTtw920Zby05FeNjohDzDK-0H3GjMwqlg") },
        { id: 169, name: "★ Flip Knife | Autotronic", price: 300, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1d4_u-V6N-H_afB3evwPtiv_V7QCe6liIrujqNjsGrdn-faFMpXJd0TO4ItEKxm92xNurrsQCNiI9Fzy_43y0f63s5t-gCT-N7rYkKXYid") },
        { id: 170, name: "★ Falchion Knife | Forest DDPAT", price: 50, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1d7v6tYK1iLs-bF1iUxf53pN5lRi67gVMksWuHntutdi_Cb1IlCZFwROYMuxmxloGyY77msQCNiNhNm3j-2CIa8G81tBGTV0lI") },
        { id: 171, name: "★ Falchion Knife | Fade", price: 170, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1d7v6tYK1iLs-SD1iWwOpzj-1gSCGn20l-tmjVmIqhdHmWa1AkCJRyFuUItBW9wNTmY7jh5ADa3o5Fy3-sinhXrnE8OtZmGks") },
        { id: 172, name: "★ Shadow Daggers | Night", price: 62, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1L-uGmV7diH_6aCW-E_uJ_t-l9AX3llBlwsGiAy47_cSiWagdzDpMjF-8MsRHrloXhP-_r4FOP2o1NyyzgznQeozLE8WY") },
        { id: 173, name: "★ Huntsman Knife | Night", price: 95, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1P7vG6YadsLM-AAVieyOl-pN5lRi67gVMktj_XzNapIi6QPwYjCcd1FOIJsBPsm9TvM7-ztFfXjIgXnyX7jCxA8G81tHpNPllX") },
        { id: 174, name: "★ Huntsman Knife | Blue Steel", price: 110, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1P7vG6YadsLM-SH1iSzftztN5lRi67gVN1tW3UzousdnrBbFB0WZt0QbVctEawxoGxN-ywtgGNjtgUySz-hiIa8G81tLF2CaOG") },
        { id: 175, name: "★ Bayonet | Blue Steel", price: 140, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzn4_v8ydP0PO_V6ZhNfWXMWuZxuZi_rgwTH21kxt24TvXwo6vdXmfbgdyDpV5RORYuxS5m4KzY7605FPejohbjXKpq_wJOWQ") },
        { id: 176, name: "★ Bayonet | Slaughter", price: 380, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzn4_v8ydP0POjV75oIuKSMWuZxuZi_uU7HyjhwUh-tm_Xydmuc3nGbwN2ApAmQeNfsUXtktOzYuLm5FPajN9bjXKpLQ8HVlE") },
        { id: 177, name: "★ Bayonet | Autotronic", price: 520, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzn4_v8ydP0PW9V6ZsOf-dC3OvwPtiv_V7QCe6liIrujqNjsGodirBZlckD5B1FLMDtka7m9DuZL7i4ADf39lNxSqqjXgc5ihstrkAT-N7rfe3-Xhk") },
        { id: 178, name: "★ Skeleton Knife | Boreal Forest", price: 350, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1I5PeibbBiLs-bF1iWzvxzo_VWTSahkBwrjDGMnYftb32fPFIkDZV4EeJbskTpxt2yN-6wtQCIjY1GnyWriyIauCxv4LtQAvY7uvqAMerubhQ") },
        { id: 179, name: "★ Karambit | Night", price: 260, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Q7uCvZaZkNM-AAVieyOl-pN5lRi67gVNxsmzXyd2tJ3-QPwB2W8MkFu5YshG8lN3jYbnm5wTc34NNzS_423wd8G81tLSi0nj9") },
        { id: 180, name: "★ Karambit | Fade", price: 1100, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Q7uCvZaZkNM-SD1iWwOpzj-1gSCGn20tztm_UyIn_JHKUbgYlWMcmQ-ZcskSwldS0MOnntAfd3YlMzH35jntXrnE8SOGRGG8") },
        { id: 183, name: "★ M9 Bayonet | Doppler", price: 600, image: steamImg("-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf3qr3czxb49KzgL-Kmsj2P7rSnXtU6dd9teTA5475jV2urhcDPzCkfMKLcAE-aV3R-lO5l-e61sfqvZ2fyiBgvikqsXiMyRGw1U1Ja-dm06adSULeWfJvEZCxug") },
        { id: 186, name: "★ Hand Wraps | Spruce DDPAT", price: 90, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu4vx603vRA_Olpfu-TVJ7uK9V6xsLvSEHGaA_u13ve5WSDu2jCIrujqNjsH_InuUaQQmDJd2Fu4NshO7kIGyYeu24Affg98UxCX_iXhJ5i465bwHT-N7rXbV3WG0") },
        { id: 187, name: "★ Hand Wraps | Desert Shamagh", price: 100, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu4vx603vRA_Olpfu-TVJ7uK9V6xsLvSEHGaA_uh3svNgTBa7mggpty6RlYDtKRTILFd-XccfGb5d6lSmwdS1Zrzr4Q3Ygo5Ayiur23lL5idr5eZQBapzqPDRignHY-U058QHLOHnE0oCUw1MCg") },
        { id: 188, name: "★ Hand Wraps | Duct Tape", price: 280, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu4vx603vRA_Olpfu-TVJ7uK9V6xsLvSEHGaA_uJzsfVhSjuqqhkysCmRm5_8HifOOV5kFJF5R7IIskW_kIXnNriz7w3eg4hMzCX-2nxP6SZo4u0LBKAi-aXV2V7fcepqgxTHW6A") },
        { id: 189, name: "★ Hand Wraps | Cobalt Skulls", price: 350, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu4vx603vRA_Olpfu-TVJ7uK9V6xsLvSEHGaA_uJzsfVhSjuqqhsmsS-MmbD7LT7CAUV7T84sBohW60fg1srnZb6zsw2Ng41MmST43C1L7is9574CBKIh_q2Big_IMOdutcNRd_iuU13QD7PQAmaY") },
        { id: 190, name: "★ Driver Gloves | Black Tie", price: 150, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5T441rsfhr9kYDl7h1I4_utY5t-NPmHDW-VxdF0vOBqRBaknRQztgKJk4jxNWXBbwdxDcZwFrFY40XrktLgNr7q4AKM2owQmX6ojSpMuCo_tulQB6ss5OSJ2E_SKQx-") },
        { id: 191, name: "★ Driver Gloves | Lunar Weave", price: 250, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5T441rsfhr9kYDl7h1I4_utY5tvLPGQBVicyOl-pK8xTizrzER1t2rczNj9JSqRZg92CZZ2RrRetBi7kYDhZeLl7wDajo9C02yg2YX5gL0s") },
        { id: 192, name: "★ Driver Gloves | Snow Leopard", price: 350, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5T441rsfhr9kYDl7h1I4_utY5tnIfeGD3Wv1uZ_pORWQyC0nQlp4TnUw9f6J3PCOw4oW8ZxRuEOshK8l9fgZbnqswHX3owXmSisjCIfuzErvbiEoDwfJQ") },
        { id: 193, name: "★ Driver Gloves | Crimson Weave", price: 600, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5T441rsfhr9kYDl7h1I4_utY5t_JfSsAm6Xyfo4trVoSnGxlh9x5DmEzt6rJS2RagYiA5siQ-MLthW9xtDlM7uxtFCNgpUFk3thcTnRAg") },
        { id: 194, name: "★ Sport Gloves | Arid", price: 220, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk5UvzWCL2kpn2-DFk_OKherB0H_2aAm6EwPxvj-1gSCGn20h3sTvVyoqheX2TbA9zDcFwQOQLtBnpw4bvM-rm4ACMiY5Cnn_63CNXrnE8hMDc76M") },
        { id: 195, name: "★ Sport Gloves | Slingshot", price: 300, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk5UvzWCL2kpn2-DFk_OKherB0H-OfB2mX0uZ5pN5lRi67gVN24DzSw479dnuTbAckWcElRbJctkW9ktPlNu2w51Dc2oNAmCWo2ioa8G81tMaI-Tzs") },
        { id: 196, name: "★ Sport Gloves | Bronze Morph", price: 450, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk5UvzWCL2kpn2-DFk_OKherB0H-CcB3Sfz9Fwou5ucDu2kSIgoTiAlLD1KCzPKhghDJBzTLMCukW6kNblNe-2tlGKj45GyCWrii8f73k95e4HA_AjrvbSkUifZkDjXxpJ") },
        { id: 197, name: "★ Sport Gloves | Superconductor", price: 1600, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk5UvzWCL2kpn2-DFk_OKherB0H_yaCW-E_ux6peRWQyC0nQlp4jjRyt-vJX6QblMgApt0R-5c5hLsktO2Nu_h4QaLg4MXyCmr2ClP7jErvbiwB_ADaw") },
        { id: 198, name: "★ Sport Gloves | Vice", price: 1800, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk5UvzWCL2kpn2-DFk_OKherB0H_KfG2Kv0ed4u95lRi67gVNx4T-Bw434IHyVb1QlAsd1FOUDthG4xNznMu3m4QXXg90Wzn_33C1I8G81tLaDi_rK") },
        { id: 199, name: "★ Sport Gloves | Hedge Maze", price: 3500, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk5UvzWCL2kpn2-DFk_OKherB0H_eBC2Ke_uJ_t-l9AX21whwi4Gndnov9JH_FblMlCJYjRbFZtkWww4HnNbjr7wWN39gUmH7gznQeohQBtY8") },
        { id: 200, name: "★ Specialist Gloves | Field Agent", price: 220, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk71ruQBH4jYLf-i5U-fe9V7d9JfOaD2uZ0vpJtuNgcCW6khUz_TiHydigcXyXawRxX5QmQLQIsxC9kYfgN--w5QCLi4IRzyz42yofvCZ1o7FVbJfAqIA") },
        { id: 201, name: "★ Specialist Gloves | Crimson Kimono", price: 700, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk71ruQBH4jYLf-i5U-fe9V7d9JfOaD2uZ0vpJu-hkQCe8qhkusjCKlIvqHjnCOml8U8UoAfkItBLswdbuNbjr5FHdjNkUzSv73C1K5y46tu4EUvAg-6bU3FrBMOE4_9BdcyhkRns5") },
        { id: 202, name: "★ Specialist Gloves | Emerald Web", price: 900, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk71ruQBH4jYLf-i5U-fe9V7d9JfOaD2uZ0vpJtexsXSi_kSIwtj-6lob-KT-Jbw4kA8d4QOBb5hnqmoHuMLmx4AWK341Bnyr93CxN6itjsb1XUfAgqLqX0V92--w69A") },
        { id: 203, name: "★ Specialist Gloves | Fade", price: 1500, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk71ruQBH4jYLf-i5U-fe9V7d9JfOaD2uZ0vpJtuBtSha_nBovp3PQy42sdX6eagIjW5AlQOVetBXuk92xNLvg4gOMjd5AmC2ointB53w__a9cBqntWBk3") },
        { id: 204, name: "★ Moto Gloves | Eclipse", price: 270, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu4r7_lb1QgTykpPf-i5U-fe9V6liNP-BDX6TzetJsuB6RiqMlxEmsDa6lob-KT-JaQMpDpFzFOdY4EO8lIDnMLjr5ALZjN1Dnyj7iyhAvXo55ucKWadx87qX0V_LSR8vSA") },
        { id: 205, name: "★ Moto Gloves | Spearmint", price: 450, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu4r7_lb1QgTykpPf-i5U-fe9V6liNP-BDX6TzetJvehnWxanhxQmvTqJn7D1KCzPKhgnW5UmRO4DsxXrlYbhPurmtAXai98UzS73in5I6S5p4OsAU_Zx-KHWkUifZsxBQgc2") },
        { id: 206, name: "★ Moto Gloves | Boom!", price: 800, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu4r7_lb1QgTykpPf-i5U-fe9V6liNP-BDX6TzetJve5nQBaxmhIqjDGMnYftb3ufaQNxA5MiEeVb5kW5ldPiZuPj5lOKjt9BxCutiSlO5ys5sL1UUPU7uvqAf72SBgc") },
        { id: 207, name: "★ Hydra Gloves | Emerald", price: 1200, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tg_13jRBnOlo_k7yNk6P6hfqF-H_KfAWiUyeFjvuVWRzC3hxwYsTGEmYTGJjnCO1hPVssnHaMU4EG6ktGyPryz5A3fiIwUyin3h3lJ5nlq5-xQVPIk-6HWjVmQOeFptI5DeqjsQUewWg") },
        { id: 208, name: "★ Bloodhound Gloves | Charred", price: 170, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tg_13jRBnOnJrv8iZT4OegbJtqLP-FC3Svw-J5v-VhQDy9kSIlvzyGkbDqKCfRO0RPVssnHaMUsES-k9HjNrixsgbd3YIRni7-inlO5i5t6-pRAqIs_aOFjg_JZbU5sI5Deqh-Veq-pA") },
        { id: 209, name: "★ Broken Fang Gloves | Jade", price: 330, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tg_13jRBnOnITv9idV6fOgb5tqLP-FC3Svzv5zouB9Ria9xE0YvjiRm4PwIhTALFN1VP0sHLBS9g65w9exM-Pl5gaKidkRziX22yNIv306571QA6pwrKGDiluTZLxs5ZdXOr_5GlzOqAIa") },
    ]
};

// Drop chances are explicit per case item (`odds`, in %, summing to 100): see getItemChances.
const skinById = {};
Object.values(skins).forEach(list => list.forEach(s => { skinById[s.id] = s; }));
function caseItems(pairs) {
    return pairs.map(p => Object.assign({}, skinById[p[0]], { odds: p[1] }));
}

const cases = [
    {
        id: 1,
        name: "Caja Principiante",
        theme: { key: "recruit", tagline: "Campo de entrenamiento", primary: "#7fb069", dark: "#2d4a22" },
        price: 0.5,
        category: "cheap",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [14, 6.89449], [56, 2.47663], [10, 3.71494], [53, 5.40355], [9, 5.94391], [7, 8.53573],
            [5, 10.24288], [6, 12.8036], [2, 7.41308], [4, 9.8841], [1, 11.86093], [3, 14.82616],
        ])
    },
    {
        id: 10,
        name: "Caja Desierto",
        theme: { key: "desert", tagline: "Dunas y espejismos", primary: "#e0a458", dark: "#3d2410" },
        price: 1.5,
        category: "cheap",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [154, 0.23916], [187, 0.03688], [83, 5.33568], [59, 2.09357], [10, 2.61696], [51, 1.80643],
            [70, 5.23391], [52, 2.06449], [69, 5.98162], [6, 6.02143], [48, 6.56884], [47, 7.22572],
            [45, 8.02858], [4, 21.24852], [1, 25.49821],
        ])
    },
    {
        id: 2,
        name: "Caja de Armas",
        theme: { key: "arsenal", tagline: "Arsenal militar", primary: "#a3a36b", dark: "#3b3b24" },
        price: 2.5,
        category: "cheap",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [21, 2.2005], [19, 2.6406], [103, 2.82922], [20, 3.16872], [16, 2.18136], [14, 2.61763],
            [18, 3.0539], [15, 3.27204], [17, 4.36272], [10, 2.5626], [13, 3.72742], [9, 4.10016],
            [11, 4.55573], [12, 5.85737], [7, 4.55504], [5, 5.46605], [6, 6.83256], [8, 8.19907],
            [2, 27.81731],
        ])
    },
    {
        id: 12,
        name: "Caja Glock",
        theme: { key: "glock", tagline: "Ráfaga de polímero", primary: "#ffb703", dark: "#1c1c1f" },
        price: 3,
        category: "cheap",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [155, 0.39991], [116, 1.53995], [156, 2.99935], [82, 3.03579], [23, 3.26107], [115, 3.69588],
            [81, 5.05964], [80, 8.67367], [56, 3.83716], [11, 10.23242], [57, 15.34863], [44, 19.8552],
            [45, 22.06133],
        ])
    },
    {
        id: 9,
        name: "Caja Neón",
        theme: { key: "neon", tagline: "Luces de neón", primary: "#ff2bd6", dark: "#1a0530" },
        price: 4,
        category: "medium",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [147, 0.0899], [135, 0.13485], [143, 0.14983], [136, 0.16856], [148, 0.22474], [142, 0.30647],
            [158, 0.30647], [161, 0.30647], [128, 3.68517], [156, 0.56186], [90, 3.20268], [91, 3.20268],
            [133, 5.52775], [94, 9.15052], [89, 10.6756], [56, 31.15323], [66, 31.15322],
        ])
    },
    {
        id: 11,
        name: "Caja Ártica",
        theme: { key: "arctic", tagline: "Hielo eterno", primary: "#8fdcff", dark: "#0c2230" },
        price: 4.5,
        category: "medium",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [178, 0.15116], [192, 0.15116], [174, 0.48098], [165, 0.96195], [88, 1.3942], [103, 4.036],
            [102, 5.13673], [80, 5.57681], [93, 9.75942], [9, 5.28167], [71, 5.86852], [68, 7.54524],
            [67, 8.80278], [39, 44.85338],
        ])
    },
    {
        id: 3,
        name: "Caja AK-47",
        theme: { key: "kalashnikov", tagline: "Fiebre del Kalashnikov", primary: "#e4572e", dark: "#4a1c10" },
        price: 5,
        category: "medium",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [140, 0.0269], [138, 0.04226], [25, 0.31142], [100, 0.4095], [139, 0.53792], [135, 0.59171],
            [101, 0.50049], [134, 0.65745], [98, 0.90089], [21, 1.25123], [99, 1.50148], [102, 2.04748],
            [75, 1.91701], [74, 2.55601], [73, 4.26002], [18, 6.39003], [61, 5.67831], [63, 6.55189],
            [62, 7.09789], [10, 10.64683], [49, 18.44932], [50, 27.67396],
        ])
    },
    {
        id: 16,
        name: "Caja Halloween",
        theme: { key: "halloween", tagline: "Noche de brujas", primary: "#ff7a00", dark: "#1a0a2e" },
        price: 6,
        category: "medium",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [179, 0.17864], [173, 0.4889], [172, 0.74912], [139, 1.78843], [105, 0.21081], [164, 1.03212],
            [162, 3.27879], [108, 1.05405], [126, 1.05405], [113, 1.31756], [132, 1.75675], [84, 1.49459],
            [125, 2.1081], [87, 2.05505], [96, 2.05505], [131, 2.63513], [85, 2.74007], [97, 2.74007],
            [92, 2.93579], [95, 2.93579], [72, 25.9464], [42, 15.7779], [41, 23.66684],
        ])
    },
    {
        id: 13,
        name: "Caja Pistolas",
        theme: { key: "pistols", tagline: "Duelo al amanecer", primary: "#2ec4b6", dark: "#06302c" },
        price: 7,
        category: "medium",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [157, 7.73012], [118, 0.34431], [22, 0.38563], [122, 0.43822], [123, 0.43822], [116, 0.5356],
            [119, 0.60255], [129, 0.64272], [120, 0.8034], [128, 0.8034], [130, 0.8034], [90, 2.70474],
            [91, 2.70474], [23, 1.13421], [115, 1.28543], [79, 4.16114], [117, 1.48319], [124, 1.48319],
            [78, 4.91771], [83, 4.91771], [125, 1.92815], [59, 4.67951], [55, 5.84939], [58, 7.79918],
            [53, 8.5082], [43, 32.91594],
        ])
    },
    {
        id: 4,
        name: "Caja AWP",
        theme: { key: "sniper", tagline: "Ojo de francotirador", primary: "#4cc9f0", dark: "#0b2a3a" },
        price: 8,
        category: "medium",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [152, 0.00733], [27, 0.01362], [151, 0.03972], [149, 0.07943], [153, 0.10591], [150, 0.39717],
            [24, 0.59575], [147, 0.63547], [111, 0.41959], [148, 1.58867], [114, 1.04897], [110, 1.15387],
            [19, 1.53849], [112, 1.53849], [77, 2.74076], [113, 2.88467], [14, 7.04767], [76, 7.04767],
            [64, 29.38418], [51, 19.4752], [52, 22.25737],
        ])
    },
    {
        id: 15,
        name: "Caja Cyberpunk",
        theme: { key: "cyber", tagline: "Futuro en circuito", primary: "#fcee0a", dark: "#1a1800" },
        price: 12,
        category: "medium",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [177, 0.59875], [169, 1.03784], [155, 0.35232], [144, 0.45298], [146, 0.45298], [111, 0.28302],
            [157, 0.79271], [109, 0.62264], [145, 1.26834], [142, 1.4413], [107, 1.03774], [103, 1.11186],
            [104, 1.19739], [128, 1.29717], [106, 1.5566], [121, 1.72956], [215, 1.94576], [124, 2.39478],
            [213, 5.09954], [214, 5.09954], [212, 7.64932], [211, 10.19909], [210, 52.37877],
        ])
    },
    {
        id: 5,
        name: "Caja Premium",
        theme: { key: "premium", tagline: "Lujo negro y oro", primary: "#f7c94b", dark: "#1a1508" },
        price: 15,
        category: "medium",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [25, 0.85154], [24, 1.0112], [166, 1.9092], [144, 1.15566], [146, 1.15566], [135, 1.61792],
            [143, 1.79769], [164, 3.18201], [157, 2.0224], [118, 1.42537], [109, 1.59642], [122, 1.81411],
            [21, 2.21725], [116, 2.21725], [119, 2.4944], [19, 2.66069], [88, 1.76303], [20, 3.19283],
            [86, 4.11374], [16, 5.87678], [14, 7.05213], [15, 8.81516], [10, 15.40675], [9, 24.65081],
        ])
    },
    {
        id: 6,
        name: "Caja de Cuchillos",
        theme: { key: "blade", tagline: "Filo de acero", primary: "#c0d6df", dark: "#1e2a30" },
        price: 25,
        category: "expensive",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [29, 0.0012], [34, 0.00614], [176, 0.00992], [179, 0.02912], [168, 0.03654], [167, 0.07088],
            [171, 0.09718], [175, 0.16856], [174, 0.33408], [25, 1.14146], [173, 0.50636], [24, 1.85854],
            [166, 0.9901], [172, 1.69897], [165, 2.38658], [170, 3.12747], [164, 4.21689], [163, 13.32001],
            [21, 4.5532], [19, 7.63709], [88, 1.4139], [20, 12.80971], [75, 3.67228], [82, 3.67228],
            [90, 3.67228], [91, 3.67228], [77, 4.95148], [74, 8.30512], [81, 15.64038],
        ])
    },
    {
        id: 7,
        name: "Caja Legendaria",
        theme: { key: "legend", tagline: "Corona de los legendarios", primary: "#b388ff", dark: "#2a1450" },
        price: 50,
        category: "expensive",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [27, 0.02382], [32, 0.16774], [33, 0.23297], [26, 0.05557], [30, 0.34945], [31, 0.44141],
            [29, 0.52417], [183, 0.6989], [28, 0.18524], [34, 0.93187], [25, 0.87746], [24, 1.04198],
            [100, 1.20492], [111, 1.20492], [141, 1.51561], [105, 1.32541], [137, 1.98473], [136, 2.08397],
            [159, 2.08397], [22, 2.65082], [21, 3.6817], [19, 4.41804], [20, 5.30165], [23, 7.79654],
            [14, 26.31873], [15, 32.89841],
        ])
    },
    {
        id: 8,
        name: "Caja Dragon",
        theme: { key: "dragon", tagline: "Aliento de dragón", primary: "#ff3d3d", dark: "#3a0a05" },
        price: 100,
        category: "expensive",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [27, 0.04589], [32, 0.33071], [33, 0.45932], [26, 0.10707], [30, 0.68898], [180, 0.75161],
            [31, 0.87028], [29, 1.03346], [138, 0.22944], [28, 0.35691], [34, 1.83727], [150, 1.3384],
            [25, 1.69061], [24, 2.0076], [147, 2.14144], [146, 2.2944], [127, 4.95042], [160, 3.21216],
            [118, 10.60803], [123, 13.50113], [82, 51.54487],
        ])
    },
    {
        id: 14,
        name: "Caja Guantes",
        theme: { key: "gloves", tagline: "Guantes de élite", primary: "#ff5e8a", dark: "#3a0a1a" },
        price: 150,
        category: "expensive",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [199, 0.00073], [32, 0.002], [198, 0.00534], [197, 0.00759], [203, 0.0092], [207, 0.0179],
            [202, 0.04221], [206, 0.05998], [201, 0.08933], [193, 0.14147], [196, 0.33367], [205, 0.33367],
            [189, 0.7061], [192, 0.7061], [209, 0.84156], [195, 1.11827], [188, 1.37378], [204, 1.53118],
            [191, 1.92628], [194, 2.8204], [200, 2.8204], [208, 6.08547], [190, 8.83947], [187, 29.6246],
            [186, 40.5633],
        ])
    }
];
// <<< GENERATED CATALOG

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

// Per-item drop chances (in %) for a case.
//  - Catalog cases carry an explicit `odds` (in %) on every item (generated by scripts/build-catalog.js so
//    that the expected value of an opening is a fixed fraction of the case price): used as is, normalised
//    to 100.
//  - Item lists without `odds` fall back to the rarity model: rarity chances (dropChances) are
//    renormalized over the rarities present, then split evenly within each rarity.
function getItemChances(items) {
    if (items.length && items.every(item => typeof item.odds === 'number' && item.odds > 0)) {
        const sum = items.reduce((total, item) => total + item.odds, 0);
        return items.map(item => item.odds * 100 / sum);
    }
    const counts = {};
    items.forEach(item => {
        const rarity = getRarity(item);
        counts[rarity] = (counts[rarity] || 0) + 1;
    });
    const total = Object.keys(counts).reduce((sum, rarity) => sum + dropChances[rarity], 0);
    return items.map(item => {
        const rarity = getRarity(item);
        return (dropChances[rarity] / total) * 100 / counts[rarity];
    });
}

// Picks an item from a case using getItemChances. `rng` returns a float in [0, 1)
// (Math.random in the browser, a crypto-based generator on the server).
function rollItem(items, rng) {
    const chances = getItemChances(items);
    let rand = (typeof rng === 'function' ? rng() : Math.random()) * 100;
    for (let i = 0; i < items.length; i++) {
        rand -= chances[i];
        if (rand < 0) return items[i];
    }
    return items[items.length - 1];
}

function formatChance(chance) {
    if (chance >= 10) return chance.toFixed(1) + '%';
    if (chance >= 0.1) return chance.toFixed(2) + '%';
    if (chance >= 0.001) return chance.toFixed(3) + '%';
    return '<0.001%';
}

// Rarity of an item (by catalog id)
const rarityById = {};
Object.keys(skins).forEach(rarity => skins[rarity].forEach(s => { rarityById[s.id] = rarity; }));

function getRarity(item) {
    return (item && rarityById[item.id]) || 'consumer';
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

// ==================== IMAGE FALLBACK (browser) ====================
// A skin or case image that fails to load (offline, CDN hiccup, removed asset) is swapped for the generic
// placeholder, so no page ever shows a broken-image icon. Capture phase: 'error' does not bubble.
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    (function () {
        function fix(img) {
            if (!img || img.tagName !== 'IMG') return;
            const current = img.getAttribute('src') || '';
            if (current === SKIN_PLACEHOLDER || current === CASE_PLACEHOLDER) return;
            img.src = cases.some(c => c.image === current) ? CASE_PLACEHOLDER : SKIN_PLACEHOLDER;
        }
        document.addEventListener('error', e => fix(e.target), true);
        // images that had already failed before this script ran
        window.addEventListener('load', () => {
            document.querySelectorAll('img').forEach(img => {
                if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fix(img);
            });
        });
    })();
}

// Node (server / tests): the same catalog is shared with js/engine.js via require()
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        skins, cases, dropChances, getItemChances, rollItem, formatChance, getRarity, getRarityColor,
        SKIN_PLACEHOLDER, CASE_PLACEHOLDER
    };
}
