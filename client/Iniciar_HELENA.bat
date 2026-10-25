@echo off
title H.E.L.E.N.A. CORE - Interface HUD Futurista 100% Local
color 0B
chcp 65001 >nul
cd /d "%~dp0"
cls
echo ===============================================================================
echo   H.E.L.E.N.A. - Heuristica de Execucao Local e Estruturacao Neural Autonoma
echo   Interface HUD em Tela Cheia - 100%% Local e Portatil para Pen Drive
echo ===============================================================================
echo.
REM 1. Configurar caminhos do Node.js caso nao esteja no PATH
if exist "C:\Program Files\nodejs\node.exe" set "PATH=%PATH%;C:\Program Files\nodejs"
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%PATH%;%ProgramFiles%\nodejs"
if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "PATH=%PATH%;%ProgramFiles(x86)%\nodejs"
if exist "%LocalAppData%\Programs\node\node.exe" set "PATH=%PATH%;%LocalAppData%\Programs\node"
if exist "%~dp0runtime\node\node.exe" set "PATH=%PATH%;%~dp0runtime\node"

REM 2. Verificar se Node.js esta disponivel
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO CRITICO] O executavel do Node.js nao foi detectado no sistema.
    echo Por favor, instale o Node.js ou coloque o node.exe na pasta runtime\node.
    echo.
    pause
    exit /b 1
)

echo [1/3] Node.js detectado com sucesso.
node -v
echo.

if not exist "%~dp0dist\" (
    echo [*] Compilando interface HUD para execucao offline...
    call npm.cmd run build
    echo.
)

REM 3. Iniciar Servidor Backend Local na porta 3000
echo [2/3] Iniciando servidor Express local na porta 3000...
start "HELENA_CORE_SERVER" /min cmd /c "node server.js"

REM Aguardar o servidor subir
ping 127.0.0.1 -n 3 >nul

REM 4. Abrir Interface HUD em Tela Cheia no Navegador
echo [3/3] Abrindo interface HUD em modo tela cheia...
echo.

REM Tentativa 1: Google Chrome em modo App tela cheia
where chrome >nul 2>nul
if %errorlevel% equ 0 (
    start "" chrome --app=http://localhost:3000 --start-fullscreen
    goto sucesso
)
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000 --start-fullscreen
    goto sucesso
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000 --start-fullscreen
    goto sucesso
)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000 --start-fullscreen
    goto sucesso
)

REM Tentativa 2: Microsoft Edge em modo App tela cheia
where msedge >nul 2>nul
if %errorlevel% equ 0 (
    start "" msedge --app=http://localhost:3000 --start-fullscreen
    goto sucesso
)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000 --start-fullscreen
    goto sucesso
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000 --start-fullscreen
    goto sucesso
)

REM Tentativa 3: Navegador padrao
start http://localhost:3000

:sucesso
echo ===============================================================================
echo   H.E.L.E.N.A. ESTA ONLINE E OPERACIONAL!
echo   Endereco: http://localhost:3000
echo   Para desligar o assistente, basta fechar esta janela.
echo ===============================================================================
echo.
