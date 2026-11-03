// =========================================================================
// H.E.L.E.N.A. — MÓDULO DE MEMÓRIA PERSISTENTE ESTRUTURADA & PRIVACIDADE
// Armazena Preferências, Informações Autorizadas, Projetos, Tarefas,
// Decisões, Configurações e Contexto Isolado por Agente (Zero Vazamento)
// =========================================================================

const fs = require('fs');
const path = require('path');

const RUNTIME_DIR = path.resolve(__dirname, '..', 'runtime');
const MEMORY_DB_FILE = path.join(RUNTIME_DIR, 'structured_memory_db.json');

if (!fs.existsSync(RUNTIME_DIR)) {
  try { fs.mkdirSync(RUNTIME_DIR, { recursive: true }); } catch (_) {}
}

const DEFAULT_MEMORY_DB = {
  updatedAt: new Date().toISOString(),
  privacyControls: {
    sharePersonalDataWithAgents: false,
    allowVoiceHistoryStorage: true,
    allowTelemetryInCloudPrompts: true,
    agentScopes: {
      orchestrator: ['preferences', 'authorizedInfo', 'projects', 'decisions'],
      academic: ['preferences', 'projects'],
      archivist: ['projects'],
      builder: ['projects', 'decisions'],
      reviewer: ['projects', 'decisions']
    }
  },
  desktopConfig: {
    startupMode: 'background', // 'background' (Modo 1) | 'hud' (Modo 2)
    autoStartWithWindows: false,
    keepAliveOnWindowClose: true,
    pause3DWhenHidden: true,
    cpuAlertThresholdPercent: 85,
    ramAlertThresholdPercent: 85
  },
  preferences: [
    {
      id: 'pref-1',
      key: 'idioma_padrao',
      value: 'Português Brasileiro (pt-BR)',
      category: 'Comunicacao',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'pref-2',
      key: 'estilo_resposta',
      value: 'Elegante, objetiva, técnica e natural inspirada no JARVIS',
      category: 'Personalidade',
      updatedAt: new Date().toISOString()
    }
  ],
  authorizedInfo: [
    {
      id: 'auth-info-1',
      title: 'Diretórios de Trabalho Autorizados',
      content: 'Desktop, Documents, Downloads e pasta PC_Inside_Workspace',
      authorizedForAgents: true,
      updatedAt: new Date().toISOString()
    }
  ],
  projects: [
    {
      id: 'proj-helena',
      name: 'H.E.L.E.N.A. HUD & Core',
      path: path.resolve(__dirname, '..'),
      ide: 'Antigravity',
      status: 'Em Produção',
      description: 'Assistente pessoal JARVIS, sistema multiagente e escritório virtual 3D no Windows.',
      updatedAt: new Date().toISOString()
    }
  ],
  decisions: [
    {
      id: 'dec-1',
      title: 'Isolamento de Segurança e Confirmação Humana (HITL)',
      rationale: 'Operações destrutivas ou administrativas exigem confirmação explícita do usuário.',
      date: new Date().toISOString()
    }
  ],
  executionHistory: [],
  agentContexts: {
    orchestrator: { summary: 'Coordenação central de missões e distribuição inteligente.', recentNotes: [] },
    academic: { summary: 'Especialista em pesquisa, explicações e relatórios.', recentNotes: [] },
    archivist: { summary: 'Catalogação e organização segura de pastas locais.', recentNotes: [] },
    builder: { summary: 'Desenvolvimento de código, aplicações e testes.', recentNotes: [] },
    reviewer: { summary: 'Auditoria de qualidade, revisão de código e segurança.', recentNotes: [] }
  }
};

function loadMemoryDB() {
  try {
    if (fs.existsSync(MEMORY_DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(MEMORY_DB_FILE, 'utf-8'));
      return {
        ...DEFAULT_MEMORY_DB,
        ...parsed,
        privacyControls: {
          ...DEFAULT_MEMORY_DB.privacyControls,
          ...(parsed.privacyControls || {})
        },
        desktopConfig: {
          ...DEFAULT_MEMORY_DB.desktopConfig,
          ...(parsed.desktopConfig || {})
        },
        agentContexts: {
          ...DEFAULT_MEMORY_DB.agentContexts,
          ...(parsed.agentContexts || {})
        }
      };
    }
  } catch (err) {
    console.warn('[MemoryStore] Aviso ao ler structured_memory_db.json:', err.message);
  }
  saveMemoryDB(DEFAULT_MEMORY_DB);
  return JSON.parse(JSON.stringify(DEFAULT_MEMORY_DB));
}

function saveMemoryDB(db) {
  try {
    db.updatedAt = new Date().toISOString();
    if (Array.isArray(db.executionHistory) && db.executionHistory.length > 150) {
      db.executionHistory = db.executionHistory.slice(0, 150);
    }
    fs.writeFileSync(MEMORY_DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[MemoryStore] Erro ao salvar structured_memory_db.json:', err.message);
    return false;
  }
}

function queryMemory({ section, search = '' } = {}) {
  const db = loadMemoryDB();
  const q = (search || '').trim().toLowerCase();

  if (section && db[section] !== undefined) {
    const data = db[section];
    if (!q || !Array.isArray(data)) return data;
    return data.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
  }

  if (!q) return db;

  const filterList = (list) =>
    (Array.isArray(list) ? list : []).filter((item) => JSON.stringify(item).toLowerCase().includes(q));

  return {
    preferences: filterList(db.preferences),
    authorizedInfo: filterList(db.authorizedInfo),
    projects: filterList(db.projects),
    decisions: filterList(db.decisions),
    executionHistory: filterList(db.executionHistory)
  };
}

function upsertMemoryItem(section, item) {
  const validSections = ['preferences', 'authorizedInfo', 'projects', 'decisions', 'executionHistory'];
  if (!validSections.includes(section)) {
    throw new Error(`Seção de memória inválida: ${section}`);
  }
  const db = loadMemoryDB();
  const list = Array.isArray(db[section]) ? db[section] : [];
  const now = new Date().toISOString();

  if (item.id) {
    const idx = list.findIndex((x) => x.id === item.id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...item, updatedAt: now };
      db[section] = list;
      saveMemoryDB(db);
      return list[idx];
    }
  }

  const newItem = {
    id: item.id || `${section.slice(0, 4)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...item,
    createdAt: now,
    updatedAt: now
  };
  list.unshift(newItem);
  db[section] = list;
  saveMemoryDB(db);
  return newItem;
}

function deleteMemoryItem(section, id) {
  const validSections = ['preferences', 'authorizedInfo', 'projects', 'decisions', 'executionHistory'];
  if (!validSections.includes(section)) {
    throw new Error(`Seção inválida: ${section}`);
  }
  const db = loadMemoryDB();
  const before = (db[section] || []).length;
  db[section] = (db[section] || []).filter((x) => x.id !== id);
  saveMemoryDB(db);
  return { deleted: before !== db[section].length, remaining: db[section].length };
}

function updatePrivacyControls(updates) {
  const db = loadMemoryDB();
  db.privacyControls = {
    ...db.privacyControls,
    ...updates,
    agentScopes: {
      ...db.privacyControls.agentScopes,
      ...(updates.agentScopes || {})
    }
  };
  saveMemoryDB(db);
  return db.privacyControls;
}

function updateDesktopConfig(updates) {
  const db = loadMemoryDB();
  db.desktopConfig = {
    ...db.desktopConfig,
    ...updates
  };
  saveMemoryDB(db);
  return db.desktopConfig;
}

function recordExecutionEvent({ actor = 'HELENA_CORE', action, tool, target = '', status = 'SUCCESS', summary = '' }) {
  return upsertMemoryItem('executionHistory', {
    actor,
    action,
    tool,
    target,
    status,
    summary,
    timestamp: new Date().toISOString()
  });
}

function updateAgentMemoryContext(agentId, noteText) {
  const db = loadMemoryDB();
  if (!db.agentContexts[agentId]) {
    db.agentContexts[agentId] = { summary: '', recentNotes: [] };
  }
  db.agentContexts[agentId].recentNotes.unshift({
    id: `ctx-${Date.now()}`,
    text: String(noteText).slice(0, 400),
    timestamp: new Date().toISOString()
  });
  db.agentContexts[agentId].recentNotes = db.agentContexts[agentId].recentNotes.slice(0, 15);
  saveMemoryDB(db);
  return db.agentContexts[agentId];
}

// Retorna APENAS o contexto autorizado pelas regras de privacidade para o agente específico
function getAgentScopedContext(agentId) {
  const db = loadMemoryDB();
  const scopes = db.privacyControls.agentScopes?.[agentId] || ['projects'];
  const sharePersonal = Boolean(db.privacyControls.sharePersonalDataWithAgents);

  const scoped = {
    agentId,
    agentMemory: db.agentContexts[agentId] || { summary: '', recentNotes: [] }
  };

  if (scopes.includes('projects')) {
    scoped.projects = db.projects.slice(0, 5);
  }
  if (scopes.includes('decisions')) {
    scoped.decisions = db.decisions.slice(0, 5);
  }
  if (scopes.includes('preferences') && (sharePersonal || agentId === 'orchestrator')) {
    scoped.preferences = db.preferences;
  }
  if (scopes.includes('authorizedInfo')) {
    scoped.authorizedInfo = db.authorizedInfo.filter((i) => i.authorizedForAgents || sharePersonal);
  }

  return scoped;
}

function getMemorySnapshot() {
  return loadMemoryDB();
}

function setPreference(key, value, category = 'general') {
  return upsertMemoryItem('preferences', { key, value, category });
}

function upsertAuthorizedInfo(item) {
  return upsertMemoryItem('authorizedInfo', {
    ...item,
    authorizedForAgents: Boolean(item.authorizedForAgents ?? item.shareWithAgents)
  });
}

function upsertProject(item) {
  return upsertMemoryItem('projects', item);
}

function recordDecision(item) {
  return upsertMemoryItem('decisions', item);
}

function recordExecutionHistory(item) {
  return recordExecutionEvent({
    actor: item.actor || 'HELENA_CORE',
    action: item.command || item.action || '',
    tool: item.toolUsed || item.tool || 'helena_brain',
    target: item.intent || '',
    status: item.status || 'SUCCESS',
    summary: item.summary || ''
  });
}

module.exports = {
  loadMemoryDB,
  saveMemoryDB,
  queryMemory,
  upsertMemoryItem,
  deleteMemoryItem,
  updatePrivacyControls,
  updateDesktopConfig,
  recordExecutionEvent,
  updateAgentMemoryContext,
  getAgentScopedContext,
  getMemorySnapshot,
  setPreference,
  upsertAuthorizedInfo,
  upsertProject,
  recordDecision,
  recordExecutionHistory
};
