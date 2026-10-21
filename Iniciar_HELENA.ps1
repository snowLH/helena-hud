# H.E.L.E.N.A. Launcher para PowerShell
$Host.UI.RawUI.WindowTitle = "H.E.L.E.N.A. CORE - Interface HUD Futurista 100% Local"
Clear-Host

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "  H.E.L.E.N.A. - Heurística de Execução Local e Estruturação Neural Autônoma" -ForegroundColor Cyan
Write-Host "  Interface HUD em Tela Cheia - 100% Local e Portátil para Pen Drive" -ForegroundColor DarkCyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Configurar caminhos do Node.js
$NodePaths = @(
    "C:\Program Files\nodejs",
    "$env:ProgramFiles\nodejs",
    "${env:ProgramFiles(x86)}\nodejs",
    "$env:LocalAppData\Programs\node",
    "$PSScriptRoot\runtime\node"
)

foreach ($p in $NodePaths) {
    if (Test-Path "$p\node.exe") {
        if (-not ($env:PATH -split ';' -contains $p)) {
            $env:PATH = "$p;$env:PATH"
        }
        break
    }
}

# 2. Verificar se Node.js está acessível
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCheck) {
    Write-Host "[ERRO CRÍTICO] Node.js não foi localizado no computador!" -ForegroundColor Red
    Write-Host "Por favor, instale o Node.js ou coloque o node.exe na pasta runtime\node." -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair..."
    exit 1
}

Write-Host "[1/3] Node.js detectado: " -NoNewline -ForegroundColor Green
node -v

# 3. Iniciar Servidor Local na porta 3000
Write-Host "[2/3] Iniciando servidor Express local na porta 3000..." -ForegroundColor Cyan
Set-Location -Path $PSScriptRoot
Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Minimized

Start-Sleep -Seconds 2

# 4. Abrir interface HUD no Navegador
Write-Host "[3/3] Abrindo interface HUD em modo tela cheia..." -ForegroundColor Cyan

$ChromePaths = @(
    "chrome",
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LocalAppData\Google\Chrome\Application\chrome.exe"
)

$opened = $false
foreach ($c in $ChromePaths) {
    try {
        if ($c -eq "chrome" -and (Get-Command chrome -ErrorAction SilentlyContinue)) {
            Start-Process "chrome" -ArgumentList "--app=http://localhost:3000", "--start-fullscreen"
            $opened = $true
            break
        } elseif (Test-Path $c) {
            Start-Process $c -ArgumentList "--app=http://localhost:3000", "--start-fullscreen"
            $opened = $true
            break
        }
    } catch {}
}

if (-not $opened) {
    # Tentar Microsoft Edge
    $EdgePaths = @(
        "msedge",
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
    )
    foreach ($e in $EdgePaths) {
        try {
            if ($e -eq "msedge" -and (Get-Command msedge -ErrorAction SilentlyContinue)) {
                Start-Process "msedge" -ArgumentList "--app=http://localhost:3000", "--start-fullscreen"
                $opened = $true
                break
            } elseif (Test-Path $e) {
                Start-Process $e -ArgumentList "--app=http://localhost:3000", "--start-fullscreen"
                $opened = $true
                break
            }
        } catch {}
    }
}

if (-not $opened) {
    Start-Process "http://localhost:3000"
}

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "  H.E.L.E.N.A. ESTÁ ONLINE E OPERACIONAL!" -ForegroundColor Green
Write-Host "  Endereço: http://localhost:3000" -ForegroundColor White
Write-Host "===============================================================================" -ForegroundColor Cyan
