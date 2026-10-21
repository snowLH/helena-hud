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
  noticias_radares?: Array<{
    topico: string;
    manchete: string;
    relevancia: string;
  }>;
}

export interface HelenaCard {
  id: string;
  titulo: string;
  tipo: 'hardware_network' | 'agenda_local' | 'prioridades' | 'finalizacao' | 'analise_hardware' | 'limpeza_temp' | 'rede_memoria' | 'processos_pesados' | 'relatorio_geral' | 'resposta_neural';
  subtitulo: string;
  fala: string;
  metricas?: Array<{ label: string; valor: string; detalhe?: string }>;
  itens?: any[];
  processos?: any[];
  dados?: any;
  mensagem?: string;
  endpointAcao?: string;
  resultadoOtimizacao?: OptimizationReport;
  motor?: string;
  texto?: string;
}

export type HelenaState = 'EM ESPERA' | 'FALANDO' | 'PROCESSANDO' | 'BIOMETRIA';
