// ==================== SKINS & CASES DATA ====================
// The catalog (skins with real per-skin Steam images, cases and their drop odds) lives between the
// GENERATED CATALOG markers below and is produced by scripts/build-catalog.js. Everything else in this
// file is hand-written. Shared by the browser (globals) and Node (module.exports at the end).

// Generic skin / case art, used when an image is missing or fails to load
const SKIN_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect fill='%231a1a25' width='200' height='150'/%3E%3Cpath d='M70 45 L130 45 L145 75 L130 105 L70 105 L55 75 Z' fill='%232a2a35' stroke='%23444' stroke-width='2'/%3E%3Crect x='75' y='70' width='50' height='8' rx='2' fill='%23555'/%3E%3Crect x='65' y='60' width='15' height='30' rx='2' fill='%23444'/%3E%3C/svg%3E";

const CASE_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%231a1a25' width='200' height='200'/%3E%3Crect x='40' y='50' width='120' height='100' rx='8' fill='%232a2a35' stroke='%23ff6b35' stroke-width='3'/%3E%3Crect x='50' y='60' width='100' height='20' rx='4' fill='%23ff6b35' opacity='0.3'/%3E%3Ccircle cx='100' cy='110' r='20' fill='none' stroke='%23ff6b35' stroke-width='3'/%3E%3Cpath d='M100 95 L100 125 M85 110 L115 110' stroke='%23ff6b35' stroke-width='3'/%3E%3C/svg%3E";

// >>> GENERATED CATALOG (scripts/build-catalog.js) - do not edit by hand, edit the spec there and re-run it
// Prices are EUR market reference values (median of the Field-Tested listing, or the closest wear
// available) from the public Skinport feed, refreshed by the build script. They are informative
// only: Skins are virtual, cannot be withdrawn and these are not sale prices.
const priceSource = {"provider":"Skinport","currency":"EUR","basis":"Mediana de la variante Field-Tested (o la más cercana)","updated":"2026-10-28","matched":306,"total":307};
// Images: Steam CDN URLs taken from the public CS2 catalog (ByMykel/CSGO-API); a failing image falls
// back to SKIN_PLACEHOLDER (see the error handler at the end of this file).
const STEAM_IMG = "https://community.akamai.steamstatic.com/economy/image/";
const steamImg = token => STEAM_IMG + token;

const skins = {
    consumer: [
        { id: 1, name: "P250 | Sand Dune", price: 0.03, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwjFU0OGvZqBSLPmUBnPelesn5-RrSXDlwRhx5TjSwtmocCifPwQpDpshReBfsxPrk4DhNu3jshue1dy8VcXxuA") },
        { id: 2, name: "MAC-10 | Silver", price: 0.28, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8n5WxrR1a4c29Yah7JeKsAm6Xyfo44-UwS32xwkUjsGzSwtqoJCjCOABxD8AkFu5bsha7wdGyM-rn4wzWjpUFk3tFRcHXeg") },
        { id: 3, name: "Negev | Army Sheen", price: 0.03, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL_m5Hl6x1a4s2veql0H-ObB2mV_uJ_t-l9AXrikxgk6z-EyYytcHLGbAclC8EhE-QJthjplN2yZO3gtVbcjIsXzSzgznQeWdeDBGI") },
        { id: 4, name: "PP-Bizon | Sand Dashed", price: 0.03, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzl4zv8x1I_826abRoH-ObAXWE_v13vuVWQyC0nQlp62XcyNygJCrDawR1WZIlQ7QL4xS_wNblPu_h7gOP3oJHynr8iHhK6zErvbioPrlsUA") },
        { id: 39, name: "P250 | Boreal Forest", price: 0.03, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwipC0PSheqF-NM-RAXWVwOJJvOhuRz39wEsm4WXRz4urcXvEZw8pXJp1RrEIuhC_lNfiYeLj51TXg4JAyyT_jTQJsHgo2RMlUQ") },
        { id: 41, name: "P250 | Bone Mask", price: 2.86, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwjFL0OaveKFSLPmUBnPekL0l47g9TXuylE916mrRy9-vdS6VZgQpWJJ5F-8OsRawl4DhNbix4Rue1dyhzdnPWw") },
        { id: 42, name: "R8 Revolver | Bone Mask", price: 0.03, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLjm4Dv8TRe_c29eJt5IeCWMWuZxuZi_rNtHX_hwh91sWjXm9qreSqfaAIgD5d3RLNbt0Pqx4e2Mrjn5wHbi99bjXKpUIbZI8w") },
        { id: 216, name: "AUG | Snake Pit", price: 0.08, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwi5Hf9Ttk6-egbZt5MvGDMWuZxuZi_rg4S3rqwxgltjyEy9r_cH7GbFBxXpd2RbEPukLtxoXgNOLg7gXe2thbjXKpZivzOLA") },
        { id: 219, name: "SG 553 | Bleached", price: 0.49, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLimcO1qx1I_82qbbdoMuSsHWyFzeJlj-1gSCGn20Uk5WTSytmqJH6XbwMoA8RyRuBY4Ea6kNC2Y-Oz7gbc3o9HxS2r2n5XrnE8gS50bog") },
        { id: 249, name: "MAG-7 | Storm", price: 0.46, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8n5G3wjFU0OG6Z7ZgJuKcAHOvzedxuPUnS3_iwk926m6EnIyvIn3DbQF0X5UjRbJfthewktK2MLzq4ATcgoJCxTK-0H2wBd1PlQ") },
        { id: 264, name: "G3SG1 | Green Cell", price: 0.03, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2zYXnrB1I_82lYKVmKc-QD2qf_uJ_t-l9AXi3whgm4WjczNageHzCZgRyDcchRu8Ls0W5l922N7jhsgyMjYpAzS7gznQe2xurqq8") },
        { id: 276, name: "MP9 | Bee-Tron", price: 0.03, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8js_f7i1e0OurZKhiN8-RB3OD_uJ_t-l9ASrhzRt062_Qm4n8cn-XbFQkCcMkTLQD5EW8m9TjM--34gXf2Y1Hzn_gznQepx3qArs") },
        { id: 279, name: "MP7 | Prey", price: 0.23, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8jsHf7jJk9feseqVuIf2sHGKU_uJ_t-l9AXvqwUsk4DyHnIr7eHySbg8gWcckTOUCsxawk9O1ZeywsQOIg95AznjgznQehcsrUP8") },
        { id: 282, name: "MP5-SD | Dirt Drop", price: 0.03, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8jsPz-R1I_826abRoH-ObAXWE_vx3vO1wcCW6khUz_W_TydqocinDPwYlW8MhQuMMs0LsxNblN7_jtVCM2I9Cz3_43Hsd7il1o7FV674h8n8") },
        { id: 285, name: "UMP-45 | Scorched", price: 0.62, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkk4a0qB1I_82qabR9LPWsAm6Xyfo46bMxGn-3x00m4m-HzN2sIH6SZwQpWJVwQu4MuhK5xIXiMuO24QLej5UFk3vMYylqRQ") },
        { id: 288, name: "P90 | Desert DDPAT", price: 0.36, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf9Ttk6_a-abBSJPWAC3WE_uJ_t-l9ASjgwBx3sj_Ry4qqcXKfPVdxD5J4F7MIsBnpl9OzP7jg7gLd2dpFyiXgznQeFOalmMw") },
        { id: 291, name: "Tec-9 | Army Mesh", price: 0.03, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLlm5W5wjFL0P-re6xSIeKeF1icyOl-pK8xGnCxkR5_tWTQztepcHiWOwAlCpJ3Q7ML5BO-lNyxMuvl5wXYiY0Q02yg2eIzVY8M") },
        { id: 294, name: "Zeus x27 | Swamp DDPAT", price: 0.03, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLln4Xl7x1T9s2qYaNkI_GeMWGf0-tlpN5lRi67gVNzsDuHyNyueHmQZgUoC5AkQuEKtkHum4fjN-jjtlfXio8UzHis2igb8G81tBqfncax") },
        { id: 305, name: "Five-SeveN | Coolant", price: 0.03, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3l4Dl7idN6vyRYL1SJOWQGnSvxvxzte9WQyC0nQlp5m_cmNqueH7EbQAiXpN0FO5YtBK_x4XgMrjmswON2osQzn77iipJ6zErvbgVYFr6QQ") },
    ],
    industrial: [
        { id: 5, name: "UMP-45 | Urban DDPAT", price: 0.03, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkk4a0qB1T9s2qbLRsNM-GHGWvzedxuPUnGS3hwBxxtm6Am4yreH2TP1N0A5EhROBb5Ba5k9TjYuLrtQWMjdhCyTK-0H2MxuWOFg") },
        { id: 6, name: "G3SG1 | Safari Mesh", price: 4.04, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2zYXnrB1I_82jbbdlH-SSAFicyOl-pK8-Tn3qwkgi5j7Wm9z7dy6fbFMoWcZ0RucOshK5l4DkZr_l5ACNgtpM02yg2YL7CXWd") },
        { id: 7, name: "Five-SeveN | Forest Night", price: 0.03, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3l4Dl7idN6vyRYL1SJv-BC3SE_uB_t-l9cCW6khUz_T7Untv9cXmfPAEnCZFwRLUJtEXtxN3iN-mz7gffjtkRnir-2nkauyx1o7FVpfrK-Xo") },
        { id: 8, name: "Dual Berettas | Contractor", price: 0.03, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL0kp_0-B1I4M2-ZadSLPmUBnPekb8g5LI8Hyi2l01z42Tdmdj9cXiRaA4jXJp4E7YJ4Ra8lILmP-7itBue1dzkV1WWjA") },
        { id: 43, name: "Desert Eagle | Night", price: 9.71, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk_P2RZq1qKOSsAm6Xyfo4seVrHHjmzRhz42XUm4mgIC6TaQYkXpMjTLIIsRawl9HhYbzktFPfgpUFk3u310nzMg") },
        { id: 44, name: "Glock-18 | Groundwater", price: 12.72, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1I4M2hZK17Jc-fB2CY1aBzseQ4GXG1lEwk4mWHmd39dC7BOwImD8F2QedeshjrkYKyML-z4Q3flcsbmqxtqryL") },
        { id: 45, name: "Glock-18 | Sand Dune", price: 13, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1I4M29aappH_KBD3Gf_uJ_t-l9AS_gwE4i4GTdyIn6IinEalUhC5t5FOMN5BK7xobiPung7wbWiolNzS_gznQeDKgSRyc") },
        { id: 47, name: "Sawed-Off | Rust Coat", price: 8.9, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLin4Hl-S1d6c2veZt-NPWWAlicyOl-pK87TC2ylB534jiGzNv6dCjFPQR2XpJ4RuQPtRbqx9znYujitFPZ3oJC02yg2T-LVFiK") },
        { id: 48, name: "XM1014 | CaliCamo", price: 0.16, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLpk8ewrHZk5-uRfqV_KfOSA2ivxetltfN9cCW6khUz_TuGmI2odiqUaVN2A5IkFuJZtRjrldDkNLiw4ADc2o1Emyj72yxM5ix1o7FV5bllY3w") },
        { id: 49, name: "AK-47 | Predator", price: 19.25, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wjFL0OirarZsI_GeMWuZxuZi_uMwF3i3xkh25W_VzNevICqTP1QoXpJ2E-MM40bpldXvY7yw4wXb3olbjXKpy8jW9Xo") },
        { id: 50, name: "AK-47 | Baroque Purple", price: 7, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wipC0OSrZqF5L8-DG3WAzetJvOhuRz39wEgl6jyBwtqtJS6QbFRzApIkR-YLsRe6wdDvZung4gHbjd4XyH7_iTQJsHhGzMbuTA") },
        { id: 51, name: "AWP | Safari Mesh", price: 0.16, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf7jJk4ve9YJt5If6sAm6Xyfo45uU7HS_nzU914z_dzImtdXyQZlMjCJIkFOUI5ES9k9PkPriz71bdiJUFk3tlgygeXw") },
        { id: 52, name: "AWP | Sun in Leo", price: 21.86, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf9Ttk9f2qYaVucs-fB2CY1aAnteVqHCzgkRsh4TnXyY2vIH-QaVcpA5F3TOdct0S_wNO0Zri05wbXlcsbmn9hB4gb") },
        { id: 222, name: "Galil AR | VariCamo", price: 0.15, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2n5rp8SNJ0Pq3V7JsMvmQD2qf_uJ_t-l9AXzgwU0ktW6HnIr_cH7FO1R1CpFyTbQNtBHqkYHuM-iw5FDeid1NmCjgznQefGamZCs") },
        { id: 225, name: "FAMAS | Cyanospatter", price: 0.05, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3n5vh7h1T9s28baFrH_yaCW-Ej7olsbNsG3rmzEoj5m6Hz9atJC2WOg8iDJchR7JeuhfuwIbnZO3k4FHAy9USioZeSPo") },
        { id: 231, name: "CZ75-Auto | Copper Fiber", price: 1.42, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLyhMG1_B1a4s2tabZvL_6sCG6SxPxJs_s-Gha_nBovp3OEzIn8c3qUagUiD5p0FuILtUKxm4e2Mrzms1baiIpCyiiqhi1J6yxo_a9cBnTQQcTV") },
        { id: 234, name: "R8 Revolver | Nitro", price: 0.1, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLjm4Dv8TRe_c29Z5tiMvGdCWKvwO11te99XHqMmRQguynLzo34IiiTagQoWZUlFOYOsha6ltLlPuPlsweMj4tDnyT6jy5MuytosvFCD_SeBWArcQ") },
        { id: 237, name: "Dual Berettas | Stained", price: 0.11, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL0kp_0-B1a_s2oZ7ZuJfSsAm6Xyfo45LVtG3zgzEt-tmWHydutd3nFaVciDJIjFrZZt0OxmoXkMuuz7wbY2pUFk3vnrYa7Ww") },
        { id: 240, name: "Five-SeveN | Midnight Paintover", price: 0.06, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3l4Dl7idN6vyRYL1SL-aWHHeR0v1JoOBgQT28gxg1jCmAm4PGLSLANkI-X5YmF-QN4EK8wdXgNenrsgDejYNAmS33jHtB6Ctj5esBBKItqKXQhhaBb-MJGErI3w") },
        { id: 243, name: "Nova | Rain Station", price: 0.12, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL_kYDhwjZJ7vugV7dlIeCWHVjAkNF6ueZhW2ewkUhysW6AzIqvdH2eOFQpC5ZzQeNc5kG8wNeyNL-w4wbfjNgRzn78kGoXuS8lQPk9") },
        { id: 246, name: "XM1014 | Blue Steel", price: 0.05, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLpk8ewrHZk7uORaqh4JfSsAm6Xyfo4s7NrFnmylk114jiBnNn7cC7GaFcgC5pxEbZe5kTslYG0N7625laN2JUFk3tWvCSOkg") },
        { id: 270, name: "PP-Bizon | Candy Apple", price: 0.19, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzl4zv8x1I4M28baBSLPmUBnPemO105rI6SirhzRwi6zjWzd2uJCmfaFByApMiRbNcuxC_k9TgZb_qthue1dzUHyay4A") },
        { id: 273, name: "MAC-10 | Calf Skin", price: 0.11, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8n5WxrR1c_M2jaac8cM-QBmKTyutkj-1gSCGn2x92sWXWntytdHPDOlIlWZJwR-5csBS8k4K1Nuzn4QLa398UyCiq2CxXrnE8x1-1j1w") },
        { id: 297, name: "Glock-18 | Ocean Topo", price: 0.07, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1T9veRfKt9L8-fB2CY1aAj57loSirrwEpy4mjSztyqdiiQbFRyCcd2RLFetEG5wdbuMbu35Azflcsbmny2FqpB") },
        { id: 299, name: "Glock-18 | Death Rattle", price: 0.18, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1T9s2gbbZiJPmSMWuZxuZi_rc8Hny3zBsm5GuDnNeoeS3Da1cgWcRwFLQL5hbux4biZenm4gXbjY5bjXKpYXhaJyA") },
        { id: 301, name: "AK-47 | VariCamo Grey", price: 0.1, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wjFU6s24abZkI_GeAVicyOl-pK8_TXvhxh5_626Bn477dn-fbQcnXMZzEeMPtxe_w9DhY-OztAXc2IsT02yg2Vc0ERtW") },
        { id: 302, name: "AK-47 | Olive Polycam", price: 0.18, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wipP0OKhZL1SI_GeAViRyrohj-1gSCGn201-4G7dyo2oeXORaAIpCcFwTeEK4ELskNa0NeKxtVTXiItDySms3XxXrnE8JD9gyYo") },
    ],
    milspec: [
        { id: 9, name: "M4A1-S | Boreal Forest", price: 0.13, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_iKMWGf0-tlpN5rQDu2lBEYvzSCkpu3dyqVZgF1CJAhF7NYtULrlIa2M-Lh4wKMiYlDmyqrhygduCZs6-xXV71lpPMY7TF_eA") },
        { id: 10, name: "AK-47 | Safari Mesh", price: 0.24, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wjFL0P-re6xSNPGdMWuZxuZi_rIxSirkkElyt2qEzI2heXiTaVIiX5siROQJtxnul4XnYbvgswOMgolbjXKpnRk9Yjk") },
        { id: 11, name: "Glock-18 | Night", price: 3.17, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1I4M2gYaNlNM-fB2CY1aAmtOU-S33jwEwhtWvdzIr4cHvCPwR1DZdxQrFZt0bsloLjP7jg4VGMlcsbmvNarNNc") },
        { id: 12, name: "USP-S | Forest Leaves", price: 0.07, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSM-CsAmKR1-tlj-1gSCGn2xgh5W3Rwo2gcH6eP1IhWcYmTeYO4xTsw9TmY-mx5Q3a3ogQmSqsiCtXrnE8utrnVdI") },
        { id: 13, name: "FAMAS | Colony", price: 0.03, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3n5vh7h1I4M29eKVuJc-eD3WZz-tJvOhuRz39xExw5GXTw4qod3uUaQ91ApZ3QbMItxDrxtK2ZbuxtAaLg4hDxS76hjQJsHgze9LmZw") },
        { id: 53, name: "USP-S | Torque", price: 0.76, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSI-WsG3SA_v5kv-Z7SjqgnAsYvzSCkpu3cH2eZgcgD5cmTOQK5BftlobvY-zk4gCN2I4UyX-s3XhI7S4_supXA71lpPNCDDeLhA") },
        { id: 55, name: "USP-S | Stainless", price: 8.99, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSIeGsG3SA_v1isehnQyyghiIrujqNjsGqcHuVa1VxCcciR7MP50a5ktLuP-rr5ATXioJNyij93y0a7nlstboAT-N7rU1N1uE6") },
        { id: 56, name: "Glock-18 | Bunsen Burner", price: 1.02, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1a_s2pZKtuK6HLMWGcwONzo95rQzy2qhEutDWR1Nb7IC-TOw4hCZF5FOJe40W5lILlZLvktAHXiIJMyST_3XlIv3k94escEf1yWue1sjU") },
        { id: 57, name: "Glock-18 | Ironwork", price: 2.52, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1a_s2pZKtuK8-XD3WbjOh3vO1WQyC0nQlp5jmEmNaodH6VbwMnApshEOcPskOww4e0N-qz5lPZ2YlGyCSviika6zErvbhhWFzqpw") },
        { id: 58, name: "Five-SeveN | Capillary", price: 0.44, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3l4Dl7idN6vyRa7FSJvmFC3SV1-t4j_dsRieMmRQguynLmY79IinFbA90CZN2Q-Bc4UW6x9KyZLnjtQCMjo8WyXr7jy1O6Ck_sfFCD_SqR6qLvA") },
        { id: 59, name: "Desert Eagle | Oxide Blaze", price: 0.52, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7OeRbKF-JeKHMWKRxuJzj-JmXTu8kRgpjDGMnYftb32UPwJxDJokRuUIsRi_lNPhM7izsgXZi49GySiq2nxNuCdttbtUB_A7uvqAjSk2l_c") },
        { id: 61, name: "AK-47 | Elite Build", price: 2.2, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSLfGAGmKC2NF6ueZhW2e2wh9y5GjTztirdSqfP1dyCpclR7FZ5xe9wNbhZei25FGPjokXxC2vkGoXuQLr5jvs") },
        { id: 62, name: "AK-47 | Uncharted", price: 0.7, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSIeqHC2SvzedxuPUnFnCwwBl_5D_Syon8dnyUaQUlD5oiQ7ECuxW7l920ZL-w4AfX2IlByTK-0H0PRM7cOA") },
        { id: 63, name: "AK-47 | Black Laminate", price: 46.58, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wipC0POlPPNhIf2sDHCvzedxuPUnGnzjlh51sTyAzomrICnEbQByWcciTOQIsBG_m9LiZOLh7wfdi91DnzK-0H1Z7oynag") },
        { id: 64, name: "AWP | Acheron", price: 1.24, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf9Ttk4eetZKFsMs-ABXKczf1JouRtTSWmkCIrujqNjsH4eC-ROFMkDccjR7EDsBCxlN2xZu7jtlaNj4pMxSr8hiIc53tt67kHT-N7rafi4HxI") },
        { id: 66, name: "MP9 | Hot Rod", price: 227.45, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8js_f_Cxk_feqV6hkJ_iHQD7Cl7ou5rlsGyi2wBgh4WyDytmqcC6fbQAhC8chEeZZtRLrw4LlNLz8p1uJeM3XA-E") },
        { id: 67, name: "MP7 | Whiteout", price: 44.73, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8jsHf7i1k-PqnfKFiNeSsAm6Xyfo4teU9Hirmx0gh4GXdy9atInqfOAcgCscmRrNetxewl9HjP7_jsgfei5UFk3u-0OOK7w") },
        { id: 68, name: "Tec-9 | Ice Cap", price: 0.47, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLlm5W5wiNW0Oara5s0H-OWD1iDwOJij-1gSCGn2xtz5TjdyNquJX-XaVV0CMd3EOUP5Bjsw93uP77jsVHejohEyH6t339XrnE8zMglqPs") },
        { id: 69, name: "Tec-9 | Sandstorm", price: 0.76, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLlm5W5wiFO0Oara_1SM_GdCnSEzvx7j-1gSCGn2xsi52XSyIqueCifOAMnD8YkQ-YMtUPpwIK2N-jq4QSK2ohCm36q239XrnE8IX2h_4o") },
        { id: 70, name: "P90 | Desert Warfare", price: 2.23, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XuWbwcuyMESA4Fdl-4nnpU7iQA3-kKnwpHIVvfOsPfI9dqDCWDDGkb4j5OU_Fy_kx0l1tj6DnoqseC2TP1cpAsF2QPlK7EcMYXqtDg") },
        { id: 71, name: "XM1014 | Frost Borre", price: 88.48, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLpk8ewrHZk7v-RY6piNOOsHW6c1-tkj-1gSCGn20V05W2Dw9v8ICjGbQMkWJd4TedZtRGxkNDnNOjqsgGN34MXxX76jH9XrnE82FMLyIU") },
        { id: 72, name: "Sawed-Off | Yorick", price: 0.42, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLin4Hl-S1d6c2pe5t-IeeWCmiWx9F4teJ7QCSymx4ioQKJk4jxNWWTaQEnXsR1QOUItBC9mtTgMenntVCKjY4RyS79jy8b6iw5susEBfYs5OSJ2HUgdoR1") },
        { id: 210, name: "P90 | Module", price: 1.29, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf_Cxk_f23aahvLPWWClicyOl-pK8_Sn_rwE1x5z6AyY6qeXmRb1cgWMNwR7Ff4Bm_m9y0Przq4A3b348Q02yg2QQMyM9M") },
        { id: 228, name: "P2000 | Royal Baroque", price: 0.49, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL5lYayrXIL0OG-bZt-I_GBCFiA0-d4pN5lRi67gVMk4GzVzNz9I32RawMoD5shR-ZeuhGxwIeyNuPntgWIjt5Ani33jC0Y8G81tMIEN1xi") },
        { id: 235, name: "R8 Revolver | Blaze", price: 5.95, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLjm4Dv8TRe_c2vaZtrLPGeC3SvzedxuPUnTCznkR9xsGiHzomgIn-UPwN1DZZyELNe5xDrlNTgY-jm5FeM3tkUnDK-0H3jUXrCJQ") },
        { id: 238, name: "Dual Berettas | Tread", price: 1.12, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL0kp_0-B1c_M2qfaVhH_KWHGKE1e9lj_V7Sii3qhEutDWR1NmhcnPEPA92CJBxQeUNsha-ltC0ZOnltQHfjI1Gn3r7jy9N7npvsb4cEf1yGJF-WOQ") },
        { id: 247, name: "XM1014 | Quicksilver", price: 0.64, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLpk8ewrHZk7uORcKk8cKHHMXSZxuJ3j-1gSCGn20oksGTXy4yrIC3GbwYpCJF1RuQMtkG-koCyNO22tVSIiY1GxXn6iyhXrnE8nW2Det4") },
        { id: 252, name: "Sawed-Off | Lunar Wyrm", price: 0.29, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLin4Hl-S1d6c29abNoJP-VCFic1OB3ot5-Vju-qhEutDWR1I6hJ3yePQUmDZMkRuFbthO8x9HuNuzl51be3Y8RxX3_iygfu3pqte0cEf1ywsMSGOc") },
        { id: 255, name: "M249 | System Lock", price: 0.7, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8zMK5wiFO0P_8PP1SM_WYGmiC_uJ_t-l9AXzhzEt25Wjcn4n4dHKebgMlCMB2RO5b40S-x9TnN-KztFDf3ohDzirgznQedTUXMuU") },
        { id: 258, name: "Negev | Man-o'-war", price: 0.37, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL_m5Hl6x1a4s2gbaNoNs-UAmiC2NF6ueZhW2fikBh352vQyt-sI3mRbQ8lDJpxTLVfuxC5k4W0MLvm5VfeithHnij5kGoXuSdORNFb") },
        { id: 261, name: "SCAR-20 | Blueprint", price: 0.46, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLinZfyr3Jk7OeRaqh4JeCBB2mE_v11sfNWQyC0nQlp4jvQn92oJX-VaVIgW5QkQuYM5kLswNTnNL-w4QaK2YNFmXqqjSxJuzErvbi8Z0332w") },
        { id: 267, name: "SSG 08 | Hand Brake", price: 0.94, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLijZGwpR1c_M29e6M9eM-QBmKTyutkj-1gSCGn2xtwtzzWmNagIH3CP1V2C5dxR7QLsES_m9PvY7nj4QPd2ohHy3r4hypXrnE8MesmkS4") },
        { id: 298, name: "Glock-18 | Winterized", price: 0.11, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1c_M2pZKtuK8-WAm6ExNF1sexmcCW6khUz_W6Azdn6eCrBalcjXJpzE7EO5xa_l4DuNu6ws1Hb2IgUn32si39B5y11o7FVC5qcAFg") },
        { id: 300, name: "Glock-18 | Off World", price: 0.33, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1Y-s2pZKtuK8-aAGOZxuFJvOhuRz39xRly4WSDm4z9dHvCOg8iC5pxQrZethbsk4C1MbnnsQTag4pFyy_9hzQJsHjSW_TM0g") },
        { id: 303, name: "AK-47 | Wintergreen", price: 0.88, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wjFU6s2jbbBsLPyaDViX0-tzvt47cCW6khUz_W-Ay96seSrBaQcnDJRyTbMDuxTsw9bmNLy0sQPb34JNyn_-jS9N6n51o7FVK4Nkj6A") },
        { id: 304, name: "AK-47 | Steel Delta", price: 1.77, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiVI0POlPPNSM-SBAWmV_uJ_t-l9AXqyk0hy5GWEyduhdC2TPAEjDptzQbRf5EHrmoWyZu22sQLciokQyyzgznQesAEGx_A") },
    ],
    restricted: [
        { id: 14, name: "AWP | Pit Viper", price: 0.99, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf9Ttk_PyvY6F-K_mdMWuZxuZi_rQ_GS3mxRwk4jvTyNv6eC-RPQV1W5AlTOZb4xLtw9fuNriw51Hd3otbjXKp4cSTTIs") },
        { id: 15, name: "M4A4 | Magnesium", price: 0.52, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiVI0P_6afBSI_icHneV09FxuO56Wxa_nBovp3OAzo2vdHPFPFUmCJRxRbNZ4xewx9W1Nb7j4gzXg99Ayy73iC1Aun1q_a9cBiEfMG3G") },
        { id: 16, name: "Desert Eagle | Cobalt", price: 103.94, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7v-RbKB9IeSXC2mDxNFmteBqQCq4qhEutDWR1I36c3OVbFQjDcRwR7EO4EW-x4HvMumzswfWjd8XnCn2iShM53s5t-0cEf1ycu8KccY") },
        { id: 17, name: "P90 | Trigon", price: 8.69, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf_jdk_6v-V7B_KfecAFicyOl-pK9vGi3nlEt24GnSwoypc3rFbQ52XsN0EOFcshfuwYa1NbzktVTZ3ohN02yg2RSFidN_") },
        { id: 18, name: "AK-47 | Blue Laminate", price: 50.99, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wipC0POlPPNhIf2sDGuFxNF6ueZhW2fhzE5_5G7dnt_7JXufa1J0DZAkE-cKtBaxl9WzPuyz5lDY3YpAzCn9kGoXuZPu7T4u") },
        { id: 73, name: "AK-47 | Rat Rod", price: 5.59, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiVI0POlPPNSLvmRDGuV09F6ueZhW2fklBx362TTnN36dHiRa1AmW5QlQuVftxO9k4HhZuvksVDc398Rzy32kGoXuR34FNLu") },
        { id: 74, name: "AK-47 | Orbit Mk01", price: 35.41, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiVI0POlV6diLP-dFzfB_vxztN5lRi67gVMk4TmEn9n_c3PGPwZyDMckTO8JsEPuktG1ZOrjsgPX2IwUyiyv3S0f8G81tLnuvOvF") },
        { id: 75, name: "AK-47 | First Class", price: 101.84, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0PW8baFjH_yWD3OYxPxJseo9GBa_nBovp3PXmNmpdymUZwMnX8EhEeBbtBnrk4LjZLzi7wbe3opNmCn8iH8YvX5i_a9cBikeWj5H") },
        { id: 76, name: "AWP | Phobos", price: 2.24, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf-jFk7uW-V7RlL_KcHVicyOl-pK84GXHmwk115D6GzdqudHyUbwRxW5R3ROZbtEG8wYDiY7-x5VOKgotB02yg2bdJjfAf") },
        { id: 77, name: "AWP | Pink DDPAT", price: 25.75, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf9Ttk6_a-abBSMPmdBVicyOl-pK9qHXC2zUpz5DiBn9arJCmXOFd0DZpxQOUDtBC6wNK0MOzl4wXWjYpG02yg2c9nQ1pb") },
        { id: 78, name: "USP-S | Cyrex", price: 4.64, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSI-WsG3SA_u1vouRxcCW6khUz_TjdzdmsJyiTZg8kX8N4ELUP5EPsw9G1YeLn5VTXjY0WxS6rhiIYuCd1o7FV2N83Spg") },
        { id: 79, name: "USP-S | Overgrowth", price: 22.76, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSKOmsHW6VxutJsvNoWSaMmRQguynLytyqdy2eaVUgAsB0QeIIsxfuldy2MO3gtFSI2ooRzSiq3HxA7SlvtfFCD_RGjmYWyQ") },
        { id: 80, name: "Glock-18 | Steel Disruption", price: 15.39, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1a4s2qbLRsNPSWAHSV_v1_vPdsXRa_nBovp3PWmYuhdnyebAdyWJUjE7ResBC6xoXhZe_j7w3Zid1Aziio3SlI5iw__a9cBqG4HP4O") },
        { id: 81, name: "Glock-18 | Weasel", price: 1.31, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1Y-s2pZKtuK6HLMXCVwP1zvN5lRi67gVN_4j7Qzdj8dimQblQkX8YkTeNe5Bmxkd2zNr_j5QbdjthCzX-qjylI8G81tDMJpR5Y") },
        { id: 82, name: "Glock-18 | Dragon Tattoo", price: 92.67, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1a4s2qeqVqL_6sCWufwuVJvOhuRz39xUl-6miDzI37dHyXOlIkA8MmROVfshO9w9G1Ye-ztgPX34tEyi74jjQJsHi_DRfxVg") },
        { id: 83, name: "Desert Eagle | Heirloom", price: 6.22, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7uORbapqMvGFC2Ovxet3t-1scCW6khUz_W3czNegeXueO1N2WZIkE-RY4EGxlNSxZLnn5gfai4oTniSoiStA6y91o7FVItTkIhw") },
        { id: 84, name: "M4A4 | Evil Daimyo", price: 3.88, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afBSJeaaAliUwOd7qe5WQyC0nQlp4GqGz42ucCqXaQMhDpd4R-AIsxK6ktXgZePltVPXitoRn3-tjCgd6zErvbijVJZd2Q") },
        { id: 85, name: "M4A4 | Spider Lily", price: 9.99, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiVI0P_6V6JhL-eWHHSvzedxuPUnHXiwlk4lsTvUz477ICiRPw52WJNxROICtxK-wYDhZejm5gCP2I9MzjK-0H1trtkVHA") },
        { id: 86, name: "M4A1-S | Flashback", price: 4.73, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_OGMWrEwL9Jtu1oXCGxlB4sjDGMnYftb3yVPQFyDMB3EbJZ5xC4kNPvMOO35AHW3d1AnC_3iHlNuytqtuYDVfI7uvqAZWXE-YM") },
        { id: 87, name: "M4A1-S | Night Terror", price: 0.64, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_eAMWrEwL9lj-hnXCa-mxQmjDGMnYftby3FPFVxA5ZwRecOtUXuxtPiNL_jsQLc2NkTzS38jC5L7ydj5u8EUKo7uvqAgGSM4LM") },
        { id: 88, name: "M4A1-S | Icarus Fell", price: 643.43, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_iKMW6TwPxjo95lRi67gVN_smmHyor9eHyUZwImDpJzEeZf4xS6kN2zY77i7wPdjtgXn3msin4b8G81tDwr8lc2") },
        { id: 89, name: "P90 | Neoqueen", price: 0.41, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf-jFk_6v-V6poL-GGC2Ke_uJ_t-l9ASyyxhl04zuDn4muInOXPAF2W5shQOAMs0G7xNfkZOuwswbej4JDnyvgznQe6S6_YqA") },
        { id: 90, name: "P250 | Nuclear Threat", price: 55.99, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwjFL0Py7Y6F-NOKaHmKvxvxzte9WQyC0nQlp5mrRztyuIy3GbQF1WMN2QbFetBfulNbnPruz7lGKit4UyS6vjn9K5jErvbiRPSOzZg") },
        { id: 91, name: "Five-SeveN | Neon Kimono", price: 518.38, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3l4Dl7idN6vyRYL1SK_meAWmf_up_sexmQS2gqhEutDWR1In4di-TagIkXMMiF-Vcthm5kNbvML604Ffdgt4WzCj22ikau35q4OwcEf1ySWJgvKc") },
        { id: 92, name: "SSG 08 | Death's Head", price: 23.97, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLijZGwpR1Y-s29e6M9eM-XC2aEyf1-teBtcCW6khUz_WTXyNipeX-QOlQhXpJwFuYO4xLqxobuN7vn4QaNgthBnHn7iSJPv351o7FVSPuLyfc") },
        { id: 93, name: "UMP-45 | Arctic Wolf", price: 0.47, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkk4a0qB1Y-s27ZbQ5dc-EBm6ExNFwse9ucCW6khUz_WiGzY6pJyjCZwN1A5p5Q-MCuxa7ldW0Ne3ntQHW2YpFmSv63S1B73t1o7FVFkKgM50") },
        { id: 94, name: "MP7 | Neon Ply", price: 2.69, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8jsHf_jdk4uL5V7ZoMPyaDWavzedxuPUnGS2wzBglsm6AnNyqJHLBOAdyCZV0ELIN5xC6kNThY-jqslbbid4WyjK-0H0WWbSZ_g") },
        { id: 95, name: "M249 | Emerald Poison Dart", price: 1.43, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8zMK5wjFL0P_8PP1SJuKcCVif0-dxue9oQxa_nBovp3PRzNb8JX2VO1IpDsclRrEPtxXtxNSxYuuw4QHai9gWyCT2j3gYuHlt_a9cBlcR8wa2") },
        { id: 96, name: "MP9 | Ruby Poison Dart", price: 1.86, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8js_f_C9k4uL3V6pkNOKcCWKe_uJ_t-l9AXzhkEsm527Xy9r_JynEP1IiWJZ3FOYP4xTqmtznNO-34VCKiYJExSjgznQeVzj6siQ") },
        { id: 97, name: "Nova | Rising Skull", price: 4.47, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL_kYDhwiFO0OGlfahhH_6cGGavzedxuPUnSSy3wEV-4miHyt__eHKSOA4pA5JxE7UJ5kO9l4HmZuixtgHZgoMTyDK-0H1FVu2S0A") },
        { id: 211, name: "MP5-SD | Gauss", price: 0.64, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8jsPz-R1c_M2jePF-JM-SHXOCzuN3pOhqcCW6khUz_WzTzYmhJXuSaANzW8EkQ7JZ4BjsxtSzYezr5lbfidlEzC-vjnxK7ih1o7FVYPX5q0o") },
        { id: 212, name: "MP5-SD | Lab Rats", price: 2, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8jsPz-R1T9s2iaaZ_IeSsA3fF_uJ_t-l9AXrhxh4l5G_Um9eoJX6WaAVyXMN1RbYM5Bi4wN21Yuq0swTdidhMzSTgznQed7nbwhE") },
        { id: 213, name: "MP5-SD | Kitbash", price: 0.46, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8jsPz-R1c_M2jePF-JM-ED3SExOJ3vuVWQyy0lB4-jDGMnYftb32XZ1NyX5B5QuJcthi7k9K0Ye6zsQeP2IMRyiX4iSJLvC5q6-4HUaY7uvqAsG-atjE") },
        { id: 214, name: "P250 | Digital Architect", price: 52.73, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwiNa0OSrerBkJ_-UC2ivz-t5vt5lRi67gVMk4mXQntr7JC_GPQNxApFxF7NethXqktfvMuLktAaKjd9Cyy_9iH8f8G81tGeD0jsi") },
        { id: 217, name: "AUG | Lapis Lazuli", price: 3.2, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwi5Hf_Ddc0P6veK1-H_ySFHKcyNF6ueZhW2frwkUi426Dw9asIHuSbQZxA5VyQ-MPsxjtkNexMOnk4QCL2YxByCn5kGoXuRkVR5wo") },
        { id: 220, name: "SG 553 | Tiger Moth", price: 1.32, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLimcO1qx1c_M29b_E4c8-HB2CV09F7v_VhcCW6khUz_TnWn9n7cyqRPQ52DpN3QLEPshjrw9zlY-jjs1bWioMQxSj8hyxJu3l1o7FVwqXqqnE") },
        { id: 221, name: "SG 553 | Bulldozer", price: 190, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLimcO1qx1I4M23bahhL-esAm6Xyfo44rZsF3jmwU53tmyDzYv6cHnCalQhXMckEe9Y5kXplIC0NrzrtAfcipUFk3th3T45rw") },
        { id: 223, name: "Galil AR | Crimson Tsunami", price: 2.19, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2n5rp8SNJ0OG-V6NsLPmfMXCR1-tJvOhuRz39x0Qm6mjQzo6qeHLGOg8nXJUiE-UKtxa5mtPgZu3rtFGMiIwXxH-viDQJsHh48m4KFg") },
        { id: 226, name: "FAMAS | Pulse", price: 9.39, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3n5vh7h1Y-s2oaalsM8-DG2uDxNF6ueZhW2flxBlxtm_WntqhJyiSbw90CpJyR-8DtRm6kdHkYuLj4QzY2INCzX-skGoXudLVHKnn") },
        { id: 229, name: "P2000 | Obsidian", price: 5.02, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL5lYayrXIL0PG7V7Q_cKDDMWiS0udyueBncCW6khUz_W7QzNf4eHKUPA9xDMAkFrMJ40brldGxM-rk4lfago1MzXmrjCwYvC91o7FVDbVY3kE") },
        { id: 232, name: "CZ75-Auto | Hydraulics", price: 2.4, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLyhMG1_B1Y9aX7V6x0JOKSG2uZwv1JvOhuRz39kE135DzRyN2hIHyea1AkA8BwTOYJ4RG6kNzlZOm0sgXX2doRmS6riTQJsHilInmzoA") },
        { id: 241, name: "Five-SeveN | Boost Protocol", price: 5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3l4Dl7idN6vyRb7dSJvmFC1iDxPhzvt5sSTygnBIpjDGMnYftby7FalV1D5QhE-EDthW8xtCyPu63tFPciYhBynn_jykfuCttte4CA6E7uvqAn_5lxU8") },
        { id: 244, name: "Nova | Clear Polymer", price: 4.02, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL_kYDhwiFO0PyhfqVSMP-fF2qV09F6ueZhW2exxkR-tmWEmIyoJXyWZw4iDsclROVftxm7wIe1NbizswPe2YlHmCuvkGoXuVU3K7Ec") },
        { id: 250, name: "MAG-7 | Core Breach", price: 1.54, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8n5G3wipC0Py7a6hoIeKsBmiEzvx3vuZscCW6khUz_WzdnoyvIHvGPFJzD8B0QrINshPtw9fmYunrsw2PiNlEnC_5iy5L5y11o7FVg__4LKQ") },
        { id: 253, name: "Sawed-Off | Highwayman", price: 1.44, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLin4Hl-S1d6c2veZt-IeeWCmiWx9F0vOBqRC68mRkYvzSCkpu3dXuVaQchCMRwQeJYsxaxl9W0N-nrtVeMid4XyHn53XtN5n5st-xRU71lpPM2tqJ-2A") },
        { id: 256, name: "M249 | Aztec", price: 0.56, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8zMK5wiNK0P_8PP1SIeqHC2SvzedxuPUnTirnwEslsT6Gzd2sJHLCOlUpWJohE-MMsxW6l9GxPuy24AyL398QnjK-0H18Ww4Zdw") },
        { id: 257, name: "M249 | Nebula Crusader", price: 1.38, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8zMK5wiVI0P_8PP1SLvWRG2uR_u1kpfJoSyyhqhEutDWR1Ir_JSiXOgciDJN4RucCsRW8w4KyZu_q5FeLjN4RnCmt33lP7nxv5-wcEf1yLX15hXE") },
        { id: 259, name: "Negev | Loudmouth", price: 0.96, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL_m5Hl6x1Y-s2gbaNoNs-SAGmZyed6sfVmXRa_nBovp3PXzousdnrBbgEiX5QjTbICsEa7ktTnNOPrsQLW3YoQyS33jygbuHts_a9cBgJfeVOc") },
        { id: 260, name: "Negev | Power Loader", price: 1.45, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL_m5Hl6x1Y-s2gbaNoNs-aA3eRwvpJvOhuRz39lE914j-HyYmscHLBZ1J1X5NyEbYI5Be8k4DmYuzh4AGIgo0QzSqs3TQJsHgPf9N5RQ") },
        { id: 262, name: "SCAR-20 | Powercore", price: 1.21, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLinZfyr3Jk6OGRe6dsMqLDMXef1utks-57Sha_nBovp3OAzd2qIy_DPVMkXMEiE7UL5ES-l9yyP76wswWP3Y1Nyyn2i35L6S5s_a9cBj_cXeyl") },
        { id: 265, name: "G3SG1 | High Seas", price: 0.86, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2zYXnrB1c_M2pO7dqcc-RG2STwOBztfNWQyC0nQlp4j7Syt-rdHPEOAIjCpV5TLQK40K5wdLjY-_r7wfeio1AySiriCIf6DErvbj1Mwus0A") },
        { id: 268, name: "SSG 08 | Ghost Crusader", price: 1.31, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLijZGwpR1c_M29e6M9eM-SHGqRwuFktd5lRi67gVN_6jnQzYmhc3jFbgUoA5J3ReYIsRO8ktGyM-iz4AaMi4hDzyqsiSJJ8G81tKe_wmAg") },
        { id: 271, name: "PP-Bizon | Osiris", price: 2.13, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzl4zv8x1Y-s2sYb5iLr2cHW6CyP1JvOhuRz39xUxx6jiBz42rIHjBbAcnWZcjROcJsxjtmoXmNe_k5QHajtlNyC2r3zQJsHh050JUDA") },
        { id: 274, name: "MAC-10 | Heat", price: 3.01, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8n5WxrR1Y-s2jaac8cM-BC2OYzvpJvOhuRz39xR5w4GzUyo6pdnuUawMpWJokTLUL50K6l9XiNO7i4lGKiYsRxCv6jTQJsHim4lDW8g") },
        { id: 277, name: "MP9 | Rose Iron", price: 9.32, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8js_f_C9k-_qheqp0H-KcHWKvzP4vj-1gSCGn20h0423Wn9qoJH6QOwNxXpRxQOQLtEHumtTvP-i05wyMjN5Hz3qtiy1XrnE8Sl7QOgI") },
        { id: 280, name: "MP7 | Special Delivery", price: 1.2, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8jsHf_jdk4uL5V6dhIeOAB2GZxOpJvOhuRz39xRhytjuBm9n4d3yXbQF1XJAhQLID4BTskobhZb-35wXZ2toTySz2jTQJsHhDRFQUDw") },
        { id: 283, name: "MP5-SD | Autumn Twilly", price: 8.8, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8jsPz-R1T9s26eqVkLvGBDW-Z1et1pN5lRi67gVMj5DiAw9avcn-XOlQoDMEjFrYOsETpkIfuYb-x7gaNj9pMzX74inwb8G81tAuAxr4i") },
        { id: 286, name: "UMP-45 | Grand Prix", price: 1.26, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkk4a0qB1a4s27ZbRSMvGQC3WvzOtyufRkASjjxU1x42nVyo2rdnKQbA9xX5ohRrYMtBntmtW1N7zj5lDZgthFzC3gznQezoUeLLY") },
        { id: 289, name: "P90 | Attack Vector", price: 7.87, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf_jdk__2icZt7Kf-fC3Ov0bcmj-1gSCGn20QhtW_Vm9r8InmVbFJyDJMkE-IJsEOwm9G1Mu3jswSP2t1Hyy-s3yJXrnE8K5R_WCY") },
        { id: 292, name: "Tec-9 | Avalanche", price: 2.32, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLlm5W5wiFO0Oara_1SIeaSAmaewuZzj-1gSCGn20Qi4m_cwtv8dy7Fbg8kXptyRuMJtEG4kdDuN-jq71ffj90QxCT22HxXrnE83F92lc4") },
        { id: 295, name: "Zeus x27 | Charged Up", price: 2.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLln4Xl7x1B6ue9V7d5If6XD3WU_udlo_RscCW6khUz_WXcntv8InLFbwckWJV4ReJZuxG5lNzlMb7r51bfj99EzHmsjSxA6Hl1o7FVTY6aVfU") },
        { id: 308, name: "AK-47 | Slate", price: 4.6, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiVI0POlPPNSMOKcCGKD0ud5vuBlcCW6khUz_W3Sytb4cCqTOFUpWJtzTOUD5hPsw9a0Yrnrs1SK3ooXzy6shilM5311o7FVYrIufmI") },
        { id: 310, name: "AWP | Worm God", price: 2.53, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_DNk7uW-V7B6Kf6WMWuZxuZi_uRoGH3iw0wh4j7cnt6ucSqSZwUkCMB5TLIPsES_kNbuYeOwtgXai4NbjXKpZ4kj0o0") },
        { id: 311, name: "Desert Eagle | Blaze", price: 700, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7vORbqhsLfWAMWuZxuZi_uI_TX6wxxkjsGXXnImsJ37COlUoWcByEOMOtxa5kdXmNu3htVPZjN1bjXKpkHLRfQU") },
        { id: 312, name: "Glock-18 | Fade", price: 1637.95, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1a7s2oaaBoH_yaCW-Ej-8u5bZvHnq1w0Vz62TUzNj4eCiVblMmXMAkROJeskLpkdXjMrzksVTAy9US8PY25So") },
    ],
    classified: [
        { id: 19, name: "AWP | Redline", price: 48.4, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6diIuKSMWuZxuZi_rUxHS3lzUwm5DjWy976dSiRagd1WJB1RLQP4RK-mtazM-3itQeL2INbjXKpw2eVIZ0") },
        { id: 20, name: "M4A1-S | Atomic Alloy", price: 41.38, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_GeMWrEwL87o95oQyW8jCIooTyLnYrGLSLANkI-D5d2FrENtRG7wNDvZe-3slfci9pFmHj8jSof6yZjtugEB6QtrKTXhxaBb-PhITXxPA") },
        { id: 21, name: "AK-47 | Redline", price: 44.99, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSI_-RHGavzedxuPUnFniykEtzsWWBzoyuIiifaAchDZUjTOZe4RC_w4buM-6z7wzbgokUyzK-0H08hRGDMA") },
        { id: 22, name: "USP-S | Kill Confirmed", price: 68.67, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSI-WsG3SA_uV_vO1WTCa9kxQ1vjiBpYPwJiPTcFB2Xpp5TO5cskG9lYCxZu_jsVCL3o4Xnij23ClO5ik9tegFA_It8qHJz1aWe-uc160") },
        { id: 23, name: "Glock-18 | Water Elemental", price: 17.95, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1Y-s2pZKtuK72fB3aFxP11te99cCW6khUz_TjVyompc3-QOFR2DJQkFOMJtBbqk9LlY-7n5QLZjtkTxCWqhixPv311o7FVIf8eASQ") },
        { id: 98, name: "AK-47 | Jet Set", price: 316.71, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0OWrZKhSNOKSGGKcxOpJseo9GBa_nBovp3ODydescy_FbVcoDZMkReYP4xC8w93jY7u35AeK2IhMmC__2itN73pv_a9cBpGGBr1j") },
        { id: 99, name: "AK-47 | Point Disarray", price: 14.16, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSMP-aAHOvxedlsfN7TjCMmRQguynLnIz_dXnEbFcoDsNzQLMN40S7mte0Zuzl5gbY34JEnnr52ChA7ytisPFCD_Rw7udDlA") },
        { id: 100, name: "AK-47 | Hydroponic", price: 1287.33, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiNW0PCvZaZiL8-ZG2mXzetJvOhuRz39lk0m4Dncztz7Jy2fagIoC5t5QeNbskW6xNLgZu-24AXZgt4Xyi_4izQJsHjOr8RS6A") },
        { id: 101, name: "AK-47 | Case Hardened", price: 237.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiNK0P2nZKFpH_yaCW-Ej7sk5bE8Sn-2lEpz4zndzoyvdHuUPwFzWZYiE7EK4Bi4k9TlY-y24FbAy9USGSiZd5Q") },
        { id: 102, name: "AK-47 | Ice Coaled", price: 4.42, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSI_-UGm-Zz-llj-1gSCGn2x4l5z_RyNj6JXnEbgFzXMYjEOUIsBe5m9exP-zg4leMj4pGxXn7jCJXrnE84asPq_0") },
        { id: 103, name: "M4A4 | Desolate Space", price: 16.29, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afBSJPWAAWuR1etJo_FoTCyMmRQguynLnNepJXPEaQJyDZJ0QOdbsxi7ktS0Y-Li4ADegthGn32ojCJJ7CxosfFCD_SyjfEkHg") },
        { id: 104, name: "M4A4 | Cyber Security", price: 16.1, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afBSI-mRC3WA1OB9j-1gSCGn2x9-527Tyt-pcnyUagQlW5JxEOIOuhjrw9XlMrixtQTd2NhNmH_5jCNXrnE8Cu1wa6c") },
        { id: 105, name: "M4A4 | Hellfire", price: 140, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afBSKPWfAmGZ0-tJvOhuRz39zEp24GTXmImsInqWP1AkXpBwE7FetUTswdfkPu7h5QXXithBy32t2DQJsHhDPmtuAA") },
        { id: 106, name: "M4A1-S | Control Panel", price: 29.09, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_eAMWrEwL9lj-55SjuygRI1jDGMnYftbynDbQBzDcR3ROMI40Hpmt3kP-y271OK3tpFmy7633hJ73xit70GBPE7uvqArjH2yek") },
        { id: 107, name: "M4A1-S | Decimator", price: 12.48, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_eAMWrEwL9JtORqRiSygRI1jDGMnYftb3iUb1dxW5ImFLNftxCxktflZLm2tgaP2otGyn_-hytOvy9q5elQV_A7uvqA6CRSoZY") },
        { id: 108, name: "M4A1-S | Nightmare", price: 9.66, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_OGMWrEwL9lj-9gSCGnmBw1tgKJk4jxNWXCbAUpXpp0FrYPthC7k4fnZOm04laMjYxHn3r52HxJ6i065e0FVKV05OSJ2IHiKyzQ") },
        { id: 109, name: "M4A1-S | Blue Phosphor", price: 690, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_GeMWrEwL9lj-NlWiygmBIstgKJk4jxNWWeOg5xDJR2Q-5b5BGwxIDuP7uw4ALa3ohMz3n3iypLvyc55-pQUKct5OSJ2OKlF5Nn") },
        { id: 110, name: "AWP | Corticera", price: 30, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk6fO4bahsH_GEHlicyOl-pK8xTSzqwU1-5jjWno6hJHyeOg91A5R2TOEOtRS-kIG2ZeO25lDYg90U02yg2USK57Qn") },
        { id: 111, name: "AWP | Electric Hive", price: 49.99, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf9Ttk5_u4bZthKfebGinElLtytLVtG362x05wsWyByt2scHrGOgd1WZJ1ROBc4xi_ld3gNO7g-UWA3Kwc2RVq") },
        { id: 112, name: "AWP | Fever Dream", price: 12.67, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V7R-OfObAXeR1eZJvOhuRz39kE1w4jiAzNiod3qTOgcgXpAlQ-ML5hjqxtHjZOrrtlHWit9EyCj9iDQJsHhCZP-wUg") },
        { id: 113, name: "AWP | Mortis", price: 3.64, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf-jFk7uW-V6BoIeSbMWuZxuZi_rNtHiuwwRwismWEnNn8JymSZgUiDpd3Ru9ZsxG-xNy2NLzn41DWg41bjXKp5oOAt0A") },
        { id: 114, name: "AWP | Silk Tiger", price: 160.46, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_C9k-_upbbZ-H_KfG2KvzedxuPUnTXywkU1x4DvXztz_dH2WZlQkXMEhFrFY5BDrm9HhMurq4AfdiYxAnDK-0H0fPMTeBA") },
        { id: 115, name: "Glock-18 | Vogue", price: 3.78, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1Y-s2pZKtuK8-WF2KTzuBiseJ9cCW6khUz_T-GyNavdCqRawN1CMFwTOcO5hO7loXiY-zmsQKPi44QzHj22ikcvy11o7FVfFOBmfY") },
        { id: 116, name: "Glock-18 | Twilight Galaxy", price: 185.63, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1a4s2vebFsH_afC2Sb0tF6ueZhW2e3zR9-5mjcztv8cnjBbQMiA8ZzFLUKtBbsl4LuY77q4AHdj4pNmCz-kGoXudhVSAZp") },
        { id: 117, name: "Desert Eagle | Conspiracy", price: 18.27, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7OeRbKFsJ_yWMWaF0-tjo95lRi67gVMk4WTSm9moI3-QPVBxDJByQOJe40O6k4fnM-zgsQXci4gUyH3_3CMa8G81tJHuULJI") },
        { id: 118, name: "Desert Eagle | Kumicho Dragon", price: 19.21, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7uORbKF-JeKHC2aXzetJu_RkRiq7mhk1sjqKlLD1KCzPKhh0CcBwQLVe5BHrloKyZOnr5w3XiYhDnC39iCpK7X1psrlUWaFw8qXekUifZlV_fDVZ") },
        { id: 119, name: "USP-S | Orion", price: 48.96, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XuWbwcuyMESA4Fdl-4nnpU7iQA3-kKn17jJk_PuibapuJeLdWGLFwL8i4eVsFiqxxUt34jmHnoysJ3qVOAYgCJZwQrRb5EPul4XlYvSiuVIHgy4Xvg") },
        { id: 120, name: "USP-S | Caiman", price: 31.58, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSI-WsBWaZzO94j-1gSCGn20t-4WyBn4mocC6XbVN0CMB2RLYMsUG5x9DgN-20tQSNiI1GzS2q3XtXrnE8NAiGp64") },
        { id: 121, name: "USP-S | Cortex", price: 3.71, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSI-WsG3SA_u1jpN5lRi67gVNz4G7Qm938cS_Da1AhXpB1EeVb4xm4mtDjN7vj4A3b2NpGyCr52i4Y8G81tMzdoYZ7") },
        { id: 122, name: "USP-S | Serum", price: 47.23, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSIf2sC2uVwvpkueJWXSy3qhEutDWR1I34J3uXOwFyCsF4TeAJt0bpw9OxNrzh7gyI3t1DmHiq3y5M6HxqsrwcEf1yfEp4lzc") },
        { id: 123, name: "P2000 | Imperial Dragon", price: 10.96, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL5lYayrXIL0PW9V7Q_cKDDMW6d0etkueBlcC2hlBoovQKJk4jxNWXEbAQmDsQmRbNYsxGwxoC1YrvrsQXXg40QxCX533tJ7Xs-4eYKWKAl5OSJ2JuLIVNl") },
        { id: 124, name: "P250 | Asiimov", price: 11.75, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwiFO0OL8PfRSIeOaB2qf19F6ueZhW2fixx53tWqEm4ugeXuebQN0CZJyRrMJuxm4loCyPr_i51TfjtgXzi79kGoXuUXmUJzm") },
        { id: 125, name: "P250 | Muertos", price: 11.99, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhzMOwwiFO0OL8PfRSLfGdCmacwNF6ueZhW2e1lh51sm3UmN37cHuUbQQhXJtwQO4C4BXsxtHjM-624A3a2IoWySiskGoXuSIJMqiP") },
        { id: 126, name: "P90 | Cold Blooded", price: 71.79, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf_C9k_P6nfKxoMs-DVzevzedxuPUnSivqkBt_5m7Rw9v8cXmTZ1UjX5Z5EOEIuhK8koHuNe7r51fYjt4XyDK-0H2E4aJrDg") },
        { id: 127, name: "P90 | Emerald Dragon", price: 109.58, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf_jdk6-Cvb6tjH-DKXliS0-9gv95lRi67gVMm4m3Vzdmqci-SO1clX8Z1QeYO5xi5mtTuPu7l4FDc2o4TmH32jC1P8G81tLxM49od") },
        { id: 128, name: "Tec-9 | Fuel Injector", price: 10.93, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLlm5W5wiVI0Oara_1SM-WDC3WTye9kt-RtcCW6khUz_Wvcy9qgdCnEPQ8hApBzRrQJ4RW7moDgMLzktFDZiI5HnyWr3ChN5yp1o7FVg4hNKG8") },
        { id: 129, name: "Five-SeveN | Monkey Business", price: 11.48, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3l4Dl7idN6vyRa7FSJvmFC3SV1-t4j-NoQSi9lCIrujqNjsGheXmXPQcoWMFzEO5ZtUOwkILjY7yzsg3ci91DySiohn4buCht4eYET-N7rZVO80Su") },
        { id: 130, name: "R8 Revolver | Llama Cannon", price: 9.51, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLjm4Dv8TRe_c2pe5t_eM-fAmadwO13vu9mQRa_nBovp3OEz9n7JH-UPwEoA5t2TLFYtBmxlNzhYuOztgHZjo9Mzyqq3C9O63o5_a9cBr5nn1G8") },
        { id: 131, name: "R8 Revolver | Skull Crusher", price: 7.76, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLjm4Dv8TRe_c2tfZt_JeacAnGV09F5oPF7Sjqgmg8YvjiBk5r0b3uSaQUiCsZ2E-EI5EKwldW2NOzqslffgopHxHj-jHxLvH4_tbwHWaQ7uvqApie1xz8") },
        { id: 132, name: "SSG 08 | Bloodshot", price: 26.18, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLijZGwpR1Y-s29e6M9eM-HB2Sbzetkj-1gSCGn201wsjnUm9qrI3OXaAQnDsZwTbIDtxnpl9W0P7i35FfW3toTzC6q2ixXrnE8w4eIHZQ") },
        { id: 133, name: "Nova | Hyper Beast", price: 12.29, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL_kYDhwiFO0PyhfqVSKOmDC3WSxO9lpN5lRi67gVMhsGrTmd2seH6XbA4pDZR1EbMCtES8m4fiNenl4FDcid1Az32ri3tM8G81tMCTwFwB") },
        { id: 215, name: "MP5-SD | Phosphor", price: 4.52, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8jsPz-R1c_M2jePFSJvWAGm6GwOJJtPNgXxa_nBovp3PRzd-vdCqQOgYgCMYkRrECskLuwdfkZeqz5QKMjYwUnHj33SlI630__a9cBl0Wy4S-") },
        { id: 239, name: "Dual Berettas | Cobra Strike", price: 51.62, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL0kp_0-B1c_M2qfaVhIvWBC3OEwP1Js-5rXSiMmRQguynLydn9JXmUOwMgCsN1EbMPsRHtxoDuZrzm4VTait4Tzn_-jn4f7ipu4fFCD_Qo-zseRg") },
        { id: 245, name: "Nova | Bloomstick", price: 11.19, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL_kYDhwiFO0OG-eq1jJ8-dAXGR_uJ_t-l9AXDrxU4msD_UzN2qIy6Va1chXJJxFu8OtBO5l9fjZLnh4wXd3olBmCzgznQeBg5SBVo") },
        { id: 248, name: "XM1014 | Incinegator", price: 5.55, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLpk8ewrHZk7OeRcKk8cKHHMW6ewud4tfNoWyahqhEutDWR1NuuJXqWO1d0CsdyE-9ctxPpkYDmYr6zsgKLgt5NnC33in9B7idi4u8cEf1ypt9Mlvk") },
        { id: 251, name: "MAG-7 | Cinquedea", price: 534.12, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8n5G3wiVI0P-vb_NSJ_ySHXSvzedxuPUnSijmlh9x4D-BnNyuJ3LCbAVzAsdxFuRe5EPpw9XiMbvh5lHYiYwQyjK-0H3Th2Gpiw") },
        { id: 254, name: "Sawed-Off | Wasteland Princess", price: 38.12, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLin4Hl-S1d6c2tfZt6MM-AD3CVxeFwtt5lRi67gVMksWuEmduuIH2fPwUkWJojQuMP5xi8lNzlY-234lDag4xFnin_jihN8G81tH9UxALW") },
        { id: 263, name: "SCAR-20 | Cyrex", price: 23.35, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLinZfyr3Jk7OeRe6dsMs-QF3WV2dF6ueZhW2fgzUR_52nUzYugICnCPVImApYkRO8NtkLtw4a1Nbzn7lSN2oITnCr5kGoXuXXxbesR") },
        { id: 266, name: "G3SG1 | The Executioner", price: 9.49, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2zYXnrB1Y-s2pO7dqcc-WFmKT1Pp_v-9sXRa_nBovp3PXmdyseC3DOFN1DJZ1TeIOtEKxmoG2PuKwsgOPgoxGzyr7jnhPvXlq_a9cBnGZIRC4") },
        { id: 284, name: "MP5-SD | Oxide Oasis", price: 212.24, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8jsPz-R1c_M2jePFSLvWcAFiWzet9pOB7QRa_nBovp3OAmYr_cnLFOlN0A5d4Qu4KtRi6lYG2Mr7n4QCLg48Tm3_-3yxOvSdj_a9cBsgSaNGx") },
        { id: 287, name: "UMP-45 | Neo-Noir", price: 5.69, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkk4a0qB1O4uL6PZtjJf-sAGiZ09F6ueZhW2flw0R0sGrcy4z9cn6XagVxCpR4F7Rb5BPplIbjY7vj4AOLjt0TzSj9kGoXuYU0ZhpI") },
        { id: 293, name: "Tec-9 | Decimator", price: 17.46, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLlm5W5wiVI0Oara_1SJPWQB2qR1eFkj-1gSCGn20h16j-Ew9j6Jy6QbQB1XJJzQLVYshXqm92xY-7g4wze3dpAySz2iXlXrnE8_HmWmcE") },
        { id: 296, name: "Zeus x27 | Dragon Snore", price: 13.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLln4Xl7x1Y-s2hfqF_MPGAHViU0-9xv-9WVSymhiIrujqNjsH6dH7FOA8pXJZ0Q-MPshe-lte0Pu6z7lbXio5GmSv83yNJ73k54rlWT-N7rWv6YDXa") },
        { id: 309, name: "AK-47 | Frontside Misty", price: 17.64, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSN_mdGmKC_v1mv_N9cCW6khUz_WvRm9r8JS-SaFMmWcN5ReMD4BDsltDkN-Prs1DfjN9Cn3r_jC4YvHl1o7FVgJsyBlQ") },
        { id: 313, name: "Five-SeveN | Fowl Play", price: 18.57, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3l4Dl7idN6vyRabVSdaesCGKR1eZzovJWQyC0nQlptm_Vw9ercnOUaA8lA5skFuIPsxPqmtXkNu205lfYiN8XnCyvj3hNvDErvbiIo1idJQ") },
        { id: 314, name: "M4A1-S | Hot Rod", price: 1228.35, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_GdMXWVxdF75OA4XBa_nBovp3PXyt2uJ32QaQciDZUhReUM5hLskdy2Pu_n4wLe2doXm3j-2i5A7X5i_a9cBuWkb97d") },
        { id: 316, name: "Sawed-Off | Kiss♥Love", price: 3.78, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLin4Hl-S1d6c2tfZt-IeeWCmiWx9F9ufJ6QyalkCIrujqNjsGoI3-QZwZzD5F5TbUDsBi_xtW1NuqwsVaPjoxFmST93ClI6S1osuYDT-N7rb6xkGzX") },
        { id: 317, name: "XM1014 | Tranquility", price: 11.58, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLpk8ewrHZk7OeRcKk8cKHHMWSR0-disfJWQyC0nQlp5zjWnNigIC-falMlWMN2F-cP5Ba-xoXlMri0swTZg41EyX34jS1LuDErvbgNI5zBZg") },
    ],
    covert: [
        { id: 24, name: "AWP | Asiimov", price: 120.98, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6V-Kf2cGFidxOp_pewnF3nhxEt0sGnSzN76dH3GOg9xC8FyEORftRe-x9PuYurq71bW3d8UnjK-0H0YSTpMGQ") },
        { id: 25, name: "AK-47 | Vulcan", price: 232.17, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSMuWRDGKC_uJ_t-l9AXCxxEh14zjTztivci2ePQZ2W8NzTecD4BKwloLiYeqxtAOIj9gUyyngznQeF7I6QE8") },
        { id: 26, name: "M4A4 | Howl", price: 4000, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afVSKP-EAm6extF6ueZhW2exwkl2tmTXwt39eCiUPQR2DMN4TOVetUK8xoLgM-K341eM2otDnC6okGoXufBz_TAB") },
        { id: 27, name: "AWP | Dragon Lore", price: 5665.6, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk4veqYaF7IfysCnWRxuF4j-B-Xxa_nBovp3Pdwtj9cC_GaAd0DZdwQu9fuhS4kNy0NePntVTbjYpCyyT_3CgY5i9j_a9cBkcCWUKV") },
        { id: 28, name: "M4A1-S | Knight", price: 2700, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_GeMWqV1e96o95lRi67gVNwsWTQzdn4JHyQZ1QhWMZyQe5YsxK-ktPnZOiwtVDcjo9ExS393ytB8G81tGXpYjdX") },
        { id: 134, name: "AK-47 | Asiimov", price: 42, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSIeOaB2qf19F6ueZhW2e2wEt-t2jcytf6dymSO1JxA5oiRecLsRa5kIfkYr-241aLgotHz3-rkGoXuUp8oX57") },
        { id: 135, name: "AK-47 | Neon Rider", price: 48.09, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlV6poL_6sHG6UxPxJvOhuRz39xkQhsTnVzoygdy7Ea1UoCZQkRe9bs0brl9TvN-m0tVHYjY5CyS35jjQJsHhk4o5zcA") },
        { id: 136, name: "AK-47 | Neon Revolution", price: 105.51, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSIf6SHGSY2NF6ueZhW2e3w0524mjQzomreXqVbAAhWJF3RuZfuxC5x920Yurh7gONjY0RxHr4kGoXuT5bpI-V") },
        { id: 137, name: "AK-47 | The Empress", price: 92.68, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiVI0POlPPNSJf2DHGKD0tF6ueZhW2exxEt152rWzI7_Ii-Ubw90DMB0Ee4C5xOwx9GxZbjk71PXgogWn36tkGoXudZeYvlo") },
        { id: 138, name: "AK-47 | Fire Serpent", price: 792.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0PSneqF-JeKDC2mE_u995LZWTTuygxIYvzSCkpu3cnvFPQB2DpUkROFY4Rntw93lP7i241DbiI1BxSuviHlKunk_6-sHU71lpPMTRLyP4Q") },
        { id: 139, name: "AK-47 | Head Shot", price: 36.15, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlV6xoIfSsHW-f1dF-v-1mcCW6khUz_TzRnNigd3-SOg4lAsF1QOQN4xS4wdHnMu-0swaMjIxExSSoiyof6ih1o7FVGHIdVhw") },
        { id: 140, name: "AK-47 | Gold Arabesque", price: 1240, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiVI0POlPPNSJ_-fCliR0-90tfJ4WiyMmRQguynLntmvICieOARzCpMhF-BYsRe-xoHvYu_g5lSNj4NDyy2viCwY6Hlu5_FCD_Q1jEqYuQ") },
        { id: 141, name: "M4A4 | Asiimov", price: 225, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6V6V-Kf2cGFidxOp_pewnTii3w0x_tmTRnt2qdHyWaFAjA5UlQOYI5BO5k9bhZunm41OI34NDnjK-0H3pAWw_Rw") },
        { id: 142, name: "M4A4 | Neo-Noir", price: 36.19, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afBSLvWcMWmfyPxJvOhuRz39wE1142vSztmvInvBOgV0W5R1FLYNuxW4wIbgNrmx4g2Kj4tMmCX93zQJsHgJr0dqFw") },
        { id: 143, name: "M4A1-S | Hyper Beast", price: 110.17, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_OGMWrEwL9JuPh5SjuMlxgmoCm6lob-KT-JbwF1WZEjR-YJskK9k9XiYePltAeNjYlAxSn5j34dvCZstb4LB6Ut-7qX0V8Xkv5_2A") },
        { id: 144, name: "M4A1-S | Printstream", price: 197.35, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_OGMWrEwL9lj_F7Rienhgk1tjyIpYPwJiPTcAAoCpsiEO5ZsUbpm9C2Zuni4VHW3o5EzSX62HxP7Sg96-hWVqYi_6TJz1aW0nxrkGs") },
        { id: 145, name: "M4A1-S | Mecha Industries", price: 105.61, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_eAMWrEwL9JveRqRyiMnBMjpi6RiIb8MhTLN1F4TowiE7EMtRW7ltzlMbvi5wPej4pDmCT2i3tKuHo4sOoEWKFz8qPS3F7BL_Rjtn0I4s52") },
        { id: 146, name: "M4A1-S | Golden Coil", price: 69.17, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_eAMWrEwL9lj_JnTiK2lxQztgKClYP9HifOOV5kFJclQ-Jb5xW-m9CxPuLq4QTfjd0XzyX6jCpL6X5o5OgDVfYn_a2Ci1rfcepqgV49FrE") },
        { id: 147, name: "AWP | Hyper Beast", price: 36.16, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6x0MPWBMWWVwP1ij-1gSCGn20pxtm_WzNuoeHKeaFAnCZUiTe5bt0HqxofmZOrm5Q2IjoMQzS_5iShXrnE8NzWs__c") },
        { id: 148, name: "AWP | Neo-Noir", price: 40.05, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6poL_6cB3WvzedxuPUnHirrxR4l423SyI39I3KXPwdxWZclQeNZ5EXskYfnNeyw71OMi9lNzDK-0H3r66pOTw") },
        { id: 149, name: "AWP | Fade", price: 1111.11, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_CNk7uW-V6JsJPWsAm6Xyfo45-c5GXDnwB534DuEwtuoIHOfaAYiAsYjF-QItUaxmoC0MO_h5ALcjJUFk3sEzfdk4w") },
        { id: 150, name: "AWP | Lightning Strike", price: 566.98, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_C9k4_upYLBjKf6UMWaH0dF6ueZhW2frwU1_sW2EmNyvc32RZwMpCpcjQ-EJ4xbtmt3gYezk4wzb3tpAy3mrkGoXubsGIfVN") },
        { id: 151, name: "AWP | Medusa", price: 2150, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk4veqfbdsH_GEHlicyOl-pK85TC23wk12tWSGnNr6JXqRPVUnA5J5RLIKshS-l4HuYbji7lfajdgU02yg2bOcOBD3") },
        { id: 152, name: "AWP | Gungnir", price: 6509.06, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf-jFk7uW-V6N4LvedB3WvzedxuPUnHnjnzUl0sWrdztitI3rDZgJzAsZ1QOFY4UPqldDgMO_l41HXit9AmTK-0H227dAsvQ") },
        { id: 153, name: "AWP | The Prince", price: 1900, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf-jFk7uW-V6FjIf2WAlicyOl-pK9qHXHkw093sGvTw4uqJSnDPQAkCsNyEbZcshiwxtK0Yumz4gbX2o9C02yg2f5NtC8l") },
        { id: 154, name: "AWP | Desert Hydra", price: 1043.92, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf-jFk7uW-V6x0JOKSMWuZxuZi_uA7Syu2w0Ry4mqGzYypeH3DaAEnCpt0FuAK4RjrkoDgMb7mtFfcit5bjXKpX4RFZcA") },
        { id: 155, name: "Glock-18 | Gamma Doppler", price: 81.24, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1a4s2rZaF_IfyXMWqR0-x6tehzSi2MkhEosDa6lob-KT-JPwZzA5J4F-8Mt0a-ktTvNeyws1PfjIsQyiX9h3gYvSpr5bwFWash-7qX0V9IgS2WPw") },
        { id: 156, name: "Glock-18 | Neo-Noir", price: 37.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1Y-s2pZKtuK8-dAW6C_uJ_t-l9AXznwh9zsjjSn9j9dH-eb1V0CsF3QrNZ4xW8ltPlM-7h4QbYit5NzyzgznQecekkTuo") },
        { id: 157, name: "Desert Eagle | Printstream", price: 39.64, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7OeRbKFsJ8-DHG6e1f1iouRoQha_nBovp3OGmdeqInyVP1V0XsYlRbEI50a5wNyzZr605AyI3t5MmCSohylAuC89_a9cBoMY9UkV") },
        { id: 158, name: "USP-S | Neo-Noir", price: 96.57, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSI-WsG3SA0tF4v-h7cCW6khUz_WXdmd-vI3uRPwEkApR4QuBcu0Xrk4biYr_mtQXdidlCz3r63Ska7Hx1o7FVWuokIcU") },
        { id: 159, name: "P90 | Death by Kitty", price: 79, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf_jdk7PO6e694LPyAMXfJkdF6ueZhW2fgkUh042jUnN2geSqTaFN2CcQmQuRfsBXtxtfkN7mztASIg91Bniv8kGoXucYQxgOQ") },
        { id: 160, name: "SSG 08 | Dragonfire", price: 267.26, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLijZGwpR1Y-s29e6M9eM-XHGaXzuBwufNscDqwmg0ijDGMnYftbyrFPVAoWcQjELQOuxO4k4e1N-nnsQfW2I5Mz3ivi3wb7Stj5ukAUKY7uvqAqS55_Pw") },
        { id: 161, name: "MAC-10 | Neon Rider", price: 110.89, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8n5WxrR1Y-s2jaac8cM-dC2ie0-dytfNWQyC0nQlp5DzTntmgdC7COABxX5NxQrUOtUS5w4LgMu6zsVCK2IJCmyisjitM6DErvbicsEA0SQ") },
        { id: 162, name: "Sawed-Off | The Kraken", price: 70, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLin4Hl-S1d6c2tfZt-IeeWCmiWx9F5s_VmXzy-hSIrujqNjsH_eXmWaVRyXpF3EOZe5Bm8w93gMbzn4waPg98Tzir8jHwbuC5p4uZUT-N7rZ8ILI16") },
        { id: 218, name: "AUG | Akihabara Accept", price: 750, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwi5Hf_jdk7vynZaFSIeWUMWuZxuZi_rZvSXDgzUV_tWWAydyqI3mQbVMiWJolTLQOtBS4w4a1MuznsVHa3YlbjXKpUc8HttI") },
        { id: 224, name: "Galil AR | Chatterbox", price: 200, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2n5rp8SNJ0PG7V6NsLPmfMWaS0-9lue5ncCS2kRQyvnPXnIn7eSrEZ1AnD5NxTeII4ESwxN3jN7zl5QHXjdhAnyuo2y9Nv3xs_a9cBuAhdjfO") },
        { id: 227, name: "FAMAS | Roll Cage", price: 104.97, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3n5vh7h1c_M2oaalsM8-BD2uc2NF6ueZhW2exzUhz4WjWmNqpdy-UbwJxDJtxReEMtRGwloflP7m04wfXi94QyXj9kGoXuV3JhaXD") },
        { id: 230, name: "P2000 | Fire Elemental", price: 71.15, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL5lYayrXIL0PG7V7Q_cKDDMWGZ0-tJte1sQiy9gRwrjDGMnYftb3-RZldxWJVyF-QLsUG5mofnML_qtg3cjd4TyCr4jXsf63lr4-5TVvA7uvqA-y0nTh8") },
        { id: 233, name: "CZ75-Auto | Victoria", price: 71.4, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLyhMG1_B1a_s2rfKdlJfSsDX3HlNF6ueZhW2fkk04i5WrXmY2sc3qfPFAlWZd3EOdY4Bi6loCxPu7h51fZjNlGzST5kGoXuTXAF0gA") },
        { id: 236, name: "R8 Revolver | Fade", price: 79.65, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLjm4Dv8TRe_c2vaZtrIfSWMXWV1-F6puR7cCW6khUz_W2EnIuheSiVZgIgX8F3Ee9YthLuw9LjMePqswCL34kQzHj6iypPu351o7FV6jjqgC8") },
        { id: 242, name: "Five-SeveN | Hyper Beast", price: 280.08, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL3l4Dl7idN6vyRa7FSJvmFC3SV1-t4j-lwXyyhlxgmoCm6lob-KT-JO1QgWZVyELEPu0W4l9KzYbzn5Fbf3YkTzn_8hihIvXxtsOoFUKYirLqX0V_f6-eqCw") },
        { id: 269, name: "SSG 08 | Blood in the Water", price: 87.83, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLijZGwpR1Y-s29YKV_K8-fB2CY1aAmsbFtFnDilkUl5j7UzoqsInmVaFd0XMMlELYDshbuxNPvP-yxtlCMlcsbmlWiixNl") },
        { id: 272, name: "PP-Bizon | Judgement of Anubis", price: 114.7, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzl4zv8x1Y-s2sYb5iLs-QG3WDxNF6ueZhW2fkzU0isDvTnomsdS7BbwF0A8ElROJfshC8wN3jYu-2tQ3c2osTxCitkGoXuVioOA3_") },
        { id: 275, name: "MAC-10 | Stalker", price: 39.37, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8n5WxrR1c_M2jaac8cM-AGmacyutkj-1gSCGn20V0t27Tw974Jy-WOg9yW8N3QOQDsxG4x9O0ZOPqtgHZ399HzST8ji9XrnE8CxAHwFY") },
        { id: 278, name: "MP9 | Starlight Protector", price: 67, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8js_f-jFk4uL3V7d5IeKfB2CY1dF6ueZhW2flkUtztz_SzYypJSqRalUhDJNwQO4PsBXtx9HkN-K37w3bgohGmHn3kGoXuZ3lRdvF") },
        { id: 281, name: "MP7 | Bloodsport", price: 35.09, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8jsHf-jFk4uL5V6ZhL_-XHXef0_pJvOhuRz39lxsk4W3Ry96pIHrFOgElDZN2Q-9etUSwk4LnYu3h5wLejYwWxSr43zQJsHiIGMoJQA") },
        { id: 290, name: "P90 | Asiimov", price: 167.53, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf_jdk_6v-JaV-KfmeAXGvzedxuPUnTSjikRgksjuBzoz4dXLFb1QoC8QlTLQD4EPqk4LvN-Pns1aMioNBzTK-0H3gQVv65g") },
        { id: 306, name: "M4A4 | Buzz Kill", price: 224.91, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiVI0P_6afBSM_WQGmiC_uJ_t-l9AX22kBh0tm3Qn92qdS7GPARyW5t0QLQD4xi6w9XkZe3jsgDW3ogUnH3gznQeqfpfmso") },
        { id: 307, name: "M4A1-S | Chantico's Fire", price: 111.54, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_OGMWrEwL9lj_JmWiWnlBYioQKJk4jxNWXFZ1IgC5MiQuZeuhK4wIXnMuPhslCM2oMTxH75hnxK6Htjse4BVqd25OSJ2DU2Q_CD") },
        { id: 315, name: "AWP | Oni Taiji", price: 306.73, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6xsLv6KD1icyOl-pK9vGCqwkx524G_WnNmsInyXOAVyXJJ0TbNb5EOxxIflYbzj4gDdiNlC02yg2XaKgrAq") },
    ],
    gold: [
        { id: 29, name: "★ Karambit | Doppler", price: 1442.83, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Q7uCvZaZkNM-SA1iUzv5mvOR7cDm7lA4i4QKJk4jxNWWXawUgA8dxRLEO40KwkobnMbnj5QKL348Qmy-sji5K7i466uxUUKQn5OSJ2KBZjkQR") },
        { id: 30, name: "★ Butterfly Knife | Fade", price: 3714.98, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Z-ua6bbZrLOmsD2avx-9ytd5lRi67gVNwsDvSwtqqc3iXZg4kCZYjReYLtRbum9XgYuvm5wbWjtgUzCn3iSsf8G81tFEeH9rw") },
        { id: 31, name: "★ M9 Bayonet | Crimson Web", price: 461.19, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Wts2sab1iLvWHMW-J_vlzsvJWQyC0nQlp4GrWzYuqeHjDZlN1XJohTecO5xawwdDvNuLm5wPcjY0QzyX83Xsd7zErvbgxKe4lfw") },
        { id: 32, name: "★ Sport Gloves | Pandora", price: 5000, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk5UvzWCL2kpn2-DFk_OKherB0H-CGHHecxNF6ueZhW2exk01w4j7cmYn4eHPCbAMhApdwTOIN5BPsx9yyYu605FTeid0Uy3j3kGoXueKyz5wo") },
        { id: 33, name: "★ Skeleton Knife | Fade", price: 536.38, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1I5PeibbBiLs-SD1iWwOpzj-1gSCGn20kjt2-En9mpcCmQag8hXsciQeJYthW9kILkMLji4g3Ygo8Uznj6jX9XrnE8raC5r1M") },
        { id: 34, name: "★ Bayonet | Tiger Tooth", price: 289.74, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzn4_v8ydP0POgV7BkJ_WBMWiCwOBxtd5lRi67gVMhsGrTntn4ci-ROAYlXMBwE7YL5BaxxIHjY-vq7w3X398RxS78iylK8G81tBow9RWL") },
        { id: 163, name: "★ Gut Knife | Safari Mesh", price: 40.89, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1c-uaRe7RSLfWABliEwOBJvOhuRz39wU12sWnczIyuI3mQbFAnD8RyTLVc4BHukIfmZbjq4Vba2IlMzyT43DQJsHjApBIhpw") },
        { id: 164, name: "★ Gut Knife | Night", price: 46.06, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1c-uaRe6tSLvmUBnOvzedxuPUnF3C3l0p25mvQz4r7c3ueag91DpclRrFc5kaxk4e2Y7zi4VOIg4hFmTK-0H3lwmjDRw") },
        { id: 165, name: "★ Gut Knife | Bright Water", price: 47.99, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1c-uaRYL1SL_OWD2mvyuB_tuRWQyC0nQlp4TiDntmtIiqeblAmDsB2QLMNukSxwNDkZOrg4wbajItNzXn4in9LvDErvbi4dh8COQ") },
        { id: 166, name: "★ Flip Knife | Night", price: 111.99, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1d4_u-V7diH_6aCW-E_uJ_t-l9ASzgk09_tW_Qy9mocXLCbgQgWJQiReEI50SxldbiMuzn4gDd3oJCyi7gznQeD7v_WUw") },
        { id: 167, name: "★ Flip Knife | Doppler", price: 1600, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1d4_u-V6VgH_KfD2Sb0et3ou1WQiihlxEiuieAnrD1KCzPKhh0CpN4FuICtEK4xoKxNbjq4gaM3dhCzSn-2i5I7346sesBVqF3_a3SkUifZq_j0qfR") },
        { id: 168, name: "★ Flip Knife | Fade", price: 326.09, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1d4_u-V6VsH_aSCmKvzedxuPUnTXywzR9-427Qyd34d3iUb1RyDJMlQbQL5xTtw920Zby05FeNjohDzDK-0H3GjMwqlg") },
        { id: 169, name: "★ Flip Knife | Autotronic", price: 157.2, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1d4_u-V6N-H_afB3evwPtiv_V7QCe6liIrujqNjsGrdn-faFMpXJd0TO4ItEKxm92xNurrsQCNiI9Fzy_43y0f63s5t-gCT-N7rYkKXYid") },
        { id: 170, name: "★ Falchion Knife | Forest DDPAT", price: 72.61, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1d7v6tYK1iLs-bF1iUxf53pN5lRi67gVMksWuHntutdi_Cb1IlCZFwROYMuxmxloGyY77msQCNiNhNm3j-2CIa8G81tBGTV0lI") },
        { id: 171, name: "★ Falchion Knife | Fade", price: 600, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1d7v6tYK1iLs-SD1iWwOpzj-1gSCGn20l-tmjVmIqhdHmWa1AkCJRyFuUItBW9wNTmY7jh5ADa3o5Fy3-sinhXrnE8OtZmGks") },
        { id: 172, name: "★ Shadow Daggers | Night", price: 42.03, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1L-uGmV7diH_6aCW-E_uJ_t-l9AX3llBlwsGiAy47_cSiWagdzDpMjF-8MsRHrloXhP-_r4FOP2o1NyyzgznQeozLE8WY") },
        { id: 173, name: "★ Huntsman Knife | Night", price: 89.74, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1P7vG6YadsLM-AAVieyOl-pN5lRi67gVMktj_XzNapIi6QPwYjCcd1FOIJsBPsm9TvM7-ztFfXjIgXnyX7jCxA8G81tHpNPllX") },
        { id: 174, name: "★ Huntsman Knife | Blue Steel", price: 109.99, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1P7vG6YadsLM-SH1iSzftztN5lRi67gVN1tW3UzousdnrBbFB0WZt0QbVctEawxoGxN-ywtgGNjtgUySz-hiIa8G81tLF2CaOG") },
        { id: 175, name: "★ Bayonet | Blue Steel", price: 229.02, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzn4_v8ydP0PO_V6ZhNfWXMWuZxuZi_rgwTH21kxt24TvXwo6vdXmfbgdyDpV5RORYuxS5m4KzY7605FPejohbjXKpq_wJOWQ") },
        { id: 176, name: "★ Bayonet | Slaughter", price: 250.19, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzn4_v8ydP0POjV75oIuKSMWuZxuZi_uU7HyjhwUh-tm_Xydmuc3nGbwN2ApAmQeNfsUXtktOzYuLm5FPajN9bjXKpLQ8HVlE") },
        { id: 177, name: "★ Bayonet | Autotronic", price: 244.59, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzn4_v8ydP0PW9V6ZsOf-dC3OvwPtiv_V7QCe6liIrujqNjsGodirBZlckD5B1FLMDtka7m9DuZL7i4ADf39lNxSqqjXgc5ihstrkAT-N7rfe3-Xhk") },
        { id: 178, name: "★ Skeleton Knife | Boreal Forest", price: 116.5, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1I5PeibbBiLs-bF1iWzvxzo_VWTSahkBwrjDGMnYftb32fPFIkDZV4EeJbskTpxt2yN-6wtQCIjY1GnyWriyIauCxv4LtQAvY7uvqAMerubhQ") },
        { id: 179, name: "★ Karambit | Night", price: 500, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Q7uCvZaZkNM-AAVieyOl-pN5lRi67gVNxsmzXyd2tJ3-QPwB2W8MkFu5YshG8lN3jYbnm5wTc34NNzS_423wd8G81tLSi0nj9") },
        { id: 180, name: "★ Karambit | Fade", price: 1819.57, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Q7uCvZaZkNM-SD1iWwOpzj-1gSCGn20tztm_UyIn_JHKUbgYlWMcmQ-ZcskSwldS0MOnntAfd3YlMzH35jntXrnE8SOGRGG8") },
        { id: 183, name: "★ M9 Bayonet | Doppler", price: 1064.54, image: steamImg("-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf3qr3czxb49KzgL-Kmsj2P7rSnXtU6dd9teTA5475jV2urhcDPzCkfMKLcAE-aV3R-lO5l-e61sfqvZ2fyiBgvikqsXiMyRGw1U1Ja-dm06adSULeWfJvEZCxug") },
        { id: 186, name: "★ Hand Wraps | Spruce DDPAT", price: 775.11, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu4vx603vRA_Olpfu-TVJ7uK9V6xsLvSEHGaA_u13ve5WSDu2jCIrujqNjsH_InuUaQQmDJd2Fu4NshO7kIGyYeu24Affg98UxCX_iXhJ5i465bwHT-N7rXbV3WG0") },
        { id: 187, name: "★ Hand Wraps | Desert Shamagh", price: 41.94, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu4vx603vRA_Olpfu-TVJ7uK9V6xsLvSEHGaA_uh3svNgTBa7mggpty6RlYDtKRTILFd-XccfGb5d6lSmwdS1Zrzr4Q3Ygo5Ayiur23lL5idr5eZQBapzqPDRignHY-U058QHLOHnE0oCUw1MCg") },
        { id: 188, name: "★ Hand Wraps | Duct Tape", price: 45.99, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu4vx603vRA_Olpfu-TVJ7uK9V6xsLvSEHGaA_uJzsfVhSjuqqhkysCmRm5_8HifOOV5kFJF5R7IIskW_kIXnNriz7w3eg4hMzCX-2nxP6SZo4u0LBKAi-aXV2V7fcepqgxTHW6A") },
        { id: 189, name: "★ Hand Wraps | Cobalt Skulls", price: 200, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu4vx603vRA_Olpfu-TVJ7uK9V6xsLvSEHGaA_uJzsfVhSjuqqhsmsS-MmbD7LT7CAUV7T84sBohW60fg1srnZb6zsw2Ng41MmST43C1L7is9574CBKIh_q2Big_IMOdutcNRd_iuU13QD7PQAmaY") },
        { id: 190, name: "★ Driver Gloves | Black Tie", price: 161.8, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5T441rsfhr9kYDl7h1I4_utY5t-NPmHDW-VxdF0vOBqRBaknRQztgKJk4jxNWXBbwdxDcZwFrFY40XrktLgNr7q4AKM2owQmX6ojSpMuCo_tulQB6ss5OSJ2E_SKQx-") },
        { id: 191, name: "★ Driver Gloves | Lunar Weave", price: 720, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5T441rsfhr9kYDl7h1I4_utY5tvLPGQBVicyOl-pK8xTizrzER1t2rczNj9JSqRZg92CZZ2RrRetBi7kYDhZeLl7wDajo9C02yg2YX5gL0s") },
        { id: 192, name: "★ Driver Gloves | Snow Leopard", price: 305.82, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5T441rsfhr9kYDl7h1I4_utY5tnIfeGD3Wv1uZ_pORWQyC0nQlp4TnUw9f6J3PCOw4oW8ZxRuEOshK8l9fgZbnqswHX3owXmSisjCIfuzErvbiEoDwfJQ") },
        { id: 193, name: "★ Driver Gloves | Crimson Weave", price: 1999, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5T441rsfhr9kYDl7h1I4_utY5t_JfSsAm6Xyfo4trVoSnGxlh9x5DmEzt6rJS2RagYiA5siQ-MLthW9xtDlM7uxtFCNgpUFk3thcTnRAg") },
        { id: 194, name: "★ Sport Gloves | Arid", price: 1320, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk5UvzWCL2kpn2-DFk_OKherB0H_2aAm6EwPxvj-1gSCGn20h3sTvVyoqheX2TbA9zDcFwQOQLtBnpw4bvM-rm4ACMiY5Cnn_63CNXrnE8hMDc76M") },
        { id: 195, name: "★ Sport Gloves | Slingshot", price: 330, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk5UvzWCL2kpn2-DFk_OKherB0H-OfB2mX0uZ5pN5lRi67gVN24DzSw479dnuTbAckWcElRbJctkW9ktPlNu2w51Dc2oNAmCWo2ioa8G81tMaI-Tzs") },
        { id: 196, name: "★ Sport Gloves | Bronze Morph", price: 90.85, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk5UvzWCL2kpn2-DFk_OKherB0H-CcB3Sfz9Fwou5ucDu2kSIgoTiAlLD1KCzPKhghDJBzTLMCukW6kNblNe-2tlGKj45GyCWrii8f73k95e4HA_AjrvbSkUifZkDjXxpJ") },
        { id: 197, name: "★ Sport Gloves | Superconductor", price: 1754.35, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk5UvzWCL2kpn2-DFk_OKherB0H_yaCW-E_ux6peRWQyC0nQlp4jjRyt-vJX6QblMgApt0R-5c5hLsktO2Nu_h4QaLg4MXyCmr2ClP7jErvbiwB_ADaw") },
        { id: 198, name: "★ Sport Gloves | Vice", price: 486.55, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk5UvzWCL2kpn2-DFk_OKherB0H_KfG2Kv0ed4u95lRi67gVNx4T-Bw434IHyVb1QlAsd1FOUDthG4xNznMu3m4QXXg90Wzn_33C1I8G81tLaDi_rK") },
        { id: 199, name: "★ Sport Gloves | Hedge Maze", price: 3900, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk5UvzWCL2kpn2-DFk_OKherB0H_eBC2Ke_uJ_t-l9AX21whwi4Gndnov9JH_FblMlCJYjRbFZtkWww4HnNbjr7wWN39gUmH7gznQeohQBtY8") },
        { id: 200, name: "★ Specialist Gloves | Field Agent", price: 140.27, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk71ruQBH4jYLf-i5U-fe9V7d9JfOaD2uZ0vpJtuNgcCW6khUz_TiHydigcXyXawRxX5QmQLQIsxC9kYfgN--w5QCLi4IRzyz42yofvCZ1o7FVbJfAqIA") },
        { id: 201, name: "★ Specialist Gloves | Crimson Kimono", price: 2365.44, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk71ruQBH4jYLf-i5U-fe9V7d9JfOaD2uZ0vpJu-hkQCe8qhkusjCKlIvqHjnCOml8U8UoAfkItBLswdbuNbjr5FHdjNkUzSv73C1K5y46tu4EUvAg-6bU3FrBMOE4_9BdcyhkRns5") },
        { id: 202, name: "★ Specialist Gloves | Emerald Web", price: 2250, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk71ruQBH4jYLf-i5U-fe9V7d9JfOaD2uZ0vpJtexsXSi_kSIwtj-6lob-KT-Jbw4kA8d4QOBb5hnqmoHuMLmx4AWK341Bnyr93CxN6itjsb1XUfAgqLqX0V92--w69A") },
        { id: 203, name: "★ Specialist Gloves | Fade", price: 224.18, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk71ruQBH4jYLf-i5U-fe9V7d9JfOaD2uZ0vpJtuBtSha_nBovp3PQy42sdX6eagIjW5AlQOVetBXuk92xNLvg4gOMjd5AmC2ointB53w__a9cBqntWBk3") },
        { id: 204, name: "★ Moto Gloves | Eclipse", price: 617.71, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu4r7_lb1QgTykpPf-i5U-fe9V6liNP-BDX6TzetJsuB6RiqMlxEmsDa6lob-KT-JaQMpDpFzFOdY4EO8lIDnMLjr5ALZjN1Dnyj7iyhAvXo55ucKWadx87qX0V_LSR8vSA") },
        { id: 205, name: "★ Moto Gloves | Spearmint", price: 2221.89, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu4r7_lb1QgTykpPf-i5U-fe9V6liNP-BDX6TzetJvehnWxanhxQmvTqJn7D1KCzPKhgnW5UmRO4DsxXrlYbhPurmtAXai98UzS73in5I6S5p4OsAU_Zx-KHWkUifZsxBQgc2") },
        { id: 206, name: "★ Moto Gloves | Boom!", price: 615.67, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu4r7_lb1QgTykpPf-i5U-fe9V6liNP-BDX6TzetJve5nQBaxmhIqjDGMnYftb3ufaQNxA5MiEeVb5kW5ldPiZuPj5lOKjt9BxCutiSlO5ys5sL1UUPU7uvqAf72SBgc") },
        { id: 207, name: "★ Hydra Gloves | Emerald", price: 35.47, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tg_13jRBnOlo_k7yNk6P6hfqF-H_KfAWiUyeFjvuVWRzC3hxwYsTGEmYTGJjnCO1hPVssnHaMU4EG6ktGyPryz5A3fiIwUyin3h3lJ5nlq5-xQVPIk-6HWjVmQOeFptI5DeqjsQUewWg") },
        { id: 208, name: "★ Bloodhound Gloves | Charred", price: 260.51, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tg_13jRBnOnJrv8iZT4OegbJtqLP-FC3Svw-J5v-VhQDy9kSIlvzyGkbDqKCfRO0RPVssnHaMUsES-k9HjNrixsgbd3YIRni7-inlO5i5t6-pRAqIs_aOFjg_JZbU5sI5Deqh-Veq-pA") },
        { id: 209, name: "★ Broken Fang Gloves | Jade", price: 80.42, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tg_13jRBnOnITv9idV6fOgb5tqLP-FC3Svzv5zouB9Ria9xE0YvjiRm4PwIhTALFN1VP0sHLBS9g65w9exM-Pl5gaKidkRziX22yNIv306571QA6pwrKGDiluTZLxs5ZdXOr_5GlzOqAIa") },
        { id: 318, name: "★ Karambit | Crimson Web", price: 650, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Q7uCvZaZkNM-bF1iHxOxlj-1gSCGn20wi4mTcyoyoeS_Dbwd2Cpd0RrMK4RbqxNTvZLyw7lff3Y5GxX6oiiNXrnE86bQY1_c") },
        { id: 319, name: "★ Butterfly Knife | Doppler", price: 3500.12, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Z-ua6bbZrLOmsD2qvw-J3s-p5SiihmSIqsi-HlorwOy7DAVRPVssnHaMUuhe9xIHlMuvqtgPf2IoTyC383Sod7CY-sr4DVfZ2qKPU3g-TNuE-545DeqjFvb87vg") },
        { id: 320, name: "★ Talon Knife | Fade", price: 726.15, image: steamImg("i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1M5vahf6lsK_WBMWaR_uh3tORWQyC0nQlpsmXcnNaoeHuTZwUiWMZzRrVZsxm9x9ThNrzj4QCPjdhNmHj73S9KujErvbhX2ACGeQ") },
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
            [6, 5.38328], [56, 3.91074], [14, 8.33333], [53, 4.12197], [2, 7.61394], [10, 5.06526],
            [9, 5.65203], [1, 11.35091], [3, 11.35091], [4, 11.35091], [5, 12.93336], [7, 12.93336],
        ])
    },
    {
        id: 18,
        name: "Caja Pesada",
        theme: { key: "heavy", tagline: "Potencia bruta", primary: "#c9a227", dark: "#2c2410" },
        price: 1,
        category: "cheap",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [254, 0.30666], [263, 0.50064], [245, 1.04467], [266, 1.23181], [248, 2.10628], [244, 0.40449],
            [250, 1.05589], [260, 1.12143], [253, 1.12921], [257, 1.17831], [262, 1.34386], [259, 1.69382],
            [265, 1.89078], [255, 3.37029], [247, 3.68626], [256, 2.90369], [249, 3.39133], [261, 5.12871],
            [258, 6.37623], [252, 8.13519], [264, 52.00045],
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
            [154, 0.08237], [187, 0.00845], [52, 0.11175], [45, 0.18791], [47, 0.27448], [83, 3.61707],
            [6, 0.60467], [70, 0.78246], [69, 2.29589], [59, 3.35553], [10, 7.27031], [48, 15.26802],
            [51, 15.26802], [1, 25.43654], [4, 25.43653],
        ])
    },
    {
        id: 17,
        name: "Caja Selva",
        theme: { key: "jungle", tagline: "Vegetación densa", primary: "#5aa469", dark: "#12301c" },
        price: 2,
        category: "cheap",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [269, 1.6961], [52, 0.03302], [49, 0.0375], [6, 0.17869], [268, 10.52841], [267, 1.41124],
            [285, 1.54834], [261, 2.88385], [10, 5.52738], [279, 4.17378], [51, 4.51186], [222, 4.81265],
            [9, 10.20439], [243, 6.01582], [246, 14.43796], [39, 31.99901],
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
            [16, 0.03644], [18, 0.07429], [19, 0.97475], [21, 1.04864], [20, 1.14012], [103, 2.89614],
            [17, 0.43589], [6, 0.06951], [11, 0.10564], [14, 3.82618], [15, 7.28446], [2, 34.10797],
            [10, 1.39528], [9, 2.5759], [12, 4.78381], [5, 9.36092], [7, 9.36092], [8, 9.36092],
            [13, 11.16222],
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
            [116, 0.11624], [82, 0.19959], [155, 0.76276], [156, 1.65243], [23, 1.20206], [80, 1.20181],
            [45, 0.17369], [44, 0.17752], [115, 5.70821], [11, 0.68245], [57, 0.85848], [81, 14.11895],
            [56, 2.12095], [300, 6.55568], [299, 12.5446], [298, 19.66703], [297, 32.25755],
        ])
    },
    {
        id: 19,
        name: "Caja Subfusiles",
        theme: { key: "smg", tagline: "Ráfaga cercana", primary: "#38bdf8", dark: "#0b2233" },
        price: 3,
        category: "cheap",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [284, 0.17085], [290, 0.17929], [272, 0.26188], [278, 0.44832], [275, 0.76295], [281, 0.856],
            [277, 0.5151], [283, 0.54554], [289, 0.61], [287, 6.37284], [274, 1.59492], [271, 2.25386],
            [286, 3.81009], [280, 4.0006], [285, 0.91642], [288, 1.57828], [279, 2.47035], [270, 12.75044],
            [273, 22.02351], [276, 18.93938], [282, 18.93938],
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
            [91, 0.01716], [66, 0.29093], [161, 0.09206], [143, 0.09267], [136, 0.09676], [158, 0.10572],
            [90, 0.15885], [135, 0.21229], [148, 0.25491], [156, 0.27224], [142, 0.28209], [147, 0.28233],
            [133, 3.75101], [128, 4.21774], [94, 3.30633], [56, 64.87415], [89, 21.69276],
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
            [88, 0.0129], [192, 0.2296], [178, 0.60273], [174, 0.6384], [71, 0.03122], [165, 1.46317],
            [67, 0.06176], [103, 2.39278], [80, 0.53954], [102, 8.81864], [68, 5.87739], [93, 17.66692],
            [9, 21.24902], [39, 40.41593],
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
            [100, 0.01138], [140, 0.01269], [138, 0.01985], [98, 0.04627], [101, 0.0617], [25, 0.06777],
            [75, 0.54389], [18, 1.08629], [135, 0.32717], [63, 0.08309], [21, 0.3257], [134, 0.37461],
            [139, 0.43523], [74, 1.56424], [49, 0.16749], [99, 1.03484], [50, 0.46059], [73, 9.90875],
            [102, 3.31525], [61, 1.7593], [304, 2.1867], [303, 4.39825], [62, 5.52923], [10, 16.12691],
            [302, 17.91172], [301, 32.24109],
        ])
    },
    {
        id: 23,
        name: "Caja Mortal",
        theme: { key: "mortal", tagline: "Sombras de guerra", primary: "#dc2626", dark: "#1f0505" },
        price: 5,
        category: "medium",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [314, 0.02087], [311, 0.02318], [306, 0.23784], [307, 0.3785], [21, 0.18661], [313, 0.33538],
            [309, 0.347], [45, 19.2604], [317, 0.45859], [308, 0.64692], [316, 0.9628], [310, 0.96131],
            [14, 1.78987], [53, 13.86749], [15, 2.74205], [2, 5.90588], [1, 25.93765], [3, 25.93766],
        ])
    },
    {
        id: 21,
        name: "Caja Retro",
        theme: { key: "retro", tagline: "Onda ochentera", primary: "#e879f9", dark: "#2a0a33" },
        price: 5.5,
        category: "medium",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [242, 0.25613], [236, 0.90066], [233, 1.00473], [230, 1.00826], [239, 0.88466], [293, 2.61546],
            [296, 3.38266], [235, 1.06687], [229, 1.48002], [241, 1.48594], [295, 2.97189], [232, 3.09572],
            [292, 3.20246], [231, 0.51315], [238, 5.66775], [228, 12.95486], [237, 6.62433], [234, 7.28676],
            [240, 12.14461], [291, 15.72655], [294, 15.72653],
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
            [179, 0.07515], [105, 0.10725], [173, 0.41871], [126, 0.20915], [162, 1.60732], [164, 0.81579],
            [172, 0.89401], [139, 3.11238], [132, 0.57352], [92, 0.20383], [125, 1.25227], [85, 0.48908],
            [108, 1.55432], [131, 1.93489], [97, 1.09304], [84, 1.25925], [113, 4.12492], [41, 0.42029],
            [96, 2.62682], [95, 3.4167], [87, 7.63419], [72, 26.1096], [42, 40.06752],
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
            [91, 0.05209], [116, 0.03277], [22, 0.08859], [90, 0.48232], [119, 0.12426], [122, 0.12881],
            [157, 2.85355], [120, 0.19264], [79, 1.1865], [118, 0.31669], [117, 0.33299], [23, 0.33892],
            [125, 0.5074], [124, 0.51776], [129, 0.52994], [123, 0.55508], [128, 0.5566], [43, 26.9485],
            [130, 0.63971], [55, 0.38849], [83, 4.34161], [78, 5.82], [115, 1.60944], [53, 4.59542],
            [59, 6.71639], [58, 7.93755], [1, 16.10299], [305, 16.10299],
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
            [152, 0.00852], [27, 0.00979], [151, 0.0258], [153, 0.0292], [149, 0.04992], [150, 0.09784],
            [114, 0.12592], [24, 0.45851], [111, 0.40418], [19, 0.41746], [148, 1.38503], [147, 1.53403],
            [110, 0.6735], [77, 0.44082], [52, 0.30045], [112, 1.59471], [113, 5.55083], [76, 5.06743],
            [64, 29.31084], [14, 11.46569], [51, 41.04953],
        ])
    },
    {
        id: 20,
        name: "Caja Fusiles",
        theme: { key: "rifles", tagline: "Puntería de rifle", primary: "#f97316", dark: "#331605" },
        price: 8,
        category: "medium",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [218, 0.23518], [224, 0.88191], [221, 0.03796], [227, 1.68031], [21, 0.94837], [20, 1.03111],
            [49, 0.05253], [108, 4.4169], [226, 0.76801], [217, 2.25364], [223, 3.29299], [220, 5.46337],
            [219, 4.53984], [10, 6.89568], [222, 6.7413], [9, 12.73048], [216, 27.80651], [225, 20.22391],
        ])
    },
    {
        id: 24,
        name: "Caja Oriental",
        theme: { key: "oriental", tagline: "Tinta y acero", primary: "#e11d48", dark: "#2b0a14" },
        price: 9,
        category: "medium",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [26, 0.00106], [314, 0.03578], [138, 0.00533], [311, 0.26043], [315, 0.01378], [24, 0.03494],
            [307, 0.0379], [22, 0.63995], [19, 0.90796], [135, 0.0879], [23, 2.44821], [309, 2.49123],
            [17, 20.9786], [310, 72.05693],
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
            [109, 0.02262], [177, 0.89139], [144, 0.3158], [169, 1.38692], [145, 0.59013], [155, 0.76716],
            [146, 0.90102], [214, 0.12591], [111, 0.31219], [157, 1.57225], [142, 1.72213], [106, 0.53649],
            [103, 0.95805], [104, 0.96935], [107, 1.25053], [124, 1.32822], [128, 1.42787], [215, 3.45279],
            [121, 4.20663], [212, 3.31949], [210, 49.13706], [211, 10.37342], [213, 14.43258],
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
            [109, 0.12273], [88, 0.0139], [25, 0.27737], [144, 0.32631], [116, 0.45619], [24, 0.53229],
            [166, 0.61897], [143, 0.58452], [16, 0.08605], [146, 0.93099], [119, 1.72962], [19, 1.74963],
            [135, 1.33909], [122, 1.79297], [164, 1.50495], [21, 1.88225], [20, 2.04645], [157, 1.62454],
            [118, 4.40824], [86, 1.89098], [14, 9.03467], [15, 17.20062], [10, 17.51369], [9, 32.33298],
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
            [167, 0.01648], [29, 0.01909], [88, 0.00375], [171, 0.06665], [91, 0.0051], [179, 0.08643],
            [168, 0.15891], [34, 0.18805], [176, 0.23179], [25, 0.49972], [175, 0.2629], [24, 1.26498],
            [166, 0.72859], [174, 0.74754], [75, 0.05186], [82, 0.05933], [173, 0.99894], [170, 1.35086],
            [90, 0.12163], [19, 4.37692], [165, 2.43701], [164, 2.58379], [21, 4.8571], [172, 2.94385],
            [20, 5.47186], [163, 3.06148], [74, 0.23365], [77, 0.36786], [81, 25.62741], [301, 6.62852],
            [297, 11.01854], [1, 23.52941],
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
            [27, 0.02775], [32, 0.04775], [26, 0.03931], [30, 0.06426], [28, 0.05823], [29, 0.16547],
            [100, 0.12336], [183, 0.22427], [33, 0.4451], [31, 0.51767], [34, 0.82399], [25, 0.67724],
            [141, 0.69882], [105, 1.13429], [24, 1.29967], [136, 1.49023], [137, 1.69653], [159, 1.9903],
            [22, 2.31251], [111, 3.17664], [19, 3.281], [21, 3.52968], [20, 3.83761], [23, 8.84682],
            [14, 21.86462], [15, 41.62688],
        ])
    },
    {
        id: 25,
        name: "Caja Infierno",
        theme: { key: "inferno", tagline: "Brasas de medianoche", primary: "#f97316", dark: "#1f0a02" },
        price: 60,
        category: "expensive",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [27, 0.00012], [26, 0.00024], [319, 0.00559], [29, 0.03756], [314, 0.00007], [138, 0.00794],
            [320, 0.16427], [318, 0.20842], [168, 0.91771], [34, 1.18306], [24, 0.4509], [174, 9.48339],
            [82, 30.00001], [146, 1.4991], [19, 0.07783], [21, 0.09106], [147, 6.0417], [118, 0.56697],
            [313, 0.60979], [316, 18.65427], [2, 0.12296], [1, 14.93852], [3, 14.93852],
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
            [27, 0.01402], [32, 0.03099], [26, 0.02034], [30, 0.04258], [28, 0.03096], [180, 0.09133],
            [29, 0.11705], [138, 0.1148], [150, 0.16423], [33, 0.33715], [31, 0.39624], [34, 0.65132],
            [160, 0.36701], [25, 0.42662], [24, 0.85647], [127, 1.30487], [82, 66.66668], [146, 1.55706],
            [147, 3.11516], [118, 8.39622], [123, 15.2989],
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
            [32, 0.06437], [199, 0.08649], [201, 0.15675], [202, 0.16636], [205, 0.16887], [193, 0.19149],
            [197, 0.22364], [194, 0.31367], [186, 0.59076], [191, 0.64491], [204, 0.77381], [206, 0.77686],
            [198, 1.02778], [195, 1.63082], [192, 1.78527], [208, 2.16032], [203, 2.58276], [189, 2.95819],
            [190, 3.80618], [200, 4.51058], [196, 7.56054], [209, 8.7404], [188, 16.98784], [187, 18.95596],
            [207, 23.13538],
        ])
    },
    {
        id: 22,
        name: "Caja Élite",
        theme: { key: "elite", tagline: "Solo para coleccionistas", primary: "#facc15", dark: "#2a2205" },
        price: 160,
        category: "expensive",
        image: CASE_PLACEHOLDER,
        items: caseItems([
            [32, 0.00317], [29, 0.02446], [218, 0.01201], [251, 0.06141], [242, 0.06069], [25, 0.08263],
            [284, 0.28027], [224, 0.10561], [144, 0.10795], [221, 66.66665], [290, 0.14135], [24, 0.24147],
            [166, 1.63904], [227, 0.30499], [236, 0.48028], [233, 0.57493], [230, 0.57825], [278, 0.63834],
            [239, 2.86861], [148, 1.48828], [254, 4.72359], [281, 1.84989], [293, 17.06613],
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
        SKIN_PLACEHOLDER, CASE_PLACEHOLDER, priceSource
    };
}
