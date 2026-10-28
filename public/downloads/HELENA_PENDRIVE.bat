@echo off
title H.E.L.E.N.A. PORTATIL // COPILOTO PEN DRIVE 100%% LOCAL
color 0B
chcp 65001 >nul
cd /d "%~dp0"
cls

echo ===============================================================================
echo   H.E.L.E.N.A. - HEURISTICA DE EXECUCAO LOCAL E ESTRUTURACAO NEURAL AUTONOMA
echo   MODO PEN DRIVE // COPILOTO UNIVERSAL PARA QUALQUER COMPUTADOR WINDOWS
echo ===============================================================================
echo.
echo [*] Inicializando a partir de: %~dp0
echo.

REM 1. Configurar caminhos do Node.js
if exist "%~dp0runtime\node\node.exe" set "PATH=%~dp0runtime\node;%PATH%"
if exist "C:\Program Files\nodejs\node.exe" set "PATH=%PATH%;C:\Program Files\nodejs"
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%PATH%;%ProgramFiles%\nodejs"
if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "PATH=%PATH%;%ProgramFiles(x86)%\nodejs"
if exist "%LocalAppData%\Programs\node\node.exe" set "PATH=%PATH%;%LocalAppData%\Programs\node"

REM 2. Verificar se Node.js esta disponivel no PC ou no Pen Drive
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Node.js nao detectado neste computador.
    echo [*] A H.E.L.E.N.A. pode baixar o Node.js Portatil (apenas ~30MB) diretamente
    echo     para a pasta do Pen Drive, permitindo rodar em qualquer PC sem instalar nada.
    echo.
    echo Pressione [ENTER] para baixar o Node.js Portatil agora ou feche a janela.
    pause >nul
    echo.
    echo [*] Baixando Node.js Portatil via PowerShell...
    if not exist "%~dp0runtime\node" mkdir "%~dp0runtime\node"
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Write-Host 'Baixando binario...'; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.18.0/win-x64/node.exe' -OutFile '%~dp0runtime\node\node.exe'"
    if exist "%~dp0runtime\node\node.exe" (
        set "PATH=%~dp0runtime\node;%PATH%"
        echo [OK] Node.js Portatil configurado com sucesso no Pen Drive!
    ) else (
        echo [ERRO] Falha ao baixar Node.js. Por favor, conecte a internet ou instale o Node.js em https://nodejs.org
        pause
        exit /b 1
    )
)

echo [1/3] Motor de Execucao Node.js: OK
node -v
echo.

REM 3. Verificar dependencias essenciais do servidor
if not exist "%~dp0node_modules\express" (
    echo [*] Instalando dependencias essenciais do servidor local...
    call npm install --omit=dev --no-audit --no-fund
    echo.
)

REM 4. Verificar se a interface ja esta compilada
if not exist "%~dp0dist\" (
    echo [*] Compilando interface HUD para execucao offline...
    call npm.cmd run build
    echo.
)

REM 5. Iniciar Servidor Local na porta 3000
echo [2/3] Verificando servidor H.E.L.E.N.A. na porta 3000...
netstat -ano | findstr :3000 >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Servidor H.E.L.E.N.A. ja esta em execucao.
) else (
    echo [*] Iniciando agente local na porta 3000...
    start "HELENA_PORTABLE_AGENT" /min cmd /c "node server.js"
    timeout /t 2 /nobreak >nul
)

REM 6. Abrir Interface HUD no Navegador em Modo App / Tela Cheia
echo [3/3] Abrindo interface HUD futurista...
echo.

REM Opcao A: Microsoft Edge App Mode
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000 --start-fullscreen
    goto sucesso
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000 --start-fullscreen
    goto sucesso
)

REM Opcao B: Google Chrome App Mode
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000 --start-fullscreen
    goto sucesso
)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000 --start-fullscreen
    goto sucesso
)

REM Opcao C: Navegador Padrao
start http://localhost:3000

:sucesso
echo ===============================================================================
echo   H.E.L.E.N.A. ESTA OPERACIONAL NO COMPUTADOR HOST!
echo   Acesse: http://localhost:3000
echo   Para encerrar, basta fechar o navegador ou finalizar a janela do servidor.
echo ===============================================================================
timeout /t 5
