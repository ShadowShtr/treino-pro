@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Travizani Fitness - Aplicacao

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js nao foi encontrado. Instale Node.js LTS e tente novamente.
    pause
    exit /b 1
)

if not exist "node_modules\vite\bin\vite.js" (
    echo A instalar dependencias do aplicativo...
    call npm install
    if errorlevel 1 goto :failure
)

echo A preparar a versao PWA...
call npm run build
if errorlevel 1 goto :failure

echo.
echo Travizani Fitness disponivel neste computador em:
echo   http://localhost:4173
echo.
echo Para testes noutro dispositivo na mesma rede, use o IP deste computador:
echo   http://IP-DESTE-COMPUTADOR:4173
echo Para instalar no iPhone, publique a pasta dist num endereco HTTPS.
echo.
start "" "http://localhost:4173"
call npm run preview -- --host 0.0.0.0 --port 4173
exit /b %errorlevel%

:failure
echo.
echo Nao foi possivel instalar ou iniciar o aplicativo.
pause
exit /b 1
