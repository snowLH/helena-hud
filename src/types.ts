export interface SystemStatus {
  timestamp: string;
  user: {
    username: string;
    hostname: string;
    platform: string;
    arch: string;
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
    | 'memoria_longa';
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
}

export type HelenaState = 'EM ESPERA' | 'FALANDO' | 'PROCESSANDO' | 'BIOMETRIA';
