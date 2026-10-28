// =========================================================================
// H.E.L.E.N.A. AI HUB — NÚCLEO MODULAR DE PROVEDORES DE INTELIGÊNCIA ARTIFICIAL
// Suporta: Google Gemini, OpenAI, Anthropic Claude, Ollama Local e Core Offline
// =========================================================================

const fs = require('fs');
const path = require('path');
const http = require('http');

const RUNTIME_DIR = path.join(__dirname, 'runtime');
const CREDENTIALS_FILE = path.join(RUNTIME_DIR, 'credentials.json');
const AI_CONFIG_FILE = path.join(RUNTIME_DIR, 'ai_config.json');

if (!fs.existsSync(RUNTIME_DIR)) {
  try { fs.mkdirSync(RUNTIME_DIR, { recursive: true }); } catch (_) {}
}

const PROVIDERS_METADATA = {
  gemini: {
    nome: 'Google Gemini',
    tipo: 'cloud',
    modelos: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash'],
    modeloPadrao: 'gemini-2.5-flash',
    descricao: 'Raciocínio multimodal de alta velocidade e precisão analítica via Google AI.'
  },
  openai: {
    nome: 'OpenAI (GPT-4o)',
    tipo: 'cloud',
    modelos: ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o3-mini'],
    modeloPadrao: 'gpt-4o',
    descricao: 'Modelos de fronteira OpenAI para raciocínio complexo, código e síntese.'
  },
  claude: {
    nome: 'Anthropic Claude',
    tipo: 'cloud',
    modelos: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    modeloPadrao: 'claude-3-5-sonnet-20241022',
    descricao: 'Engenharia de software avançada e escrita refinada via Anthropic.'
  },
  ollama: {
    nome: 'Ollama (Modelos Locais)',
    tipo: 'local',
    endpoint: 'http://127.0.0.1:11434',
    modelos: ['qwen2.5-coder:7b', 'qwen2.5-coder:14b', 'hermes3:8b', 'llama3.1:8b'],
    modeloPadrao: 'qwen2.5-coder:7b',
    descricao: 'Execução 100% offline e privada acelerada na GPU do seu computador.'
  },
  llama_server: {
    nome: 'llama-server (.GGUF Portátil)',
    tipo: 'local',
    endpoint: 'http://127.0.0.1:8080',
    modelos: ['Hermes-3-Llama-3.1-8B.Q4_K_M.gguf'],
    modeloPadrao: 'Hermes-3-Llama-3.1-8B.Q4_K_M.gguf',
    descricao: 'Binário nativo C++ para pen drive sem serviços externos.'
  },
  core: {
    nome: 'Motor Especialista H.E.L.E.N.A. Core',
    tipo: 'offline_embutido',
    endpoint: 'local-process',
    modelos: ['Helena-Specialist-v2.5'],
    modeloPadrao: 'Helena-Specialist-v2.5',
    descricao: 'Motor cognitivo nativo embarcado no Node.js (sempre disponível).'
  }
};

function loadCredentials() {
  let creds = {
    geminiKey: process.env.GEMINI_API_KEY || '',
    openaiKey: process.env.OPENAI_API_KEY || '',
    claudeKey: process.env.ANTHROPIC_API_KEY || '',
    elevenlabsKey: process.env.ELEVENLABS_API_KEY || ''
  };

  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const data = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
      creds = { ...creds, ...data };
    }
  } catch (err) {
    console.error('Erro ao ler credentials.json:', err.message);
  }
  return creds;
}

function saveCredentials(updates) {
  const current = loadCredentials();
  const next = { ...current };

  if (updates.geminiKey !== undefined) next.geminiKey = (updates.geminiKey || '').trim();
  if (updates.openaiKey !== undefined) next.openaiKey = (updates.openaiKey || '').trim();
  if (updates.claudeKey !== undefined) next.claudeKey = (updates.claudeKey || '').trim();
  if (updates.elevenlabsKey !== undefined) next.elevenlabsKey = (updates.elevenlabsKey || '').trim();

  try {
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(next, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Erro ao gravar credentials.json:', err.message);
    return false;
  }
}

function maskKey(key) {
  if (!key || typeof key !== 'string' || key.length < 8) return null;
  const start = key.slice(0, 4);
  const end = key.slice(-4);
  return `${start}...${end}`;
}

function getMaskedCredentials() {
  const creds = loadCredentials();
  return {
    geminiKey: maskKey(creds.geminiKey),
    openaiKey: maskKey(creds.openaiKey),
    claudeKey: maskKey(creds.claudeKey),
    elevenlabsKey: maskKey(creds.elevenlabsKey),
    hasGemini: !!creds.geminiKey,
    hasOpenAI: !!creds.openaiKey,
    hasClaude: !!creds.claudeKey,
    hasElevenLabs: !!creds.elevenlabsKey
  };
}

function loadAIConfig() {
  let config = {
    provedorAtivo: 'core',
    modeloAtivo: 'Helena-Specialist-v2.5',
    activeProvider: 'core',
    activeModel: 'Helena-Specialist-v2.5',
    temperatura: 0.7,
    fallbackAutomatico: true
  };

  try {
    if (fs.existsSync(AI_CONFIG_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(AI_CONFIG_FILE, 'utf-8'));
      config = { ...config, ...parsed };
    }
  } catch (_) {}

  // Auto-detect if provider should be upgraded based on keys or local services
  const creds = loadCredentials();
  if (config.provedorAtivo === 'core') {
    if (creds.geminiKey) {
      config.provedorAtivo = 'gemini';
      config.modeloAtivo = 'gemini-2.5-flash';
    } else if (creds.openaiKey) {
      config.provedorAtivo = 'openai';
      config.modeloAtivo = 'gpt-4o';
    } else if (creds.claudeKey) {
      config.provedorAtivo = 'claude';
      config.modeloAtivo = 'claude-3-5-sonnet-20241022';
    }
  }

  config.activeProvider = config.provedorAtivo;
  config.activeModel = config.modeloAtivo;
  return config;
}

function saveAIConfig(newConfig) {
  const current = loadAIConfig();
  const next = { ...current, ...newConfig };
  if (newConfig.activeProvider) next.provedorAtivo = newConfig.activeProvider;
  if (newConfig.activeModel) next.modeloAtivo = newConfig.activeModel;
  if (newConfig.provedorAtivo) next.activeProvider = newConfig.provedorAtivo;
  if (newConfig.modeloAtivo) next.activeModel = newConfig.modeloAtivo;

  try {
    fs.writeFileSync(AI_CONFIG_FILE, JSON.stringify(next, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao gravar ai_config.json:', err.message);
  }
  return next;
}

// -------------------------------------------------------------------------
// CHAMADAS AOS PROVEDORES
// -------------------------------------------------------------------------

async function callGemini(apiKey, model, messages, systemPrompt) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents = [];
  for (const m of messages) {
    contents.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    });
  }

  const payload = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500
    }
  };

  if (systemPrompt) {
    payload.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(12000)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Gemini Error (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini retornou resposta vazia.');
  return text.trim();
}

async function callOpenAI(apiKey, model, messages, systemPrompt) {
  const endpoint = 'https://api.openai.com/v1/chat/completions';

  const fullMessages = [];
  if (systemPrompt) {
    fullMessages.push({ role: 'system', content: systemPrompt });
  }
  for (const m of messages) {
    fullMessages.push({ role: m.role, content: m.content });
  }

  const payload = {
    model: model || 'gpt-4o',
    messages: fullMessages,
    temperature: 0.7,
    max_tokens: 500
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(12000)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI Error (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI retornou conteúdo vazio.');
  return text.trim();
}

async function callClaude(apiKey, model, messages, systemPrompt) {
  const endpoint = 'https://api.anthropic.com/v1/messages';

  const userMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content
  }));

  const payload = {
    model: model || 'claude-3-5-sonnet-20241022',
    max_tokens: 500,
    temperature: 0.7,
    messages: userMessages
  };

  if (systemPrompt) {
    payload.system = systemPrompt;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(12000)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude Error (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error('Claude retornou conteúdo vazio.');
  return text.trim();
}

async function callOllama(model, messages, systemPrompt) {
  const endpoint = 'http://127.0.0.1:11434/api/chat';

  const fullMessages = [];
  if (systemPrompt) {
    fullMessages.push({ role: 'system', content: systemPrompt });
  }
  for (const m of messages) {
    fullMessages.push({ role: m.role, content: m.content });
  }

  const payload = {
    model: model || 'qwen2.5-coder:7b',
    messages: fullMessages,
    stream: false,
    options: {
      temperature: 0.7,
      num_predict: 250
    },
    think: false
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000)
  });

  if (!res.ok) {
    throw new Error(`Ollama indisponível no endpoint local (${res.status})`);
  }

  const data = await res.json();
  const text = data.message?.content;
  if (!text) throw new Error('Ollama retornou resposta vazia.');
  return text.trim();
}

// -------------------------------------------------------------------------
// QUERY PRINCIPAL COM FALLBACK RESILIENTE
// -------------------------------------------------------------------------

async function queryAI({ prompt, systemPrompt, conversationHistory = [] }) {
  const t0 = Date.now();
  const config = loadAIConfig();
  const creds = loadCredentials();

  const messages = [...conversationHistory];
  if (prompt) {
    messages.push({ role: 'user', content: prompt });
  }

  let lastError = null;
  const currentProvider = config.provedorAtivo;

  // 1. Tentar provedor configurado
  try {
    if (currentProvider === 'gemini') {
      if (!creds.geminiKey) throw new Error('Chave de API do Google Gemini não configurada.');
      const text = await callGemini(creds.geminiKey, config.modeloAtivo || 'gemini-2.5-flash', messages, systemPrompt);
      return {
        success: true,
        text,
        provedor: 'gemini',
        nomeProvedor: 'Google Gemini',
        modelo: config.modeloAtivo || 'gemini-2.5-flash',
        duracaoMs: Date.now() - t0
      };
    }

    if (currentProvider === 'openai') {
      if (!creds.openaiKey) throw new Error('Chave de API da OpenAI não configurada.');
      const text = await callOpenAI(creds.openaiKey, config.modeloAtivo || 'gpt-4o', messages, systemPrompt);
      return {
        success: true,
        text,
        provedor: 'openai',
        nomeProvedor: 'OpenAI',
        modelo: config.modeloAtivo || 'gpt-4o',
        duracaoMs: Date.now() - t0
      };
    }

    if (currentProvider === 'claude') {
      if (!creds.claudeKey) throw new Error('Chave de API da Anthropic Claude não configurada.');
      const text = await callClaude(creds.claudeKey, config.modeloAtivo || 'claude-3-5-sonnet-20241022', messages, systemPrompt);
      return {
        success: true,
        text,
        provedor: 'claude',
        nomeProvedor: 'Anthropic Claude',
        modelo: config.modeloAtivo || 'claude-3-5-sonnet-20241022',
        duracaoMs: Date.now() - t0
      };
    }

    if (currentProvider === 'ollama') {
      const text = await callOllama(config.modeloAtivo || 'qwen2.5-coder:7b', messages, systemPrompt);
      return {
        success: true,
        text,
        provedor: 'ollama',
        nomeProvedor: 'Ollama Local',
        modelo: config.modeloAtivo || 'qwen2.5-coder:7b',
        duracaoMs: Date.now() - t0
      };
    }
  } catch (err) {
    lastError = err.message;
    console.warn(`[H.E.L.E.N.A. AI Hub] Provedor "${currentProvider}" falhou: ${err.message}. Verificando fallback...`);
  }

  // 2. Fallback resiliente: tenta Ollama local se o principal falhou
  if (config.fallbackAutomatico && currentProvider !== 'ollama') {
    try {
      const text = await callOllama('qwen2.5-coder:7b', messages, systemPrompt);
      return {
        success: true,
        text,
        provedor: 'ollama',
        nomeProvedor: 'Ollama (Fallback Local)',
        modelo: 'qwen2.5-coder:7b',
        duracaoMs: Date.now() - t0,
        aviso: `Provedor primário indisponível: ${lastError}`
      };
    } catch (_) {}
  }

  // 3. Fallback final: Motor Especialista Core (Offline Heuristics)
  return {
    success: false,
    text: null,
    erro: lastError,
    provedor: 'core',
    nomeProvedor: 'H.E.L.E.N.A. Core Especialista',
    duracaoMs: Date.now() - t0
  };
}

// -------------------------------------------------------------------------
// TESTE DE CONEXÃO DE PROVEDOR
// -------------------------------------------------------------------------

async function testProviderConnection(providerId, customKey, customModel) {
  const t0 = Date.now();
  const creds = loadCredentials();
  const testMessage = [{ role: 'user', content: 'Responda apenas: CONEXAO_OK' }];
  const sys = 'Você é um assistente de teste de infraestrutura. Responda apenas com a palavra CONEXAO_OK.';

  try {
    if (providerId === 'gemini') {
      const key = customKey || creds.geminiKey;
      if (!key) return { success: false, erro: 'Chave do Google Gemini não informada.', duracaoMs: 0 };
      const res = await callGemini(key, customModel || 'gemini-2.5-flash', testMessage, sys);
      return { success: true, resposta: res, duracaoMs: Date.now() - t0 };
    }

    if (providerId === 'openai') {
      const key = customKey || creds.openaiKey;
      if (!key) return { success: false, erro: 'Chave da OpenAI não informada.', duracaoMs: 0 };
      const res = await callOpenAI(key, customModel || 'gpt-4o-mini', testMessage, sys);
      return { success: true, resposta: res, duracaoMs: Date.now() - t0 };
    }

    if (providerId === 'claude') {
      const key = customKey || creds.claudeKey;
      if (!key) return { success: false, erro: 'Chave da Anthropic Claude não informada.', duracaoMs: 0 };
      const res = await callClaude(key, customModel || 'claude-3-5-haiku-20241022', testMessage, sys);
      return { success: true, resposta: res, duracaoMs: Date.now() - t0 };
    }

    if (providerId === 'ollama') {
      const res = await callOllama(customModel || 'qwen2.5-coder:7b', testMessage, sys);
      return { success: true, resposta: res, duracaoMs: Date.now() - t0 };
    }

    if (providerId === 'core') {
      return { success: true, resposta: 'CONEXAO_OK (Local Offline)', duracaoMs: 1 };
    }

    return { success: false, erro: `Provedor desconhecido: ${providerId}` };
  } catch (err) {
    return { success: false, erro: err.message, duracaoMs: Date.now() - t0 };
  }
}

module.exports = {
  PROVIDERS_METADATA,
  loadCredentials,
  saveCredentials,
  getMaskedCredentials,
  loadAIConfig,
  saveAIConfig,
  queryAI,
  testProviderConnection
};
