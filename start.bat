@echo off
title Zenith Discord Bot - Otomatik Yeniden Baslatma
color 0a
echo ============================================================
echo      🚀 Zenith Discord Bot 7/24 Baslatiliyor...
echo ============================================================

:: Node.js kontrolü
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [HATA] Node.js yuklu degil! Lutfen https://nodejs.org adresinden yukle.
    pause
    exit /b
)

:: .env kontrolü
if not exist .env (
    echo [UYARI] .env dosyasi bulunamadi! TOKEN degiskenini eklemeyi unutma.
    pause
)

:: node_modules kontrolü
if not exist node_modules (
    echo [Bilgi] node_modules klasoru bulunamadi, bagimliliklar yukleniyor...
    npm install
)

:: Ana döngü
:RESTART
echo [Bilgi] Bot baslatiliyor...
node src/app.js

:: Eğer bot kapanırsa buraya düşer
echo.
echo [UYARI] Bot durdu veya hata aldi. 5 saniye sonra yeniden baslatiliyor...
timeout /t 5 /nobreak >nul
goto RESTART
