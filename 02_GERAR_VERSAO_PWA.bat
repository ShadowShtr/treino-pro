@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Travizani Fitness - Build PWA

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js nao foi encontrado. Instale Node.js LTS e tente novamente.
    pause
    exit /b 1
)

if not exist "node_modules\vite\bin\vite.js" call npm install
if errorlevel 1 goto :failure

call npm run build
if errorlevel 1 goto :failure

echo.
echo Versao PWA pronta na pasta dist.
echo Publique essa pasta num endereco HTTPS para instalar no iPhone.
pause
exit /b 0

:failure
echo.
echo O build nao foi concluido.
pause
exit /b 1
