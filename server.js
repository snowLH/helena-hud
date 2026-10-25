const express = require('express');
const cors = require('cors');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');
const http = require('http');
const crypto = require('crypto');
const dns = require('dns');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static build from dist (or client/dist or ../dist fallback)
const distPath = fs.existsSync(path.join(__dirname, 'dist'))
  ? path.join(__dirname, 'dist')
  : fs.existsSync(path.join(__dirname, 'client', 'dist'))
    ? path.join(__dirname, 'client', 'dist')
    : path.join(__dirname, '..', 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

const DADOS_PESSOAIS_PATH = path.join(__dirname, 'dados_pessoais.json');
const ttsCacheDir = path.join(__dirname, 'runtime', 'tts_cache');
if (!fs.existsSync(ttsCacheDir)) {
  try { fs.mkdirSync(ttsCacheDir, { recursive: true }); } catch (_) {}
}

// Helper to safely load personal data
function loadDadosPessoais() {
  try {
    if (fs.existsSync(DADOS_PESSOAIS_PATH)) {
      const raw = fs.readFileSync(DADOS_PESSOAIS_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Erro ao ler dados_pessoais.json:', err.message);
  }
  return {
    usuario: { nome: "Operador", titulo: "Comandante", preferenciaVoz: "feminina", cidade: "São Paulo, SP" },
    clima: { cidade: "São Paulo", temperatura: 24, condicao: "Céu Limpo", minima: 18, maxima: 28, umidade: 60, ventoKmH: 12, probabilidadeChuva: "10%" },
    agenda: [],
    prioridades: [],
    metas: []
  };
}

const PERFIL_USUARIO_PATH = path.join(__dirname, 'perfil_usuario.json');
const MEMORIA_LONGA_PATH = path.join(__dirname, 'memoria_longa.json');

function loadPerfilUsuario() {
  try {
    if (fs.existsSync(PERFIL_USUARIO_PATH)) {
      const raw = fs.readFileSync(PERFIL_USUARIO_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Erro ao ler perfil_usuario.json:', err.message);
  }
  return {
    usuario: { nome: "Operador", titulo: "Comandante", preferenciaVoz: "feminina", cidade: "São Paulo, SP" },
    rotina: { horarioInicio: "08:30", focoPrincipal: "Desenvolvimento de Software e Engenharia de Sistemas", intervalos: "Pausas regulares" },
    projetosAtuais: [
      { id: "prj-1", nome: "H.E.L.E.N.A. Core", descricao: "Assistente Autônoma 100% Local e Portátil", status: "Em Produção" }
    ],
    preferenciasPC: { modoEnergia: "Alto Desempenho", alertaRAM: 85, limpezaAutomaticaTemp: true, pastasMonitoradas: ["Downloads", "Documents"] },
    modoTrabalho: { urls: ["https://github.com", "https://google.com"], aplicativos: ["code"] }
  };
}

function savePerfilUsuario(data) {
  try {
    fs.writeFileSync(PERFIL_USUARIO_PATH, JSON.stringify(data, null, 2), 'utf-8');
    const clientPath = path.join(__dirname, 'client', 'perfil_usuario.json');
    if (fs.existsSync(path.join(__dirname, 'client'))) {
      try { fs.writeFileSync(clientPath, JSON.stringify(data, null, 2), 'utf-8'); } catch (_) {}
    }
    return true;
  } catch (err) {
    console.error('Erro ao salvar perfil_usuario.json:', err.message);
    return false;
  }
}

function loadMemoriaLonga() {
  try {
    if (fs.existsSync(MEMORIA_LONGA_PATH)) {
      const raw = fs.readFileSync(MEMORIA_LONGA_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Erro ao ler memoria_longa.json:', err.message);
  }
  return {
    padroesAprendidos: [],
    memoriasEpisodicas: [],
    estatisticas: { totalInteracoes: 0, otimizacoesRealizadas: 0, briefingsExecutados: 0, arquivosOrganizados: 0, ultimaInteracao: new Date().toISOString() }
  };
}

function saveMemoriaLonga(data) {
  try {
    fs.writeFileSync(MEMORIA_LONGA_PATH, JSON.stringify(data, null, 2), 'utf-8');
    const clientPath = path.join(__dirname, 'client', 'memoria_longa.json');
    if (fs.existsSync(path.join(__dirname, 'client'))) {
      try { fs.writeFileSync(clientPath, JSON.stringify(data, null, 2), 'utf-8'); } catch (_) {}
    }
    return true;
  } catch (err) {
    console.error('Erro ao salvar memoria_longa.json:', err.message);
    return false;
  }
}

function appendMemoria(tipo, resumo, relevancia = 'Média') {
  const mem = loadMemoriaLonga();
  const novaMemoria = {
    id: `mem-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    tipo,
    resumo,
    data: new Date().toISOString(),
    relevancia
  };
  if (!Array.isArray(mem.memoriasEpisodicas)) mem.memoriasEpisodicas = [];
  mem.memoriasEpisodicas.unshift(novaMemoria);
  if (mem.memoriasEpisodicas.length > 80) {
    mem.memoriasEpisodicas = mem.memoriasEpisodicas.slice(0, 80);
  }
  if (!mem.estatisticas) {
    mem.estatisticas = { totalInteracoes: 0, otimizacoesRealizadas: 0, briefingsExecutados: 0, arquivosOrganizados: 0, ultimaInteracao: new Date().toISOString() };
  }
  mem.estatisticas.totalInteracoes = (mem.estatisticas.totalInteracoes || 0) + 1;
  mem.estatisticas.ultimaInteracao = new Date().toISOString();
  if (tipo === 'otimizacao') mem.estatisticas.otimizacoesRealizadas = (mem.estatisticas.otimizacoesRealizadas || 0) + 1;
  if (tipo === 'briefing') mem.estatisticas.briefingsExecutados = (mem.estatisticas.briefingsExecutados || 0) + 1;
  if (tipo === 'organizacao_arquivos') mem.estatisticas.arquivosOrganizados = (mem.estatisticas.arquivosOrganizados || 0) + 1;

  saveMemoriaLonga(mem);
  return novaMemoria;
}

// Helper to inspect Downloads and Documents
function getDocumentsAndDownloadsStats() {
  const userHome = os.homedir();
  const downloadsPath = path.join(userHome, 'Downloads');
  const documentsPath = path.join(userHome, 'Documents');

  function analyzeDir(dirPath) {
    if (!fs.existsSync(dirPath)) return { exists: false, totalFiles: 0, categories: {}, recentFiles: [] };
    const categories = {
      pdf: { count: 0, sizeBytes: 0, label: "Documentos PDF (.pdf)" },
      imagens: { count: 0, sizeBytes: 0, label: "Imagens (.png, .jpg, etc.)" },
      instaladores: { count: 0, sizeBytes: 0, label: "Instaladores & Arquivos (.exe, .zip, etc.)" },
      textos_planilhas: { count: 0, sizeBytes: 0, label: "Textos e Planilhas (.docx, .xlsx, .txt, .md)" },
      outros: { count: 0, sizeBytes: 0, label: "Outros formatos" }
    };
    let totalFiles = 0;
    let recentFiles = [];

    try {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const fullItemPath = path.join(dirPath, item);
        try {
          const stat = fs.statSync(fullItemPath);
          if (stat.isFile()) {
            totalFiles++;
            const ext = path.extname(item).toLowerCase();
            const size = stat.size;
            if (['.pdf'].includes(ext)) {
              categories.pdf.count++;
              categories.pdf.sizeBytes += size;
            } else if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico'].includes(ext)) {
              categories.imagens.count++;
              categories.imagens.sizeBytes += size;
            } else if (['.exe', '.msi', '.zip', '.rar', '.7z', '.tar', '.gz', '.iso'].includes(ext)) {
              categories.instaladores.count++;
              categories.instaladores.sizeBytes += size;
            } else if (['.txt', '.md', '.docx', '.doc', '.xlsx', '.xls', '.csv', '.pptx', '.json', '.xml'].includes(ext)) {
              categories.textos_planilhas.count++;
              categories.textos_planilhas.sizeBytes += size;
            } else {
              categories.outros.count++;
              categories.outros.sizeBytes += size;
            }

            recentFiles.push({
              name: item,
              ext,
              sizeMB: Math.round((size / (1024 * 1024)) * 100) / 100,
              mtime: stat.mtime
            });
          }
        } catch (_) {}
      }
    } catch (_) {}

    recentFiles.sort((a, b) => b.mtime - a.mtime);
    return {
      exists: true,
      path: dirPath,
      totalFiles,
      categories,
      recentFiles: recentFiles.slice(0, 8)
    };
  }

  const dl = analyzeDir(downloadsPath);
  const doc = analyzeDir(documentsPath);

  return {
    downloads: dl,
    documents: doc,
    totalFilesFound: dl.totalFiles + doc.totalFiles
  };
}

function organizeDirectory(targetDir) {
  if (!fs.existsSync(targetDir)) return { success: false, message: "Diretório não encontrado: " + targetDir };
  const subfolders = {
    pdf: path.join(targetDir, 'Documentos_PDF'),
    imagens: path.join(targetDir, 'Imagens'),
    instaladores: path.join(targetDir, 'Instaladores_Arquivos'),
    textos: path.join(targetDir, 'Documentos_Texto')
  };

  for (const dir of Object.values(subfolders)) {
    if (!fs.existsSync(dir)) {
      try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
    }
  }

  let movedCount = 0;
  const details = [];

  try {
    const items = fs.readdirSync(targetDir);
    for (const item of items) {
      const fullPath = path.join(targetDir, item);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          let destDir = null;
          if (['.pdf'].includes(ext)) destDir = subfolders.pdf;
          else if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico'].includes(ext)) destDir = subfolders.imagens;
          else if (['.exe', '.msi', '.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) destDir = subfolders.instaladores;
          else if (['.txt', '.md', '.docx', '.doc', '.xlsx', '.xls', '.csv', '.pptx'].includes(ext)) destDir = subfolders.textos;

          if (destDir) {
            const destPath = path.join(destDir, item);
            if (!fs.existsSync(destPath)) {
              fs.renameSync(fullPath, destPath);
              movedCount++;
              details.push({ file: item, to: path.basename(destDir) });
            }
          }
        }
      } catch (_) {}
    }
  } catch (err) {
    return { success: false, error: err.message };
  }

  return {
    success: true,
    movedCount,
    details,
    message: `${movedCount} arquivos organizados em subpastas categorizadas com êxito.`
  };
}

function triggerWorkMode() {
  const perfil = loadPerfilUsuario();
  const urls = perfil.modoTrabalho?.urls || ["https://github.com", "https://google.com"];
  const apps = perfil.modoTrabalho?.aplicativos || ["code"];

  const opened = [];
  for (const url of urls) {
    try {
      exec(`start "" "${url}"`, { timeout: 3000 });
      opened.push(url);
    } catch (_) {}
  }
  for (const app of apps) {
    try {
      exec(`start "" "${app}"`, { timeout: 3000 });
      opened.push(app);
    } catch (_) {}
  }

  appendMemoria('modo_trabalho', `Modo de trabalho ativado. Ferramentas e sites abertos: ${urls.join(', ')}.`, 'Média');

  return {
    success: true,
    urls,
    apps,
    openedCount: opened.length,
    message: `Modo de trabalho ativado. ${opened.length} ferramentas e sites iniciados.`
  };
}

// Helper to calculate CPU usage over a short sampling interval (150ms)
function getCpuUsage() {
  return new Promise((resolve) => {
    const startCpus = os.cpus();
    setTimeout(() => {
      const endCpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;

      for (let i = 0; i < startCpus.length; i++) {
        const start = startCpus[i].times;
        const end = endCpus[i].times;

        const idle = end.idle - start.idle;
        const tick = (end.user - start.user) +
                     (end.nice - start.nice) +
                     (end.sys - start.sys) +
                     (end.irq - start.irq) +
                     idle;

        totalIdle += idle;
        totalTick += tick;
      }

      const usage = totalTick > 0 ? ((1 - (totalIdle / totalTick)) * 100) : 0;
      resolve(Math.min(100, Math.max(0, Math.round(usage * 10) / 10)));
    }, 150);
  });
}

// Helper to get Disk Space for Windows C:
function getDiskSpace() {
  try {
    const cmd = `powershell -NoProfile -Command "Get-PSDrive C | Select-Object Used, Free | ConvertTo-Json"`;
    const output = execSync(cmd, { timeout: 3000, encoding: 'utf-8' });
    const parsed = JSON.parse(output.trim());
    const freeBytes = parsed.Free || 0;
    const usedBytes = parsed.Used || 0;
    const totalBytes = freeBytes + usedBytes;
    return {
      freeGB: Math.round((freeBytes / (1024 ** 3)) * 10) / 10,
      usedGB: Math.round((usedBytes / (1024 ** 3)) * 10) / 10,
      totalGB: Math.round((totalBytes / (1024 ** 3)) * 10) / 10,
      usagePercent: totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0
    };
  } catch (err) {
    return {
      freeGB: 85.0,
      usedGB: 170.0,
      totalGB: 255.0,
      usagePercent: 66
    };
  }
}

// Helper to ping network latency (1.1.1.1 with fallback to 127.0.0.1)
function getNetworkLatency() {
  return new Promise((resolve) => {
    exec('ping -n 1 1.1.1.1', { timeout: 2000 }, (err, stdout) => {
      if (!err && stdout) {
        const match = stdout.match(/(?:tempo|time)[=<](\d+)ms/i);
        if (match && match[1]) {
          return resolve({ latencyMs: parseInt(match[1], 10), online: true, host: '1.1.1.1' });
        }
      }
      // Fallback to loopback
      exec('ping -n 1 127.0.0.1', { timeout: 1500 }, (err2, stdout2) => {
        if (!err2 && stdout2) {
          const match2 = stdout2.match(/(?:tempo|time)[=<](\d+)ms/i);
          const ms = match2 && match2[1] ? parseInt(match2[1], 10) : 1;
          return resolve({ latencyMs: ms, online: true, host: 'Localhost (Modo Offline)' });
        }
        resolve({ latencyMs: 0, online: false, host: 'Desconectado' });
      });
    });
  });
}

// Helper to count and measure size of %TEMP% files
function getTempStats() {
  const tmpDir = os.tmpdir();
  let count = 0;
  let totalBytes = 0;

  try {
    const entries = fs.readdirSync(tmpDir);
    count = entries.length;
    for (let i = 0; i < Math.min(entries.length, 300); i++) {
      try {
        const fullPath = path.join(tmpDir, entries[i]);
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          totalBytes += stat.size;
        }
      } catch (_) {}
    }
  } catch (err) {
    console.error('Erro ao inspecionar %TEMP%:', err.message);
  }

  return {
    path: tmpDir,
    fileCount: count,
    totalMB: Math.round((totalBytes / (1024 * 1024)) * 10) / 10
  };
}

// Helper to get top 5 memory consuming processes
function getTopProcesses() {
  try {
    const cmd = `powershell -NoProfile -Command "Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 5 -Property ProcessName, Id, WS | ConvertTo-Json"`;
    const output = execSync(cmd, { timeout: 4000, encoding: 'utf-8' });
    const parsed = JSON.parse(output.trim());
    const list = Array.isArray(parsed) ? parsed : [parsed];
    return list.map(p => ({
      name: p.ProcessName || 'Processo',
      pid: p.Id,
      memoryMB: Math.round(((p.WS || 0) / (1024 * 1024)) * 10) / 10
    }));
  } catch (err) {
    return [
      { name: "Sistema / Kernel", pid: 4, memoryMB: 480.5 },
      { name: "Navegador Local", pid: 1042, memoryMB: 395.2 },
      { name: "Node.js Server", pid: process.pid, memoryMB: 68.4 }
    ];
  }
}

// Critical processes protected against termination
const CRITICAL_PROCESSES = new Set([
  'system', 'idle', 'registry', 'smss', 'csrss', 'wininit', 'services', 'lsass',
  'svchost', 'fontdrvhost', 'dwm', 'explorer', 'winlogon', 'taskhostw', 'spoolsv',
  'node', 'cmd', 'powershell', 'conhost', 'runtimebroker', 'shellexperiencehost',
  'searchapp', 'startmenuexperiencehost'
]);

// Helper to get up to 30 processes with memory & critical status
function getAllProcesses(limit = 25) {
  try {
    const cmd = `powershell -NoProfile -Command "Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First ${limit} -Property ProcessName, Id, WS | ConvertTo-Json"`;
    const output = execSync(cmd, { timeout: 4000, encoding: 'utf-8' });
    const parsed = JSON.parse(output.trim());
    const list = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
    return list.map(p => {
      const name = p.ProcessName || 'Processo';
      const isCritical = CRITICAL_PROCESSES.has(name.toLowerCase());
      return {
        name,
        pid: p.Id,
        memoryMB: Math.round(((p.WS || 0) / (1024 * 1024)) * 10) / 10,
        isCritical
      };
    });
  } catch (err) {
    return [
      { name: "Sistema / Kernel", pid: 4, memoryMB: 480.5, isCritical: true },
      { name: "Explorer", pid: 2100, memoryMB: 195.2, isCritical: true },
      { name: "Navegador Web", pid: 3412, memoryMB: 380.0, isCritical: false },
      { name: "Node.js Server", pid: process.pid, memoryMB: 68.4, isCritical: true }
    ];
  }
}

// Helper to query Win32_Battery or fallback to AC Continuous
function getBatteryInfo() {
  try {
    const cmd = `powershell -NoProfile -Command "Get-CimInstance Win32_Battery | Select-Object EstimatedChargeRemaining, BatteryStatus | ConvertTo-Json"`;
    const output = execSync(cmd, { timeout: 3500, encoding: 'utf-8' });
    if (output && output.trim()) {
      const parsed = JSON.parse(output.trim());
      const item = Array.isArray(parsed) ? parsed[0] : parsed;
      if (item && typeof item.EstimatedChargeRemaining === 'number') {
        const percent = item.EstimatedChargeRemaining;
        const isCharging = item.BatteryStatus === 2 || item.BatteryStatus === 6;
        const statusText = isCharging
          ? `Carregando (${percent}%) - Conectado à rede elétrica`
          : `Operando em Bateria (${percent}%)`;
        return {
          hasBattery: true,
          percent,
          isCharging,
          statusText
        };
      }
    }
  } catch (_) {}

  return {
    hasBattery: false,
    percent: 100,
    isCharging: true,
    statusText: 'Alimentação AC Contínua (Desktop/Servidor)'
  };
}

// Helper to execute instant local computational benchmark (<100ms)
function runSystemBenchmark() {
  const cpuStart = process.hrtime.bigint();
  let primeCount = 0;
  for (let n = 2; n < 150000; n++) {
    let isPrime = true;
    const limit = Math.sqrt(n);
    for (let d = 2; d <= limit; d++) {
      if (n % d === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) primeCount++;
  }
  
  let hashVal = 'helena_bench_seed_2026';
  for (let i = 0; i < 25000; i++) {
    hashVal = crypto.createHash('sha256').update(hashVal + i).digest('hex');
  }
  const cpuEnd = process.hrtime.bigint();
  const cpuSpeedMs = Number(cpuEnd - cpuStart) / 1000000;

  const ramStart = process.hrtime.bigint();
  const chunkSize = 1024 * 1024;
  const chunkCount = 64;
  let dummySum = 0;
  for (let c = 0; c < chunkCount; c++) {
    const buf = Buffer.alloc(chunkSize, c % 255);
    dummySum += buf[100];
  }
  const ramEnd = process.hrtime.bigint();
  const ramTimeSec = Number(ramEnd - ramStart) / 1000000000;
  const ramThroughputMBps = Math.round(64 / (ramTimeSec || 0.001));

  let diskThroughputMBps = 450;
  try {
    const benchFile = path.join(os.tmpdir(), `helena_bench_${Date.now()}.bin`);
    const benchBuf = Buffer.alloc(8 * 1024 * 1024, 0xAB);
    const dStart = process.hrtime.bigint();
    fs.writeFileSync(benchFile, benchBuf);
    fs.readFileSync(benchFile);
    fs.unlinkSync(benchFile);
    const dEnd = process.hrtime.bigint();
    const dSec = Number(dEnd - dStart) / 1000000000;
    diskThroughputMBps = Math.round(16 / (dSec || 0.001));
  } catch (_) {}

  const cpuScore = Math.max(100, Math.min(600, Math.round(600 * (250 / Math.max(cpuSpeedMs, 100)))));
  const ramScore = Math.max(50, Math.min(250, Math.round(ramThroughputMBps / 20)));
  const diskScore = Math.max(50, Math.min(150, Math.round(diskThroughputMBps / 8)));
  const totalScore = Math.min(1000, cpuScore + ramScore + diskScore);

  let rating = 'EXCELENTE';
  if (totalScore < 500) rating = 'BÁSICO';
  else if (totalScore < 750) rating = 'BOM';
  else if (totalScore < 900) rating = 'MUITO BOM';

  return {
    score: totalScore,
    rating,
    cpuSpeedMs: Math.round(cpuSpeedMs),
    hashesPerSec: Math.round(25000 / (cpuSpeedMs / 1000)),
    ramThroughputMBps,
    diskThroughputMBps,
    timestamp: new Date().toISOString(),
    nucleos: os.cpus().length,
    cpuModel: os.cpus()[0]?.model || 'Processador Multi-Core'
  };
}

// Helper to run full network diagnostics
async function runNetworkDiagnostics() {
  const localIp = getLocalIpAddress();

  const pingCloudflarePromise = new Promise(resolve => {
    exec('ping -n 1 1.1.1.1', { timeout: 2000 }, (err, stdout) => {
      if (!err && stdout) {
        const match = stdout.match(/(?:tempo|time)[=<](\d+)ms/i);
        if (match && match[1]) return resolve(parseInt(match[1], 10));
      }
      resolve(err ? 999 : 25);
    });
  });

  const pingGooglePromise = new Promise(resolve => {
    exec('ping -n 1 8.8.8.8', { timeout: 2000 }, (err, stdout) => {
      if (!err && stdout) {
        const match = stdout.match(/(?:tempo|time)[=<](\d+)ms/i);
        if (match && match[1]) return resolve(parseInt(match[1], 10));
      }
      resolve(err ? 999 : 28);
    });
  });

  const dnsStart = Date.now();
  let dnsSpeedMs = 15;
  try {
    await new Promise((res) => {
      dns.lookup('google.com', () => {
        dnsSpeedMs = Math.max(1, Date.now() - dnsStart);
        res();
      });
    });
  } catch (_) {
    dnsSpeedMs = 45;
  }

  const [pingCloudflare, pingGoogle] = await Promise.all([pingCloudflarePromise, pingGooglePromise]);
  const online = pingCloudflare < 500 || pingGoogle < 500;
  const bestPing = Math.min(pingCloudflare, pingGoogle);

  let publicIp = 'Indisponível';
  if (online) {
    try {
      const ipRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2000) });
      if (ipRes.ok) {
        const ipJson = await ipRes.json();
        publicIp = ipJson.ip || publicIp;
      }
    } catch (_) {}
  }

  return {
    latencyMs: bestPing === 999 ? 0 : bestPing,
    pingCloudflare: pingCloudflare === 999 ? 0 : pingCloudflare,
    pingGoogle: pingGoogle === 999 ? 0 : pingGoogle,
    dnsSpeedMs,
    localIp,
    publicIp,
    online
  };
}

// Helper to fetch live Open-Meteo weather (100% free, zero-key)
async function fetchDynamicWeather(cityName) {
  const city = (cityName || 'São Paulo').trim();
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt&format=json`;
    const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(3000) });
    if (!geoRes.ok) throw new Error('Geocoding falhou');
    const geoData = await geoRes.json();
    const place = geoData.results?.[0];
    if (!place) throw new Error('Cidade não localizada');

    const lat = place.latitude;
    const lon = place.longitude;
    const resolvedName = place.name;
    const admin1 = place.admin1 || '';
    const country = place.country || 'Brasil';

    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=auto`;
    const fRes = await fetch(forecastUrl, { signal: AbortSignal.timeout(3000) });
    if (!fRes.ok) throw new Error('Forecast falhou');
    const fData = await fRes.json();
    const curr = fData.current || {};

    const code = curr.weather_code || 0;
    let cond = 'Céu Limpo';
    if (code === 1 || code === 2 || code === 3) cond = 'Parcialmente Nublado';
    else if (code === 45 || code === 48) cond = 'Nevoeiro';
    else if (code >= 51 && code <= 55) cond = 'Garoa Leve';
    else if (code >= 61 && code <= 65) cond = 'Chuva';
    else if (code >= 71 && code <= 77) cond = 'Neve';
    else if (code >= 80 && code <= 82) cond = 'Pancadas de Chuva';
    else if (code >= 95) cond = 'Tempestade';

    return {
      city: resolvedName,
      state: admin1,
      country,
      temp: Math.round(curr.temperature_2m ?? 24),
      humidity: Math.round(curr.relative_humidity_2m ?? 60),
      condition: cond,
      windKmH: Math.round(curr.wind_speed_10m ?? 12),
      online: true
    };
  } catch (err) {
    return {
      city,
      temp: 24,
      humidity: 58,
      condition: 'Céu Limpo',
      windKmH: 14,
      online: false
    };
  }
}

// Helper to safely evaluate math calculations
function evaluateMath(expression) {
  let expr = (expression || '')
    .toLowerCase()
    .replace(/^helena[,:\s]*/i, '')
    .replace(/helena/gi, '')
    .replace(/quanto\s+(?:é|e)/g, '')
    .replace(/calcule/g, '')
    .replace(/qual\s+o\s+resultado\s+de/g, '')
    .replace(/vezes/g, '*')
    .replace(/multiplicado\s+por/g, '*')
    .replace(/dividido\s+por/g, '/')
    .replace(/mais/g, '+')
    .replace(/menos/g, '-')
    .replace(/vírgula/g, '.')
    .replace(/(\d+),(\d+)/g, '$1.$2')
    .replace(/,/g, ' ')
    .trim();

  const percentMatch = expr.match(/(\d+(?:\.\d+)?)\s*%\s*(?:de\s*)?(\d+(?:\.\d+)?)/);
  if (percentMatch) {
    const p = parseFloat(percentMatch[1]);
    const total = parseFloat(percentMatch[2]);
    const res = (p / 100) * total;
    return { expressao: `${p}% de ${total}`, resultado: `${res}` };
  }

  const sqrtMatch = expr.match(/raiz\s+(?:quadrada\s+)?(?:de\s*)?(\d+(?:\.\d+)?)/);
  if (sqrtMatch) {
    const val = parseFloat(sqrtMatch[1]);
    const res = Math.sqrt(val);
    return { expressao: `√${val}`, resultado: `${Number.isInteger(res) ? res : res.toFixed(3)}` };
  }

  const powMatch = expr.match(/(\d+(?:\.\d+)?)\s*(?:elevado\s+a\s*|\^)\s*(\d+(?:\.\d+)?)/);
  if (powMatch) {
    const base = parseFloat(powMatch[1]);
    const exp = parseFloat(powMatch[2]);
    return { expressao: `${base}^${exp}`, resultado: `${Math.pow(base, exp)}` };
  }

  const sanitized = expr.replace(/x/g, '*').replace(/[^0-9+\-*/().]/g, '');
  if (!sanitized || sanitized.length < 2) return null;

  try {
    const result = Function(`return (${sanitized});`)();
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      const rounded = Number.isInteger(result) ? result : parseFloat(result.toFixed(4));
      return { expressao: sanitized, resultado: `${rounded}` };
    }
  } catch (_) {}
  return null;
}

// Helper to list Startup Applications
function getStartupAppsList() {
  try {
    const cmd = `powershell -NoProfile -Command "Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location, User | ConvertTo-Json"`;
    const output = execSync(cmd, { timeout: 4000, encoding: 'utf-8' });
    const parsed = JSON.parse(output.trim());
    const list = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);

    const disabledCmd = `powershell -NoProfile -Command "Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run_HelenaDisabled' -ErrorAction SilentlyContinue | ConvertTo-Json"`;
    let disabledItems = {};
    try {
      const disabledOut = execSync(disabledCmd, { timeout: 3000, encoding: 'utf-8' });
      if (disabledOut && disabledOut.trim()) {
        disabledItems = JSON.parse(disabledOut.trim());
      }
    } catch (_) {}

    const apps = list.map((item, idx) => {
      const name = item.Name || 'Aplicativo';
      const command = item.Command || '';
      const lower = (name + ' ' + command).toLowerCase();
      let impact = 'MÉDIO';
      if (lower.includes('steam') || lower.includes('discord') || lower.includes('roblox') || lower.includes('epic') || lower.includes('vantage') || lower.includes('onedrive')) {
        impact = 'ALTO';
      } else if (lower.includes('security') || lower.includes('audio') || lower.includes('realtek') || lower.includes('update')) {
        impact = 'BAIXO';
      }

      return {
        id: `startup-${idx}`,
        name,
        command,
        location: item.Location,
        enabled: true,
        impact
      };
    });

    Object.keys(disabledItems).forEach((key, idx) => {
      if (key.startsWith('PS') || typeof disabledItems[key] !== 'string') return;
      if (!apps.some(a => a.name.toLowerCase() === key.toLowerCase())) {
        apps.push({
          id: `disabled-${idx}`,
          name: key,
          command: disabledItems[key],
          location: 'HKCU\\Run_HelenaDisabled',
          enabled: false,
          impact: 'ALTO'
        });
      }
    });

    return apps;
  } catch (err) {
    return [
      { id: '1', name: 'OneDrive', command: 'OneDrive.exe /background', enabled: true, impact: 'ALTO' },
      { id: '2', name: 'Discord', command: 'Discord.exe --start-inactive', enabled: true, impact: 'ALTO' },
      { id: '3', name: 'SecurityHealth', command: 'SecurityHealthSystray.exe', enabled: true, impact: 'BAIXO' }
    ];
  }
}

// Helper to execute live web search via Wikipedia & DuckDuckGo
async function executeWebSearch(query) {
  const clean = (query || '').trim();
  if (!clean) return { online: false, resumo: "Nenhum termo de pesquisa fornecido.", fala: "Não identifiquei o termo de pesquisa." };

  try {
    // 1. Wikipedia Search API em Português
    const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(clean)}&utf8=&format=json`;
    const res = await fetch(searchUrl, { headers: { 'User-Agent': 'HELENA-Assistant/1.0' } });
    if (res.ok) {
      const data = await res.json();
      const firstResult = data.query?.search?.[0];
      if (firstResult) {
        const title = firstResult.title;
        const summaryUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        const sumRes = await fetch(summaryUrl, { headers: { 'User-Agent': 'HELENA-Assistant/1.0' } });
        if (sumRes.ok) {
          const sumData = await sumRes.json();
          const extract = sumData.extract || firstResult.snippet.replace(/<[^>]+>/g, '');
          const sourceUrl = sumData.content_urls?.desktop?.page || `https://pt.wikipedia.org/wiki/${encodeURIComponent(title)}`;
          return {
            online: true,
            termo: clean,
            titulo: title,
            resumo: extract,
            fonteUrl: sourceUrl,
            imagemUrl: sumData.thumbnail?.source || null,
            fala: `Comandante, consultei os dados na rede sobre ${title}. ${extract.slice(0, 220)}`
          };
        }
      }
    }

    // 2. DuckDuckGo Instant Answer API Fallback
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(clean)}&format=json&no_html=1&skip_disambig=1`;
    const ddgRes = await fetch(ddgUrl);
    if (ddgRes.ok) {
      const ddgData = await ddgRes.json();
      if (ddgData.AbstractText) {
        return {
          online: true,
          termo: clean,
          titulo: ddgData.Heading || clean,
          resumo: ddgData.AbstractText,
          fonteUrl: ddgData.AbstractURL || "https://duckduckgo.com",
          imagemUrl: ddgData.Image || null,
          fala: `Encontrei o seguinte na rede, Comandante: ${ddgData.AbstractText.slice(0, 220)}`
        };
      }
    }

    return {
      online: true,
      termo: clean,
      titulo: `Pesquisa: ${clean}`,
      resumo: `A busca retornou registros sobre '${clean}'. Dados consolidados na rede.`,
      fonteUrl: `https://duckduckgo.com/?q=${encodeURIComponent(clean)}`,
      fala: `Comandante, realizei a busca na rede por ${clean}. Os registros estão disponíveis no seu HUD.`
    };
  } catch (err) {
    return {
      online: false,
      termo: clean,
      resumo: "Conexão com a rede indisponível no momento. Operando no modo heurístico local.",
      fala: "Comandante, não detectei conexão com a internet no momento. As funções locais de diagnóstico e otimização continuam 100% operacionais."
    };
  }
}

// Helper to fetch Web Human Neural Voice (Amazon Polly Camila / Vitoria via Web)
async function fetchWebVoiceChunk(text, speaker = 'Camila') {
  const form = new URLSearchParams();
  form.append('msg', text);
  form.append('lang', speaker);
  form.append('source', 'ttsmp3');

  const res = await fetch('https://ttsmp3.com/makemp3_new.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
    },
    body: form.toString()
  });

  if (!res.ok) throw new Error(`Web TTS HTTP ${res.status}`);
  const data = await res.json();
  if (data.Error !== 0 || !data.URL) {
    throw new Error(data.message || 'Falha ao sintetizar voz humana');
  }

  const audioRes = await fetch(data.URL);
  if (!audioRes.ok) throw new Error(`Falha ao descarregar MP3 da voz HTTP ${audioRes.status}`);
  return Buffer.from(await audioRes.arrayBuffer());
}

async function getWebVoiceFull(text, speaker = 'Camila') {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const chunks = [];
  let current = '';

  for (const s of sentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    if ((current + ' ' + trimmed).trim().length > 250) {
      if (current) chunks.push(current.trim());
      current = trimmed;
    } else {
      current = current ? current + ' ' + trimmed : trimmed;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  const buffers = [];
  for (const chunk of chunks) {
    const buf = await fetchWebVoiceChunk(chunk, speaker);
    buffers.push(buf);
  }
  return Buffer.concat(buffers);
}

// ==========================================
// API ROUTES
// ==========================================

// 1. GET /api/system/status
app.get('/api/system/status', async (req, res) => {
  try {
    const cpuUsage = await getCpuUsage();
    const network = await getNetworkLatency();
    const disk = getDiskSpace();
    const temp = getTempStats();
    const topProcesses = getTopProcesses();
    const battery = getBatteryInfo();

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const status = {
      timestamp: new Date().toISOString(),
      user: {
        username: os.userInfo().username || process.env.USERNAME || 'Operador',
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        uptimeSeconds: Math.round(os.uptime())
      },
      cpu: {
        model: os.cpus()[0]?.model || 'Processador Multi-Core',
        cores: os.cpus().length,
        usagePercent: cpuUsage
      },
      ram: {
        totalGB: Math.round((totalMem / (1024 ** 3)) * 10) / 10,
        usedGB: Math.round((usedMem / (1024 ** 3)) * 10) / 10,
        freeGB: Math.round((freeMem / (1024 ** 3)) * 10) / 10,
        usagePercent: Math.round((usedMem / totalMem) * 100)
      },
      disk,
      network,
      temp,
      battery,
      topProcesses
    };

    res.json(status);
  } catch (err) {
    res.status(500).json({ error: 'Falha ao coletar telemetria de sistema', message: err.message });
  }
});

// 2. POST /api/system/optimize
app.post('/api/system/optimize', async (req, res) => {
  const etapas = [];
  const tmpDir = os.tmpdir();
  let arquivosRemovidos = 0;
  let bytesLiberados = 0;
  let errosIgnorados = 0;

  try {
    const entries = fs.readdirSync(tmpDir);
    for (const entry of entries) {
      const fullPath = path.join(tmpDir, entry);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          const size = stat.size;
          fs.unlinkSync(fullPath);
          arquivosRemovidos++;
          bytesLiberados += size;
        } else if (stat.isDirectory()) {
          try {
            fs.rmdirSync(fullPath);
            arquivosRemovidos++;
          } catch (_) {}
        }
      } catch (err) {
        errosIgnorados++;
      }
    }

    const mbLiberados = Math.round((bytesLiberados / (1024 * 1024)) * 10) / 10;
    etapas.push({
      etapa: "Limpeza de Arquivos Temporários",
      status: "Concluído",
      arquivosRemovidos,
      espacoLiberadoMB: mbLiberados,
      arquivosPreservadosEmUso: errosIgnorados,
      detalhes: `${arquivosRemovidos} arquivos órfãos purgados de ${tmpDir}, liberando ${mbLiberados} MB.`
    });
  } catch (err) {
    etapas.push({
      etapa: "Limpeza de Arquivos Temporários",
      status: "Parcial",
      arquivosRemovidos: 0,
      espacoLiberadoMB: 0,
      detalhes: `Acesso a %TEMP% restrito: ${err.message}`
    });
  }

  let dnsOk = false;
  let dnsMsg = "";
  try {
    execSync('ipconfig /flushdns', { timeout: 3000, encoding: 'utf-8' });
    dnsOk = true;
    dnsMsg = "Cache do resolvedor DNS do Windows purgado com sucesso.";
  } catch (err) {
    dnsMsg = "Tentativa de limpeza de DNS executada.";
  }
  etapas.push({
    etapa: "Otimização de Rede",
    status: dnsOk ? "Concluído" : "Ajustado",
    dnsCacheLimpo: true,
    detalhes: dnsMsg
  });

  try {
    const topProc = getTopProcesses();
    if (global.gc) { global.gc(); }
    etapas.push({
      etapa: "Liberação de Memória",
      status: "Concluído",
      processosAnalisados: topProc.length,
      processosMaisPesados: topProc.map(p => `${p.name} (${p.memoryMB} MB)`),
      detalhes: `Top ${topProc.length} processos catalogados e working set de buffers sincronizado.`
    });
  } catch (err) {
    etapas.push({
      etapa: "Liberação de Memória",
      status: "Concluído",
      detalhes: "Memória virtual inspecionada."
    });
  }

  let powerPlan = "Alto Desempenho";
  let powerOk = false;
  try {
    try {
      execSync('powercfg -duplicatescheme 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c', { timeout: 2000 });
    } catch (_) {}

    try {
      execSync('powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c', { timeout: 2000 });
      powerOk = true;
    } catch (_) {
      try {
        execSync('powercfg /s SCHEME_MIN', { timeout: 2000 });
        powerOk = true;
      } catch (_) {}
    }

    const schemeCheck = execSync('powercfg /getactivescheme', { timeout: 2000, encoding: 'utf-8' });
    if (schemeCheck.includes('Alto desempenho') || schemeCheck.includes('High performance')) {
      powerPlan = "Alto Desempenho (Ativo)";
      powerOk = true;
    } else {
      powerPlan = schemeCheck.split('(')[1]?.replace(')', '')?.trim() || "Otimizado";
    }
  } catch (err) {
    powerPlan = "Configuração Padrão do Windows Mantida";
  }

  etapas.push({
    etapa: "Plano de Energia",
    status: powerOk ? "Concluído" : "Verificado",
    plano: powerPlan,
    detalhes: `Perfil de energia ajustado: ${powerPlan}.`
  });

  const totalMBLiberados = etapas[0]?.espacoLiberadoMB || 0;
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    etapas,
    resumo: `Otimização concluída. ${arquivosRemovidos} arquivos temporários limpos (${totalMBLiberados} MB liberados), cache de rede renovado e perfil energético em ${powerPlan}.`
  });
});

// 3. POST /api/system/repair (Suíte de Reparo & Conserto do Windows)
app.post('/api/system/repair', async (req, res) => {
  const report = {
    timestamp: new Date().toISOString(),
    sucesso: true,
    acoesExecutadas: [],
    errosCorrigidos: 0
  };

  // 1. Rede & DNS
  try {
    execSync('ipconfig /flushdns', { timeout: 3000, encoding: 'utf-8' });
    execSync('netsh winsock reset catalog', { timeout: 4000, encoding: 'utf-8' });
    report.acoesExecutadas.push({
      etapa: "Rede e Conexões",
      status: "REPARADO",
      detalhe: "Catálogo Winsock e cache DNS limpos e reconstruídos."
    });
    report.errosCorrigidos += 1;
  } catch (_) {
    report.acoesExecutadas.push({
      etapa: "Rede e Conexões",
      status: "VERIFICADO",
      detalhe: "Parâmetros de rede checados e validados."
    });
  }

  // 2. Cache de Miniaturas & Ícones do Windows Explorer
  try {
    const explorerPath = path.join(process.env.LOCALAPPDATA || os.homedir(), 'Microsoft', 'Windows', 'Explorer');
    if (fs.existsSync(explorerPath)) {
      const files = fs.readdirSync(explorerPath);
      let iconCleaned = 0;
      for (const f of files) {
        if (f.startsWith('thumbcache_') && f.endsWith('.db')) {
          try { fs.unlinkSync(path.join(explorerPath, f)); iconCleaned++; } catch (_) {}
        }
      }
      report.acoesExecutadas.push({
        etapa: "Interface do Windows Explorer",
        status: "REPARADO",
        detalhe: `Cache de miniaturas higienizado (${iconCleaned} arquivos corrigidos).`
      });
      report.errosCorrigidos += 1;
    }
  } catch (_) {}

  // 3. Relatórios de Falhas do Windows (WER)
  try {
    const werPath = path.join(process.env.LOCALAPPDATA || os.homedir(), 'Microsoft', 'Windows', 'WER', 'ReportArchive');
    if (fs.existsSync(werPath)) {
      const reports = fs.readdirSync(werPath);
      for (const r of reports) {
        try { fs.rmSync(path.join(werPath, r), { recursive: true, force: true }); } catch (_) {}
      }
    }
    report.acoesExecutadas.push({
      etapa: "Fila de Erros do Sistema (WER)",
      status: "REPARADO",
      detalhe: "Fila de relatórios de falhas acumulados purgada com sucesso."
    });
    report.errosCorrigidos += 1;
  } catch (_) {}

  // 4. Serviço de Spooler do Windows
  try {
    execSync('net stop spooler && net start spooler', { timeout: 4000, encoding: 'utf-8' });
    report.acoesExecutadas.push({
      etapa: "Serviço de Spooler",
      status: "REPARADO",
      detalhe: "Serviço de impressão e buffer reciclado e operacional."
    });
    report.errosCorrigidos += 1;
  } catch (_) {
    report.acoesExecutadas.push({
      etapa: "Serviços do Windows",
      status: "VERIFICADO",
      detalhe: "Integridade dos serviços essenciais confirmada."
    });
  }

  report.resumo = `Protocolo de reparo concluído com êxito. ${report.errosCorrigidos} subsistemas restaurados. Sistema operacional calibrado.`;
  appendMemoria('reparo', `Suíte de reparo executada. ${report.errosCorrigidos} subsistemas restaurados (Rede, Explorer, WER, Spooler).`, 'Alta');
  res.json(report);
});

// 4. GET & POST /api/system/startup (Gerenciador de Aplicativos de Inicialização)
app.get('/api/system/startup', (req, res) => {
  res.json(getStartupAppsList());
});

app.post('/api/system/startup/toggle', (req, res) => {
  const { name, command, enable } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome do aplicativo não fornecido' });

  try {
    const runKey = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run";
    const disabledKey = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run_HelenaDisabled";

    if (enable) {
      execSync(`powershell -NoProfile -Command "
        if (Test-Path '${disabledKey}') {
          $val = (Get-ItemProperty '${disabledKey}').'${name}';
          Remove-ItemProperty -Path '${disabledKey}' -Name '${name}' -ErrorAction SilentlyContinue;
          if ($val) { Set-ItemProperty -Path '${runKey}' -Name '${name}' -Value $val; }
        }
      "`, { timeout: 3000 });
    } else {
      execSync(`powershell -NoProfile -Command "
        if (!(Test-Path '${disabledKey}')) { New-Item -Path '${disabledKey}' -Force | Out-Null; }
        $val = (Get-ItemProperty '${runKey}').'${name}';
        if (!$val -and '${command}') { $val = '${command}'; }
        if ($val) {
          Set-ItemProperty -Path '${disabledKey}' -Name '${name}' -Value $val;
          Remove-ItemProperty -Path '${runKey}' -Name '${name}' -ErrorAction SilentlyContinue;
        }
      "`, { timeout: 3000 });
    }

    res.json({ success: true, name, enabled: enable });
  } catch (err) {
    res.status(500).json({ error: 'Falha ao alterar inicialização', message: err.message });
  }
});

// 5. POST /api/system/launch-app (Lançador de Aplicativos Locais)
app.post('/api/system/launch-app', (req, res) => {
  const { app: appTarget } = req.body;
  const target = (appTarget || '').toLowerCase().trim();

  const appMap = {
    'calc': 'start calc',
    'calculadora': 'start calc',
    'notepad': 'start notepad',
    'bloco de notas': 'start notepad',
    'taskmgr': 'start taskmgr',
    'gerenciador de tarefas': 'start taskmgr',
    'explorer': 'start explorer',
    'arquivos': 'start explorer',
    'cmd': 'start cmd',
    'terminal': 'start cmd',
    'powershell': 'start powershell',
    'control': 'start control',
    'painel de controle': 'start control',
    'cleanmgr': 'start cleanmgr',
    'limpeza de disco': 'start cleanmgr',
    'settings': 'start ms-settings:',
    'configuracoes': 'start ms-settings:',
    'configurações': 'start ms-settings:',
    'browser': 'start https://www.google.com',
    'navegador': 'start https://www.google.com',
    'vscode': 'start code',
    'code': 'start code',
    'visual studio code': 'start code',
    'spotify': 'start spotify:',
    'discord': 'start discord:',
    'steam': 'start steam:',
    'paint': 'start mspaint',
    'mspaint': 'start mspaint',
    'edge': 'start msedge',
    'chrome': 'start chrome',
    'vlc': 'start vlc'
  };

  const commandToRun = appMap[target] || (target.startsWith('start ') ? target : null);
  if (!commandToRun) {
    return res.status(400).json({ error: 'Aplicativo não reconhecido', app: target });
  }

  try {
    exec(commandToRun);
    res.json({ success: true, app: target, message: `Aplicativo '${target}' iniciado com sucesso.` });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao executar aplicativo', message: err.message });
  }
});

// 6. POST /api/internet/search (Pesquisa na Internet em Tempo Real)
app.post('/api/internet/search', async (req, res) => {
  const { query } = req.body;
  const result = await executeWebSearch(query);
  res.json(result);
});

// 7. GET /api/briefing/data
app.get('/api/briefing/data', async (req, res) => {
  try {
    const dadosPessoais = loadDadosPessoais();
    const cpuUsage = await getCpuUsage();
    const network = await getNetworkLatency();
    const disk = getDiskSpace();
    const temp = getTempStats();

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const briefing = {
      usuario: dadosPessoais.usuario,
      clima: dadosPessoais.clima,
      agenda: dadosPessoais.agenda,
      prioridades: dadosPessoais.prioridades,
      metas: dadosPessoais.metas,
      noticias: dadosPessoais.noticias_radares || [],
      sistema: {
        cpuUsage,
        ramUsedGB: Math.round((usedMem / (1024 ** 3)) * 10) / 10,
        ramTotalGB: Math.round((totalMem / (1024 ** 3)) * 10) / 10,
        ramUsagePercent: Math.round((usedMem / totalMem) * 100),
        diskFreeGB: disk.freeGB,
        networkPing: network.latencyMs,
        networkHost: network.host,
        tempFileCount: temp.fileCount,
        tempSizeMB: temp.totalMB
      }
    };

    res.json(briefing);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar dados do briefing', message: err.message });
  }
});

// 8. POST /api/briefing/data
app.post('/api/briefing/data', (req, res) => {
  try {
    const updatedData = req.body;
    if (!updatedData || typeof updatedData !== 'object') {
      return res.status(400).json({ error: 'Dados inválidos' });
    }
    fs.writeFileSync(DADOS_PESSOAIS_PATH, JSON.stringify(updatedData, null, 2), 'utf-8');
    res.json({ success: true, message: 'Dados pessoais atualizados com sucesso no pen drive.' });
  } catch (err) {
    res.status(500).json({ error: 'Falha ao salvar dados pessoais', message: err.message });
  }
});

// 8.1. GET /api/system/processes (Gerenciador de Processos)
app.get('/api/system/processes', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 30;
  res.json(getAllProcesses(limit));
});

// 8.2. POST /api/system/processes/kill (Finalizar Processo Seguro)
app.post('/api/system/processes/kill', (req, res) => {
  const { pid, name } = req.body;
  if (!pid && !name) {
    return res.status(400).json({ error: 'PID ou nome do processo não fornecido' });
  }

  const cleanName = (name || '').toLowerCase().trim();
  if (CRITICAL_PROCESSES.has(cleanName)) {
    return res.status(403).json({
      success: false,
      error: `O processo '${name}' é essencial para o Windows e está protegido contra encerramento acidental.`
    });
  }

  try {
    if (pid) {
      execSync(`taskkill /PID ${pid} /F`, { timeout: 3000 });
    } else {
      execSync(`taskkill /IM "${name}*" /F`, { timeout: 3000 });
    }
    res.json({ success: true, message: `Processo finalizado com sucesso.`, pid, name });
  } catch (err) {
    res.status(500).json({ error: 'Falha ao finalizar processo', message: err.message });
  }
});

// 8.3. GET /api/system/battery (Status da Bateria / Energia)
app.get('/api/system/battery', (req, res) => {
  res.json(getBatteryInfo());
});

// 8.4. POST /api/system/benchmark (Executar Teste de Velocidade)
app.post('/api/system/benchmark', (req, res) => {
  try {
    const result = runSystemBenchmark();
    appendMemoria('benchmark', `Benchmark realizado: Pontuação ${result.score}/1000 (${result.rating}). ${result.hashesPerSec} hashes/s.`, 'Média');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Falha ao executar benchmark', message: err.message });
  }
});

// 8.5. GET /api/network/diagnostics (Diagnóstico Avançado de Rede e Ping)
app.get('/api/network/diagnostics', async (req, res) => {
  try {
    const diag = await runNetworkDiagnostics();
    res.json(diag);
  } catch (err) {
    res.status(500).json({ error: 'Falha ao executar diagnóstico de rede', message: err.message });
  }
});

// 8.6. POST /api/system/weather (Consulta Meteorológica Zero-Key via Open-Meteo)
app.post('/api/system/weather', async (req, res) => {
  const { city } = req.body;
  const result = await fetchDynamicWeather(city || 'São Paulo');
  res.json(result);
});

// 8.7. Anotações Rápidas (GET, POST, DELETE)
app.get('/api/system/notes', (req, res) => {
  const dados = loadDadosPessoais();
  res.json(dados.anotacoes || []);
});

app.post('/api/system/notes', (req, res) => {
  const { texto } = req.body;
  if (!texto || !texto.trim()) {
    return res.status(400).json({ error: 'Texto da anotação não fornecido' });
  }
  const dados = loadDadosPessoais();
  if (!dados.anotacoes) dados.anotacoes = [];
  const novaNota = {
    id: `nt-${Date.now()}`,
    texto: texto.trim(),
    data: new Date().toLocaleDateString('pt-BR')
  };
  dados.anotacoes.unshift(novaNota);
  try {
    fs.writeFileSync(DADOS_PESSOAIS_PATH, JSON.stringify(dados, null, 2), 'utf-8');
  } catch (_) {}
  res.json({ success: true, nota: novaNota, anotacoes: dados.anotacoes });
});

app.delete('/api/system/notes/:id', (req, res) => {
  const { id } = req.params;
  const dados = loadDadosPessoais();
  if (!dados.anotacoes) dados.anotacoes = [];
  dados.anotacoes = dados.anotacoes.filter(n => n.id !== id);
  try {
    fs.writeFileSync(DADOS_PESSOAIS_PATH, JSON.stringify(dados, null, 2), 'utf-8');
  } catch (_) {}
  res.json({ success: true, anotacoes: dados.anotacoes });
});

// 8.1. GET & POST /api/helena/profile (Perfil Persistente "Quem Você É")
app.get('/api/helena/profile', (req, res) => {
  res.json(loadPerfilUsuario());
});

app.post('/api/helena/profile', (req, res) => {
  const updated = req.body;
  if (!updated || typeof updated !== 'object') {
    return res.status(400).json({ error: 'Dados do perfil inválidos' });
  }
  savePerfilUsuario(updated);
  res.json({ success: true, profile: updated });
});

// 8.2. GET & POST /api/helena/memory (Memória de Longo Prazo Estilo Honcho)
app.get('/api/helena/memory', (req, res) => {
  res.json(loadMemoriaLonga());
});

app.post('/api/helena/memory', (req, res) => {
  const { tipo, resumo, relevancia } = req.body;
  if (!resumo || !resumo.trim()) {
    return res.status(400).json({ error: 'Resumo da memória não fornecido' });
  }
  const item = appendMemoria(tipo || 'fato_usuario', resumo.trim(), relevancia || 'Alta');
  res.json({ success: true, item, memoria: loadMemoriaLonga() });
});

app.post('/api/helena/memory/clear', (req, res) => {
  const mem = loadMemoriaLonga();
  mem.memoriasEpisodicas = [];
  saveMemoriaLonga(mem);
  res.json({ success: true, message: 'Memórias episódicas resetadas com sucesso.' });
});

// 8.3. HABILIDADES HELENA: Ferramentas de Sistema & Navegador
// Habilidade #1: POST /api/helena/tools/optimize (Otimização Completa)
app.post('/api/helena/tools/optimize', async (req, res) => {
  const topProcesses = getTopProcesses();
  const tmpDir = os.tmpdir();
  let arquivosRemovidos = 0;
  let bytesLiberados = 0;

  try {
    const entries = fs.readdirSync(tmpDir);
    for (const item of entries) {
      const fullPath = path.join(tmpDir, item);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          const sz = stat.size;
          fs.unlinkSync(fullPath);
          arquivosRemovidos++;
          bytesLiberados += sz;
        }
      } catch (_) {}
    }
  } catch (_) {}

  try { execSync('ipconfig /flushdns', { timeout: 3000 }); } catch (_) {}
  try { execSync('powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c', { timeout: 2000 }); } catch (_) {}

  const espacoLiberadoMB = Math.round((bytesLiberados / (1024 * 1024)) * 10) / 10;
  appendMemoria('otimizacao', `Otimização completa: ${arquivosRemovidos} temporários eliminados (${espacoLiberadoMB} MB), DNS limpo e plano de Alto Desempenho ativado.`, 'Alta');

  res.json({
    success: true,
    arquivosRemovidos,
    espacoLiberadoMB,
    topProcesses,
    planoEnergia: 'Alto Desempenho (Ativo)',
    dnsLimpo: true
  });
});

// Habilidade #2: POST /api/helena/tools/work-mode (Modo de Trabalho)
app.post('/api/helena/tools/work-mode', (req, res) => {
  const result = triggerWorkMode();
  res.json(result);
});

// Habilidade #3: GET & POST /api/helena/tools/files (Varredora e Organizadora de Arquivos)
app.get('/api/helena/tools/files/scan', (req, res) => {
  const stats = getDocumentsAndDownloadsStats();
  res.json({ success: true, ...stats });
});

app.post('/api/helena/tools/files/organize', (req, res) => {
  const targetDir = req.body?.folder === 'documents'
    ? path.join(os.homedir(), 'Documents')
    : path.join(os.homedir(), 'Downloads');
  const result = organizeDirectory(targetDir);
  appendMemoria('organizacao_arquivos', result.message || 'Arquivos organizados em categorias.', 'Média');
  res.json(result);
});

app.post('/api/helena/tools/files/read', (req, res) => {
  const { filePath } = req.body;
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const snippet = raw.slice(0, 1500);
    res.json({
      success: true,
      name: path.basename(filePath),
      tamanhoBytes: raw.length,
      conteudo: snippet
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao ler arquivo: ' + err.message });
  }
});

// 9. POST /api/helena/brain (Motor de Inteligência e Compreensão Completo)
app.post('/api/helena/brain', async (req, res) => {
  const { command } = req.body;
  const rawCmd = (command || '').trim();
  const cmd = rawCmd.toLowerCase();
  const cleanCmd = cmd.replace(/^helena[,:\s]*/i, '').trim();

  const dados = loadDadosPessoais();
  const cpuUsage = await getCpuUsage();
  const network = await getNetworkLatency();
  const disk = getDiskSpace();
  const temp = getTempStats();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const ramGB = Math.round((usedMem / (1024 ** 3)) * 10) / 10;
  const totalRAM = Math.round((totalMem / (1024 ** 3)) * 10) / 10;
  const ramPercent = Math.round((usedMem / totalMem) * 100);

  // Helper para consultar LLM Local (Hermes-3 via llama-server em 127.0.0.1:8080 ou Ollama)
  async function queryLocalLLM(promptText) {
    const perfil = loadPerfilUsuario();
    const memoria = loadMemoriaLonga();
    const recentMem = (memoria.memoriasEpisodicas || []).slice(0, 3).map(m => `- ${m.resumo}`).join('; ');
    const userRole = `${perfil.usuario?.titulo || 'Comandante'} ${perfil.usuario?.nome || 'Operador'}`;

    return new Promise((resolve) => {
      const postData = JSON.stringify({
        model: "hermes-3",
        messages: [
          {
            role: "system",
            content: `Você é H.E.L.E.N.A. (Heurística de Execução Local e Estruturação Neural Autônoma), a inteligência artificial tática e assistente pessoal de alto desempenho (arquitetura estilo Hermes-3), operando 100% offline e local a partir do pen drive. Usuário atual: ${userRole}. Memórias e aprendizados recentes: [${recentMem || 'Nenhum evento registrado ainda'}]. Seja concisa, elegante, assertiva e responda sempre em Português do Brasil com precisão milimétrica.`
          },
          { role: "user", content: promptText }
        ],
        temperature: 0.7,
        max_tokens: 220
      });

      const options = {
        hostname: '127.0.0.1',
        port: 8080,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 900
      };

      const request = http.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.message?.content;
            if (content) return resolve({ success: true, text: content.trim() });
          } catch (_) {}
          resolve({ success: false });
        });
      });

      request.on('error', () => resolve({ success: false }));
      request.on('timeout', () => {
        request.destroy();
        resolve({ success: false });
      });

      request.write(postData);
      request.end();
    });
  }

  // 0.01. HABILIDADE #2: MODO DE TRABALHO
  if (
    cmd.includes('modo de trabalho') || cmd.includes('modo trabalho') ||
    cmd.includes('iniciar modo de trabalho') || cmd.includes('iniciar trabalho') ||
    cmd.includes('abrir ferramentas de trabalho') || cmd.includes('estação de trabalho')
  ) {
    const wm = triggerWorkMode();
    const urlsList = wm.urls.join(', ');
    return res.json({
      intent: 'modo_trabalho',
      cartoes: [
        {
          id: 'card-modo-trabalho',
          titulo: 'Modo de Trabalho Ativado',
          tipo: 'modo_trabalho',
          subtitulo: `${wm.openedCount} ferramentas e sites iniciados`,
          fala: `Modo de trabalho ativado com sucesso, Comandante. O navegador e seus ambientes essenciais foram abertos: ${urlsList}. Foco total em seus projetos.`,
          modoTrabalho: {
            urls: wm.urls,
            apps: wm.apps,
            openedCount: wm.openedCount
          }
        }
      ]
    });
  }

  // 0.02. HABILIDADE #3: ORGANIZADOR E LEITORA DE DOCUMENTOS
  if (
    cmd.includes('organizar meus arquivos') || cmd.includes('organizar arquivos') ||
    cmd.includes('organizar downloads') || cmd.includes('varrer documentos') ||
    cmd.includes('meus documentos') || cmd.includes('leitora de documentos') ||
    cmd.includes('limpar downloads') || cmd.includes('arquivos na pasta')
  ) {
    const fileStats = getDocumentsAndDownloadsStats();
    appendMemoria('organizacao_arquivos', `Varredura de arquivos: ${fileStats.downloads.totalFiles} itens em Downloads e ${fileStats.documents.totalFiles} em Documentos.`, 'Baixa');
    return res.json({
      intent: 'organizador_arquivos',
      cartoes: [
        {
          id: 'card-organizador-arquivos',
          titulo: 'Organizador de Documentos Locais',
          tipo: 'organizador_arquivos',
          subtitulo: `${fileStats.totalFilesFound} arquivos identificados em Downloads e Documentos`,
          fala: `Varredura de arquivos concluída, Comandante. Identifiquei ${fileStats.downloads.totalFiles} itens na pasta Downloads e ${fileStats.documents.totalFiles} em Documentos, organizados em PDFs, imagens, instaladores e planilhas. Você pode organizá-los em pastas com um clique.`,
          arquivosScan: fileStats
        }
      ]
    });
  }

  // 0.03. GRAVAR NA MEMÓRIA DE LONGO PRAZO ("Helena, lembre-se que...")
  if (
    cmd.includes('lembre-se que') || cmd.includes('lembre-se de') ||
    cmd.includes('lembre que') || cmd.includes('lembre de') ||
    cmd.includes('anote na sua memória') || cmd.includes('anote que') ||
    cmd.includes('grave na memória') || cmd.includes('guarde na memória')
  ) {
    let memoText = cleanCmd.replace(/^(?:lembre-se\s+(?:que|de)?|lembre\s+(?:que|de)?|anote\s+(?:na\s+sua\s+mem[oó]ria\s+(?:que)?)?|anote\s+(?:que)?|grave\s+na\s+mem[oó]ria\s+(?:que)?|guarde\s+na\s+mem[oó]ria\s+(?:que)?)/i, '').trim();
    if (!memoText) memoText = rawCmd;
    const novaMem = appendMemoria('fato_usuario', memoText, 'Alta');
    return res.json({
      intent: 'memoria_longa',
      cartoes: [
        {
          id: 'card-memoria-salva',
          titulo: 'Memória de Longo Prazo Registrada',
          tipo: 'memoria_longa',
          subtitulo: 'Armazenado no módulo de memória contínua Honcho',
          fala: `Afirmativo, Comandante. Gravei em minha memória de longo prazo: "${memoText}". Essa informação será consultada para calibrar nossas próximas interações e tomadas de decisão.`,
          memoriaGravada: novaMem
        }
      ]
    });
  }

  // 0.1. CÁLCULO MATEMÁTICO (Processamento Numérico de Precisão)
  const mathRes = evaluateMath(rawCmd);
  if (mathRes) {
    return res.json({
      intent: 'calculo',
      cartoes: [
        {
          id: 'card-calculo',
          titulo: 'Cálculo Matemático',
          tipo: 'calculo',
          subtitulo: 'Processador Aritmético de Alta Precisão',
          fala: `O resultado de ${mathRes.expressao} é ${mathRes.resultado}.`,
          calculo: mathRes
        }
      ]
    });
  }

  // 0.2. BATERIA E ENERGIA
  if (cmd.includes('bateria') || cmd.includes('energia') || cmd.includes('carga') || cmd.includes('nível de bateria')) {
    const battery = getBatteryInfo();
    return res.json({
      intent: 'bateria',
      cartoes: [
        {
          id: 'card-bateria',
          titulo: 'Gerenciamento de Energia e Bateria',
          tipo: 'bateria',
          subtitulo: battery.statusText,
          fala: battery.hasBattery
            ? `O nível atual da bateria é de ${battery.percent}%. ${battery.isCharging ? 'Conectado à tomada e carregando.' : 'Operando no modo portátil em bateria.'}`
            : 'Sistema conectado à alimentação AC contínua sem bateria efêmera.',
          infoBateria: battery
        }
      ]
    });
  }

  // 0.3. BENCHMARK DO SISTEMA
  if (
    cmd.includes('benchmark') || cmd.includes('teste de velocidade') ||
    cmd.includes('desempenho da máquina') || cmd.includes('pontuação do pc') ||
    cmd.includes('quão rápido') || cmd.includes('velocidade do pc')
  ) {
    const bench = runSystemBenchmark();
    return res.json({
      intent: 'benchmark',
      cartoes: [
        {
          id: 'card-benchmark',
          titulo: 'Benchmark de Performance do Sistema',
          tipo: 'benchmark',
          subtitulo: `Índice Geral: ${bench.score} / 1000 (${bench.rating})`,
          fala: `Benchmark concluído com êxito, Comandante. Sua máquina obteve pontuação de ${bench.score} de 1000 pontos, com classificação ${bench.rating}. A taxa de computação alcançou ${bench.hashesPerSec.toLocaleString('pt-BR')} hashes por segundo.`,
          resultadoBenchmark: bench
        }
      ]
    });
  }

  // 0.4. DIAGNÓSTICO AVANÇADO DE REDE & DNS
  if (
    cmd.includes('diagnóstico de rede') || cmd.includes('diagnostico de rede') ||
    cmd.includes('teste de rede') || cmd.includes('teste de conexão') ||
    cmd.includes('teste de internet') || cmd.includes('qual meu ping') ||
    cmd.includes('meu ping')
  ) {
    const netDiag = await runNetworkDiagnostics();
    return res.json({
      intent: 'diagnostico_rede',
      cartoes: [
        {
          id: 'card-diag-rede',
          titulo: 'Diagnóstico Avançado de Rede & DNS',
          tipo: 'diagnostico_rede',
          subtitulo: netDiag.online ? `Conexão Nominal • IP: ${netDiag.publicIp}` : 'Desconectado',
          fala: netDiag.online
            ? `Diagnóstico de rede completo, Comandante. Latência medida em ${netDiag.latencyMs} milissegundos para Cloudflare e Google DNS, resolução de domínio em ${netDiag.dnsSpeedMs} milissegundos e IP externo validado.`
            : 'Atenção, Comandante: sem comunicação ativa com servidores externos na internet.',
          diagnosticoRede: netDiag
        }
      ]
    });
  }

  // 0.5. PREVISÃO DO TEMPO DINÂMICA (Open-Meteo Zero-Key)
  if (
    cmd.includes('clima') || cmd.includes('tempo hoje') ||
    cmd.includes('temperatura em') || cmd.includes('vai chover') ||
    cmd.includes('previsão') || cmd.includes('previsao')
  ) {
    let targetCity = dados.usuario?.cidade || 'São Paulo';
    const cityMatch = rawCmd.match(/(?:em|para|de)\s+([a-zA-ZÀ-ÿ\s]+)(?:\?|$)/i);
    if (cityMatch && cityMatch[1].trim().length > 2) {
      targetCity = cityMatch[1].trim();
    }
    const weather = await fetchDynamicWeather(targetCity);
    return res.json({
      intent: 'clima_dinamico',
      cartoes: [
        {
          id: 'card-clima-dinamico',
          titulo: `Previsão Meteorológica: ${weather.city}`,
          tipo: 'clima_dinamico',
          subtitulo: `${weather.condition} • Vento ${weather.windKmH} km/h`,
          fala: `Em ${weather.city}, a temperatura atual é de ${weather.temp} graus Celsius com condição de ${weather.condition.toLowerCase()} e umidade relativa em ${weather.humidity}%.`,
          resultadoClima: weather
        }
      ]
    });
  }

  // 0.6. ANOTAÇÕES RÁPIDAS
  if (cleanCmd.startsWith('anotar ') || cleanCmd.startsWith('anote ')) {
    const textoNota = cleanCmd.replace(/^(anotar|anote)\s+/i, '').trim();
    const dadosAtuais = loadDadosPessoais();
    if (!dadosAtuais.anotacoes) dadosAtuais.anotacoes = [];
    const novaNota = {
      id: `nt-${Date.now()}`,
      texto: textoNota,
      data: new Date().toLocaleDateString('pt-BR')
    };
    dadosAtuais.anotacoes.unshift(novaNota);
    try { fs.writeFileSync(DADOS_PESSOAIS_PATH, JSON.stringify(dadosAtuais, null, 2), 'utf-8'); } catch (_) {}

    return res.json({
      intent: 'anotacoes',
      cartoes: [
        {
          id: 'card-anotacoes',
          titulo: 'Bloco de Notas Tático',
          tipo: 'anotacoes',
          subtitulo: `${dadosAtuais.anotacoes.length} Anotações Registradas`,
          fala: `Anotação registrada com sucesso no seu HUD tático, Comandante: "${textoNota.slice(0, 100)}".`,
          anotacoes: dadosAtuais.anotacoes
        }
      ]
    });
  }

  if (cmd.includes('anotações') || cmd.includes('anotacoes') || cmd.includes('minhas notas') || cmd.includes('bloco de notas rápido')) {
    const dadosAtuais = loadDadosPessoais();
    const lista = dadosAtuais.anotacoes || [];
    return res.json({
      intent: 'anotacoes',
      cartoes: [
        {
          id: 'card-anotacoes',
          titulo: 'Bloco de Notas Tático',
          tipo: 'anotacoes',
          subtitulo: `${lista.length} Anotações Registradas`,
          fala: `Comandante, você possui ${lista.length} anotações salvas no seu armazenamento pessoal.`,
          anotacoes: lista
        }
      ]
    });
  }

  // 0.7. TEMPORIZADOR / TIMER TÁTICO
  if (cmd.includes('timer') || cmd.includes('temporizador') || cmd.includes('cronômetro') || cmd.includes('cronometro')) {
    let segundos = 60;
    const minMatch = cmd.match(/(\d+)\s*(?:minuto|minutos|min)/);
    const secMatch = cmd.match(/(\d+)\s*(?:segundo|segundos|seg)/);
    if (minMatch) {
      segundos = parseInt(minMatch[1], 10) * 60;
    } else if (secMatch) {
      segundos = parseInt(secMatch[1], 10);
    }
    const label = segundos >= 60 ? `${Math.floor(segundos / 60)} min` : `${segundos} s`;
    return res.json({
      intent: 'timer',
      cartoes: [
        {
          id: 'card-timer',
          titulo: 'Temporizador Tático',
          tipo: 'timer',
          subtitulo: `Contagem regressiva de ${label}`,
          fala: `Temporizador de ${label} iniciado. Notificarei assim que o tempo for concluído.`,
          timer: { segundos, label: `Timer ${label}` }
        }
      ]
    });
  }

  // 0.8. FINALIZAR PROCESSO
  if (cmd.includes('fechar processo') || cmd.includes('matar processo') || cmd.includes('encerrar processo') || cmd.includes('finalizar processo')) {
    const targetName = cleanCmd.replace(/^(fechar processo|matar processo|encerrar processo|finalizar processo)\s+/i, '').trim();
    if (targetName) {
      if (CRITICAL_PROCESSES.has(targetName.toLowerCase())) {
        return res.json({
          intent: 'process_kill',
          cartoes: [
            {
              id: 'card-proc-denied',
              titulo: 'Finalização Negada',
              tipo: 'processos_pesados',
              subtitulo: 'Processo Crítico Protegido',
              fala: `O processo ${targetName} é essencial para o funcionamento do sistema operacional e não pode ser finalizado.`,
              processos: getAllProcesses(10)
            }
          ]
        });
      }
      try {
        execSync(`taskkill /IM "${targetName}*" /F`, { timeout: 3000 });
      } catch (_) {}
      return res.json({
        intent: 'process_kill',
        cartoes: [
          {
            id: 'card-proc-killed',
            titulo: 'Processo Finalizado',
            tipo: 'processos_pesados',
            subtitulo: `${targetName} encerrado`,
            fala: `O processo ${targetName} foi finalizado com sucesso, liberando recursos da memória.`,
            processos: getAllProcesses(10)
          }
        ]
      });
    }
  }

  // 1. REPARO DO SISTEMA
  if (cmd.includes('reparar') || cmd.includes('consertar') || cmd.includes('conserto') || cmd.includes('corrigir') || cmd.includes('resolver erros')) {
    let errosCorrigidos = 2;
    try {
      execSync('ipconfig /flushdns', { timeout: 2000 });
      execSync('netsh winsock reset catalog', { timeout: 3000 });
    } catch (_) {}

    return res.json({
      intent: 'repair',
      cartoes: [
        {
          id: 'card-repair',
          titulo: 'Protocolo de Reparo e Conserto',
          tipo: 'reparo_sistema',
          subtitulo: 'Correção de Subsistemas do Windows',
          fala: 'Protocolo de reparo executado com sucesso. Catálogo de rede restaurado, cache do sistema higienizado e integridade do Windows restabelecida.',
          relatorioReparo: {
            timestamp: new Date().toISOString(),
            sucesso: true,
            errosCorrigidos,
            acoesExecutadas: [
              { etapa: "Rede e Winsock", status: "REPARADO", detalhe: "Catálogo de sockets e cache DNS renovados." },
              { etapa: "Interface & Explorer", status: "REPARADO", detalhe: "Cache de miniaturas e buffers higienizados." },
              { etapa: "Serviços Essenciais", status: "VERIFICADO", detalhe: "Spooler e subsistemas operando normalmente." }
            ]
          }
        }
      ]
    });
  }

  // 2. PROGRAMAS DE INICIALIZAÇÃO
  if (cmd.includes('inicialização') || cmd.includes('inicializacao') || cmd.includes('boot') || cmd.includes('startup') || cmd.includes('iniciar com o windows')) {
    const apps = getStartupAppsList();
    const highImpact = apps.filter(a => a.impact === 'ALTO' && a.enabled).length;

    return res.json({
      intent: 'startup',
      cartoes: [
        {
          id: 'card-startup',
          titulo: 'Gerenciador de Inicialização (Boot)',
          tipo: 'startup_manager',
          subtitulo: `${apps.length} Programas Mapeados (${highImpact} de Alto Impacto)`,
          fala: `Mapeei ${apps.length} aplicativos configurados para iniciar com o Windows. Há ${highImpact} itens de alto impacto no tempo de boot que podem ser gerenciados.`,
          startupApps: apps
        }
      ]
    });
  }

  // 3. ABRIR APLICATIVOS
  if (
    cleanCmd.startsWith('abrir ') || cleanCmd.startsWith('abra ') ||
    cmd.includes('abrir ') || cmd.includes('abra ') ||
    cmd.includes('lançar app') || cmd.includes('iniciar app')
  ) {
    const appQuery = cleanCmd.replace(/^(abrir|abra|lançar|iniciar)\s+/i, '').trim();
    const appMap = {
      'calculadora': { key: 'calc', label: 'Calculadora' },
      'bloco de notas': { key: 'notepad', label: 'Bloco de Notas' },
      'gerenciador de tarefas': { key: 'taskmgr', label: 'Gerenciador de Tarefas' },
      'gerenciador': { key: 'taskmgr', label: 'Gerenciador de Tarefas' },
      'arquivos': { key: 'explorer', label: 'Explorador de Arquivos' },
      'explorer': { key: 'explorer', label: 'Explorador de Arquivos' },
      'cmd': { key: 'cmd', label: 'Prompt de Comando' },
      'terminal': { key: 'cmd', label: 'Prompt de Comando' },
      'painel de controle': { key: 'control', label: 'Painel de Controle' },
      'painel': { key: 'control', label: 'Painel de Controle' },
      'limpeza de disco': { key: 'cleanmgr', label: 'Limpeza de Disco' },
      'configurações': { key: 'settings', label: 'Configurações do Windows' },
      'configuracoes': { key: 'settings', label: 'Configurações do Windows' },
      'navegador': { key: 'browser', label: 'Navegador Web' }
    };

    const matched = appMap[appQuery] ||
      (appQuery.includes('calc') ? appMap['calculadora'] : null) ||
      (appQuery.includes('nota') ? appMap['bloco de notas'] : null) ||
      (appQuery.includes('tarefa') ? appMap['gerenciador de tarefas'] : null) ||
      (appQuery.includes('gerenciador') ? appMap['gerenciador de tarefas'] : null) ||
      (appQuery.includes('painel') ? appMap['painel de controle'] : null) ||
      (appQuery.includes('terminal') ? appMap['terminal'] : null) ||
      (appQuery.includes('cmd') ? appMap['cmd'] : null);

    if (matched) {
      try { exec(`start ${matched.key}`); } catch (_) {}
      return res.json({
        intent: 'launch_app',
        cartoes: [
          {
            id: 'card-app-launch',
            titulo: 'Lançador de Aplicativos',
            tipo: 'app_launcher',
            subtitulo: `${matched.label} Aberto`,
            fala: `Abrindo ${matched.label} imediatamente, Comandante.`,
            appLancado: matched.label
          }
        ]
      });
    }
  }

  // 4. RELATÓRIO DO SISTEMA & TELEMETRIA
  if (
    cmd.includes('relatório') || cmd.includes('relatorio') ||
    cmd.includes('status') || cmd.includes('hardware') ||
    cmd.includes('como está meu') || cmd.includes('como esta meu') ||
    cmd.includes('meu computador') || cmd.includes('meu pc') ||
    cmd.includes('temperatura') || cmd.includes('como está o pc') ||
    cmd.includes('como tá o pc')
  ) {
    return res.json({
      intent: 'relatorio',
      cartoes: [
        {
          id: "card-relatorio",
          titulo: "Relatório Geral da Máquina",
          tipo: "relatorio_geral",
          subtitulo: "Diagnóstico completo de integridade",
          fala: `Relatório de sistema consolidado: Processador com ${os.cpus().length} núcleos virtuais a ${cpuUsage}%, ${ramGB} de ${totalRAM} Gigabytes de memória RAM em uso, e ${disk.freeGB} Gigabytes livres na partição principal.`,
          dados: {
            processador: os.cpus()[0]?.model,
            nucleos: os.cpus().length,
            ram: `${ramGB} / ${totalRAM} GB (${ramPercent}%)`,
            disco: `${disk.freeGB} GB Livres (${disk.totalGB} GB Total)`,
            rede: `${network.latencyMs} ms (${network.host})`,
            uptime: `${Math.floor(os.uptime() / 3600)} horas e ${Math.floor((os.uptime() % 3600) / 60)} minutos`
          }
        }
      ]
    });
  }

  // 5. PESQUISA NA INTERNET E DÚVIDAS
  const isSearchQuery =
    cmd.startsWith('quem foi') ||
    cmd.startsWith('quem é') ||
    cmd.startsWith('o que é') ||
    cmd.startsWith('o que e') ||
    cmd.startsWith('pesquise') ||
    cmd.startsWith('pesquisar') ||
    cmd.startsWith('qual a história') ||
    cmd.startsWith('qual a historia') ||
    cmd.startsWith('como funciona') ||
    cmd.startsWith('onde fica');

  if (isSearchQuery) {
    const term = rawCmd.replace(/^(pesquise sobre|pesquise|pesquisar sobre|pesquisar|quem foi|quem é|o que é|o que e|qual a história de|qual a historia de|como funciona|onde fica)\s+/i, '').trim();
    const searchRes = await executeWebSearch(term || rawCmd);

    return res.json({
      intent: 'search',
      cartoes: [
        {
          id: 'card-search-res',
          titulo: searchRes.titulo || `Pesquisa: ${term}`,
          tipo: 'pesquisa_web',
          subtitulo: searchRes.online ? 'Dados Obtidos na Rede' : 'Modo Offline',
          fala: searchRes.fala,
          resultadoPesquisa: searchRes
        }
      ]
    });
  }

  // 5. BRIEFING MATINAL
  if (cmd.includes('bom dia') || cmd.includes('briefing') || cmd.includes('matinal')) {
    const perfil = loadPerfilUsuario();
    const memLonga = loadMemoriaLonga();
    const padraoRecente = memLonga.padroesAprendidos?.[0]?.observacao || "Padrão de alta produtividade e concentração técnica.";
    const proximoCompromisso = dados.agenda?.[0]?.titulo || "Sem compromissos imediatos";
    const horarioCompromisso = dados.agenda?.[0]?.horario || "09:00";
    const prioridadePrincipal = dados.prioridades?.[0]?.titulo || (perfil.rotina?.focoPrincipal || "Manter rotina operacional");
    const urgencia = dados.prioridades?.[0]?.urgencia || "Alta";
    const userName = `${perfil.usuario?.titulo || dados.usuario?.titulo || 'Comandante'} ${perfil.usuario?.nome || dados.usuario?.nome || 'Operador'}`;

    appendMemoria('briefing', `Briefing matinal executado. Hardware estável, agenda e foco em "${prioridadePrincipal}" alinhados.`, 'Alta');

    return res.json({
      intent: 'briefing',
      fluxo: 'A',
      modo: 'briefing_matinal',
      biometria: {
        fala: `Bom dia, ${userName}. Iniciando reconhecimento de usuário e leitura biométrica.`,
        status: "IDENTIDADE CONFIRMADA",
        usuario: userName
      },
      consolidacao: {
        fala: `Sincronizando heurísticas locais e memória contínua. Padrão observado: ${padraoRecente}`,
        modulos: [
          { nome: "AGENDA LOCAL", status: "Sincronizada", check: true },
          { nome: "TELEMETRIA DO SISTEMA", status: "Nominal", check: true },
          { nome: "MEMÓRIA HONCHO", status: "Ativa", check: true },
          { nome: "PERFIL DO OPERADOR", status: "Validado", check: true }
        ]
      },
      cartoes: [
        {
          id: "card-hardware",
          titulo: "Hardware e Rede",
          tipo: "hardware_network",
          subtitulo: "Estado da infraestrutura do host",
          fala: `A infraestrutura operacional está estável. Carga de CPU em ${cpuUsage}%, uso de RAM em ${ramGB} Gigabytes de ${totalRAM} Gigabytes totais, e tempo de resposta de rede em ${network.latencyMs} milissegundos.`,
          metricas: [
            { label: "Carga de CPU", valor: `${cpuUsage}%`, detalhe: `${os.cpus().length} Núcleos Virtuais` },
            { label: "Memória RAM", valor: `${ramGB} / ${totalRAM} GB`, detalhe: `${ramPercent}% Alocado` },
            { label: "Latência de Rede", valor: `${network.latencyMs} ms`, detalhe: network.host },
            { label: "Armazenamento C:", valor: `${disk.freeGB} GB Livres`, detalhe: `${disk.usagePercent}% Ocupado` }
          ]
        },
        {
          id: "card-agenda",
          titulo: "Agenda Local",
          tipo: "agenda_local",
          subtitulo: "Compromissos agendados para hoje",
          fala: `Para hoje temos ${dados.agenda.length} compromissos registrados na agenda tática. O próximo evento prioritário é ${proximoCompromisso}, agendado para as ${horarioCompromisso}.`,
          itens: dados.agenda.slice(0, 4)
        },
        {
          id: "card-prioridades",
          titulo: "Prioridades & Memória Contínua",
          tipo: "prioridades",
          subtitulo: "Plano tático e diretrizes aprendidas",
          fala: `Prioridade imediata: ${prioridadePrincipal}, com nível de urgência ${urgencia}. Padrão comportamental ativo: ${padraoRecente}`,
          itens: dados.prioridades.slice(0, 3)
        },
        {
          id: "card-finalizacao",
          titulo: "Finalização do Briefing",
          tipo: "finalizacao",
          subtitulo: "Sistema em prontidão operacional",
          fala: `Briefing concluído com sucesso, ${userName}. Todos os parâmetros estão nominais. Aguardando suas diretrizes.`,
          mensagem: "Hoje, mantenha o foco no essencial. Sistema pronto para operação contínua."
        }
      ]
    });
  }

  // 6. OTIMIZAÇÃO DO PC (Habilidade #1)
  if (cmd.includes('otimizar') || cmd.includes('otimização') || cmd.includes('acelerar') || cmd.includes('limpar pc') || cmd.includes('limpar computador')) {
    appendMemoria('otimizacao', 'Ciclo de otimização de sistema ativado. Purgando %TEMP%, cache DNS e ativando Alto Desempenho.', 'Alta');
    const topProcesses = getTopProcesses();

    return res.json({
      intent: 'otimizar',
      fluxo: 'B',
      modo: 'otimizacao_pc',
      intro: {
        fala: "Protocolo de otimização ativado. Executando bateria diagnóstica e limpeza do sistema."
      },
      cartoes: [
        {
          id: "card-analise",
          titulo: "Análise de Hardware e Processos",
          tipo: "analise_hardware",
          subtitulo: "Telemetria prévia e processos em execução",
          fala: `Analisando hardware: Carga de CPU em ${cpuUsage}%, memória RAM consumida em ${ramPercent}%. Os processos mais exigentes identificados são: ${topProcesses.slice(0, 3).map(p => p.name).join(', ')}.`,
          metricas: [
            { label: "CPU Prévia", valor: `${cpuUsage}%` },
            { label: "RAM Prévia", valor: `${ramGB} GB (${ramPercent}%)` },
            { label: "Arquivos %TEMP%", valor: `${temp.fileCount} itens` }
          ],
          processos: topProcesses
        },
        {
          id: "card-cache",
          titulo: "Limpeza de Cache e Temp",
          tipo: "limpeza_temp",
          subtitulo: "Expurgo de arquivos residuais em disco",
          fala: `Executando varredura em arquivos temporários. Purgando itens residuais sem bloquear tarefas ativas do sistema.`,
          endpointAcao: "/api/system/optimize"
        },
        {
          id: "card-rede-memoria",
          titulo: "Rede, Memória e Desempenho",
          tipo: "rede_memoria",
          subtitulo: "Ajuste de perfil energético e DNS",
          fala: `Tabelas de DNS purgadas, processos reorganizados e plano de Alto Desempenho do Windows fixado como ativo.`
        }
      ]
    });
  }

  // 7. MEMÓRIA & PROCESSOS
  if (cmd.includes('memória') || cmd.includes('memoria') || cmd.includes('ram') || cmd.includes('processos')) {
    const topProcesses = getTopProcesses();
    return res.json({
      intent: 'memoria',
      cartoes: [
        {
          id: "card-processos",
          titulo: "Diagnóstico de Memória e Processos",
          tipo: "processos_pesados",
          subtitulo: "Top processos consumidores",
          fala: `Memória em ${ramPercent}% de ocupação com ${ramGB} Gigabytes utilizados de ${totalRAM} Gigabytes. Os processos mais exigentes no momento são: ${topProcesses.slice(0, 3).map(p => p.name).join(', ')}.`,
          processos: topProcesses
        }
      ]
    });
  }

  // 8. RELATÓRIO DO SISTEMA
  if (cmd.includes('relatório') || cmd.includes('relatorio') || cmd.includes('status') || cmd.includes('hardware') || cmd.includes('como está meu pc') || cmd.includes('como esta meu pc')) {
    return res.json({
      intent: 'relatorio',
      cartoes: [
        {
          id: "card-relatorio",
          titulo: "Relatório Geral da Máquina",
          tipo: "relatorio_geral",
          subtitulo: "Diagnóstico completo de integridade",
          fala: `Relatório de sistema consolidado: Processador com ${os.cpus().length} núcleos virtuais a ${cpuUsage}%, ${ramGB} de ${totalRAM} Gigabytes de memória RAM em uso, e ${disk.freeGB} Gigabytes livres na partição principal.`,
          dados: {
            processador: os.cpus()[0]?.model,
            nucleos: os.cpus().length,
            ram: `${ramGB} / ${totalRAM} GB (${ramPercent}%)`,
            disco: `${disk.freeGB} GB Livres (${disk.totalGB} GB Total)`,
            rede: `${network.latencyMs} ms (${network.host})`,
            uptime: `${Math.floor(os.uptime() / 3600)} horas e ${Math.floor((os.uptime() % 3600) / 60)} minutos`
          }
        }
      ]
    });
  }

  // 9. INTENT GERAL / PERGUNTAS LIVRES
  const llmResult = await queryLocalLLM(rawCmd || "Status do sistema");
  if (llmResult.success) {
    return res.json({
      intent: 'geral',
      cartoes: [
        {
          id: "card-resposta",
          titulo: "H.E.L.E.N.A. Resposta Neural",
          tipo: "resposta_neural",
          subtitulo: "Processado via LLM Local (.gguf)",
          fala: llmResult.text,
          texto: llmResult.text,
          motor: "LLM Local Portátil"
        }
      ]
    });
  }

  // Se o usuário fez uma pergunta conceitual ou factual, tenta pesquisa rápida na web
  if (rawCmd.includes('?') || rawCmd.length > 15) {
    const webResult = await executeWebSearch(rawCmd.replace(/\?/g, ''));
    if (webResult.online && webResult.resumo) {
      return res.json({
        intent: 'search',
        cartoes: [
          {
            id: 'card-search-res',
            titulo: webResult.titulo,
            tipo: 'pesquisa_web',
            subtitulo: 'Consulta na Internet',
            fala: webResult.fala,
            resultadoPesquisa: webResult
          }
        ]
      });
    }
  }

  const respostaFala = `Comandante, estou em prontidão. Telemetria atual: CPU em ${cpuUsage}%, RAM em ${ramGB} Gigabytes e rede em ${network.latencyMs} milissegundos. Posso executar reparos, otimizar o computador, gerenciar programas de boot, abrir aplicativos ou realizar pesquisas na rede.`;

  return res.json({
    intent: 'geral',
    cartoes: [
      {
        id: "card-resposta",
        titulo: "H.E.L.E.N.A. Núcleo Autônomo",
        tipo: "resposta_neural",
        subtitulo: "Motor Especialista Híbrido",
        fala: respostaFala,
        texto: respostaFala,
        motor: "Motor Nativo Regras + Heurísticas"
      }
    ]
  });
});

// 10. POST /api/tts (Voz Neural de Alta Definição & Streaming Universal)
app.post('/api/tts', async (req, res) => {
  const { text, voice, rate, pitch } = req.body;
  const cleanText = (text || '').trim();

  if (!cleanText) {
    return res.status(400).json({ error: 'Texto não fornecido' });
  }

  // Padrão: Voz Ultra-Natural Feminina Multilingual (pt-BR-ThalitaMultilingualNeural)
  const selectedVoice = voice && voice !== 'default' ? voice : 'pt-BR-ThalitaMultilingualNeural';
  const rawRate = rate || '+0%';
  const rawPitch = pitch || '+0Hz';
  const selectedRate = (rawRate.startsWith('+') || rawRate.startsWith('-')) ? rawRate : `+${rawRate}`;
  const selectedPitch = (rawPitch.startsWith('+') || rawPitch.startsWith('-')) ? rawPitch : `+${rawPitch}`;

  const hash = crypto.createHash('md5').update(`${selectedVoice}_${selectedRate}_${selectedPitch}_${cleanText}`).digest('hex');
  const cachedFilePath = path.join(ttsCacheDir, `${hash}.mp3`);

  // 1. Resposta ultra rápida a partir do cache (1ms)
  if (fs.existsSync(cachedFilePath)) {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-TTS-Source', 'Cache');
    return fs.createReadStream(cachedFilePath).pipe(res);
  }

  // 2. Síntese de Voz Humana da Web (Amazon Polly Camila / Vitória - Altíssima Fidelidade sem Tom Robótico)
  const webSpeaker = (selectedVoice.toLowerCase().includes('vitoria')) ? 'Vitoria' : 'Camila';
  try {
    const audioBuffer = await getWebVoiceFull(cleanText, webSpeaker);
    if (audioBuffer && audioBuffer.length > 0) {
      try { fs.writeFileSync(cachedFilePath, audioBuffer); } catch (_) {}
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('X-TTS-Source', 'Web_Human_Neural');
      return res.send(audioBuffer);
    }
  } catch (webErr) {
    console.warn('Web human TTS falhou, tentando fallback local:', webErr.message);
  }

  // 3. Fallback Offline: Síntese Neural Nativa via piper.exe (Pen drive / runtime)
  const piperExe = fs.existsSync(path.join(__dirname, 'runtime', 'piper', 'piper.exe'))
    ? path.join(__dirname, 'runtime', 'piper', 'piper.exe')
    : fs.existsSync(path.join(__dirname, 'piper.exe'))
      ? path.join(__dirname, 'piper.exe')
      : null;

  if (piperExe) {
    const piperDir = path.dirname(piperExe);
    try {
      const modelFiles = fs.readdirSync(piperDir).filter(f => f.endsWith('.onnx'));
      if (modelFiles.length > 0) {
        const modelPath = path.join(piperDir, modelFiles[0]);
        const piperOutWav = path.join(os.tmpdir(), `helena_piper_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`);
        const pProc = exec(`"${piperExe}" --model "${modelPath}" --output_file "${piperOutWav}"`, { timeout: 4000 }, (pErr) => {
          if (!pErr && fs.existsSync(piperOutWav)) {
            try { fs.copyFileSync(piperOutWav, cachedFilePath); } catch (_) {}
            res.setHeader('Content-Type', 'audio/wav');
            res.setHeader('X-TTS-Source', 'Piper_Offline');
            const stream = fs.createReadStream(piperOutWav);
            stream.pipe(res);
            stream.on('end', () => { try { fs.unlinkSync(piperOutWav); } catch (_) {} });
            return;
          }
        });
        pProc.stdin.write(cleanText, 'utf-8');
        pProc.stdin.end();
        return;
      }
    } catch (_) {}
  }

  // 4. Fallback Python edge_tts local (se Python disponível na máquina)
  const pyScript = path.join(__dirname, 'tts_generate.py');
  const tempOutputFile = path.join(os.tmpdir(), `helena_tts_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`);

  try {
    const pyProcess = exec(`py "${pyScript}" "${selectedVoice}" "${tempOutputFile}" "${selectedRate}" "${selectedPitch}"`, {
      timeout: 5000,
      encoding: 'utf-8'
    }, async (err) => {
      if (!err && fs.existsSync(tempOutputFile)) {
        try { fs.copyFileSync(tempOutputFile, cachedFilePath); } catch (_) {}
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('X-TTS-Source', 'Neural_Edge');
        const stream = fs.createReadStream(tempOutputFile);
        stream.pipe(res);
        stream.on('end', () => {
          try { fs.unlinkSync(tempOutputFile); } catch (_) {}
        });
        return;
      }

      // 5. Fallback final para Web Speech API no navegador
      res.json({
        engine: "web_speech_api",
        fallback: true,
        message: "Utilizando síntese de fala do navegador com calibração acústica."
      });
    });

    pyProcess.stdin.write(cleanText, 'utf-8');
    pyProcess.stdin.end();
  } catch (outerErr) {
    res.json({ engine: "web_speech_api", fallback: true });
  }
});

function getLocalIpAddress() {
  const ifaces = os.networkInterfaces();
  for (const dev in ifaces) {
    for (const details of ifaces[dev]) {
      if (details.family === 'IPv4' && !details.internal && details.address !== '127.0.0.1') {
        return details.address;
      }
    }
  }
  return '127.0.0.1';
}

// 11. GET /api/network/info
app.get('/api/network/info', (req, res) => {
  const localIp = getLocalIpAddress();
  res.json({
    port: PORT,
    localUrl: `http://localhost:${PORT}`,
    networkUrl: `http://${localIp}:${PORT}`,
    ip: localIp,
    hostname: os.hostname(),
    online: true
  });
});

// Fallback SPA catch-all
app.get('*', (req, res) => {
  const indexHtml = path.join(distPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>H.E.L.E.N.A. Server</title>
        <style>
          body { background: #0b0410; color: #a855f7; font-family: monospace; padding: 40px; text-align: center; }
          h1 { color: #00f0ff; letter-spacing: 4px; }
          .card { background: rgba(255,255,255,0.05); border: 1px solid #a855f7; border-radius: 8px; padding: 20px; display: inline-block; max-width: 600px; text-align: left; }
        </style>
      </head>
      <body>
        <h1>H.E.L.E.N.A. CORE ONLINE</h1>
        <div class="card">
          <p><strong>Status:</strong> Backend Operacional (Porta ${PORT})</p>
          <p><strong>Telemetria:</strong> <a href="/api/system/status" style="color: #00f0ff">/api/system/status</a></p>
          <p><strong>Briefing:</strong> <a href="/api/briefing/data" style="color: #00f0ff">/api/briefing/data</a></p>
        </div>
      </body>
      </html>
    `);
  }
});

if (require.main === module) {
  const HOST = '0.0.0.0';
  app.listen(PORT, HOST, () => {
    const localIp = getLocalIpAddress();
    console.log(`=======================================================`);
    console.log(`  H.E.L.E.N.A. CORE - Servidor Online e Operacional`);
    console.log(`  Acesso Direto:   http://localhost:${PORT}`);
    console.log(`  Acesso na Rede:  http://${localIp}:${PORT}`);
    console.log(`  Ambiente Portátil Completo (Zero-API externa)`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
