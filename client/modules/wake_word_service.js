// =========================================================================
// H.E.L.E.N.A. — SERVIÇO DE ATIVAÇÃO POR VOZ PERMANENTE (WAKE WORD LOCAL)
// Escuta Contínua em Segundo Plano ("HELENA"), Sinal Sonoro, Captura de
// Comandos, Dispositivos de Entrada, Sensibilidade, Filtro de Ruído e TTS
// =========================================================================

const fs = require('fs');
const path = require('path');
const { spawn, exec, execSync } = require('child_process');
const windowsTools = require('./windows_tools');

const IS_WIN = process.platform === 'win32';
const ROOT_DIR = path.resolve(__dirname, '..');
const RUNTIME_DIR = path.join(ROOT_DIR, 'runtime');
const WAKE_CONFIG_FILE = path.join(RUNTIME_DIR, 'wake_word_config.json');
const WAKE_HISTORY_FILE = path.join(RUNTIME_DIR, 'wake_word_history.json');

if (!fs.existsSync(RUNTIME_DIR)) {
  try { fs.mkdirSync(RUNTIME_DIR, { recursive: true }); } catch (_) {}
}

const DEFAULT_WAKE_CONFIG = {
  enabled: true,
  wakeWord: 'HELENA',
  sensitivity: 0.75, // 0.1 (restrito) a 1.0 (alta sensibilidade)
  noiseSuppression: true,
  ambientThresholdDb: -42,
  playAcousticChime: true,
  speakResponseInBackground: true,
  selectedDeviceId: 'default',
  selectedDeviceName: 'Microfone Padrão do Sistema (Windows)',
  engineMode: 'windows_sapi_local', // 'windows_sapi_local' | 'openwakeword_whisper' | 'hud_hybrid'
  privacyLocalOnly: true,
  updatedAt: new Date().toISOString()
};

let wakeConfig = loadWakeConfig();
let listeningState = wakeConfig.enabled ? 'ACTIVE_LISTENING' : 'PAUSED'; // 'ACTIVE_LISTENING' | 'WAKE_DETECTED' | 'CAPTURED' | 'PROCESSING' | 'SPEAKING' | 'PAUSED'
let backgroundListenerProc = null;
let activeTtsProc = null;
let commandProcessorCallback = null; // Injetado pelo server.js para chamar o Cérebro Principal / Orquestrador
const wakeSseClients = new Set();

function loadWakeConfig() {
  try {
    if (fs.existsSync(WAKE_CONFIG_FILE)) {
      const saved = JSON.parse(fs.readFileSync(WAKE_CONFIG_FILE, 'utf-8'));
      return { ...DEFAULT_WAKE_CONFIG, ...saved };
    }
  } catch (_) {}
  saveWakeConfig(DEFAULT_WAKE_CONFIG);
  return { ...DEFAULT_WAKE_CONFIG };
}

function saveWakeConfig(cfg) {
  try {
    cfg.updatedAt = new Date().toISOString();
    fs.writeFileSync(WAKE_CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (_) {}
  return cfg;
}

function loadWakeHistory() {
  try {
    if (fs.existsSync(WAKE_HISTORY_FILE)) {
      const data = JSON.parse(fs.readFileSync(WAKE_HISTORY_FILE, 'utf-8'));
      if (Array.isArray(data)) return data;
    }
  } catch (_) {}
  return [];
}

function appendWakeHistory(entry) {
  if (!wakeConfig.privacyLocalOnly && wakeConfig.privacyLocalOnly !== undefined) {
    // Mesmo em modo local, salva apenas em disco local se autorizado
  }
  const list = loadWakeHistory();
  const item = {
    id: `wake-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    wakeWordDetected: 'HELENA',
    rawTranscript: entry.rawTranscript || '',
    cleanCommand: entry.cleanCommand || '',
    confidence: entry.confidence || 0.92,
    source: entry.source || 'BACKGROUND_SERVICE',
    executionRoute: entry.executionRoute || 'HELENA_CORE',
    intent: entry.intent || 'geral',
    responseSpoken: entry.responseSpoken || '',
    status: entry.status || 'EXECUTADO'
  };
  list.unshift(item);
  const trimmed = list.slice(0, 100);
  try {
    fs.writeFileSync(WAKE_HISTORY_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (_) {}
  broadcastWakeEvent('wakeword:history', item);
  return item;
}

function clearWakeHistory() {
  try {
    fs.writeFileSync(WAKE_HISTORY_FILE, JSON.stringify([], null, 2), 'utf-8');
  } catch (_) {}
  return [];
}

function broadcastWakeEvent(event, data) {
  const payload = JSON.stringify({ event, data, timestamp: Date.now() });
  for (const client of wakeSseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch (_) {
      wakeSseClients.delete(client);
    }
  }
}

function setListeningState(nextState, details = '') {
  listeningState = nextState;
  broadcastWakeEvent('wakeword:state', {
    listeningState,
    enabled: wakeConfig.enabled,
    details,
    timestamp: new Date().toISOString()
  });
}

// Emite sinal sonoro tático nativo no Windows quando a palavra "HELENA" é detectada
function playNativeWakeChime() {
  if (!IS_WIN || !wakeConfig.playAcousticChime) return;
  try {
    exec(`powershell -NoProfile -Command "[Console]::Beep(880, 90); [Console]::Beep(1320, 120)"`, { timeout: 2000 });
  } catch (_) {}
}

// Fala a resposta em segundo plano via SAPI5 nativo do Windows (mesmo sem navegador aberto)
function speakInBackgroundWindows(text) {
  if (!IS_WIN || !text) return;
  interruptBackgroundSpeech();
  const safeText = String(text)
    .replace(/["`$]/g, ' ')
    .replace(/\r?\n/g, ' ')
    .slice(0, 550);

  setListeningState('SPEAKING', safeText);

  const psScript = `
    Add-Type -AssemblyName System.Speech;
    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
    $voices = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -like 'pt-BR*' };
    if ($voices) { $synth.SelectVoice($voices[0].VoiceInfo.Name); }
    $synth.Rate = 1;
    $synth.Speak("${safeText}");
  `.replace(/\r?\n/g, ' ');

  activeTtsProc = exec(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript}"`, { timeout: 35000 }, () => {
    activeTtsProc = null;
    if (wakeConfig.enabled) {
      setListeningState('ACTIVE_LISTENING', 'Aguardando palavra de ativação "HELENA"...');
    } else {
      setListeningState('PAUSED', 'Microfone desativado pelo usuário.');
    }
  });
}

function interruptBackgroundSpeech() {
  if (activeTtsProc) {
    try {
      activeTtsProc.kill();
    } catch (_) {}
    activeTtsProc = null;
  }
  if (wakeConfig.enabled) {
    setListeningState('ACTIVE_LISTENING', 'Fala interrompida (Barge-in). Escutando...');
  }
}

// Lista dispositivos reais de áudio/microfone no Windows
function listAudioInputDevices() {
  const devices = [
    {
      id: 'default',
      name: 'Microfone Padrão do Sistema (Windows Default)',
      status: 'OK',
      isDefault: true
    }
  ];

  if (IS_WIN) {
    try {
      const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_SoundDevice | Select-Object Name, DeviceID, Status | ConvertTo-Json -Compress"`;
      const raw = execSync(cmd, { timeout: 3500, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      if (raw) {
        const parsed = JSON.parse(raw);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        for (const d of list) {
          if (d && d.Name) {
            devices.push({
              id: d.DeviceID || `dev-${devices.length}`,
              name: d.Name,
              status: d.Status || 'OK',
              isDefault: false
            });
          }
        }
      }
    } catch (_) {}
  }

  return devices;
}

// Verifica motores locais disponíveis (SAPI5 Nativo, openWakeWord, whisper.cpp)
function detectLocalVoiceEngines() {
  const voiceDir = path.join(RUNTIME_DIR, 'voice');
  const hasWhisperCpp = fs.existsSync(path.join(voiceDir, 'whisper-cli.exe')) || fs.existsSync(path.join(voiceDir, 'main.exe'));
  const hasOpenWakeWord = fs.existsSync(path.join(voiceDir, 'openwakeword.onnx'));

  return {
    windowsSapiRecognition: IS_WIN,
    whisperCppLocal: hasWhisperCpp,
    openWakeWordLocal: hasOpenWakeWord,
    edgeTtsAvailable: true,
    activeEngine: hasOpenWakeWord && hasWhisperCpp
      ? 'openWakeWord + whisper.cpp (Offline Nativo)'
      : 'Windows SAPI SpeechRecognitionEngine + WebSpeech Hybrid (100% Local)'
  };
}

// Inicia o daemon em segundo plano do Windows (.NET SpeechRecognitionEngine) para escutar "HELENA" sem navegador aberto
function startBackgroundWakeDaemon() {
  if (!IS_WIN || !wakeConfig.enabled) return;
  stopBackgroundWakeDaemon();

  const confidenceThreshold = Math.max(0.25, Math.min(0.9, 1.05 - wakeConfig.sensitivity * 0.65)).toFixed(2);

  // Script PowerShell/.NET contínuo que escuta "Helena" + comando via microfone padrão do Windows
  const psDaemonScript = `
    $ErrorActionPreference = 'Stop';
    try {
      Add-Type -AssemblyName System.Speech;
      $recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine;
      $recognizer.SetInputToDefaultAudioDevice();

      $choices = New-Object System.Speech.Recognition.Choices;
      $choices.Add(@(
        "Helena abra o Discord",
        "Helena organize minha pasta de Downloads",
        "Helena verifique o desempenho do meu computador",
        "Helena pesquise sobre inteligencia artificial",
        "Helena crie uma pasta chamada Projetos",
        "Helena abra meu projeto no Antigravity",
        "Helena abrir escritorio 3D",
        "Helena relatorio do sistema",
        "Helena otimizar computador"
      ));
      $gb = New-Object System.Speech.Recognition.GrammarBuilder($choices);
      $grammar = New-Object System.Speech.Recognition.Grammar($gb);
      $recognizer.LoadGrammar($grammar);

      $dictation = New-Object System.Speech.Recognition.DictationGrammar;
      $recognizer.LoadGrammar($dictation);

      Write-Output "WAKE_DAEMON_READY";
      while ($true) {
        $result = $recognizer.Recognize([TimeSpan]::FromSeconds(10));
        if ($result -ne $null -and $result.Text -ne $null) {
          $txt = $result.Text;
          $conf = $result.Confidence;
          if ($txt -match '(?i)\\bhelena\\b' -and $conf -ge ${confidenceThreshold}) {
            Write-Output ("WAKE_TRIGGER::" + $conf + "::" + $txt);
          }
        }
      }
    } catch {
      Write-Output ("WAKE_DAEMON_INFO::" + $_.Exception.Message);
    }
  `;

  try {
    backgroundListenerProc = spawn('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      psDaemonScript
    ], {
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true
    });

    backgroundListenerProc.stdout.on('data', (chunk) => {
      const lines = String(chunk).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (line === 'WAKE_DAEMON_READY') {
          windowsTools.logSystemServiceEvent('WAKE_WORD_DAEMON', 'Motor local System.Speech iniciado em segundo plano.');
          setListeningState('ACTIVE_LISTENING', 'Escuta permanente "HELENA" ativa em segundo plano.');
        } else if (line.startsWith('WAKE_TRIGGER::')) {
          const parts = line.split('::');
          const conf = parseFloat(parts[1]) || 0.9;
          const phrase = parts.slice(2).join('::');
          handleWakeWordPhrase({
            phrase,
            confidence: conf,
            source: 'WINDOWS_BACKGROUND_MIC',
            speakNatively: true
          });
        }
      }
    });

    backgroundListenerProc.on('exit', () => {
      backgroundListenerProc = null;
    });
  } catch (err) {
    windowsTools.logSystemServiceEvent('WAKE_WORD_WARN', err.message);
  }
}

function stopBackgroundWakeDaemon() {
  if (backgroundListenerProc) {
    try {
      backgroundListenerProc.kill();
    } catch (_) {}
    backgroundListenerProc = null;
  }
}

// Processa qualquer frase ativada por "HELENA ..." (vinda do serviço em segundo plano, do HUD ou de teste direto)
async function handleWakeWordPhrase({ phrase, confidence = 0.95, source = 'WAKE_WORD_ENGINE', speakNatively = false }) {
  if (!wakeConfig.enabled && source !== 'MANUAL_TEST') {
    return {
      ok: false,
      status: 'PAUSED',
      message: 'A escuta por palavra de ativação (Wake Word) está desativada nas configurações de privacidade.'
    };
  }

  const rawTranscript = String(phrase || '').trim();
  if (!rawTranscript) {
    return { ok: false, error: 'Frase de comando vazia.' };
  }

  // Verifica se contém a palavra de ativação "HELENA" (ou adiciona se foi acionado após o wake chime)
  const cleanCommand = rawTranscript.replace(/^(ei\s+|oi\s+|olá\s+)?helena[,:\s-]*/i, '').trim() || 'Status do sistema';

  // Passo 4 & 5: Detecta a palavra HELENA e emite sinal sonoro
  setListeningState('WAKE_DETECTED', `Palavra "HELENA" detectada (${Math.round(confidence * 100)}%)`);
  playNativeWakeChime();

  // Passo 6, 7 & 8: Captura o comando seguinte e interpreta no Cérebro Principal
  setListeningState('PROCESSING', `Interpretando: "${cleanCommand}"`);
  windowsTools.logSystemServiceEvent('WAKE_WORD_COMMAND', `Origem=${source} | Comando="${cleanCommand}"`);

  let brainResponse = {
    intent: 'geral',
    executionRoute: 'HELENA_CORE',
    fala: `Comando "${cleanCommand}" recebido e processado.`,
    cartoes: [],
    delegatedToAgents: false
  };

  if (typeof commandProcessorCallback === 'function') {
    try {
      brainResponse = await commandProcessorCallback(rawTranscript, cleanCommand, source);
    } catch (err) {
      brainResponse.fala = `Identifiquei sua chamada, Comandante, mas ocorreu um erro ao processar a tarefa: ${err.message}`;
    }
  }

  const spokenText =
    brainResponse.fala ||
    brainResponse.cartoes?.[0]?.fala ||
    brainResponse.cartoes?.[0]?.texto ||
    `Tarefa "${cleanCommand}" executada.`;

  const historyItem = appendWakeHistory({
    rawTranscript,
    cleanCommand,
    confidence,
    source,
    executionRoute: brainResponse.delegatedToAgents ? 'MULTI_AGENT_SQUAD' : 'HELENA_CORE_DIRECT',
    intent: brainResponse.intent || 'geral',
    responseSpoken: spokenText,
    status: 'EXECUTADO'
  });
  historyItem.responseSummary = spokenText;

  // Passo 10: O resultado é apresentado e comunicado por voz
  if (speakNatively && wakeConfig.speakResponseInBackground) {
    speakInBackgroundWindows(spokenText);
  } else {
    setListeningState(wakeConfig.enabled ? 'ACTIVE_LISTENING' : 'PAUSED', 'Pronta para o próximo comando "HELENA".');
  }

  broadcastWakeEvent('wakeword_completed', {
    historyItem,
    brainResponse
  });

  return {
    ok: true,
    triggered: true,
    wakeWordDetected: true,
    chimeEmitted: wakeConfig.playAcousticChime,
    rawTranscript,
    cleanCommand,
    executionRoute: historyItem.executionRoute,
    intent: brainResponse.intent,
    spokenText,
    cartoes: brainResponse.cartoes || [],
    delegatedToAgents: Boolean(brainResponse.delegatedToAgents),
    missionInfo: brainResponse.missionInfo || null,
    brainResponse,
    entry: historyItem,
    historyItem
  };
}

function updateWakeConfig(updates = {}) {
  const prevEnabled = wakeConfig.enabled;
  wakeConfig = saveWakeConfig({
    ...wakeConfig,
    ...updates,
    sensitivity: updates.sensitivity !== undefined
      ? Math.max(0.1, Math.min(1.0, Number(updates.sensitivity)))
      : wakeConfig.sensitivity
  });

  if (wakeConfig.enabled && !prevEnabled) {
    startBackgroundWakeDaemon();
    setListeningState('ACTIVE_LISTENING', 'Escuta permanente ativada.');
  } else if (!wakeConfig.enabled && prevEnabled) {
    stopBackgroundWakeDaemon();
    interruptBackgroundSpeech();
    setListeningState('PAUSED', 'Escuta permanente pausada pelo usuário.');
  }

  const snap = getWakeWordStatus();
  broadcastWakeEvent('wakeword_config', snap);
  return snap;
}

function cancelCurrentListening() {
  interruptBackgroundSpeech();
  setListeningState(wakeConfig.enabled ? 'ACTIVE_LISTENING' : 'PAUSED', 'Escuta atual cancelada pelo usuário.');
  return {
    ok: true,
    listeningState,
    listenerState: wakeConfig.enabled ? 'PASSIVE_LISTENING' : 'DISABLED',
    message: 'Captura de voz e fala em andamento foram canceladas imediatamente.'
  };
}

function getWakeWordStatus() {
  const devices = listAudioInputDevices();
  const history = loadWakeHistory().slice(0, 30).map((h) => ({
    ...h,
    responseSummary: h.responseSummary || h.responseSpoken || ''
  }));
  const mappedState = !wakeConfig.enabled
    ? 'DISABLED'
    : listeningState === 'WAKE_DETECTED'
      ? 'AWAITING_COMMAND'
      : listeningState === 'PROCESSING'
        ? 'PROCESSING_COMMAND'
        : 'PASSIVE_LISTENING';

  return {
    config: wakeConfig,
    listeningState,
    listenerState: mappedState,
    daemonRunning: Boolean(backgroundListenerProc),
    engines: detectLocalVoiceEngines(),
    devices,
    audioDevices: devices,
    history
  };
}

function addSseClient(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  wakeSseClients.add(res);
  res.write(`data: ${JSON.stringify({ event: 'wakeword_status', data: getWakeWordStatus() })}\n\n`);
  res.on('close', () => wakeSseClients.delete(res));
}

async function handleWakeWordUtterance(transcript, options = {}) {
  return handleWakeWordPhrase({
    phrase: transcript,
    source: options.source || 'HUD_VOICE',
    speakNatively: Boolean(options.speakInBackground)
  });
}

function initWakeWordService({ onProcessCommand, processBrainCommand }) {
  commandProcessorCallback = onProcessCommand || processBrainCommand;
  if (wakeConfig.enabled) {
    startBackgroundWakeDaemon();
  }
}

module.exports = {
  initWakeWordService,
  getWakeWordStatus,
  getStatusSnapshot: getWakeWordStatus,
  updateWakeConfig,
  updateConfig: updateWakeConfig,
  handleWakeWordPhrase,
  handleWakeWordUtterance,
  cancelCurrentListening,
  cancelListening: cancelCurrentListening,
  interruptBackgroundSpeech,
  listAudioInputDevices,
  loadWakeHistory,
  clearWakeHistory,
  clearHistory: clearWakeHistory,
  addSseClient,
  wakeSseClients
};
