export interface SystemStatus {
  timestamp: string;
  isLocalAgent?: boolean;
  isCloudSandbox?: boolean;
  cloudNotice?: string;
  user: {
    username: string;
    hostname: string;
    platform: string;
    arch: string;
    pcModel?: string;
    uptimeSeconds: number;
  };
  cpu: {
    model: string;
    cores: number;
    usagePercent: number;
  };
  ram: {
    totalGB: number;
    usedGB: number;
    freeGB: number;
    usagePercent: number;
  };
  disk: {
    freeGB: number;
    usedGB: number;
    totalGB: number;
    usagePercent: number;
  };
  network: {
    latencyMs: number;
    online: boolean;
    host: string;
  };
  temp: {
    path: string;
    fileCount: number;
    totalMB: number;
  };
  battery?: BatteryInfo;
  topProcesses: Array<{
    name: string;
    pid: number;
    memoryMB: number;
  }>;
}

export interface OptimizationStep {
  etapa: string;
  status: string;
  arquivosRemovidos?: number;
  espacoLiberadoMB?: number;
  arquivosPreservadosEmUso?: number;
  dnsCacheLimpo?: boolean;
  processosAnalisados?: number;
  processosMaisPesados?: string[];
  plano?: string;
  detalhes: string;
}

export interface OptimizationReport {
  success: boolean;
  timestamp: string;
  etapas: OptimizationStep[];
  resumo: string;
}

export interface RepairReport {
  timestamp: string;
  sucesso: boolean;
  acoesExecutadas: Array<{
    etapa: string;
    status: string;
    detalhe: string;
  }>;
  errosCorrigidos: number;
  resumo?: string;
}

export interface GoldenRepairStep {
  fase: string;
  comando: string;
  status: 'CONCLUÍDO' | 'REPARADO' | 'VERIFICADO' | 'REQUER ELEVAÇÃO' | 'ALERTA';
  detalhe: string;
  duracaoMs?: number;
}

export interface GoldenRepairReport {
  timestamp: string;
  sucesso: boolean;
  modo: string;
  duracaoTotalMs: number;
  etapas: GoldenRepairStep[];
  errosCorrigidos: number;
  resumo: string;
  recomendacao: string;
}

export interface RegistryOptimizationReport {
  timestamp: string;
  sucesso: boolean;
  backupCriado: boolean;
  backupPath: string;
  parametrosModificados: Array<{
    chave: string;
    valorOriginal?: any;
    valorOtimizado: any;
    finalidade: string;
  }>;
  resumo: string;
}

export interface CognitiveEngineInfo {
  id: string;
  nome: string;
  tipo: 'ollama' | 'llama_server' | 'embutido';
  endpoint: string;
  online: boolean;
  modeloAtivo?: string;
  modelosDisponiveis?: string[];
  latenciaMs?: number;
  vramEstimada?: string;
  descricao: string;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
  category: string;
  riskLevel: 'Baixo (Auto)' | 'Médio (Controlado)' | 'Alto (HITL Requerido)';
}

export interface HitlRequest {
  id: string;
  acao: string;
  alvo: string;
  nivelRiscoAIRQ: string;
  blastRadius: string;
  descricao: string;
  comandoSugerido: string;
  timestamp: string;
}

export interface StartupApp {
  id: string;
  name: string;
  command: string;
  location?: string;
  enabled: boolean;
  impact: 'ALTO' | 'MÉDIO' | 'BAIXO';
}

export interface ProcessItem {
  name: string;
  pid: number;
  memoryMB: number;
  isCritical?: boolean;
}

export interface BenchmarkResult {
  score: number;
  rating: string;
  cpuSpeedMs: number;
  hashesPerSec: number;
  ramThroughputMBps: number;
  diskThroughputMBps: number;
  timestamp: string;
  nucleos: number;
  cpuModel: string;
}

export interface BatteryInfo {
  hasBattery: boolean;
  percent: number;
  isCharging: boolean;
  statusText: string;
}

export interface NetworkDiagnostics {
  latencyMs: number;
  pingCloudflare: number;
  pingGoogle: number;
  dnsSpeedMs: number;
  localIp: string;
  publicIp: string;
  online: boolean;
}

export interface WeatherResult {
  city: string;
  state?: string;
  country?: string;
  temp: number;
  humidity: number;
  condition: string;
  windKmH: number;
  online: boolean;
}

export interface AnotacaoItem {
  id: string;
  texto: string;
  data: string;
}

export interface SearchResult {
  online: boolean;
  termo: string;
  titulo?: string;
  resumo: string;
  fonteUrl?: string;
  imagemUrl?: string;
  fala: string;
}

export interface AgendaItem {
  id: string;
  horario: string;
  titulo: string;
  status: string;
  local?: string;
  prioridade: string;
}

export interface PrioridadeItem {
  id: string;
  titulo: string;
  descricao: string;
  urgencia: string;
  progresso: number;
}

export interface MetaItem {
  id: string;
  categoria: string;
  descricao: string;
  meta: string;
  concluido: boolean;
}

export interface PersonalData {
  usuario: {
    nome: string;
    titulo: string;
    preferenciaVoz: string;
    cidade: string;
  };
  clima: {
    cidade: string;
    condicao: string;
    temperatura: number;
    minima: number;
    maxima: number;
    umidade: number;
    ventoKmH: number;
    probabilidadeChuva: string;
  };
  agenda: AgendaItem[];
  prioridades: PrioridadeItem[];
  metas: MetaItem[];
  anotacoes?: AnotacaoItem[];
  noticias_radares?: Array<{
    topico: string;
    manchete: string;
    relevancia: string;
  }>;
}

export interface UserProfile {
  usuario: {
    nome: string;
    titulo: string;
    preferenciaVoz: string;
    cidade: string;
  };
  rotina: {
    horarioInicio: string;
    focoPrincipal: string;
    intervalos: string;
  };
  projetosAtuais: Array<{
    id: string;
    nome: string;
    descricao: string;
    status: string;
  }>;
  preferenciasPC: {
    modoEnergia: string;
    alertaRAM: number;
    limpezaAutomaticaTemp: boolean;
    pastasMonitoradas: string[];
  };
  modoTrabalho: {
    urls: string[];
    aplicativos: string[];
  };
}

export interface LearnedPattern {
  padrao: string;
  observacao: string;
  confianca: number;
  dataDetecao: string;
}

export interface EpisodicMemory {
  id: string;
  tipo: string;
  resumo: string;
  data: string;
  relevancia: string;
}

export interface LongTermMemory {
  padroesAprendidos: LearnedPattern[];
  memoriasEpisodicas: EpisodicMemory[];
  estatisticas: {
    totalInteracoes: number;
    otimizacoesRealizadas: number;
    briefingsExecutados: number;
    arquivosOrganizados: number;
    ultimaInteracao: string;
  };
}

export interface ExamItem {
  id: string;
  materia: string;
  dataHora: string;
  status: 'A Iniciar' | 'Revisando' | 'Dominado';
  topicos: string[];
  progresso: number;
}

export interface HelenaCard {
  id: string;
  titulo: string;
  tipo:
    | 'hardware_network'
    | 'agenda_local'
    | 'prioridades'
    | 'finalizacao'
    | 'analise_hardware'
    | 'limpeza_temp'
    | 'rede_memoria'
    | 'processos_pesados'
    | 'relatorio_geral'
    | 'resposta_neural'
    | 'reparo_sistema'
    | 'startup_manager'
    | 'app_launcher'
    | 'pesquisa_web'
    | 'benchmark'
    | 'bateria'
    | 'diagnostico_rede'
    | 'calculo'
    | 'clima_dinamico'
    | 'timer'
    | 'anotacoes'
    | 'modo_trabalho'
    | 'organizador_arquivos'
    | 'memoria_longa'
    | 'modo_estudo'
    | 'dicas_estudo'
    | 'briefing_unificado'
    | 'otimizacao_unificada'
    | 'reparo_dourado'
    | 'otimizacao_registro'
    | 'motores_cognitivos'
    | 'mcp_console'
    | 'hitl_confirmacao'
    | 'diagnostico_tecnico'
    | 'ia_config';
  subtitulo: string;
  fala: string;
  metricas?: Array<{ label: string; valor: string; detalhe?: string }>;
  itens?: any[];
  processos?: any[];
  dados?: any;
  mensagem?: string;
  endpointAcao?: string;
  resultadoOtimizacao?: OptimizationReport;
  relatorioReparo?: RepairReport;
  resultadoPesquisa?: SearchResult;
  startupApps?: StartupApp[];
  resultadoBenchmark?: BenchmarkResult;
  infoBateria?: BatteryInfo;
  diagnosticoRede?: NetworkDiagnostics;
  resultadoClima?: WeatherResult;
  calculo?: { expressao: string; resultado: string };
  timer?: { segundos: number; label: string };
  anotacoes?: AnotacaoItem[];
  appLancado?: string;
  motor?: string;
  texto?: string;
  modoTrabalho?: { urls: string[]; apps: string[]; openedCount: number };
  arquivosScan?: any;
  memoriaGravada?: any;
  modoEstudo?: {
    status: string;
    tempoFocoMinutos: number;
    intervaloMinutos: number;
    frequenciaFoco: string;
    dica: string;
    acaoSugerida?: string;
  };
  dicasEstudo?: {
    metodo: string;
    explicacao: string;
    passos: string[];
    recomendacao: string;
  };
  briefingUnificado?: {
    usuario: string;
    biometriaStatus: string;
    padraoMemoria: string;
    metricasHardware: Array<{ label: string; valor: string; detalhe?: string }>;
    agenda: any[];
    prioridades: any[];
    clima?: any;
  };
  otimizacaoUnificada?: {
    espacoLiberadoMB: number;
    arquivosRemovidos: number;
    dnsLimpo: boolean;
    planoEnergia: string;
    processos: Array<{ name: string; pid: number; memoryMB: number }>;
  };
  relatorioReparoDourado?: GoldenRepairReport;
  otimizacaoRegistro?: RegistryOptimizationReport;
  motoresCognitivos?: {
    motores: CognitiveEngineInfo[];
    motorAtivoId: string;
  };
  mcpConsole?: {
    tools: McpTool[];
    resources: Array<{ uri: string; name: string; description: string }>;
  };
  hitlConfirmacao?: HitlRequest;
  diagnosticoTecnico?: GuidedDiagnostic;
  aiConfigData?: any;
}

export interface CauseItem {
  hipotese: string;
  probabilidade: string;
  evidencia: string;
}

export interface GuidedDiagnostic {
  sintomaIdentificado: string;
  categoria: string;
  nivelConfianca: string;
  causasProvaveis: CauseItem[];
  testesRecomendados: string[];
  orientacoesFisicas: string[];
  planoAcao: string[];
  resumoFala: string;
  hardwareInfo?: any;
}

export interface AIProviderConfig {
  activeProvider: string;
  activeModel: string;
  temperatura?: number;
  fallbackAutomatico?: boolean;
}

export type HelenaState = 'EM ESPERA' | 'FALANDO' | 'PROCESSANDO' | 'BIOMETRIA';
