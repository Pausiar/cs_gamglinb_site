# Script para descargar imágenes de skins de CS2
# Crear carpeta de imágenes
$imgPath = "c:\Users\Pau\Desktop\ps_cs\images"
if (!(Test-Path $imgPath)) {
    New-Item -ItemType Directory -Path $imgPath -Force
}
if (!(Test-Path "$imgPath\skins")) {
    New-Item -ItemType Directory -Path "$imgPath\skins" -Force
}
if (!(Test-Path "$imgPath\cases")) {
    New-Item -ItemType Directory -Path "$imgPath\cases" -Force
}

Write-Host "Descargando imagenes de skins..." -ForegroundColor Cyan

# URLs de imagenes de skins (usando steam CDN directo con User-Agent)
$skins = @{
    # Consumer
    "1" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_p250_hy_p250_sand_light_large.png"
    "2" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_mac10_am_mac10_silver_light_large.png"
    "3" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_negev_am_army_shine_light_large.png"
    "4" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_bizon_sp_spray_sand_light_large.png"
    # Industrial
    "5" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_ump45_hy_ddpat_urb_light_large.png"
    "6" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_g3sg1_sp_mesh_tan_light_large.png"
    "7" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_fiveseven_hy_forest_night_light_large.png"
    "8" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_elite_hy_contractor_light_large.png"
    # Mil-Spec
    "9" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_m4a1_silencer_hy_forest_boreal_light_large.png"
    "10" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_ak47_sp_mesh_tan_light_large.png"
    "11" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_glock_hy_night_light_large.png"
    "12" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_usp_silencer_hy_forest_leaves_light_large.png"
    "13" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_famas_sp_colony_light_large.png"
    # Restricted
    "14" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_awp_hy_snakeskin_light_large.png"
    "15" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_m4a1_am_m4a4_magnesium_light_large.png"
    "16" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_deagle_aa_vertigo_light_large.png"
    "17" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_p90_sp_trigon_light_large.png"
    "18" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_ak47_hy_laminate_light_large.png"
    # Classified
    "19" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_awp_cu_awp_lightning_light_large.png"
    "20" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_m4a1_silencer_cu_m4a1s_atomic_alloy_light_large.png"
    "21" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_ak47_cu_ak47_cobra_light_large.png"
    "22" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_usp_silencer_cu_usp_kill_confirmed_light_large.png"
    "23" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_glock_cu_glock_dw_light_large.png"
    # Covert
    "24" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_awp_cu_awp_asimov_light_large.png"
    "25" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_ak47_cu_ak47_vulcan_light_large.png"
    "26" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_m4a1_cu_m4a4_howl_light_large.png"
    "27" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_awp_cu_medieval_dragon_awp_light_large.png"
    "28" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_m4a1_silencer_am_m4a1s_knight_light_large.png"
    # Gold (Knives)
    "29" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_knife_karambit_am_doppler_phase2_light_large.png"
    "30" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_knife_butterfly_aa_fade_light_large.png"
    "31" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_knife_m9_bayonet_hy_webs_light_large.png"
    "32" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_knife_skeleton_aa_fade_light_large.png"
    "33" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_knife_skeleton_aa_fade_light_large.png"
    "34" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_bayonet_am_tiger_orange_light_large.png"
}

# Descargar skins
foreach ($skin in $skins.GetEnumerator()) {
    $outFile = "$imgPath\skins\$($skin.Key).png"
    Write-Host "Descargando skin $($skin.Key)..." -NoNewline
    try {
        Invoke-WebRequest -Uri $skin.Value -OutFile $outFile -ErrorAction Stop
        Write-Host " OK" -ForegroundColor Green
    } catch {
        Write-Host " Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nDescargando imagenes de cajas..." -ForegroundColor Cyan

# URLs de cajas
$caseUrls = @{
    "1" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/weapon_cases/crate_community_1.png"
    "2" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/weapon_cases/crate_community_2.png"
    "3" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/weapon_cases/crate_community_3.png"
    "4" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/weapon_cases/crate_community_5.png"
    "5" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/weapon_cases/crate_community_6.png"
    "6" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/weapon_cases/crate_community_9.png"
    "7" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/weapon_cases/crate_community_10.png"
    "8" = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/weapon_cases/crate_community_15.png"
}

foreach ($case in $caseUrls.GetEnumerator()) {
    $outFile = "$imgPath\cases\$($case.Key).png"
    Write-Host "Descargando caja $($case.Key)..." -NoNewline
    try {
        Invoke-WebRequest -Uri $case.Value -OutFile $outFile -ErrorAction Stop
        Write-Host " OK" -ForegroundColor Green
    } catch {
        Write-Host " Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n¡Descarga completada!" -ForegroundColor Green
Write-Host "Las imagenes estan en: $imgPath" -ForegroundColor Yellow
