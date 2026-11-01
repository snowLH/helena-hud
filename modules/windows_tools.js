// =========================================================================
// H.E.L.E.N.A. — MÓDULO DE INTEGRAÇÃO PROFUNDA COM O WINDOWS (OS & TOOLS)
// Hardware Real, Gerenciamento de Janelas, Pesquisa de Arquivos, Auto-Start
// =========================================================================

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const IS_WIN = process.platform === 'win32';
const ROOT_DIR = path.resolve(__dirname, '..');

// Cache rápido para evitar sobrecarga de chamadas WMI/CIM repetidas em < 5s
let cachedSnapshot = null;
let lastSnapshotTime = 0;

function runPowerShellJson(psCommand, timeoutMs = 8000) {
  if (!IS_WIN) return null;
  try {
    const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCommand} | ConvertTo-Json -Depth 4 -Compress"`;
    const raw = execSync(cmd, { timeout: timeoutMs, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function getFastTopProcesses() {
  if (!IS_WIN) return [];
  try {
    const out = execSync('tasklist /FO CSV /NH', { timeout: 3000, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
    const lines = out.trim().split(/\r?\n/);
    const map = new Map();
    for (const line of lines) {
      const parts = line.split('","').map(s => s.replace(/^"|"$/g, ''));
      if (parts.length >= 5) {
        const name = parts[0];
        const pid = parseInt(parts[1], 10) || 0;
        const memStr = parts[4].replace(/[^\d]/g, '');
        const memMB = Math.round(((parseInt(memStr, 10) || 0) / 1024) * 10) / 10;
        if (!map.has(name) || map.get(name).memoryMB < memMB) {
          map.set(name, { pid, name, cpuSeconds: 0, memoryMB: memMB });
        }
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.memoryMB - a.memoryMB)
      .slice(0, 8);
  } catch (_) {
    return [];
  }
}

// 1. Coleta Real e Completa de Hardware, Processos, Temp e Inicialização
function getFullSystemSnapshot(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedSnapshot && (now - lastSnapshotTime < 5000)) {
    return cachedSnapshot;
  }

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  const snapshot = {
    timestamp: new Date().toISOString(),
    hostname: os.hostname(),
    platform: process.platform,
    arch: os.arch(),
    uptimeHours: Math.round((os.uptime() / 3600) * 10) / 10,
    cpu: {
      model: os.cpus()[0]?.model || 'Processador Desconhecido',
      physicalCores: Math.max(1, Math.floor(os.cpus().length / 2)),
      logicalProcessors: os.cpus().length,
      maxClockMHz: os.cpus()[0]?.speed || 0,
      loadPercent: 0
    },
    gpu: [],
    ram: {
      totalGB: Math.round((totalMem / (1024 ** 3)) * 10) / 10,
      usedGB: Math.round((usedMem / (1024 ** 3)) * 10) / 10,
      freeGB: Math.round((freeMem / (1024 ** 3)) * 10) / 10,
      usagePercent: Math.round((usedMem / totalMem) * 100)
    },
    disks: [],
    temperature: {
      supported: false,
      celsius: null,
      source: 'Sensores ACPI do Sistema'
    },
    battery: {
      present: false,
      percentage: null,
      charging: false,
      status: 'Conectado à Tomada (AC)'
    },
    tempFiles: {
      path: os.tmpdir(),
      fileCount: 0,
      sizeMB: 0
    },
    topProcesses: getFastTopProcesses(),
    startupCount: 0,
    startupItems: [],
    autoStartEnabled: getWindowsAutoStart()
  };

  // Medir pasta %TEMP% real
  try {
    const tmpDir = os.tmpdir();
    const entries = fs.readdirSync(tmpDir);
    let count = 0;
    let bytes = 0;
    for (const item of entries.slice(0, 500)) {
      try {
        const st = fs.statSync(path.join(tmpDir, item));
        if (st.isFile()) {
          count++;
          bytes += st.size;
        }
      } catch (_) {}
    }
    snapshot.tempFiles.fileCount = count;
    snapshot.tempFiles.sizeMB = Math.round((bytes / (1024 * 1024)) * 10) / 10;
  } catch (_) {}

  if (IS_WIN) {
    // Executa uma ÚNICA chamada PowerShell consolidada para máxima performance (< 1.5s)
    const consolidatedPs = `
      $ErrorActionPreference = 'SilentlyContinue';
      $cpu = Get-CimInstance Win32_Processor | Select-Object -First 1 Name, NumberOfCores, NumberOfLogicalProcessors, MaxClockSpeed, LoadPercentage;
      $gpu = @(Get-CimInstance Win32_VideoController | Select-Object Name, AdapterRAM, DriverVersion, Status);
      $disks = @(Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' | Select-Object DeviceID, VolumeName, Size, FreeSpace);
      $bat = Get-CimInstance Win32_Battery | Select-Object -First 1 EstimatedChargeRemaining, BatteryStatus, Name;
      $temp = Get-CimInstance Win32_PerfFormattedData_Counters_ThermalZoneInformation | Select-Object -First 1 Name, Temperature;
      $procs = @(Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 8 Id, ProcessName, CPU, @{Name='MemoryMB';Expression={[math]::Round($_.WorkingSet64 / 1MB, 1)}});
      $startup = @(Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location);
      @{
        cpu = $cpu;
        gpu = $gpu;
        disks = $disks;
        bat = $bat;
        temp = $temp;
        procs = $procs;
        startup = $startup
      }
    `.replace(/\r?\n/g, ' ');

    const allData = runPowerShellJson(consolidatedPs, 6000);
    if (allData) {
      // CPU
      if (allData.cpu) {
        const c = Array.isArray(allData.cpu) ? allData.cpu[0] : allData.cpu;
        if (c.Name) snapshot.cpu.model = c.Name.trim();
        if (c.NumberOfCores) snapshot.cpu.physicalCores = c.NumberOfCores;
        if (c.NumberOfLogicalProcessors) snapshot.cpu.logicalProcessors = c.NumberOfLogicalProcessors;
        if (c.MaxClockSpeed) snapshot.cpu.maxClockMHz = c.MaxClockSpeed;
        if (typeof c.LoadPercentage === 'number') snapshot.cpu.loadPercent = c.LoadPercentage;
      }

      // GPU
      if (allData.gpu) {
        const gpus = Array.isArray(allData.gpu) ? allData.gpu : [allData.gpu];
        snapshot.gpu = gpus.filter(Boolean).map(g => ({
          name: g.Name || 'GPU Integrada',
          vramMB: g.AdapterRAM ? Math.round(Number(g.AdapterRAM) / (1024 * 1024)) : 0,
          driverVersion: g.DriverVersion || 'N/A',
          status: g.Status || 'OK'
        }));
      }

      // Discos Lógicos
      if (allData.disks) {
        const disks = Array.isArray(allData.disks) ? allData.disks : [allData.disks];
        snapshot.disks = disks.filter(Boolean).map(d => {
          const totalGB = d.Size ? Math.round((Number(d.Size) / (1024 ** 3)) * 10) / 10 : 0;
          const freeGB = d.FreeSpace ? Math.round((Number(d.FreeSpace) / (1024 ** 3)) * 10) / 10 : 0;
          const usedPercent = totalGB > 0 ? Math.round(((totalGB - freeGB) / totalGB) * 100) : 0;
          return {
            drive: d.DeviceID || 'C:',
            label: d.VolumeName || 'Sistema Local',
            totalGB,
            freeGB,
            usedPercent
          };
        });
      }

      // Bateria Real
      if (allData.bat) {
        const b = Array.isArray(allData.bat) ? allData.bat[0] : allData.bat;
        if (b && b.EstimatedChargeRemaining !== undefined) {
          snapshot.battery = {
            present: true,
            percentage: b.EstimatedChargeRemaining,
            charging: b.BatteryStatus === 2 || b.BatteryStatus === 6,
            status: b.BatteryStatus === 2 ? 'Carregando na Tomada (AC)' : 'Operando na Bateria',
            model: b.Name || 'Bateria Interna'
          };
        }
      }

      // Temperatura Real
      if (allData.temp) {
        const t = Array.isArray(allData.temp) ? allData.temp[0] : allData.temp;
        if (t && t.Temperature && Number(t.Temperature) > 273) {
          const celsius = Math.round(Number(t.Temperature) - 273.15);
          if (celsius > 15 && celsius < 115) {
            snapshot.temperature = {
              supported: true,
              celsius,
              source: `Sensor ACPI (${t.Name || 'ThermalZone'})`
            };
          }
        }
      }

      // Top Processos
      if (allData.procs) {
        const procs = Array.isArray(allData.procs) ? allData.procs : [allData.procs];
        snapshot.topProcesses = procs.filter(Boolean).map(p => ({
          pid: p.Id,
          name: p.ProcessName,
          cpuSeconds: p.CPU ? Math.round(Number(p.CPU) * 10) / 10 : 0,
          memoryMB: p.MemoryMB || 0
        }));
      }

      // Startup
      if (allData.startup) {
        const items = Array.isArray(allData.startup) ? allData.startup : [allData.startup];
        const validItems = items.filter(Boolean);
        snapshot.startupCount = validItems.length;
        snapshot.startupItems = validItems.slice(0, 10).map(s => ({
          name: s.Name,
          command: s.Command,
          location: s.Location
        }));
      }
    }
  }

  cachedSnapshot = snapshot;
  lastSnapshotTime = now;
  return snapshot;
}

// 2. Gerenciamento de Janelas Ativas no Windows
function listActiveWindows() {
  if (!IS_WIN) return [];
  const data = runPowerShellJson('Get-Process | Where-Object { $_.MainWindowTitle -ne "" } | Select-Object Id, ProcessName, MainWindowTitle, @{Name="MemoryMB";Expression={[math]::Round($_.WorkingSet64 / 1MB, 1)}}', 3000);
  if (!data) return [];
  const list = Array.isArray(data) ? data : [data];
  return list.map(w => ({
    pid: w.Id,
    processName: w.ProcessName,
    title: w.MainWindowTitle,
    memoryMB: w.MemoryMB
  }));
}

function manageWindow(action, targetPidOrName) {
  if (!IS_WIN) return { success: false, message: 'Suportado apenas no Windows.' };
  try {
    if (action === 'minimize_all') {
      execSync(`powershell -NoProfile -Command "(New-Object -ComObject Shell.Application).MinimizeAll()"`, { timeout: 3000 });
      return { success: true, message: 'Todas as janelas foram minimizadas (Mostrar Área de Trabalho).' };
    }
    if (action === 'restore_all') {
      execSync(`powershell -NoProfile -Command "(New-Object -ComObject Shell.Application).UndoMinimizeAll()"`, { timeout: 3000 });
      return { success: true, message: 'Janelas restauradas na Área de Trabalho.' };
    }
    if (action === 'focus' && targetPidOrName) {
      const safeTarget = String(targetPidOrName).replace(/[^a-zA-Z0-9_\-. ]/g, '');
      const ps = `
        $wshell = New-Object -ComObject wscript.shell;
        $wshell.AppActivate('${safeTarget}')
      `;
      execSync(`powershell -NoProfile -Command "${ps.replace(/\n/g, ' ')}"`, { timeout: 3000 });
      return { success: true, message: `Janela "${safeTarget}" trazida para o foco.` };
    }
    return { success: false, message: 'Ação de janela desconhecida.' };
  } catch (err) {
    return { success: false, message: 'Erro ao gerenciar janela: ' + err.message };
  }
}

// 3. Pesquisa Local de Arquivos e Operações Autorizadas
function getAllowedUserDirs() {
  const home = os.homedir();
  return {
    desktop: path.join(home, 'Desktop'),
    documents: path.join(home, 'Documents'),
    downloads: path.join(home, 'Downloads'),
    workspace: ROOT_DIR
  };
}

function isPathInsideAllowedDirs(targetPath) {
  const resolved = path.resolve(targetPath).toLowerCase();
  const allowed = Object.values(getAllowedUserDirs()).map(d => path.resolve(d).toLowerCase());
  return allowed.some(dir => resolved.startsWith(dir));
}

function searchLocalFiles(query, folderScope = 'all', maxResults = 30) {
  const cleanQuery = (query || '').trim().toLowerCase();
  const dirs = getAllowedUserDirs();
  const searchTargets = folderScope && dirs[folderScope]
    ? [dirs[folderScope]]
    : [dirs.desktop, dirs.documents, dirs.downloads];

  const results = [];

  function scanDir(currentDir, depth = 0) {
    if (depth > 3 || results.length >= maxResults) return;
    if (!fs.existsSync(currentDir)) return;

    let entries = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (_) {
      return;
    }

    for (const entry of entries) {
      if (results.length >= maxResults) break;
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      const fullPath = path.join(currentDir, entry.name);
      const matches = !cleanQuery || entry.name.toLowerCase().includes(cleanQuery);

      if (matches) {
        try {
          const st = fs.statSync(fullPath);
          results.push({
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            sizeKB: Math.round((st.size / 1024) * 10) / 10,
            modifiedAt: st.mtime.toISOString(),
            folder: path.basename(currentDir)
          });
        } catch (_) {}
      }

      if (entry.isDirectory() && depth < 2) {
        scanDir(fullPath, depth + 1);
      }
    }
  }

  for (const dir of searchTargets) {
    scanDir(dir, 0);
  }

  return {
    success: true,
    query: cleanQuery,
    count: results.length,
    files: results
  };
}

function createUserDocument(fileName, content, targetFolder = 'documents') {
  const dirs = getAllowedUserDirs();
  const baseDir = dirs[targetFolder] || dirs.documents;
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  const safeName = path.basename(fileName || `documento_helena_${Date.now()}.txt`).replace(/[<>:"/\\|?*]/g, '_');
  const fullPath = path.join(baseDir, safeName);

  if (!isPathInsideAllowedDirs(fullPath)) {
    return { success: false, error: 'Caminho fora dos diretórios autorizados do usuário.' };
  }

  fs.writeFileSync(fullPath, content || '', 'utf-8');
  return {
    success: true,
    fileName: safeName,
    fullPath,
    sizeBytes: Buffer.byteLength(content || '', 'utf-8')
  };
}

function renameUserFile(filePath, newName) {
  if (!filePath || !newName) {
    return { success: false, error: 'Caminho original e novo nome são obrigatórios.' };
  }
  if (!isPathInsideAllowedDirs(filePath)) {
    return { success: false, error: 'Operação permitida apenas nas pastas Desktop, Documentos e Downloads.' };
  }
  if (!fs.existsSync(filePath)) {
    return { success: false, error: 'Arquivo original não encontrado.' };
  }

  const safeNewName = path.basename(newName).replace(/[<>:"/\\|?*]/g, '_');
  const newPath = path.join(path.dirname(filePath), safeNewName);

  if (fs.existsSync(newPath)) {
    return { success: false, error: 'Já existe um arquivo com esse nome na mesma pasta.' };
  }

  fs.renameSync(filePath, newPath);
  return {
    success: true,
    oldPath: filePath,
    newPath,
    newName: safeNewName
  };
}

function openFolderOrFile(targetPathOrAlias) {
  if (!IS_WIN) return { success: false, error: 'Disponível apenas no Windows.' };
  const dirs = getAllowedUserDirs();
  const aliasMap = {
    downloads: dirs.downloads,
    documents: dirs.documents,
    documentos: dirs.documents,
    desktop: dirs.desktop,
    'área de trabalho': dirs.desktop,
    'area de trabalho': dirs.desktop,
    helena: ROOT_DIR
  };

  const target = aliasMap[(targetPathOrAlias || '').toLowerCase().trim()] || targetPathOrAlias;
  if (!target || (!fs.existsSync(target) && !aliasMap[(targetPathOrAlias || '').toLowerCase()])) {
    return { success: false, error: `Pasta ou arquivo não encontrado: ${targetPathOrAlias}` };
  }

  try {
    exec(`explorer.exe "${target}"`);
    return { success: true, openedPath: target };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// 4. Inicialização com o Windows (Auto-Start no Registro HKCU) e Atalhos .LNK
const REG_RUN_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
const REG_VALUE_NAME = 'HELENA_Copilot_Desktop';

function getWindowsAutoStart() {
  if (!IS_WIN) return false;
  try {
    const out = execSync(`reg query "${REG_RUN_KEY}" /v "${REG_VALUE_NAME}"`, {
      timeout: 2000,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return out.includes(REG_VALUE_NAME);
  } catch (_) {
    return false;
  }
}

function setWindowsAutoStart(enable) {
  if (!IS_WIN) return { success: false, error: 'Suportado apenas no Windows.' };
  try {
    if (enable) {
      const vbsLauncher = path.join(ROOT_DIR, 'HELENA_DESKTOP.vbs');
      const batLauncher = path.join(ROOT_DIR, 'Iniciar_HELENA.bat');
      const targetCmd = fs.existsSync(vbsLauncher) ? `wscript.exe "${vbsLauncher}"` : `"${batLauncher}"`;
      execSync(`reg add "${REG_RUN_KEY}" /v "${REG_VALUE_NAME}" /t REG_SZ /d "${targetCmd.replace(/"/g, '\\"')}" /f`, {
        timeout: 3000,
        stdio: 'ignore'
      });
      return { success: true, enabled: true, message: 'H.E.L.E.N.A. configurada para iniciar junto com o Windows.' };
    } else {
      try {
        execSync(`reg delete "${REG_RUN_KEY}" /v "${REG_VALUE_NAME}" /f`, {
          timeout: 3000,
          stdio: 'ignore'
        });
      } catch (_) {}
      return { success: true, enabled: false, message: 'Inicialização automática com o Windows desativada.' };
    }
  } catch (err) {
    return { success: false, error: 'Erro ao atualizar registro de inicialização: ' + err.message };
  }
}

function createDesktopAndStartMenuShortcuts() {
  if (!IS_WIN) return { success: false, error: 'Suportado apenas no Windows.' };
  try {
    const desktopDir = path.join(os.homedir(), 'Desktop');
    const startMenuDir = path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs');
    const vbsPath = path.join(ROOT_DIR, 'HELENA_DESKTOP.vbs');
    const iconPath = path.join(ROOT_DIR, 'public', 'icons', 'helena.ico');

    const shortcutsCreated = [];

    const createLnk = (lnkPath) => {
      const psScript = `
        $WshShell = New-Object -ComObject WScript.Shell;
        $Shortcut = $WshShell.CreateShortcut('${lnkPath}');
        $Shortcut.TargetPath = 'wscript.exe';
        $Shortcut.Arguments = '"${vbsPath}"';
        $Shortcut.WorkingDirectory = '${ROOT_DIR}';
        $Shortcut.Description = 'H.E.L.E.N.A. — Copiloto Pessoal de Inteligência Artificial';
        if (Test-Path '${iconPath}') { $Shortcut.IconLocation = '${iconPath}'; }
        $Shortcut.Save();
      `;
      execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript.replace(/\r?\n/g, ' ')}"`, { timeout: 4000 });
      shortcutsCreated.push(lnkPath);
    };

    if (fs.existsSync(desktopDir)) {
      createLnk(path.join(desktopDir, 'H.E.L.E.N.A. Copilot.lnk'));
    }
    if (fs.existsSync(startMenuDir)) {
      createLnk(path.join(startMenuDir, 'H.E.L.E.N.A. Copilot.lnk'));
    }

    return {
      success: true,
      shortcuts: shortcutsCreated,
      message: 'Atalhos criados na Área de Trabalho e no Menu Iniciar com sucesso.'
    };
  } catch (err) {
    return { success: false, error: 'Erro ao criar atalhos: ' + err.message };
  }
}

module.exports = {
  getFullSystemSnapshot,
  listActiveWindows,
  manageWindow,
  searchLocalFiles,
  createUserDocument,
  renameUserFile,
  openFolderOrFile,
  getWindowsAutoStart,
  setWindowsAutoStart,
  createDesktopAndStartMenuShortcuts
};
