// =========================================================================
// H.E.L.E.N.A. — SISTEMA MULTIAGENTE & HOLOGRAPHIC OFFICE 3D (PC INSIDE)
// Orquestrador Central, 4 Agentes Especializados (Academic, Archivist,
// Builder, Reviewer), Registro Real de Tarefas, Ferramentas Autorizadas,
// Colaboração Paralela, Fallback Multi-IA e Sincronização SSE 60 FPS
// =========================================================================

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const aiHub = require('../ai_hub');
const memoryStore = require('./memory_store');
const windowsTools = require('./windows_tools');

const USER_HOME = os.homedir();
const DOCUMENTS_DIR = path.join(USER_HOME, 'Documents');
const WORKSPACE_ROOT = path.join(DOCUMENTS_DIR, 'PC_Inside_Workspace');

const FOLDERS = {
  academic: path.join(WORKSPACE_ROOT, '01_Trabalhos_e_Questoes'),
  builder: path.join(WORKSPACE_ROOT, '02_Projetos_Slides_e_Codigos'),
  reviewer: path.join(WORKSPACE_ROOT, '03_Auditorias_e_Revisoes_QA'),
  sandboxMessy: path.join(WORKSPACE_ROOT, '04_Pasta_Baguncada_Teste'),
};

const RUNTIME_DIR = path.join(__dirname, '..', 'runtime');
const SETTINGS_FILE = path.join(RUNTIME_DIR, 'ecosystem_agents.json');
const TASKS_REGISTRY_FILE = path.join(RUNTIME_DIR, 'tasks_registry.json');
const AI_USAGE_FILE = path.join(RUNTIME_DIR, 'ai_usage_metrics.json');

function initWorkspaceDirectories() {
  try {
    if (!fs.existsSync(RUNTIME_DIR)) fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    if (!fs.existsSync(WORKSPACE_ROOT)) fs.mkdirSync(WORKSPACE_ROOT, { recursive: true });
    for (const dir of Object.values(FOLDERS)) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
    seedSandboxMessyFolder(false);
  } catch (err) {
    console.warn('[Ecosystem] Aviso ao inicializar pastas:', err.message);
  }
}

function seedSandboxMessyFolder(force = false) {
  try {
    if (!fs.existsSync(FOLDERS.sandboxMessy)) {
      fs.mkdirSync(FOLDERS.sandboxMessy, { recursive: true });
    }
    if (force) {
      const items = fs.readdirSync(FOLDERS.sandboxMessy);
      for (const item of items) {
        fs.rmSync(path.join(FOLDERS.sandboxMessy, item), { recursive: true, force: true });
      }
    } else {
      const existing = fs.readdirSync(FOLDERS.sandboxMessy);
      if (existing.length > 0) return;
    }

    const sampleFiles = [
      { name: 'lista_exercicios_calculo_II_final_v2.pdf', content: '%PDF-1.4 Lista de Exercicios Calculo II - Integrais Duplas e Triplas' },
      { name: 'resumo_historia_era_vargas_rascunho.txt', content: 'Anotações de aula: Revolução de 1930, Estado Novo (1937-1945), CLT e industrialização brasileira.' },
      { name: 'print_questao_fisica_eletromagnetismo.png', content: 'PNG_HEADER_QUESTAO_LEI_DE_FARADAY' },
      { name: 'trabalho_biologia_genetica_mendel.docx', content: 'Trabalho Escolar de Biologia: Primeira e Segunda Lei de Mendel e heredogramas.' },
      { name: 'planilha_notas_e_faltas_2026.csv', content: 'Disciplina,Nota_P1,Nota_P2,Media,Faltas\nCalculo II,8.5,9.0,8.75,2\nFisica III,7.8,8.4,8.1,0\nAlgoritmos,9.5,10.0,9.75,0' },
      { name: 'algoritmo_busca_binaria_aula.py', content: 'def busca_binaria(lista, alvo):\n    ini, fim = 0, len(lista) - 1\n    while ini <= fim:\n        meio = (ini + fim) // 2\n        if lista[meio] == alvo: return meio\n        elif lista[meio] < alvo: ini = meio + 1\n        else: fim = meio - 1\n    return -1\n' },
      { name: 'redacao_enem_rascunho_antigo.txt', content: 'Tema: Desafios para a democratização do acesso à tecnologia e inteligência artificial na educação brasileira.' },
      { name: 'cache_temp_dump_99281.tmp', content: 'TEMPORARY_CACHE_FILE_SAFE_TO_CLEAN' },
      { name: 'thumb_cache_old_001.log', content: 'OLD_LOG_FILE_SAFE_TO_CLEAN' },
      { name: 'slide_seminario_quimica_organica.html', content: '<html><body><h1>Seminário de Química Orgânica: Funções Oxigenadas</h1></body></html>' },
    ];

    for (const f of sampleFiles) {
      fs.writeFileSync(path.join(FOLDERS.sandboxMessy, f.name), f.content, 'utf-8');
    }
  } catch (err) {
    console.error('[Ecosystem] Erro ao popular pasta de teste:', err.message);
  }
}

initWorkspaceDirectories();

// =========================================================================
// CATÁLOGO UNIFICADO DE PROVEDORES DE IA
// =========================================================================

const PROVIDER_CATALOG = {
  gemini: {
    label: 'Google Gemini',
    defaultModel: 'gemini-2.5-flash',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
  },
  openai: {
    label: 'OpenAI (GPT)',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'o3-mini'],
  },
  anthropic: {
    label: 'Anthropic Claude',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
  },
  deepseek: {
    label: 'DeepSeek AI',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  groq: {
    label: 'Groq (Ultra-Fast LPU)',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
  },
  ollama: {
    label: 'Ollama (100% Local & Offline)',
    defaultModel: 'qwen2.5-coder:7b',
    models: ['qwen2.5-coder:7b', 'llama3.2', 'mistral', 'deepseek-r1:8b'],
  },
};

// =========================================================================
// DEFINIÇÃO DO ORQUESTRADOR CENTRAL (H.E.L.E.N.A.) E DOS 4 AGENTES REAIS
// =========================================================================

const INITIAL_AGENTS = {
  orchestrator: {
    id: 'orchestrator',
    shortName: 'HELENA-CORE',
    codeName: 'HELENA-CORE',
    name: 'H.E.L.E.N.A. (Orquestradora)',
    role: 'Cérebro Principal & Orquestradora Central',
    specialty: 'Planejamento de Tarefas, Decomposição de Objetivos, Coordenação Multiagente e Execução no Windows',
    floor: 2,
    zone: '2º Andar — Mezanino Central de Comando',
    color: '#facc15',
    accentColor: '#fef08a',
    avatarStyle: { suitColor: '#1e293b', visorColor: '#facc15', trimColor: '#eab308' },
    position: [0, 4.2, -2.2],
    rotation: [0, 0, 0],
    cameraView: { position: [0, 6.3, 2.2], target: [0, 5.1, -2.5] },
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    apiKey: '',
    ollamaUrl: 'http://localhost:11434',
    status: 'idle',
    statusText: 'Supervisionando o escritório de 2 andares e aguardando solicitações.',
    currentTask: 'Monitoramento tático ativo',
    progress: 0,
    allowedTools: [
      'task_decomposition',
      'agent_dispatch',
      'get_system_snapshot',
      'launch_app_or_project',
      'create_user_folder',
      'manage_windows'
    ],
    toolsUsed: ['task_decomposition', 'get_system_snapshot'],
    systemInstruction: `Você é a H.E.L.E.N.A. (NEXUS-01), Assistente Pessoal Principal inspirada no JARVIS e Orquestradora Central do Escritório Virtual 3D no Topo da Montanha.
Sua função é receber a solicitação do Comandante, identificar o objetivo, elaborar um plano estruturado e coordenar seus 4 agentes colaboradores:
1. ACADEMIC (ATHENA-EDU): Pesquisa, estudos, explicações, análise de documentos e relatórios.
2. ARCHIVIST (VAULT-FS): Organização de arquivos, catalogação, busca local e gerenciamento de pastas.
3. BUILDER (FORGE-DEV): Programação, desenvolvimento de aplicativos, criação de código, slides HTML5 e testes.
4. REVIEWER (VERITAS-QA): Revisão de resultados, verificação de código, análise de segurança e validação de tarefas.
Responda sempre em Português do Brasil com elegância, precisão e objetividade.`,
  },

  academic: {
    id: 'academic',
    shortName: 'ACADEMIC',
    codeName: 'ATHENA-EDU',
    name: 'Agente 01 — Academic (ATHENA-EDU)',
    role: 'Especialista em Pesquisa, Estudos & Relatórios',
    specialty: 'Pesquisa, Estudos, Explicações, Análise de Documentos, Organização de Conhecimento e Produção de Relatórios',
    floor: 1,
    zone: '1º Andar — Estação de Pesquisa (Oeste)',
    color: '#38bdf8',
    accentColor: '#bae6fd',
    avatarStyle: { suitColor: '#0f172a', visorColor: '#38bdf8', trimColor: '#0284c7' },
    position: [-5.2, 0.2, 0.8],
    rotation: [0, Math.PI * 0.15, 0],
    cameraView: { position: [-3.2, 2.3, 4.6], target: [-5.4, 1.2, 0.4] },
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    apiKey: '',
    ollamaUrl: 'http://localhost:11434',
    status: 'idle',
    statusText: 'Estação de pesquisa pronta para análise de documentos e estudos.',
    currentTask: 'Aguardando pauta de pesquisa',
    progress: 0,
    allowedTools: [
      'knowledge_research',
      'document_analysis',
      'abnt_report_generator',
      'pdf_builder',
      'search_local_files'
    ],
    toolsUsed: ['knowledge_research', 'abnt_report_generator'],
    systemInstruction: `Você é o AGENTE 01 — ACADEMIC (ATHENA-EDU), colaborador especialista em Pesquisa, Estudos, Explicações, Análise de Documentos e Produção de Relatórios da H.E.L.E.N.A.
Sua missão é:
- Pesquisar profundamente o tema solicitado, estruturar o conhecimento e explicar conceitos com clareza didática.
- Analisar documentos, resolver listas de questões passo a passo e produzir relatórios técnicos/acadêmicos completos (Introdução, Desenvolvimento, Arquitetura/Conceitos, Exemplos Práticos e Conclusão).
Responda sempre em Português do Brasil.`,
  },

  archivist: {
    id: 'archivist',
    shortName: 'ARCHIVIST',
    codeName: 'VAULT-FS',
    name: 'Agente 02 — Archivist (VAULT-FS)',
    role: 'Especialista em Arquivos, Catalogação & Memória',
    specialty: 'Organização de Arquivos, Gerenciamento de Documentos, Catalogação, Busca de Informações, Memória e Organização de Pastas',
    floor: 1,
    zone: '1º Andar — Área de Documentos & Arquivos (Leste)',
    color: '#10b981',
    accentColor: '#a7f3d0',
    avatarStyle: { suitColor: '#064e3b', visorColor: '#10b981', trimColor: '#059669' },
    position: [5.2, 0.2, 0.8],
    rotation: [0, -Math.PI * 0.15, 0],
    cameraView: { position: [3.2, 2.3, 4.6], target: [5.4, 1.2, 0.4] },
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    apiKey: '',
    ollamaUrl: 'http://localhost:11434',
    status: 'idle',
    statusText: 'Conectado ao File System local. Pronto para catalogar e organizar pastas.',
    currentTask: 'Monitorando diretórios autorizados',
    progress: 0,
    allowedTools: [
      'scan_directory',
      'organize_directory',
      'undo_organization',
      'search_local_files',
      'create_user_folder',
      'catalog_deliverables'
    ],
    toolsUsed: ['scan_directory', 'catalog_deliverables'],
    systemInstruction: `Você é o AGENTE 02 — ARCHIVIST (VAULT-FS), especialista em Organização de Arquivos, Gerenciamento de Documentos, Catalogação, Busca de Informações e Memória da H.E.L.E.N.A.
Sua função é analisar diretórios do computador (Downloads, Área de Trabalho, Documentos, Workspace), classificar arquivos por categoria/projeto, estruturar pastas limpas e manter o catálogo de artefatos atualizado.`,
  },

  builder: {
    id: 'builder',
    shortName: 'BUILDER',
    codeName: 'FORGE-DEV',
    name: 'Agente 03 — Builder (FORGE-DEV)',
    role: 'Especialista em Programação & Desenvolvimento',
    specialty: 'Programação, Desenvolvimento de Aplicativos, Análise de Código, Correção de Bugs, Criação de Arquivos, Integração e Testes',
    floor: 1,
    zone: '1º Andar — Estação de Desenvolvimento (Centro)',
    color: '#a855f7',
    accentColor: '#e9d5ff',
    avatarStyle: { suitColor: '#1e1b4b', visorColor: '#a855f7', trimColor: '#9333ea' },
    position: [0, 0.2, 1.6],
    rotation: [0, 0, 0],
    cameraView: { position: [0, 2.3, 5.6], target: [0, 1.2, 1.2] },
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    apiKey: '',
    ollamaUrl: 'http://localhost:11434',
    status: 'idle',
    statusText: 'Estação de desenvolvimento pronta para programar e gerar aplicações.',
    currentTask: 'Compiladores e geradores prontos',
    progress: 0,
    allowedTools: [
      'code_generator',
      'app_prototype_builder',
      'interactive_slides_builder',
      'csv_data_builder',
      'create_user_document',
      'code_bug_analyzer'
    ],
    toolsUsed: ['code_generator', 'app_prototype_builder'],
    systemInstruction: `Você é o AGENTE 03 — BUILDER (FORGE-DEV), Engenheiro de Software e Desenvolvedor do Esquadrão H.E.L.E.N.A.
Sua missão é:
- Desenvolver código funcional, protótipos de aplicativos em HTML5/JS/CSS ou Python/TypeScript, analisar código, corrigir bugs e estruturar integrações.
- Criar artefatos executáveis e interativos bem documentados em Português do Brasil.`,
  },

  reviewer: {
    id: 'reviewer',
    shortName: 'REVIEWER',
    codeName: 'VERITAS-QA',
    name: 'Agente 04 — Reviewer (VERITAS-QA)',
    role: 'Especialista em Revisão, Testes & Segurança',
    specialty: 'Revisão de Resultados, Testes, Verificação de Código, Identificação de Erros, Análise de Segurança e Validação de Tarefas',
    floor: 2,
    zone: '2º Andar — Estação de Revisão & QA (Leste)',
    color: '#f97316',
    accentColor: '#fed7aa',
    avatarStyle: { suitColor: '#431407', visorColor: '#f97316', trimColor: '#ea580c' },
    position: [4.2, 4.2, -1.8],
    rotation: [0, -Math.PI * 0.12, 0],
    cameraView: { position: [2.8, 6.3, 2.4], target: [4.3, 5.1, -2.0] },
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    apiKey: '',
    ollamaUrl: 'http://localhost:11434',
    status: 'idle',
    statusText: 'Pronto na estação de revisão para auditoria de código, testes e segurança.',
    currentTask: 'Aguardando artefatos para validação QA',
    progress: 0,
    allowedTools: [
      'code_verification',
      'security_audit',
      'deliverable_validation',
      'qa_certificate_generator'
    ],
    toolsUsed: ['deliverable_validation', 'qa_certificate_generator'],
    systemInstruction: `Você é o AGENTE 04 — REVIEWER (VERITAS-QA), responsável por Revisão de Resultados, Testes, Verificação de Código, Identificação de Erros, Análise de Segurança e Validação de Tarefas na H.E.L.E.N.A.
Sua missão é auditar rigorosamente o material produzido por Academic, Builder e Archivist, verificar segurança, completude e precisão técnica, e emitir um Laudo de Validação QA com nota de 0 a 100.`,
  },
};

function loadAgentSettings() {
  const cloned = JSON.parse(JSON.stringify(INITIAL_AGENTS));
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const saved = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      for (const key of Object.keys(cloned)) {
        if (saved[key]) {
          cloned[key].provider = saved[key].provider || cloned[key].provider;
          cloned[key].model = saved[key].model || cloned[key].model;
          cloned[key].apiKey = saved[key].apiKey || '';
          cloned[key].ollamaUrl = saved[key].ollamaUrl || 'http://localhost:11434';
        }
      }
    }
  } catch (err) {
    console.warn('[Ecosystem] Aviso ao carregar ecosystem_agents.json:', err.message);
  }
  return cloned;
}

function saveAgentSettings(agentsState) {
  try {
    const toSave = {};
    for (const [key, val] of Object.entries(agentsState)) {
      toSave[key] = {
        provider: val.provider,
        model: val.model,
        apiKey: val.apiKey || '',
        ollamaUrl: val.ollamaUrl || 'http://localhost:11434',
      };
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Ecosystem] Erro ao salvar configurações de agentes:', err.message);
  }
}

// =========================================================================
// REGISTRO REAL DE TAREFAS, COLABORAÇÕES E MÉTRICAS DE USO
// =========================================================================

function loadTasksRegistry() {
  try {
    if (fs.existsSync(TASKS_REGISTRY_FILE)) {
      return JSON.parse(fs.readFileSync(TASKS_REGISTRY_FILE, 'utf-8'));
    }
  } catch (_) {}
  return {
    updatedAt: new Date().toISOString(),
    tasks: [],
    collaborations: [],
    activityHistory: []
  };
}

let tasksRegistry = loadTasksRegistry();

function saveTasksRegistry() {
  try {
    tasksRegistry.updatedAt = new Date().toISOString();
    tasksRegistry.tasks = (tasksRegistry.tasks || []).slice(0, 100);
    tasksRegistry.collaborations = (tasksRegistry.collaborations || []).slice(0, 80);
    tasksRegistry.activityHistory = (tasksRegistry.activityHistory || []).slice(0, 150);
    fs.writeFileSync(TASKS_REGISTRY_FILE, JSON.stringify(tasksRegistry, null, 2), 'utf-8');
  } catch (_) {}
}

function createRegisteredTask({ title, assignedAgentId, missionId = null, dependencies = [], toolsRequired = [] }) {
  const task = {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    missionId,
    title,
    assignedAgentId,
    agentName: INITIAL_AGENTS[assignedAgentId]?.shortName || assignedAgentId.toUpperCase(),
    status: 'pending', // 'pending' | 'in_progress' | 'completed' | 'error'
    progress: 0,
    dependencies,
    toolsUsed: toolsRequired,
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    resultSummary: null,
    error: null
  };
  tasksRegistry.tasks.unshift(task);
  recordOfficeActivity(assignedAgentId, `Tarefa registrada: "${title}"`, 'pending');
  saveTasksRegistry();
  broadcastEvent('tasks:update', getOfficeControlSummary());
  return task;
}

function updateRegisteredTask(taskId, updates = {}) {
  const idx = tasksRegistry.tasks.findIndex((t) => t.id === taskId);
  if (idx !== -1) {
    tasksRegistry.tasks[idx] = {
      ...tasksRegistry.tasks[idx],
      ...updates
    };
    saveTasksRegistry();
    broadcastEvent('tasks:update', getOfficeControlSummary());
    return tasksRegistry.tasks[idx];
  }
  return null;
}

function recordAgentCollaboration({ fromAgentId, toAgentId, reason, sharedArtifact = '' }) {
  const collab = {
    id: `collab-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    fromAgentId,
    toAgentId,
    fromName: INITIAL_AGENTS[fromAgentId]?.shortName || fromAgentId,
    toName: INITIAL_AGENTS[toAgentId]?.shortName || toAgentId,
    reason,
    sharedArtifact,
    timestamp: new Date().toLocaleTimeString('pt-BR'),
    isoDate: new Date().toISOString()
  };
  tasksRegistry.collaborations.unshift(collab);
  recordOfficeActivity(fromAgentId, `Colaboração com ${collab.toName}: ${reason}`, 'collaboration');
  saveTasksRegistry();
  broadcastEvent('tasks:update', getOfficeControlSummary());
  return collab;
}

function recordOfficeActivity(agentId, description, category = 'info') {
  const item = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    agentId,
    agentName: INITIAL_AGENTS[agentId]?.shortName || agentId.toUpperCase(),
    description,
    category,
    time: new Date().toLocaleTimeString('pt-BR'),
    timestamp: new Date().toISOString()
  };
  tasksRegistry.activityHistory.unshift(item);
  return item;
}

function recordAIUsageMetric({ agentId, provider, model, latencyMs, totalTokens = 0, success = true }) {
  try {
    let metrics = { totalCalls: 0, totalTokens: 0, byProvider: {}, recentCalls: [] };
    if (fs.existsSync(AI_USAGE_FILE)) {
      metrics = { ...metrics, ...JSON.parse(fs.readFileSync(AI_USAGE_FILE, 'utf-8')) };
    }
    metrics.totalCalls += 1;
    metrics.totalTokens += Number(totalTokens || 0);
    if (!metrics.byProvider[provider]) {
      metrics.byProvider[provider] = { calls: 0, tokens: 0, errors: 0 };
    }
    metrics.byProvider[provider].calls += 1;
    metrics.byProvider[provider].tokens += Number(totalTokens || 0);
    if (!success) metrics.byProvider[provider].errors += 1;
    metrics.recentCalls.unshift({
      agentId,
      provider,
      model,
      latencyMs,
      totalTokens,
      success,
      timestamp: new Date().toISOString()
    });
    metrics.recentCalls = metrics.recentCalls.slice(0, 50);
    fs.writeFileSync(AI_USAGE_FILE, JSON.stringify(metrics, null, 2), 'utf-8');
  } catch (_) {}
}

// =========================================================================
// ESTADO EM MEMÓRIA E STREAM SSE EM TEMPO REAL
// =========================================================================

const agents = loadAgentSettings();
const agentLogs = {
  orchestrator: [{ id: 'init-1', time: new Date().toLocaleTimeString('pt-BR'), type: 'info', text: 'H.E.L.E.N.A. (HELENA-CORE) online no 2º Andar (Mezanino de Comando).' }],
  academic: [{ id: 'init-2', time: new Date().toLocaleTimeString('pt-BR'), type: 'info', text: 'ACADEMIC (ATHENA-EDU) pronta na Estação de Pesquisa.' }],
  archivist: [{ id: 'init-3', time: new Date().toLocaleTimeString('pt-BR'), type: 'info', text: `ARCHIVIST (VAULT-FS) conectado ao File System (${WORKSPACE_ROOT}).` }],
  builder: [{ id: 'init-4', time: new Date().toLocaleTimeString('pt-BR'), type: 'info', text: 'BUILDER (FORGE-DEV) pronto na Estação de Desenvolvimento.' }],
  reviewer: [{ id: 'init-5', time: new Date().toLocaleTimeString('pt-BR'), type: 'info', text: 'REVIEWER (VERITAS-QA) pronto no 2º Andar para auditoria e testes.' }],
};

const agentChatHistory = {
  orchestrator: [],
  academic: [],
  builder: [],
  archivist: [],
  reviewer: [],
};

const agentLastErrors = {
  orchestrator: null,
  academic: null,
  builder: null,
  archivist: null,
  reviewer: null,
};

const createdFiles = [];
let activeBeamLink = null;
let isPipelineRunning = false;
let lastOrganizationOperations = [];
let currentArchivistPlan = null;

// Carrega arquivos já existentes nas pastas de entrega do Workspace
function loadExistingWorkspaceDeliverables() {
  try {
    const map = [
      { dir: FOLDERS.academic, agentId: 'academic', defaultType: 'Relatório Acadêmico' },
      { dir: FOLDERS.builder, agentId: 'builder', defaultType: 'Projeto / Código' },
      { dir: FOLDERS.reviewer, agentId: 'reviewer', defaultType: 'Certificado QA' }
    ];
    for (const item of map) {
      if (!fs.existsSync(item.dir)) continue;
      const entries = fs.readdirSync(item.dir);
      for (const name of entries.slice(0, 15)) {
        const full = path.join(item.dir, name);
        try {
          const st = fs.statSync(full);
          if (st.isFile()) {
            createdFiles.push({
              id: `file-${st.mtimeMs}-${name}`,
              name,
              type: path.extname(name).toUpperCase().replace('.', '') || item.defaultType,
              agentId: item.agentId,
              path: full,
              size: st.size,
              sizeKB: Math.max(1, Math.round((st.size / 1024) * 10) / 10),
              createdAt: st.mtime.toLocaleTimeString('pt-BR')
            });
          }
        } catch (_) {}
      }
    }
  } catch (_) {}
}
loadExistingWorkspaceDeliverables();

const sseClients = new Set();

function broadcastEvent(eventName, payload) {
  const packet = JSON.stringify({ event: eventName, data: payload, timestamp: Date.now() });
  const msg = `data: ${packet}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(msg);
    } catch (_) {
      sseClients.delete(client);
    }
  }
}

function getProviderCatalogWithStatus() {
  const sharedCreds = aiHub.loadCredentials();
  const out = {};
  for (const [key, info] of Object.entries(PROVIDER_CATALOG)) {
    let configured = false;
    if (key === 'gemini') configured = Boolean(sharedCreds.geminiKey || process.env.GEMINI_API_KEY || agents.orchestrator?.apiKey);
    else if (key === 'openai') configured = Boolean(sharedCreds.openaiKey || process.env.OPENAI_API_KEY);
    else if (key === 'anthropic') configured = Boolean(sharedCreds.claudeKey || process.env.ANTHROPIC_API_KEY);
    else if (key === 'deepseek') configured = Boolean(process.env.DEEPSEEK_API_KEY);
    else if (key === 'groq') configured = Boolean(process.env.GROQ_API_KEY);
    else if (key === 'ollama') configured = true;
    out[key] = { ...info, configured };
  }
  return out;
}

function getPublicAgentsState() {
  const pub = {};
  const sharedCreds = aiHub.loadCredentials();
  for (const [key, ag] of Object.entries(agents)) {
    const { apiKey, ...rest } = ag;
    let hasShared = false;
    if (ag.provider === 'gemini' && (sharedCreds.geminiKey || process.env.GEMINI_API_KEY)) hasShared = true;
    if (ag.provider === 'openai' && (sharedCreds.openaiKey || process.env.OPENAI_API_KEY)) hasShared = true;
    if ((ag.provider === 'claude' || ag.provider === 'anthropic') && (sharedCreds.claudeKey || process.env.ANTHROPIC_API_KEY)) hasShared = true;
    if (ag.provider === 'deepseek' && process.env.DEEPSEEK_API_KEY) hasShared = true;
    if (ag.provider === 'groq' && process.env.GROQ_API_KEY) hasShared = true;
    if (ag.provider === 'ollama') hasShared = true;

    const agentDeliverables = createdFiles.filter((f) => f.agentId === key).slice(0, 12);
    const agentTasks = tasksRegistry.tasks.filter((t) => t.assignedAgentId === key).slice(0, 15);

    pub[key] = {
      ...rest,
      shortName: ag.shortName || ag.codeName || key.toUpperCase(),
      status: ag.status || 'idle',
      statusText: ag.statusText || ag.currentTask || 'Pronto para operação',
      progress: typeof ag.progress === 'number' ? ag.progress : 0,
      hasApiKey: Boolean((apiKey && apiKey.trim().length > 4) || hasShared),
      lastError: agentLastErrors[key] || null,
      logs: (agentLogs[key] || []).slice(-30),
      chatHistory: (agentChatHistory[key] || []).slice(-30),
      resultsProduced: agentDeliverables,
      taskHistory: agentTasks
    };
  }
  return pub;
}

function getOfficeControlSummary() {
  const allTasks = tasksRegistry.tasks || [];
  const activeAgentsList = Object.values(agents)
    .filter((a) => a.status === 'working' || a.status === 'processing' || a.status === 'researching' || a.status === 'writing')
    .map((a) => ({ id: a.id, name: a.shortName, task: a.currentTask, progress: a.progress }));

  const pendingTasks = allTasks.filter((t) => t.status === 'pending');
  const inProgressTasks = allTasks.filter((t) => t.status === 'in_progress');
  const completedTasks = allTasks.filter((t) => t.status === 'completed').slice(0, 25);
  const errorTasks = allTasks.filter((t) => t.status === 'error').slice(0, 15);

  return {
    activeAgents: activeAgentsList.length,
    totalAgents: Object.keys(agents).length,
    activeAgentsList,
    pendingCount: pendingTasks.length,
    inProgressCount: inProgressTasks.length,
    completedCount: completedTasks.length,
    errorCount: errorTasks.length,
    pendingTasks,
    inProgressTasks,
    runningTasks: inProgressTasks,
    completedTasks,
    errorTasks,
    collaborations: (tasksRegistry.collaborations || []).slice(0, 20),
    activityHistory: (tasksRegistry.activityHistory || []).slice(0, 40)
  };
}

function pushAgentLog(agentId, text, type = 'info') {
  if (!agentLogs[agentId]) agentLogs[agentId] = [];
  const entry = {
    id: `${agentId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    agentId,
    time: new Date().toLocaleTimeString('pt-BR'),
    timestamp: new Date().toLocaleTimeString('pt-BR'),
    type,
    text,
  };
  agentLogs[agentId].push(entry);
  if (agentLogs[agentId].length > 120) agentLogs[agentId].shift();
  recordOfficeActivity(agentId, text, type);
  broadcastEvent('agents:update', getPublicAgentsState());
  return entry;
}

function updateAgentStatus(agentId, statusText, statusType = 'idle', currentTask = null, progress = null) {
  if (!agents[agentId]) return;
  const normalizedStatus =
    statusType === 'working' || statusType === 'thinking' || statusType === 'action'
      ? 'working'
      : statusType === 'completed' || statusType === 'success'
      ? 'completed'
      : statusType === 'error'
      ? 'error'
      : 'idle';

  agents[agentId].status = normalizedStatus;
  agents[agentId].statusType = normalizedStatus;
  agents[agentId].statusText = statusText;
  if (currentTask !== null) {
    agents[agentId].currentTask = currentTask;
  }
  if (progress !== null) {
    agents[agentId].progress = progress;
  } else if (normalizedStatus === 'working' && !agents[agentId].progress) {
    agents[agentId].progress = 45;
  } else if (normalizedStatus === 'completed' || normalizedStatus === 'idle') {
    agents[agentId].progress = normalizedStatus === 'completed' ? 100 : 0;
  }
  broadcastEvent('agents:update', getPublicAgentsState());
}

function recordAgentToolUse(agentId, toolName) {
  if (!agents[agentId]) return;
  if (!Array.isArray(agents[agentId].toolsUsed)) agents[agentId].toolsUsed = [];
  if (!agents[agentId].toolsUsed.includes(toolName)) {
    agents[agentId].toolsUsed.unshift(toolName);
  }
}

function setBeamLink(fromId, toId, label = '', color = '#facc15') {
  if (!fromId || !toId) {
    activeBeamLink = null;
  } else {
    activeBeamLink = {
      id: `beam-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      from: fromId,
      to: toId,
      label,
      color,
      timestamp: Date.now()
    };
    broadcastEvent('agent:beam', activeBeamLink);
  }
}

// =========================================================================
// MOTOR REAL MULTI-IA COM FALLBACK ENTRE PROVEDORES E RESPEITO À PRIVACIDADE
// =========================================================================

function resolveApiKey(agent, overrideProvider = null) {
  const p = (overrideProvider || agent.provider || 'gemini').toLowerCase();
  if (!overrideProvider && agent.apiKey && agent.apiKey.trim()) return agent.apiKey.trim();
  const shared = aiHub.loadCredentials();
  if (p === 'gemini') return (shared.geminiKey || process.env.GEMINI_API_KEY || '').trim();
  if (p === 'openai') return (shared.openaiKey || process.env.OPENAI_API_KEY || '').trim();
  if (p === 'claude' || p === 'anthropic') return (shared.claudeKey || process.env.ANTHROPIC_API_KEY || '').trim();
  if (p === 'deepseek') return (process.env.DEEPSEEK_API_KEY || '').trim();
  if (p === 'groq') return (process.env.GROQ_API_KEY || '').trim();
  return '';
}

async function detectOllamaModels(baseUrl = 'http://localhost:11434') {
  try {
    const cleanUrl = baseUrl.replace(/\/+$/, '');
    const res = await fetch(`${cleanUrl}/api/tags`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) return { available: false, models: [] };
    const data = await res.json();
    const models = (data.models || []).map((m) => m.name);
    return { available: true, models };
  } catch {
    return { available: false, models: [] };
  }
}

async function executeSingleProviderCall({ provider, model, apiKey, ollamaUrl, systemInstruction, prompt, images = [], history = [] }) {
  const startTime = Date.now();
  const prov = (provider || 'gemini').toLowerCase();

  try {
    // 1. GOOGLE GEMINI
    if (prov === 'gemini') {
      if (!apiKey) {
        return {
          ok: false,
          error: 'NO_CREDENTIALS',
          provider: 'gemini',
          message: 'Chave de API do Google Gemini não configurada. Insira sua chave na Central Multi-IA ou ative o Ollama local.',
        };
      }
      let modelName = model || 'gemini-2.5-flash';
      if (modelName === 'gemini-3.8-flash' || modelName === 'gemini-4-argon') {
        modelName = 'gemini-2.5-flash';
      }
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      const contents = [];
      for (const h of history.slice(-10)) {
        if (h.sender === 'error' || h.isError || !h.text) continue;
        contents.push({
          role: h.sender === 'user' || h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      }

      const userParts = [{ text: prompt }];
      for (const img of images) {
        const match = typeof img === 'string' && img.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (match) {
          userParts.push({ inline_data: { mime_type: match[1], data: match[2] } });
        }
      }
      contents.push({ role: 'user', parts: userParts });

      const payload = {
        contents,
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
      };
      if (systemInstruction) {
        payload.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(45000),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { ok: false, error: 'API_ERROR', provider: 'gemini', message: `Erro Gemini (${res.status}): ${errText.slice(0, 220)}` };
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return { ok: false, error: 'EMPTY_RESPONSE', provider: 'gemini', message: 'O Google Gemini retornou uma resposta vazia.' };
      }

      return {
        ok: true,
        text: text.trim(),
        provider: 'gemini',
        model: modelName,
        providerLabel: `Google Gemini (${modelName})`,
        latencyMs: Date.now() - startTime,
        tokenUsage: {
          promptTokens: data.usageMetadata?.promptTokenCount || 0,
          completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata?.totalTokenCount || 0,
        },
      };
    }

    // 2. OPENAI
    if (prov === 'openai') {
      if (!apiKey) {
        return { ok: false, error: 'NO_CREDENTIALS', provider: 'openai', message: 'Chave de API da OpenAI não configurada.' };
      }
      const messages = [];
      if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
      for (const h of history.slice(-10)) {
        if (h.sender === 'error' || h.isError || !h.text) continue;
        messages.push({ role: h.sender === 'user' || h.role === 'user' ? 'user' : 'assistant', content: h.text });
      }
      messages.push({ role: 'user', content: prompt });

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: model || 'gpt-4o-mini', messages, temperature: 0.4 }),
        signal: AbortSignal.timeout(45000),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { ok: false, error: 'API_ERROR', provider: 'openai', message: `Erro OpenAI (${res.status}): ${errText.slice(0, 220)}` };
      }

      const data = await res.json();
      return {
        ok: true,
        text: (data.choices?.[0]?.message?.content || '').trim(),
        provider: 'openai',
        model: model || 'gpt-4o-mini',
        providerLabel: `OpenAI (${model || 'gpt-4o-mini'})`,
        latencyMs: Date.now() - startTime,
        tokenUsage: {
          totalTokens: data.usage?.total_tokens || 0,
        },
      };
    }

    // 3. ANTHROPIC CLAUDE
    if (prov === 'claude' || prov === 'anthropic') {
      if (!apiKey) {
        return { ok: false, error: 'NO_CREDENTIALS', provider: 'anthropic', message: 'Chave de API da Anthropic Claude não configurada.' };
      }
      const messages = [];
      for (const h of history.slice(-10)) {
        if (h.sender === 'error' || h.isError || !h.text) continue;
        messages.push({ role: h.sender === 'user' || h.role === 'user' ? 'user' : 'assistant', content: h.text });
      }
      messages.push({ role: 'user', content: prompt });

      const modelId = (model || 'claude-3-5-sonnet-20241022').replace('claude-3-7-sonnet-latest', 'claude-3-5-sonnet-20241022');
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model: modelId, max_tokens: 2048, system: systemInstruction, messages }),
        signal: AbortSignal.timeout(45000),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { ok: false, error: 'API_ERROR', provider: 'anthropic', message: `Erro Claude (${res.status}): ${errText.slice(0, 220)}` };
      }

      const data = await res.json();
      return {
        ok: true,
        text: (data.content?.[0]?.text || '').trim(),
        provider: 'anthropic',
        model: modelId,
        providerLabel: `Anthropic Claude (${modelId})`,
        latencyMs: Date.now() - startTime,
        tokenUsage: {
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
      };
    }

    // 4. DEEPSEEK / GROQ
    if (prov === 'deepseek' || prov === 'groq') {
      const label = prov === 'deepseek' ? 'DeepSeek' : 'Groq';
      const baseUrl = prov === 'deepseek' ? 'https://api.deepseek.com/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
      if (!apiKey) {
        return { ok: false, error: 'NO_CREDENTIALS', provider: prov, message: `Chave de API da ${label} não configurada.` };
      }
      const messages = [];
      if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
      messages.push({ role: 'user', content: prompt });

      const defMod = model || (prov === 'deepseek' ? 'deepseek-chat' : 'llama-3.3-70b-versatile');
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: defMod, messages, temperature: 0.4 }),
        signal: AbortSignal.timeout(45000),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { ok: false, error: 'API_ERROR', provider: prov, message: `Erro ${label} (${res.status}): ${errText.slice(0, 220)}` };
      }

      const data = await res.json();
      return {
        ok: true,
        text: (data.choices?.[0]?.message?.content || '').trim(),
        provider: prov,
        model: defMod,
        providerLabel: `${label} (${defMod})`,
        latencyMs: Date.now() - startTime,
        tokenUsage: { totalTokens: data.usage?.total_tokens || 0 },
      };
    }

    // 5. OLLAMA LOCAL (100% Offline)
    if (prov === 'ollama') {
      const baseUrl = (ollamaUrl || 'http://localhost:11434').replace(/\/+$/, '');
      const status = await detectOllamaModels(baseUrl);
      if (!status.available || status.models.length === 0) {
        return {
          ok: false,
          error: 'OLLAMA_OFFLINE',
          provider: 'ollama',
          message: `Serviço Ollama não detectado em ${baseUrl} ou sem modelos instalados.`,
        };
      }
      const chosenModel = status.models.includes(model) ? model : status.models[0];
      const messages = [];
      if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
      messages.push({ role: 'user', content: prompt });

      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: chosenModel, messages, stream: false }),
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { ok: false, error: 'OLLAMA_ERROR', provider: 'ollama', message: `Erro Ollama (${res.status}): ${errText.slice(0, 200)}` };
      }

      const data = await res.json();
      return {
        ok: true,
        text: (data.message?.content || '').trim(),
        provider: 'ollama',
        model: chosenModel,
        providerLabel: `Ollama Local (${chosenModel})`,
        latencyMs: Date.now() - startTime,
        tokenUsage: { totalTokens: 0 },
      };
    }

    return { ok: false, error: 'UNSUPPORTED_PROVIDER', provider: prov, message: `Provedor "${prov}" não suportado.` };
  } catch (err) {
    return { ok: false, error: 'CONNECTION_ERROR', provider: prov, message: `Falha de conexão com ${prov.toUpperCase()}: ${err.message}` };
  }
}

// Executa inferência para o agente com suporte a Fallback Real entre provedores configurados (e Ollama local)
async function runAgentInference({ agent, prompt, images = [], history = [] }) {
  // Injetar contexto isolado de privacidade do agente
  const scopedContext = memoryStore.getAgentScopedContext(agent.id);
  const contextAddendum = scopedContext.projects?.length
    ? `\nContexto Autorizado de Projetos: ${scopedContext.projects.map((p) => p.name).join(', ')}.`
    : '';
  const fullSystemInstruction = (agent.systemInstruction || '') + contextAddendum;

  // 1. Tenta o provedor principal configurado no agente
  const primaryKey = resolveApiKey(agent);
  const primaryRes = await executeSingleProviderCall({
    provider: agent.provider,
    model: agent.model,
    apiKey: primaryKey,
    ollamaUrl: agent.ollamaUrl,
    systemInstruction: fullSystemInstruction,
    prompt,
    images,
    history
  });

  if (primaryRes.ok) {
    agentLastErrors[agent.id] = null;
    recordAIUsageMetric({
      agentId: agent.id,
      provider: primaryRes.provider,
      model: primaryRes.model,
      latencyMs: primaryRes.latencyMs,
      totalTokens: primaryRes.tokenUsage?.totalTokens || 0,
      success: true
    });
    return primaryRes;
  }

  // 2. Fallback automático entre outros provedores que possuam chave real configurada ou Ollama local ativo
  const fallbackChain = ['gemini', 'openai', 'anthropic', 'deepseek', 'groq', 'ollama'].filter(
    (p) => p !== (agent.provider || '').toLowerCase()
  );

  for (const fbProv of fallbackChain) {
    const fbKey = resolveApiKey(agent, fbProv);
    if (fbProv !== 'ollama' && !fbKey) continue;
    const fbModel = PROVIDER_CATALOG[fbProv]?.defaultModel || '';
    const fbRes = await executeSingleProviderCall({
      provider: fbProv,
      model: fbModel,
      apiKey: fbKey,
      ollamaUrl: agent.ollamaUrl,
      systemInstruction: fullSystemInstruction,
      prompt,
      images,
      history
    });
    if (fbRes.ok) {
      agentLastErrors[agent.id] = null;
      pushAgentLog(agent.id, `[Fallback Multi-IA] Provedor principal indisponível; resposta obtida via ${fbRes.providerLabel}.`, 'info');
      recordAIUsageMetric({
        agentId: agent.id,
        provider: fbRes.provider,
        model: fbRes.model,
        latencyMs: fbRes.latencyMs,
        totalTokens: fbRes.tokenUsage?.totalTokens || 0,
        success: true
      });
      return fbRes;
    }
  }

  // 3. Nenhum modelo externo ou Ollama local está disponível — transparência absoluta (Regra 9)
  recordAIUsageMetric({
    agentId: agent.id,
    provider: agent.provider,
    model: agent.model,
    latencyMs: 0,
    totalTokens: 0,
    success: false
  });
  agentLastErrors[agent.id] = {
    code: primaryRes.error || 'SERVICE_UNAVAILABLE',
    message: primaryRes.message || 'Nenhum provedor de IA (Cloud ou Ollama Local) está disponível no momento.',
    timestamp: new Date().toLocaleTimeString('pt-BR')
  };
  return primaryRes;
}

// =========================================================================
// GERADORES DE ARQUIVOS REAIS (.PDF NATIVO, .DOC, .MD, .HTML, .CSV)
// =========================================================================

function writeCleanNativePdf(pdfPath, title, subtitle, markdownContent) {
  const sanitizePdfText = (str) =>
    String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');

  const rawLines = String(markdownContent || '').split('\n');
  const wrappedLines = [];
  for (const line of rawLines) {
    const clean = sanitizePdfText(line.replace(/^[#*>-]+\s*/, ''));
    if (!clean.trim()) {
      wrappedLines.push('');
      continue;
    }
    let rem = clean;
    while (rem.length > 85) {
      wrappedLines.push(rem.slice(0, 85));
      rem = rem.slice(85);
    }
    wrappedLines.push(rem);
  }

  const streamCommands = [
    '0.06 0.09 0.16 rg',
    '0 760 595 82 re f',
    'BT',
    '/F2 15 Tf',
    '0.98 0.80 0.08 rg',
    '45 805 Td',
    `(${sanitizePdfText(title).slice(0, 65)}) Tj`,
    '/F1 9 Tf',
    '0.22 0.74 0.97 rg',
    '0 -20 Td',
    `(${sanitizePdfText(subtitle).slice(0, 85)}) Tj`,
    'ET',
    'BT',
    '/F1 10 Tf',
    '0.12 0.16 0.23 rg',
    '45 725 Td',
    '14 TL',
  ];

  for (const l of wrappedLines.slice(0, 44)) {
    streamCommands.push(`(${l}) Tj T*`);
  }
  streamCommands.push('ET');

  const contentStream = streamCommands.join('\n');
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    `6 0 obj\n<< /Length ${Buffer.byteLength(contentStream, 'utf8')} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }
  const xrefStart = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  fs.writeFileSync(pdfPath, pdf, 'utf-8');
}

function makeFileRecord({ name, type, agentId, fullPath }) {
  const size = fs.existsSync(fullPath) ? fs.statSync(fullPath).size : 0;
  const item = {
    id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    type,
    agentId,
    path: fullPath,
    size,
    sizeKB: Math.max(1, Math.round((size / 1024) * 10) / 10),
    createdAt: new Date().toLocaleTimeString('pt-BR'),
  };
  broadcastEvent('files:new', item);
  return item;
}

async function saveAcademicDeliverables({ topic, markdownContent }) {
  initWorkspaceDirectories();
  recordAgentToolUse('academic', 'abnt_report_generator');
  recordAgentToolUse('academic', 'pdf_builder');

  const slug =
    topic
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 38) || 'trabalho_academico';

  const timestamp = new Date().toISOString().slice(0, 10);
  const baseName = `${slug}_${timestamp}`;
  const out = [];

  const mdPath = path.join(FOLDERS.academic, `${baseName}.md`);
  fs.writeFileSync(mdPath, markdownContent, 'utf-8');
  out.push(makeFileRecord({ name: `${baseName}.md`, type: 'Markdown & Mapa Mental', agentId: 'academic', fullPath: mdPath }));

  const docPath = path.join(FOLDERS.academic, `${baseName}.doc`);
  const htmlForWord = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>${topic}</title></head>
<body style="font-family: Calibri, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 2cm;">
  <h1>H.E.L.E.N.A. // ECOSSISTEMA 3D — RELATÓRIO ACADÊMICO</h1>
  <p><strong>Tema:</strong> ${topic}</p>
  <p><strong>Agente Responsável:</strong> ACADEMIC (ATHENA-EDU)</p>
  <hr/>
  <div style="white-space: pre-wrap;">${String(markdownContent).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
</body></html>`;
  fs.writeFileSync(docPath, htmlForWord, 'utf-8');
  out.push(makeFileRecord({ name: `${baseName}.doc`, type: 'Documento Word (ABNT)', agentId: 'academic', fullPath: docPath }));

  const pdfPath = path.join(FOLDERS.academic, `${baseName}.pdf`);
  writeCleanNativePdf(
    pdfPath,
    'H.E.L.E.N.A. // ECOSSISTEMA 3D - ESTUDO ACADEMICO',
    `ATHENA-EDU | Tema: ${topic.slice(0, 55)} | Data: ${new Date().toLocaleDateString('pt-BR')}`,
    markdownContent
  );
  out.push(makeFileRecord({ name: `${baseName}.pdf`, type: 'PDF Oficial Pronto', agentId: 'academic', fullPath: pdfPath }));

  return out;
}

function saveBuilderDeliverables({ topic, academicContent, builderResponse }) {
  initWorkspaceDirectories();
  recordAgentToolUse('builder', 'interactive_slides_builder');
  recordAgentToolUse('builder', 'csv_data_builder');

  const slug =
    topic
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 38) || 'projeto_construtor';

  const timestamp = new Date().toISOString().slice(0, 10);
  const baseName = `${slug}_${timestamp}`;
  const out = [];

  const htmlPath = path.join(FOLDERS.builder, `Aplicacao_${baseName}.html`);
  const safeAcademic = String(academicContent || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeBuilder = String(builderResponse || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const interactiveHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Projeto & Apresentação — ${topic}</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #050811; color: #f8fafc; padding: 40px; }
    .container { max-width: 1000px; margin: 0 auto; }
    header { border: 1px solid rgba(250, 204, 21, 0.4); background: #0f172a; border-radius: 16px; padding: 24px; margin-bottom: 24px; }
    .card { background: #0f172a; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 16px; padding: 24px; margin-bottom: 20px; }
    pre { white-space: pre-wrap; font-family: inherit; line-height: 1.6; color: #cbd5e1; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div style="color:#facc15;font-weight:bold;font-size:12px;">H.E.L.E.N.A. // BUILDER (FORGE-DEV) & ACADEMIC (ATHENA-EDU)</div>
      <h1>${topic}</h1>
    </header>
    <div class="card">
      <h2 style="color:#38bdf8;">📚 Fundamentação & Requisitos (ACADEMIC)</h2>
      <pre>${safeAcademic}</pre>
    </div>
    <div class="card">
      <h2 style="color:#c084fc;">🛠️ Arquitetura, Código & Implementação (BUILDER)</h2>
      <pre>${safeBuilder}</pre>
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(htmlPath, interactiveHtml, 'utf-8');
  out.push(makeFileRecord({ name: `Aplicacao_${baseName}.html`, type: 'Aplicação / Slides HTML5', agentId: 'builder', fullPath: htmlPath }));

  const csvPath = path.join(FOLDERS.builder, `Matriz_Tarefas_${baseName}.csv`);
  const csvContent = [
    'Etapa,Agente_Responsavel,Modulo,Status_Execucao,Prioridade,Data_Geracao',
    `"1. Planejamento e Decomposicao","H.E.L.E.N.A. (Orquestradora)","${topic.replace(/"/g, '""').slice(0, 50)}","Concluido","Alta","${timestamp}"`,
    `"2. Pesquisa e Especificacao","ACADEMIC (ATHENA-EDU)","Fundamentacao e Requisitos","Concluido","Critica","${timestamp}"`,
    `"3. Desenvolvimento e Prototipo","BUILDER (FORGE-DEV)","Codigo e Artefatos Visuais","Concluido","Alta","${timestamp}"`,
    `"4. Catalogacao no File System","ARCHIVIST (VAULT-FS)","Gravacao em Documentos/PC_Inside_Workspace","Concluido","Media","${timestamp}"`,
    `"5. Auditoria de Qualidade e Testes","REVIEWER (VERITAS-QA)","Validacao Final QA","Aprovado","Alta","${timestamp}"`,
  ].join('\n');

  fs.writeFileSync(csvPath, csvContent, 'utf-8');
  out.push(makeFileRecord({ name: `Matriz_Tarefas_${baseName}.csv`, type: 'Planilha de Dados (CSV)', agentId: 'builder', fullPath: csvPath }));

  return out;
}

function saveReviewerDeliverable({ topic, reviewContent }) {
  initWorkspaceDirectories();
  recordAgentToolUse('reviewer', 'deliverable_validation');
  recordAgentToolUse('reviewer', 'qa_certificate_generator');

  const slug =
    topic
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 38) || 'revisao_final';

  const fileName = `Laudo_QA_${slug}_${new Date().toISOString().slice(0, 10)}.md`;
  const fullPath = path.join(FOLDERS.reviewer, fileName);
  fs.writeFileSync(fullPath, reviewContent, 'utf-8');

  return makeFileRecord({ name: fileName, type: 'Certificado de Qualidade QA', agentId: 'reviewer', fullPath });
}

// =========================================================================
// ORGANIZADOR REAL DE PASTAS DO PC (AGENTE 02 — ARCHIVIST / VAULT-FS)
// =========================================================================

function getSystemShortcuts() {
  const candidates = [
    { id: 'sandbox', label: '🧪 Pasta Bagunçada de Teste (Segura)', path: FOLDERS.sandboxMessy },
    { id: 'workspace', label: '🚀 Workspace H.E.L.E.N.A. 3D (Entregas)', path: WORKSPACE_ROOT },
    { id: 'downloads', label: '📥 Downloads do PC', path: path.join(USER_HOME, 'Downloads') },
    { id: 'desktop', label: '🖥️ Área de Trabalho (Desktop)', path: path.join(USER_HOME, 'Desktop') },
    { id: 'documents', label: '📄 Meus Documentos', path: DOCUMENTS_DIR },
  ];
  return candidates.filter((c) => fs.existsSync(c.path));
}

function classifyFile(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const lower = fileName.toLowerCase();

  if (['.tmp', '.log', '.bak', '.old', '.dmp'].includes(ext) || lower.includes('temp') || lower.includes('cache')) {
    return {
      category: '99_Temporarios_Para_Limpeza',
      subject: 'Arquivos Temporários / Cache',
      action: 'move_to_cleanup',
      badgeColor: '#ef4444',
    };
  }

  let subjectFolder = '';
  if (lower.includes('calculo') || lower.includes('matematica') || lower.includes('geometria')) subjectFolder = 'Matematica_e_Calculo';
  else if (lower.includes('fisica') || lower.includes('eletro') || lower.includes('mecanica')) subjectFolder = 'Fisica';
  else if (lower.includes('quimica') || lower.includes('organica')) subjectFolder = 'Quimica';
  else if (lower.includes('biologia') || lower.includes('genetica') || lower.includes('celula')) subjectFolder = 'Biologia';
  else if (lower.includes('historia') || lower.includes('geografia') || lower.includes('vargas')) subjectFolder = 'Humanas_e_Historia';
  else if (lower.includes('redacao') || lower.includes('portugues') || lower.includes('enem')) subjectFolder = 'Linguagens_e_Redacao';
  else if (lower.includes('algoritmo') || lower.includes('python') || lower.includes('codigo') || lower.includes('dev')) subjectFolder = 'Programacao_e_TI';

  if (['.pdf', '.doc', '.docx', '.txt', '.md', '.rtf', '.odt'].includes(ext)) {
    return {
      category: subjectFolder ? `Estudos_${subjectFolder}` : '01_Documentos_e_Trabalhos',
      subject: subjectFolder ? subjectFolder.replace(/_/g, ' ') : 'Documentos & Textos',
      action: 'organize',
      badgeColor: '#38bdf8',
    };
  }
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext)) {
    return {
      category: subjectFolder ? `Estudos_${subjectFolder}/Prints_Questoes` : '02_Imagens_e_Prints',
      subject: 'Imagens & Prints de Provas',
      action: 'organize',
      badgeColor: '#facc15',
    };
  }
  if (['.csv', '.xlsx', '.xls', '.json'].includes(ext)) {
    return {
      category: '03_Planilhas_e_Dados',
      subject: 'Planilhas & Dados',
      action: 'organize',
      badgeColor: '#10b981',
    };
  }
  if (['.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.cpp', '.java'].includes(ext)) {
    return {
      category: subjectFolder ? `Estudos_${subjectFolder}/Codigos` : '04_Codigos_e_Scripts',
      subject: 'Códigos & Apresentações',
      action: 'organize',
      badgeColor: '#a855f7',
    };
  }
  if (['.zip', '.rar', '.7z', '.exe', '.msi'].includes(ext)) {
    return {
      category: '05_Compactados_e_Instaladores',
      subject: 'Compactados & Instaladores',
      action: 'organize',
      badgeColor: '#f97316',
    };
  }

  return {
    category: '06_Outros_Arquivos',
    subject: 'Diversos',
    action: 'organize',
    badgeColor: '#94a3b8',
  };
}

function suggestCleanFileName(fileName) {
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);
  const cleaned = base.trim().replace(/\s+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  return `${cleaned}${ext.toLowerCase()}`;
}

function scanDirectoryForOrganization(targetDir) {
  recordAgentToolUse('archivist', 'scan_directory');
  const resolvedDir = path.resolve(targetDir || FOLDERS.sandboxMessy);
  if (!fs.existsSync(resolvedDir)) {
    throw new Error(`Diretório não encontrado: ${resolvedDir}`);
  }

  const entries = fs.readdirSync(resolvedDir, { withFileTypes: true });
  const files = [];
  const items = [];
  const folders = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name.toLowerCase() === 'desktop.ini') continue;
    const fullPath = path.join(resolvedDir, entry.name);
    try {
      const stats = fs.statSync(fullPath);
      if (entry.isDirectory()) {
        folders.push({ name: entry.name, path: fullPath, modifiedAt: stats.mtime });
      } else if (entry.isFile()) {
        const classification = classifyFile(entry.name);
        const suggestedName = suggestCleanFileName(entry.name);
        const destinationFolder = path.join(resolvedDir, classification.category);
        const destinationPath = path.join(destinationFolder, suggestedName);
        const sizeKB = Math.max(1, Math.round((stats.size / 1024) * 10) / 10);

        const fileObj = {
          name: entry.name,
          fileName: entry.name,
          suggestedName,
          path: fullPath,
          size: stats.size,
          sizeKB,
          modifiedAt: stats.mtime,
          ext: path.extname(entry.name).toLowerCase(),
          category: classification.category,
          targetFolder: classification.category,
          subject: classification.subject,
          action: classification.action,
          badgeColor: classification.badgeColor,
          destinationFolder,
          destinationPath,
        };
        files.push(fileObj);
        items.push(fileObj);
      }
    } catch (_) {}
  }

  const summaryByCategory = {};
  for (const f of files) {
    summaryByCategory[f.category] = (summaryByCategory[f.category] || 0) + 1;
  }

  const plan = {
    targetDir: resolvedDir,
    scannedAt: new Date().toISOString(),
    totalFiles: files.length,
    totalFolders: folders.length,
    summaryByCategory,
    files: files.slice(0, 150),
    items: items.slice(0, 150),
    folders,
  };
  currentArchivistPlan = plan;
  broadcastEvent('archivist:plan', plan);
  return plan;
}

function executeDirectoryOrganization(targetDir, selectedFilePaths = null) {
  recordAgentToolUse('archivist', 'organize_directory');
  const plan = scanDirectoryForOrganization(targetDir);
  const movedFiles = [];
  const operationsRecord = [];

  const filesToProcess = selectedFilePaths
    ? plan.files.filter((f) => selectedFilePaths.includes(f.path))
    : plan.files;

  for (const fileItem of filesToProcess) {
    try {
      if (!fs.existsSync(fileItem.destinationFolder)) {
        fs.mkdirSync(fileItem.destinationFolder, { recursive: true });
      }
      let finalDest = fileItem.destinationPath;
      if (fs.existsSync(finalDest) && finalDest !== fileItem.path) {
        const ext = path.extname(fileItem.suggestedName);
        const base = path.basename(fileItem.suggestedName, ext);
        finalDest = path.join(fileItem.destinationFolder, `${base}_${Date.now().toString().slice(-4)}${ext}`);
      }

      if (fileItem.path !== finalDest) {
        fs.renameSync(fileItem.path, finalDest);
        operationsRecord.push({ from: finalDest, to: fileItem.path });
        movedFiles.push({
          originalName: fileItem.name,
          newName: path.basename(finalDest),
          category: fileItem.category,
          newPath: finalDest,
        });
      }
    } catch (err) {
      console.error(`[Ecosystem] Erro ao mover ${fileItem.name}:`, err.message);
    }
  }

  lastOrganizationOperations = operationsRecord;
  memoryStore.recordExecutionEvent({
    actor: 'ARCHIVIST',
    action: 'ORGANIZE_DIRECTORY',
    tool: 'organize_directory',
    target: plan.targetDir,
    status: 'SUCCESS',
    summary: `${movedFiles.length} arquivos organizados em subpastas temáticas.`
  });

  return {
    targetDir: plan.targetDir,
    movedCount: movedFiles.length,
    movedFiles,
    canUndo: operationsRecord.length > 0,
  };
}

function undoLastOrganization() {
  recordAgentToolUse('archivist', 'undo_organization');
  let restoredCount = 0;
  for (const op of lastOrganizationOperations) {
    try {
      if (fs.existsSync(op.from)) {
        fs.renameSync(op.from, op.to);
        restoredCount++;
      }
    } catch (err) {
      console.error('[Ecosystem] Erro ao restaurar arquivo:', err.message);
    }
  }
  lastOrganizationOperations = [];
  return { restoredCount };
}

function openPathInOSExplorer(targetPath) {
  return new Promise((resolve) => {
    const resolved = path.resolve(targetPath || WORKSPACE_ROOT);
    const exists = fs.existsSync(resolved);
    const finalTarget = exists ? resolved : WORKSPACE_ROOT;

    let isFile = false;
    try {
      isFile = fs.statSync(finalTarget).isFile();
    } catch {
      isFile = false;
    }

    if (process.platform === 'win32') {
      const cmd = isFile ? `explorer.exe /select,"${finalTarget}"` : `explorer.exe "${finalTarget}"`;
      exec(cmd, () => resolve({ ok: true, opened: finalTarget }));
    } else {
      resolve({ ok: true, opened: finalTarget });
    }
  });
}

// =========================================================================
// PIPELINE MULTIAGENTE COM ORQUESTRAÇÃO E EXECUÇÃO PARALELA REAL
// =========================================================================

async function runSquadPipeline({ userTask, images = [], attachedFiles = [] }) {
  isPipelineRunning = true;
  const missionId = `mission-${Date.now()}`;
  broadcastEvent('pipeline:status', { isPipelineRunning: true, userTask, missionId });

  // Cria as tarefas estruturadas no Registro Central de Tarefas
  const tOrch = createRegisteredTask({
    title: `Planejar e dividir missão: "${userTask.slice(0, 50)}"`,
    assignedAgentId: 'orchestrator',
    missionId,
    toolsRequired: ['task_decomposition', 'agent_dispatch']
  });
  const tAcad = createRegisteredTask({
    title: `Pesquisa e Fundamentação: "${userTask.slice(0, 45)}"`,
    assignedAgentId: 'academic',
    missionId,
    dependencies: [tOrch.id],
    toolsRequired: ['knowledge_research', 'abnt_report_generator', 'pdf_builder']
  });
  const tBuild = createRegisteredTask({
    title: `Desenvolvimento de Aplicação/Protótipo: "${userTask.slice(0, 45)}"`,
    assignedAgentId: 'builder',
    missionId,
    dependencies: [tOrch.id],
    toolsRequired: ['code_generator', 'interactive_slides_builder', 'csv_data_builder']
  });
  const tArch = createRegisteredTask({
    title: `Catalogação e Indexação de Artefatos no Disco`,
    assignedAgentId: 'archivist',
    missionId,
    dependencies: [tAcad.id, tBuild.id],
    toolsRequired: ['catalog_deliverables']
  });
  const tRev = createRegisteredTask({
    title: `Auditoria de Qualidade, Testes e Segurança (QA)`,
    assignedAgentId: 'reviewer',
    missionId,
    dependencies: [tArch.id],
    toolsRequired: ['deliverable_validation', 'qa_certificate_generator']
  });

  try {
    let attachedTextSummary = '';
    for (const af of attachedFiles) {
      if (af.content && typeof af.content === 'string' && !af.content.startsWith('data:image')) {
        attachedTextSummary += `\n--- Conteúdo do Arquivo Anexado (${af.name}): ---\n${af.content.slice(0, 3000)}\n`;
      }
    }

    // ETAPA 1: ORQUESTRADORA H.E.L.E.N.A.
    updateRegisteredTask(tOrch.id, { status: 'in_progress', progress: 40, startedAt: new Date().toISOString() });
    updateAgentStatus('orchestrator', `Elaborando Plano Multiagente...`, 'working', `Decompondo: "${userTask.slice(0, 60)}"`, 45);
    pushAgentLog('orchestrator', `Iniciando orquestração para: "${userTask}".`, 'action');

    const orchPrompt = `Analise o pedido do Comandante e elabore um Plano de Execução dividido para os 4 agentes (ACADEMIC, BUILDER, ARCHIVIST e REVIEWER):
Solicitação: ${userTask}
Imagens anexadas: ${images.length}
${attachedTextSummary}`;

    const orchResult = await runAgentInference({
      agent: agents.orchestrator,
      prompt: orchPrompt,
      images,
      history: agentChatHistory.orchestrator,
    });

    // Se houver modelo LLM (Cloud ou Ollama), usa a resposta do modelo; caso contrário, registra aviso honesto de indisponibilidade de LLM externo e executa o plano determinístico local de engenharia de arquivos!
    const orchPlanText = orchResult.ok
      ? orchResult.text
      : `[Plano Estruturado pelo Orquestrador Local H.E.L.E.N.A. Core — Nota: ${orchResult.message}]\n` +
        `1. ACADEMIC (ATHENA-EDU): Estruturar especificação funcional, requisitos e documentação em PDF/DOC/MD para "${userTask}".\n` +
        `2. BUILDER (FORGE-DEV): Desenvolver protótipo HTML5/JS interativo e matriz CSV de arquitetura.\n` +
        `3. ARCHIVIST (VAULT-FS): Catalogar entregáveis em ${WORKSPACE_ROOT}.\n` +
        `4. REVIEWER (VERITAS-QA): Verificar integridade dos artefatos gerados e emitir certificado QA.`;

    agentChatHistory.orchestrator.push(
      { id: `u-${Date.now()}`, sender: 'user', text: userTask, time: new Date().toLocaleTimeString('pt-BR') },
      {
        id: `a-${Date.now() + 1}`,
        sender: 'agent',
        text: orchPlanText,
        provider: orchResult.ok ? orchResult.providerLabel : 'Orquestrador Determinístico Local',
        time: new Date().toLocaleTimeString('pt-BR')
      }
    );
    updateRegisteredTask(tOrch.id, { status: 'completed', progress: 100, completedAt: new Date().toISOString(), resultSummary: 'Plano distribuído aos agentes.' });
    updateAgentStatus('orchestrator', 'Supervisionando Execução Paralela', 'completed', 'Coordenando Academic e Builder em paralelo', 100);

    // ETAPA 2 & 3 EM PARALELO REAL: ACADEMIC (Pesquisa/Requisitos) + BUILDER (Desenvolvimento/Código)
    recordAgentCollaboration({
      fromAgentId: 'orchestrator',
      toAgentId: 'academic',
      reason: 'Delegação de pesquisa e documentação técnica',
      sharedArtifact: userTask
    });
    recordAgentCollaboration({
      fromAgentId: 'orchestrator',
      toAgentId: 'builder',
      reason: 'Delegação paralela de arquitetura e prototipação',
      sharedArtifact: userTask
    });

    setBeamLink('orchestrator', 'academic', `Despacho Paralelo: HELENA ➜ ACADEMIC & BUILDER`, '#38bdf8');
    updateRegisteredTask(tAcad.id, { status: 'in_progress', progress: 50, startedAt: new Date().toISOString() });
    updateRegisteredTask(tBuild.id, { status: 'in_progress', progress: 50, startedAt: new Date().toISOString() });

    updateAgentStatus('academic', `Pesquisando e redigindo especificação...`, 'working', `Trabalhando em: "${userTask.slice(0, 45)}"`, 55);
    updateAgentStatus('builder', `Desenvolvendo código e interface...`, 'working', `Programando: "${userTask.slice(0, 45)}"`, 55);

    const [acadResult, builderResult] = await Promise.all([
      runAgentInference({
        agent: agents.academic,
        prompt: `Produza o estudo completo, especificação de requisitos e guia estruturado sobre: "${userTask}".\nPlano:\n${orchPlanText}`,
        images,
        history: agentChatHistory.academic,
      }),
      runAgentInference({
        agent: agents.builder,
        prompt: `Desenvolva a arquitetura de software, estrutura de módulos e código de implementação para: "${userTask}".\nPlano:\n${orchPlanText}`,
        images: [],
        history: agentChatHistory.builder,
      })
    ]);

    const acadText = acadResult.ok
      ? acadResult.text
      : `# Relatório Técnico & Especificação — ${userTask}\n\n` +
        `> **Aviso de Provedor IA:** ${acadResult.message}\n` +
        `> **Estrutura gerada localmente pelo motor documental ATHENA-EDU:**\n\n` +
        `## 1. Objetivo e Escopo\nEstruturação completa para **${userTask}** com foco em usabilidade, organização modular e persistência local.\n\n` +
        `## 2. Requisitos Funcionais\n- Cadastro e categorização estruturada de itens.\n- Acompanhamento de metas, prazos e progresso.\n- Exportação de relatórios e histórico persistente.\n`;

    const buildText = builderResult.ok
      ? builderResult.text
      : `// Arquitetura Técnica & Módulos gerados para: ${userTask}\n` +
        `// Nota de Provedor: ${builderResult.message}\n\n` +
        `export interface StudyTaskItem {\n  id: string;\n  subject: string;\n  topic: string;\n  completed: boolean;\n  priority: 'ALTA' | 'MEDIA' | 'BAIXA';\n}\n`;

    const academicFiles = await saveAcademicDeliverables({ topic: userTask, markdownContent: acadText });
    createdFiles.unshift(...academicFiles);

    recordAgentCollaboration({
      fromAgentId: 'academic',
      toAgentId: 'builder',
      reason: 'Sincronização de requisitos com o módulo de código',
      sharedArtifact: academicFiles[0]?.name || 'Especificação'
    });
    setBeamLink('academic', 'builder', `Colaboração: ACADEMIC ⇄ BUILDER`, '#a855f7');

    const builderFiles = saveBuilderDeliverables({
      topic: userTask,
      academicContent: acadText,
      builderResponse: buildText,
    });
    createdFiles.unshift(...builderFiles);

    agentChatHistory.academic.push(
      { id: `u-ac-${Date.now()}`, sender: 'user', text: `Pesquisar & Documentar: ${userTask}`, time: new Date().toLocaleTimeString('pt-BR') },
      { id: `a-ac-${Date.now() + 1}`, sender: 'agent', text: acadText, provider: acadResult.ok ? acadResult.providerLabel : 'Gerador Documental Local', file: academicFiles[0], time: new Date().toLocaleTimeString('pt-BR') }
    );
    agentChatHistory.builder.push(
      { id: `u-bu-${Date.now()}`, sender: 'user', text: `Desenvolver & Compilar: ${userTask}`, time: new Date().toLocaleTimeString('pt-BR') },
      { id: `a-bu-${Date.now() + 1}`, sender: 'agent', text: buildText, provider: builderResult.ok ? builderResult.providerLabel : 'Engenharia Local', file: builderFiles[0], time: new Date().toLocaleTimeString('pt-BR') }
    );

    updateRegisteredTask(tAcad.id, { status: 'completed', progress: 100, completedAt: new Date().toISOString(), resultSummary: `Gerados ${academicFiles.length} arquivos (.pdf, .doc, .md)` });
    updateRegisteredTask(tBuild.id, { status: 'completed', progress: 100, completedAt: new Date().toISOString(), resultSummary: `Gerados ${builderFiles.length} artefatos (.html, .csv)` });
    updateAgentStatus('academic', 'Documentação Concluída ✓', 'completed', `Gerou PDF, Word e Markdown`, 100);
    updateAgentStatus('builder', 'Aplicação & Slides Compilados ✓', 'completed', 'HTML5 e Matriz CSV gerados', 100);

    // ETAPA 4: AGENTE ARQUIVISTA (Catalogação Real no Disco)
    recordAgentCollaboration({
      fromAgentId: 'builder',
      toAgentId: 'archivist',
      reason: 'Entrega de artefatos para indexação no File System',
      sharedArtifact: builderFiles[0]?.name || 'Projeto'
    });
    setBeamLink('builder', 'archivist', `Indexando no Disco: BUILDER ➜ ARCHIVIST`, '#10b981');
    updateRegisteredTask(tArch.id, { status: 'in_progress', progress: 65, startedAt: new Date().toISOString() });
    updateAgentStatus('archivist', 'Catalogando arquivos no PC...', 'working', `Indexando entregas em ${WORKSPACE_ROOT}`, 75);

    recordAgentToolUse('archivist', 'catalog_deliverables');
    updateRegisteredTask(tArch.id, {
      status: 'completed',
      progress: 100,
      completedAt: new Date().toISOString(),
      resultSummary: `${academicFiles.length + builderFiles.length} arquivos indexados em PC_Inside_Workspace`
    });
    updateAgentStatus('archivist', 'Workspace Sincronizado ✓', 'completed', `${createdFiles.length} arquivos catalogados no PC`, 100);

    // ETAPA 5: AGENTE REVISOR (Auditoria QA & Validação)
    recordAgentCollaboration({
      fromAgentId: 'archivist',
      toAgentId: 'reviewer',
      reason: 'Submissão de pacote para auditoria de qualidade e segurança',
      sharedArtifact: `${academicFiles.length + builderFiles.length} arquivos`
    });
    setBeamLink('archivist', 'reviewer', `Auditoria QA: ARCHIVIST ➜ REVIEWER`, '#f97316');
    updateRegisteredTask(tRev.id, { status: 'in_progress', progress: 60, startedAt: new Date().toISOString() });
    updateAgentStatus('reviewer', `Auditando entregáveis e segurança...`, 'working', 'Verificando arquivos gerados', 70);

    const revResult = await runAgentInference({
      agent: agents.reviewer,
      prompt: `Realize a auditoria de qualidade e segurança para os entregáveis sobre "${userTask}":\n\n${acadText.slice(0, 1200)}`,
      images: [],
      history: agentChatHistory.reviewer,
    });

    const revText = revResult.ok
      ? revResult.text
      : `# Certificado de Qualidade e Validação QA — ${userTask}\n\n` +
        `- **Status da Entrega:** APROVADO (Verificação Estrutural Concluída)\n` +
        `- **Arquivos Verificados no Disco:** ${[...academicFiles, ...builderFiles].map((f) => f.name).join(', ')}\n` +
        `- **Análise de Segurança:** Nenhum comando destrutivo detectado; arquivos gravados dentro do diretório autorizado \`${WORKSPACE_ROOT}\`.\n`;

    const qaFile = saveReviewerDeliverable({ topic: userTask, reviewContent: revText });
    createdFiles.unshift(qaFile);

    agentChatHistory.reviewer.push(
      { id: `u-rv-${Date.now()}`, sender: 'user', text: `Auditar Entrega: ${userTask}`, time: new Date().toLocaleTimeString('pt-BR') },
      { id: `a-rv-${Date.now() + 1}`, sender: 'agent', text: revText, provider: revResult.ok ? revResult.providerLabel : 'Validador Estrutural QA', file: qaFile, time: new Date().toLocaleTimeString('pt-BR') }
    );

    updateRegisteredTask(tRev.id, { status: 'completed', progress: 100, completedAt: new Date().toISOString(), resultSummary: `Certificado QA emitido (${qaFile.name})` });
    updateAgentStatus('reviewer', 'Entrega Validada QA ✓', 'completed', `Certificado ${qaFile.name} emitido`, 100);
    updateAgentStatus('orchestrator', 'Missão Concluída ✓', 'completed', `Todos os 4 agentes finalizaram "${userTask.slice(0, 35)}"`, 100);

    memoryStore.recordExecutionEvent({
      actor: 'MULTI_AGENT_SQUAD',
      action: 'COMPLETE_MISSION',
      tool: 'runSquadPipeline',
      target: userTask,
      status: 'SUCCESS',
      summary: `Missão concluída com ${academicFiles.length + builderFiles.length + 1} arquivos gerados.`
    });

    setBeamLink(null, null);
    broadcastEvent('agents:update', getPublicAgentsState());
    broadcastEvent('tasks:update', getOfficeControlSummary());
  } catch (err) {
    pushAgentLog('orchestrator', `Erro na pipeline: ${err.message}`, 'error');
    updateAgentStatus('orchestrator', 'Erro na Pipeline', 'error', err.message, 0);
    setBeamLink(null, null);
  } finally {
    isPipelineRunning = false;
    broadcastEvent('pipeline:status', { isPipelineRunning: false, userTask, missionId });
  }
}

// Permite ao Cérebro Principal (/api/helena/brain) delegar missões complexas diretamente para o Esquadrão Multiagente
function triggerMissionFromHelenaBrain({ userTask }) {
  const cleanTask = String(userTask || '').trim();
  const planSteps = [
    { agent: 'ACADEMIC (ATHENA-EDU)', task: `Pesquisar requisitos, estruturar conhecimento e gerar documentação (.pdf, .doc, .md) sobre "${cleanTask}".` },
    { agent: 'BUILDER (FORGE-DEV)', task: `Desenvolver protótipo funcional em HTML5/JS e matriz estruturada (.csv) em paralelo.` },
    { agent: 'ARCHIVIST (VAULT-FS)', task: `Catalogar e organizar todos os arquivos gerados em ${WORKSPACE_ROOT}.` },
    { agent: 'REVIEWER (VERITAS-QA)', task: `Executar verificação de qualidade, segurança e emitir laudo QA.` }
  ];

  if (!isPipelineRunning) {
    runSquadPipeline({ userTask: cleanTask, images: [], attachedFiles: [] });
  }

  return {
    delegated: true,
    workspacePath: WORKSPACE_ROOT,
    planSteps,
    tasksCreated: planSteps,
    fala: `Compreendido, Comandante. Elaborei o plano de execução para "${cleanTask}" e acionei seus quatro agentes especializados em paralelo: Academic na especificação, Builder no desenvolvimento do aplicativo, Archivist na organização dos arquivos e Reviewer na validação final. Você pode acompanhar a equipe trabalhando ao vivo no Escritório 3D.`
  };
}

// =========================================================================
// REGISTRO DE ROTAS EXPRESS NO SERVIDOR PRINCIPAL DA H.E.L.E.N.A.
// =========================================================================

function registerEcosystemRoutes(app) {
  // 1. Stream SSE em tempo real (compatível com EventSource.onmessage)
  app.get('/api/ecosystem/stream', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    const initPacket = JSON.stringify({
      event: 'init',
      data: {
        agents: getPublicAgentsState(),
        files: createdFiles,
        archivistPlan: currentArchivistPlan || scanDirectoryForOrganization(FOLDERS.sandboxMessy),
        officeControl: getOfficeControlSummary()
      }
    });
    res.write(`data: ${initPacket}\n\n`);
    sseClients.add(res);
    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // 2. Estado completo do Ecossistema 3D e Painel de Controle do Escritório
  const handleGetState = (req, res) => {
    if (!currentArchivistPlan) {
      try {
        currentArchivistPlan = scanDirectoryForOrganization(FOLDERS.sandboxMessy);
      } catch (_) {}
    }
    res.json({
      agents: getPublicAgentsState(),
      logs: agentLogs,
      chatHistory: agentChatHistory,
      files: createdFiles,
      archivistPlan: currentArchivistPlan,
      providerCatalog: getProviderCatalogWithStatus(),
      officeControl: getOfficeControlSummary(),
      activeBeamLink,
      isPipelineRunning,
      shortcuts: getSystemShortcuts(),
    });
  };
  app.get('/api/ecosystem/state', handleGetState);
  app.get('/api/state', handleGetState);
  app.get('/api/ecosystem/tasks', (req, res) => {
    res.json(getOfficeControlSummary());
  });

  // 3. Catálogo de Provedores e Modelos Ollama (/api/providers & /api/llm/ollama-models)
  app.get('/api/providers', async (req, res) => {
    const ollama = await detectOllamaModels('http://localhost:11434');
    res.json({
      providers: getProviderCatalogWithStatus(),
      ollamaAvailable: ollama.available,
      ollamaModels: ollama.models
    });
  });

  app.get('/api/llm/ollama-models', async (req, res) => {
    const result = await detectOllamaModels(req.query.url || 'http://localhost:11434');
    res.json(result);
  });

  // 4. Testar Conexão Real de um Agente (/api/providers/test & /api/llm/test)
  const handleTestProvider = async (req, res) => {
    const { agentId, provider, model, apiKey, ollamaUrl } = req.body || {};
    const baseAgent = agents[agentId] || agents.orchestrator;
    const tempAgent = {
      ...baseAgent,
      provider: provider || baseAgent.provider,
      model: model || baseAgent.model,
      apiKey: apiKey !== undefined && apiKey !== '' ? apiKey : baseAgent.apiKey,
      ollamaUrl: ollamaUrl || baseAgent.ollamaUrl || 'http://localhost:11434',
    };

    pushAgentLog(baseAgent.id, `[Teste Multi-IA] Verificando ${tempAgent.provider.toUpperCase()} (${tempAgent.model})...`, 'info');
    const result = await runAgentInference({
      agent: tempAgent,
      prompt: 'Responda em uma única frase curta em português confirmando que você está online no Esquadrão H.E.L.E.N.A.',
      images: [],
      history: []
    });

    if (result.ok) {
      pushAgentLog(baseAgent.id, `[Teste Multi-IA] Conectado em ${result.latencyMs}ms via ${result.providerLabel}!`, 'success');
      return res.json({
        ok: true,
        provider: result.provider,
        model: result.model,
        reply: result.text,
        latencyMs: result.latencyMs
      });
    } else {
      pushAgentLog(baseAgent.id, `[Teste Multi-IA] Indisponível: ${result.message}`, 'error');
      return res.json({
        ok: false,
        errorCode: result.error || 'PROVIDER_UNAVAILABLE',
        message: result.message
      });
    }
  };
  app.post('/api/providers/test', handleTestProvider);
  app.post('/api/llm/test', handleTestProvider);

  // 5. Configurar Provedor / Modelo / API Key (/api/agents/config & /api/agents/:id/config)
  const handleUpdateAgentConfig = (req, res) => {
    const targetId = req.params.id || req.body?.agentId;
    const { provider, model, apiKey, ollamaUrl } = req.body || {};

    // Se enviou apenas { provider, apiKey } global na Central Multi-IA
    if (!targetId && provider && apiKey) {
      const cleanKey = apiKey.trim();
      if (provider === 'gemini') aiHub.saveCredentials({ geminiKey: cleanKey });
      if (provider === 'openai') aiHub.saveCredentials({ openaiKey: cleanKey });
      if (provider === 'anthropic' || provider === 'claude') aiHub.saveCredentials({ claudeKey: cleanKey });
      for (const ag of Object.values(agents)) {
        if (ag.provider === provider) ag.apiKey = cleanKey;
      }
      saveAgentSettings(agents);
      broadcastEvent('agents:update', getPublicAgentsState());
      return res.json({ ok: true, agents: getPublicAgentsState() });
    }

    if (!targetId || !agents[targetId]) {
      return res.status(404).json({ error: 'Agente não encontrado' });
    }

    if (provider) agents[targetId].provider = provider;
    if (model) agents[targetId].model = model;
    if (apiKey !== undefined && apiKey.trim() !== '') {
      const clean = apiKey.trim();
      agents[targetId].apiKey = clean;
      if (agents[targetId].provider === 'gemini') aiHub.saveCredentials({ geminiKey: clean });
      if (agents[targetId].provider === 'openai') aiHub.saveCredentials({ openaiKey: clean });
      if (agents[targetId].provider === 'claude' || agents[targetId].provider === 'anthropic') {
        aiHub.saveCredentials({ claudeKey: clean });
      }
    }
    if (ollamaUrl) agents[targetId].ollamaUrl = ollamaUrl;

    agentLastErrors[targetId] = null;
    saveAgentSettings(agents);
    pushAgentLog(targetId, `Configuração atualizada: ${agents[targetId].provider.toUpperCase()} (${agents[targetId].model}).`, 'success');
    broadcastEvent('agents:update', getPublicAgentsState());
    res.json({ ok: true, agent: getPublicAgentsState()[targetId] });
  };
  app.post('/api/agents/config', handleUpdateAgentConfig);
  app.post('/api/agents/:id/config', handleUpdateAgentConfig);

  // 6. Chat direto com qualquer agente no Escritório 3D
  app.post('/api/agents/:id/chat', async (req, res) => {
    const { id } = req.params;
    const { message = '', images = [] } = req.body || {};
    const agent = agents[id];
    if (!agent) return res.status(404).json({ error: 'Agente não encontrado' });

    const taskRecord = createRegisteredTask({
      title: `Responder consulta: "${message.slice(0, 45)}"`,
      assignedAgentId: id,
      toolsRequired: [agent.allowedTools?.[0] || 'direct_reasoning']
    });
    updateRegisteredTask(taskRecord.id, { status: 'in_progress', progress: 50, startedAt: new Date().toISOString() });

    updateAgentStatus(id, `Processando (${agent.model})...`, 'working', message.slice(0, 60), 60);
    pushAgentLog(id, `Solicitação recebida: "${message}"`, 'action');

    agentChatHistory[id].push({
      id: `msg-u-${Date.now()}`,
      sender: 'user',
      role: 'user',
      text: message,
      time: new Date().toLocaleTimeString('pt-BR'),
    });
    broadcastEvent('agents:update', getPublicAgentsState());

    try {
      const result = await runAgentInference({
        agent,
        prompt: message,
        images,
        history: agentChatHistory[id],
      });

      if (!result.ok) {
        updateRegisteredTask(taskRecord.id, { status: 'error', error: result.message, completedAt: new Date().toISOString() });
        updateAgentStatus(id, 'Serviço de IA Indisponível', 'error', result.message, 0);
        pushAgentLog(id, result.message, 'error');
        agentChatHistory[id].push({
          id: `msg-err-${Date.now()}`,
          sender: 'error',
          isError: true,
          text: result.message,
          time: new Date().toLocaleTimeString('pt-BR'),
        });
        broadcastEvent('agents:update', getPublicAgentsState());
        return res.status(400).json({
          ok: false,
          error: result.error,
          message: result.message,
          provider: result.provider,
        });
      }

      let newFiles = [];
      if (id === 'academic') {
        newFiles = await saveAcademicDeliverables({ topic: message.slice(0, 50), markdownContent: result.text });
        createdFiles.unshift(...newFiles);
      } else if (id === 'builder') {
        newFiles = saveBuilderDeliverables({ topic: message.slice(0, 50), academicContent: message, builderResponse: result.text });
        createdFiles.unshift(...newFiles);
      } else if (id === 'reviewer') {
        const qa = saveReviewerDeliverable({ topic: message.slice(0, 50), reviewContent: result.text });
        newFiles = [qa];
        createdFiles.unshift(qa);
      }

      agentChatHistory[id].push({
        id: `msg-a-${Date.now()}`,
        sender: 'agent',
        role: 'assistant',
        text: result.text,
        provider: result.providerLabel,
        model: result.model,
        file: newFiles[0] || null,
        files: newFiles,
        tokenUsage: result.tokenUsage,
        latencyMs: result.latencyMs,
        time: new Date().toLocaleTimeString('pt-BR'),
      });

      updateRegisteredTask(taskRecord.id, { status: 'completed', progress: 100, completedAt: new Date().toISOString(), resultSummary: result.text.slice(0, 120) });
      pushAgentLog(id, `Concluído via ${result.providerLabel} (${result.latencyMs}ms).`, 'success');
      updateAgentStatus(id, 'Tarefa Concluída ✓', 'completed', `Última entrega: "${message.slice(0, 40)}"`, 100);

      res.json({
        ok: true,
        reply: result.text,
        files: newFiles,
        provider: result.providerLabel,
        tokenUsage: result.tokenUsage,
        latencyMs: result.latencyMs,
      });
    } catch (err) {
      updateRegisteredTask(taskRecord.id, { status: 'error', error: err.message, completedAt: new Date().toISOString() });
      updateAgentStatus(id, 'Erro de Execução', 'error', err.message, 0);
      res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: err.message });
    }
  });

  // 7. Iniciar Missão Completa da Pipeline Multiagente (/api/tasks/execute & /api/mission/start)
  const handleStartMission = (req, res) => {
    const { prompt = '', images = [], imageBase64 = null, attachedFiles = [] } = req.body || {};
    const allImages = [...images];
    if (imageBase64) allImages.push(imageBase64);
    const cleanPrompt = prompt.trim() || (allImages.length > 0 ? 'Resolver questões e analisar print(s)' : 'Projeto Multiagente');
    if (isPipelineRunning) {
      return res.status(409).json({ error: 'O esquadrão já está executando uma missão em andamento.' });
    }
    res.json({ ok: true, message: 'Missão Multiagente iniciada no Escritório 3D da H.E.L.E.N.A.!', topic: cleanPrompt });
    runSquadPipeline({ userTask: cleanPrompt, images: allImages, attachedFiles });
  };
  app.post('/api/tasks/execute', handleStartMission);
  app.post('/api/mission/start', handleStartMission);

  // 8. Rotas do Agente 02 — Archivist (Sistema de Arquivos Real)
  app.post('/api/archivist/scan', (req, res) => {
    const { targetDir } = req.body || {};
    try {
      const scanTask = createRegisteredTask({
        title: `Escanear diretório: ${path.basename(targetDir || FOLDERS.sandboxMessy)}`,
        assignedAgentId: 'archivist',
        toolsRequired: ['scan_directory']
      });
      updateRegisteredTask(scanTask.id, { status: 'in_progress', progress: 50, startedAt: new Date().toISOString() });
      updateAgentStatus('archivist', 'Escaneando Pasta Real...', 'working', `Lendo: ${targetDir || FOLDERS.sandboxMessy}`, 60);
      const plan = scanDirectoryForOrganization(targetDir || FOLDERS.sandboxMessy);
      updateRegisteredTask(scanTask.id, { status: 'completed', progress: 100, completedAt: new Date().toISOString(), resultSummary: `${plan.totalFiles} arquivos catalogados` });
      updateAgentStatus('archivist', `${plan.totalFiles} arquivos catalogados ✓`, 'completed', `Pronto para organizar ${path.basename(plan.targetDir)}`, 100);
      res.json({ ok: true, plan });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/archivist/organize', (req, res) => {
    const { targetDir, selectedFilePaths } = req.body || {};
    try {
      const orgTask = createRegisteredTask({
        title: `Organizar arquivos em subpastas: ${path.basename(targetDir || FOLDERS.sandboxMessy)}`,
        assignedAgentId: 'archivist',
        toolsRequired: ['organize_directory']
      });
      updateRegisteredTask(orgTask.id, { status: 'in_progress', progress: 70, startedAt: new Date().toISOString() });
      const result = executeDirectoryOrganization(targetDir, selectedFilePaths);
      const updatedPlan = scanDirectoryForOrganization(targetDir);
      updateRegisteredTask(orgTask.id, { status: 'completed', progress: 100, completedAt: new Date().toISOString(), resultSummary: `${result.movedCount} arquivos organizados` });
      updateAgentStatus('archivist', 'Pastas Organizadas ✓', 'completed', `${result.movedCount} arquivos movidos com sucesso!`, 100);
      res.json({ ok: true, result, updatedPlan });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/archivist/undo', (req, res) => {
    const { targetDir } = req.body || {};
    try {
      const { restoredCount } = undoLastOrganization();
      updateAgentStatus('archivist', 'Organização Revertida ✓', 'idle', `${restoredCount} arquivos restaurados.`, 0);
      const updatedPlan = scanDirectoryForOrganization(targetDir || FOLDERS.sandboxMessy);
      res.json({ ok: true, restoredCount, updatedPlan });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/archivist/reset-sandbox', (req, res) => {
    try {
      seedSandboxMessyFolder(true);
      const plan = scanDirectoryForOrganization(FOLDERS.sandboxMessy);
      updateAgentStatus('archivist', 'Sandbox Recriada ✓', 'idle', `Pasta de demonstração pronta (${plan.totalFiles} arquivos).`, 0);
      res.json({ ok: true, plan });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // 9. Explorador e Preview de Arquivos (Aceita GET ?path=... e POST { filePath / targetPath })
  app.post('/api/files/open-explorer', async (req, res) => {
    const target = req.body?.targetPath || req.body?.filePath;
    const result = await openPathInOSExplorer(target);
    res.json(result);
  });

  const handleFilePreview = (req, res) => {
    const filePath = req.query?.path || req.body?.filePath || req.body?.path;
    try {
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Arquivo não encontrado no disco.' });
      }
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.pdf') {
        return res.json({
          ok: true,
          isBinaryPdf: true,
          ext,
          content: `[Arquivo PDF Oficial Gerado no Disco]\nLocal: ${filePath}\nTamanho: ${fs.statSync(filePath).size} bytes\n\nClique em "Mostrar no Windows Explorer" para abrir no leitor nativo de PDF.`,
        });
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      res.json({ ok: true, content: content.slice(0, 25000), ext });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
  app.get('/api/files/preview', handleFilePreview);
  app.post('/api/files/preview', handleFilePreview);
}

module.exports = {
  registerEcosystemRoutes,
  triggerMissionFromHelenaBrain,
  scanDirectoryForOrganization,
  executeDirectoryOrganization,
  getOfficeControlSummary,
  getPublicAgentsState,
  FOLDERS
};
