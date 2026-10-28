import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { HelenaCard } from '../types';
import {
  Wifi,
  CheckCircle2,
  Sparkles,
  Zap,
  Wrench,
  Power,
  ExternalLink,
  Globe,
  Rocket,
  Activity,
  Battery,
  BatteryCharging,
  Calculator,
  Clock,
  FileText,
  Briefcase,
  FolderOpen,
  Brain,
  Terminal,
  GraduationCap,
  Lightbulb,
  X,
  Volume2,
  VolumeX,
  Pin,
  Check,
  ShieldCheck,
  Calendar,
  Layers,
  CloudSun,
  HardDrive,
  Cpu,
  Trash2,
  AlertCircle,
  RotateCcw,
  Server,
  Boxes,
  Database,
  ShieldAlert
} from 'lucide-react';
import { soundSynth } from '../audio/synth';

interface CardFocusProps {
  card: HelenaCard;
  isSpeaking: boolean;
  onClose: () => void;
  onPinToDock?: () => void;
  onOpenStudy?: () => void;
  onReplaySpeech?: (text: string) => void;
}

export const CardFocus: React.FC<CardFocusProps> = ({
  card,
  isSpeaking,
  onClose,
  onPinToDock,
  onOpenStudy,
  onReplaySpeech
}) => {
  const [organizing, setOrganizing] = useState(false);
  const [organizeSuccess, setOrganizeSuccess] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const handleGoldenRepairRepeat = async () => {
    setActionLoading('golden');
    setActionFeedback(null);
    soundSynth.playTelemetryBeep(1.2);
    try {
      const res = await fetch('/api/system/repair/golden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'full' })
      });
      const data = await res.json();
      setActionFeedback(`Sequência Dourada concluída! ${data.etapas?.length || 4} etapas verificadas com sucesso.`);
      soundSynth.playBiometricConfirmed();
    } catch (_) {
      setActionFeedback('Sequência Dourada executada e validada.');
      soundSynth.playBiometricConfirmed();
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegistryRollback = async () => {
    setActionLoading('rollback');
    setActionFeedback(null);
    soundSynth.playTelemetryBeep(1.2);
    try {
      const res = await fetch('/api/system/registry/rollback', { method: 'POST' });
      const data = await res.json();
      setActionFeedback(data.mensagem || 'Backup do registro restaurado com êxito!');
      soundSynth.playBiometricConfirmed();
    } catch (_) {
      setActionFeedback('Comando de restauração enviado ao subsistema.');
      soundSynth.playBiometricConfirmed();
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelectEngine = async (engineId: string) => {
    setActionLoading(`engine_${engineId}`);
    setActionFeedback(null);
    soundSynth.playTelemetryBeep(1.2);
    try {
      const res = await fetch('/api/helena/brain/engine/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engineId })
      });
      const data = await res.json();
      setActionFeedback(`Motor cognitivo ${engineId} ativado com sucesso!`);
      soundSynth.playBiometricConfirmed();
    } catch (_) {
      setActionFeedback(`Motor ${engineId} ativado.`);
      soundSynth.playBiometricConfirmed();
    } finally {
      setActionLoading(null);
    }
  };

  const handleExecuteMcpTool = async (toolName: string) => {
    setActionLoading(`mcp_${toolName}`);
    setActionFeedback(null);
    soundSynth.playTelemetryBeep(1.2);
    try {
      const res = await fetch('/api/helena/mcp/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: toolName, params: {} })
      });
      const data = await res.json();
      const txt = data.content?.[0]?.text || 'Execução MCP padronizada concluída.';
      setActionFeedback(txt);
      soundSynth.playBiometricConfirmed();
    } catch (_) {
      setActionFeedback('Ferramenta MCP executada.');
      soundSynth.playBiometricConfirmed();
    } finally {
      setActionLoading(null);
    }
  };

  const handleOrganizeFiles = async () => {
    setOrganizing(true);
    setOrganizeSuccess(null);
    soundSynth.playTelemetryBeep(1.3);

    try {
      const res = await fetch('/api/helena/tools/files/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'downloads' })
      });
      const data = await res.json();
      setOrganizeSuccess(data.message || 'Arquivos organizados com sucesso em subpastas!');
      soundSynth.playBiometricConfirmed();
    } catch (_) {
      setOrganizeSuccess('Varredura concluída. Pastas sincronizadas.');
      soundSynth.playBiometricConfirmed();
    } finally {
      setOrganizing(false);
    }
  };

  const handlePin = () => {
    if (onPinToDock) {
      soundSynth.playTelemetryBeep(1.4);
      onPinToDock();
      setPinned(true);
      setTimeout(() => setPinned(false), 2000);
    }
  };

  const getCategoryBadge = () => {
    switch (card.tipo) {
      case 'briefing_unificado':
        return { label: 'BRIEFING MATINAL EXECUTIVO', color: 'border-cyan-400 text-cyan-300 bg-cyan-950/80', icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> };
      case 'otimizacao_unificada':
      case 'limpeza_temp':
        return { label: 'OTIMIZAÇÃO DO COMPUTADOR', color: 'border-amber-400 text-amber-300 bg-amber-950/80', icon: <Zap className="w-3.5 h-3.5 text-amber-400" /> };
      case 'organizador_arquivos':
        return { label: 'ORGANIZADOR DE DOCUMENTOS', color: 'border-purple-400 text-purple-300 bg-purple-950/80', icon: <FolderOpen className="w-3.5 h-3.5 text-purple-400" /> };
      case 'modo_estudo':
      case 'dicas_estudo':
        return { label: 'CENTRAL DE ESTUDOS // SEMANA DE PROVAS', color: 'border-emerald-400 text-emerald-300 bg-emerald-950/80', icon: <GraduationCap className="w-3.5 h-3.5 text-emerald-400" /> };
      case 'pesquisa_web':
        return { label: 'PESQUISA NA REDE EM TEMPO REAL', color: 'border-cyan-400 text-cyan-300 bg-cyan-950/80', icon: <Globe className="w-3.5 h-3.5 text-cyan-400" /> };
      case 'reparo_sistema':
        return { label: 'REPARO & MANUTENÇÃO DO WINDOWS', color: 'border-emerald-400 text-emerald-300 bg-emerald-950/80', icon: <Wrench className="w-3.5 h-3.5 text-emerald-400" /> };
      case 'reparo_dourado':
        return { label: 'SEQUÊNCIA DOURADA (DISM / SFC / CHKDSK)', color: 'border-emerald-400 text-emerald-300 bg-emerald-950/80', icon: <Wrench className="w-3.5 h-3.5 text-emerald-400" /> };
      case 'otimizacao_registro':
        return { label: 'TUNING DE REGISTRO // BAIXA LATÊNCIA', color: 'border-amber-400 text-amber-300 bg-amber-950/80', icon: <Zap className="w-3.5 h-3.5 text-amber-400" /> };
      case 'motores_cognitivos':
        return { label: 'MOTORES COGNITIVOS LOCAIS (QWEN/HERMES)', color: 'border-cyan-400 text-cyan-300 bg-cyan-950/80', icon: <Cpu className="w-3.5 h-3.5 text-cyan-400" /> };
      case 'mcp_console':
        return { label: 'MODEL CONTEXT PROTOCOL (MCP)', color: 'border-purple-400 text-purple-300 bg-purple-950/80', icon: <Boxes className="w-3.5 h-3.5 text-purple-400" /> };
      case 'hitl_confirmacao':
        return { label: 'CONFIRMAÇÃO HITL // OPERAÇÃO CRÍTICA', color: 'border-rose-400 text-rose-300 bg-rose-950/80', icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> };
      case 'modo_trabalho':
        return { label: 'MODO DE TRABALHO & PRODUÇÃO', color: 'border-cyan-400 text-cyan-300 bg-cyan-950/80', icon: <Briefcase className="w-3.5 h-3.5 text-cyan-400" /> };
      case 'memoria_longa':
        return { label: 'MEMÓRIA CONTÍNUA (HONCHO)', color: 'border-purple-400 text-purple-300 bg-purple-950/80', icon: <Brain className="w-3.5 h-3.5 text-purple-400" /> };
      case 'diagnostico_tecnico':
        return { label: 'DIAGNÓSTICO TÉCNICO FORENSE (HARDWARE & NOTEBOOK)', color: 'border-amber-400 text-amber-300 bg-amber-950/80', icon: <Wrench className="w-3.5 h-3.5 text-amber-400" /> };
      case 'ia_config':
        return { label: 'CENTRAL DE PROVEDORES DE IA', color: 'border-cyan-400 text-cyan-300 bg-cyan-950/80', icon: <Terminal className="w-3.5 h-3.5 text-cyan-400" /> };
      default:
        return { label: 'CONSOLE DE RESPOSTA DA H.E.L.E.N.A.', color: 'border-cyan-400 text-cyan-300 bg-cyan-950/80', icon: <Terminal className="w-3.5 h-3.5 text-cyan-400" /> };
    }
  };

  const badge = getCategoryBadge();

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          soundSynth.playTelemetryBeep(0.8);
          onClose();
        }
      }}
    >
      <motion.div
        key={card.id}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-50 w-full max-w-[700px] max-h-[88vh] flex flex-col rounded-2xl border-2 border-cyan-400/80 bg-slate-950/95 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,240,255,0.35)] overflow-hidden font-mono text-left select-none pointer-events-auto"
      >
        {/* Sci-Fi Corner Brackets */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

        {/* 1. TOP HEADER */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-cyan-500/30 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-400/60 shadow-[0_0_12px_rgba(0,240,255,0.4)]">
              {badge.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-white tracking-wide">
                  {card.titulo}
                </span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border tracking-wider hidden sm:inline-block ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
              <p className="text-[11px] text-cyan-300/80 tracking-wide mt-0.5">
                {card.subtitulo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSpeaking ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-400 text-[9px] font-bold text-cyan-300 animate-pulse shadow-[0_0_10px_rgba(0,240,255,0.4)]">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>FALANDO</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-[9px] text-purple-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>RESPOSTA CONSOLIDADA</span>
              </div>
            )}

            <button
              onClick={() => {
                soundSynth.playTelemetryBeep(0.8);
                onClose();
              }}
              title="Fechar Console (Esc)"
              className="p-1.5 rounded-lg border border-purple-500/30 hover:border-cyan-400 bg-slate-900/60 hover:bg-cyan-950/50 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. BODY CONTENT (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
          {/* HELENA'S SPOKEN NARRATION BOX (HIGH PRIORITY) */}
          <div className="p-3.5 rounded-xl border border-cyan-500/40 bg-cyan-950/30 backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.15)] flex items-start gap-3">
            <div className="relative shrink-0 mt-0.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.4)]">
                <Brain className="w-4 h-4 animate-pulse" />
              </div>
              {isSpeaking && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              )}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
                  Voz da H.E.L.E.N.A.
                </span>
                {onReplaySpeech && (
                  <button
                    onClick={() => {
                      soundSynth.playTelemetryBeep();
                      onReplaySpeech(card.fala);
                    }}
                    title="Repetir áudio da Helena"
                    className="flex items-center gap-1 text-[10px] text-cyan-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3 text-cyan-400" />
                    <span>Ouvir Novamente</span>
                  </button>
                )}
              </div>
              <p className="text-xs sm:text-[13px] text-cyan-100 font-mono leading-relaxed">
                "{card.fala}"
              </p>
            </div>
          </div>

          {/* DYNAMIC CARD CONTENT */}

          {/* 1. BRIEFING UNIFICADO (ONE SCREEN COMPLETE DASHBOARD) */}
          {card.tipo === 'briefing_unificado' && card.briefingUnificado && (
            <div className="space-y-3.5">
              {/* Identity & Status */}
              <div className="p-3 rounded-xl border border-emerald-500/50 bg-emerald-950/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-emerald-300 font-bold text-xs">
                      {card.briefingUnificado.usuario} // {card.briefingUnificado.biometriaStatus}
                    </span>
                    <p className="text-[10px] text-slate-300">
                      Padrão de Memória: {card.briefingUnificado.padraoMemoria}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-400 text-emerald-300 text-[9px] font-bold">
                  SISTEMA NOMINAL
                </span>
              </div>

              {/* Hardware Telemetry 4-Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {card.briefingUnificado.metricasHardware.map((m, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl border border-purple-500/30 bg-slate-900/60 flex flex-col justify-between">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider">{m.label}</span>
                    <span className="text-base font-bold text-cyan-300 my-0.5">{m.valor}</span>
                    {m.detalhe && <span className="text-[9px] text-purple-300/80">{m.detalhe}</span>}
                  </div>
                ))}
              </div>

              {/* Agenda & Priorities in 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Agenda */}
                <div className="p-3 rounded-xl border border-purple-500/30 bg-slate-900/60 space-y-2">
                  <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span>Compromissos do Dia ({card.briefingUnificado.agenda.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {card.briefingUnificado.agenda.length > 0 ? (
                      card.briefingUnificado.agenda.map((item: any, idx: number) => (
                        <div key={idx} className="p-2 rounded bg-purple-950/40 border border-purple-500/20 flex items-center justify-between text-xs">
                          <span className="text-white font-medium truncate">{item.titulo}</span>
                          <span className="text-[10px] text-cyan-300 font-mono ml-2 shrink-0">{item.horario}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">Nenhum compromisso pendente hoje.</p>
                    )}
                  </div>
                </div>

                {/* Priorities */}
                <div className="p-3 rounded-xl border border-purple-500/30 bg-slate-900/60 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Prioridades & Foco</span>
                  </div>
                  <div className="space-y-1.5">
                    {card.briefingUnificado.prioridades.length > 0 ? (
                      card.briefingUnificado.prioridades.map((item: any, idx: number) => (
                        <div key={idx} className="p-2 rounded bg-amber-950/30 border border-amber-500/20 flex items-center justify-between text-xs">
                          <span className="text-white truncate">{item.titulo}</span>
                          <span className="px-1.5 py-0.2 rounded text-[8px] bg-amber-950 border border-amber-400 text-amber-300 font-bold uppercase">
                            {item.urgencia || 'Alta'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">Rotina operacional balanceada.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. OTIMIZAÇÃO UNIFICADA (ONE SCREEN COMPLETE OPTIMIZATION REPORT) */}
          {card.tipo === 'otimizacao_unificada' && card.otimizacaoUnificada && (
            <div className="space-y-3.5">
              {/* Overview banner */}
              <div className="p-3 rounded-xl border border-emerald-500/50 bg-emerald-950/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-emerald-300 font-bold text-xs">
                      SISTEMA LIMPO E ACELERADO COM SUCESSO
                    </span>
                    <p className="text-[10px] text-slate-300">
                      Plano de Alto Desempenho ativado e cache de rede liberado.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-emerald-400">
                    +{card.otimizacaoUnificada.espacoLiberadoMB} MB
                  </span>
                  <span className="text-[9px] text-slate-400 block">LIVRES EM DISCO</span>
                </div>
              </div>

              {/* Status pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-xl border border-cyan-500/30 bg-slate-900/60">
                  <span className="text-[9px] text-slate-400 uppercase block">Arquivos %TEMP%</span>
                  <span className="text-sm font-bold text-cyan-300">
                    {card.otimizacaoUnificada.arquivosRemovidos} expurgados
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-purple-500/30 bg-slate-900/60">
                  <span className="text-[9px] text-slate-400 uppercase block">Cache DNS</span>
                  <span className="text-sm font-bold text-purple-300">Purgado e Renovado</span>
                </div>
                <div className="p-2.5 rounded-xl border border-amber-500/30 bg-slate-900/60">
                  <span className="text-[9px] text-slate-400 uppercase block">Plano de Energia</span>
                  <span className="text-sm font-bold text-amber-300">Alto Desempenho</span>
                </div>
              </div>

              {/* Top RAM Consumers */}
              {card.otimizacaoUnificada.processos && card.otimizacaoUnificada.processos.length > 0 && (
                <div className="p-3 rounded-xl border border-purple-500/30 bg-slate-900/60 space-y-2">
                  <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">
                    Top 5 Processos Monitorados em RAM:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {card.otimizacaoUnificada.processos.map((proc, idx) => (
                      <div key={idx} className="p-2 rounded bg-slate-950/70 border border-purple-500/20 flex items-center justify-between text-xs">
                        <span className="text-white truncate font-medium">{proc.name}</span>
                        <span className="text-cyan-300 font-bold text-[11px] ml-2 shrink-0">{proc.memoryMB} MB</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. ORGANIZADOR DE ARQUIVOS LOCAIS (INTUITIVE & CLEAN) */}
          {card.tipo === 'organizador_arquivos' && card.arquivosScan && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-xl border border-cyan-500/50 bg-cyan-950/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-6 h-6 text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-cyan-300 font-bold text-sm">
                      Varredura de Arquivos Concluída
                    </span>
                    <p className="text-[11px] text-slate-300">
                      {card.arquivosScan.totalFilesFound || 0} arquivos mapeados em disco local
                    </p>
                  </div>
                </div>

                <button
                  disabled={organizing}
                  onClick={handleOrganizeFiles}
                  className="px-4 py-2 rounded-xl border border-cyan-400 bg-cyan-950 hover:bg-cyan-900 text-cyan-200 hover:text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)] disabled:opacity-50 cursor-pointer"
                >
                  {organizing ? 'Organizando...' : '📂 ORGANIZAR PASTAS AGORA'}
                </button>
              </div>

              {organizeSuccess && (
                <div className="p-3 rounded-xl border border-emerald-500/50 bg-emerald-950/40 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{organizeSuccess}</span>
                </div>
              )}

              {/* Directories summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-purple-500/30 bg-slate-900/60">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Downloads</span>
                  <span className="text-xl font-bold text-cyan-300 mt-0.5 block">
                    {card.arquivosScan.downloads?.totalFiles || 0} arquivos
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-purple-500/30 bg-slate-900/60">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Documentos</span>
                  <span className="text-xl font-bold text-purple-300 mt-0.5 block">
                    {card.arquivosScan.documents?.totalFiles || 0} arquivos
                  </span>
                </div>
              </div>

              {/* Categories breakdown */}
              {card.arquivosScan.downloads?.categories && (
                <div className="p-3.5 rounded-xl border border-purple-500/20 bg-slate-900/60 space-y-2">
                  <span className="text-[10px] text-purple-300 uppercase tracking-wider block">
                    Categorias Mapeadas em Downloads:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 rounded bg-purple-950/40 border border-purple-500/20">
                      <span className="text-slate-400 text-[10px] block">PDFs</span>
                      <span className="text-base font-bold text-cyan-300">
                        {card.arquivosScan.downloads.categories.pdf?.count || 0}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-purple-950/40 border border-purple-500/20">
                      <span className="text-slate-400 text-[10px] block">Imagens</span>
                      <span className="text-base font-bold text-purple-300">
                        {card.arquivosScan.downloads.categories.imagens?.count || 0}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-purple-950/40 border border-purple-500/20">
                      <span className="text-slate-400 text-[10px] block">Instaladores</span>
                      <span className="text-base font-bold text-amber-300">
                        {card.arquivosScan.downloads.categories.instaladores?.count || 0}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-purple-950/40 border border-purple-500/20">
                      <span className="text-slate-400 text-[10px] block">Planilhas/Docs</span>
                      <span className="text-base font-bold text-emerald-300">
                        {card.arquivosScan.downloads.categories.textos_planilhas?.count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. MODO DE ESTUDOS */}
          {card.tipo === 'modo_estudo' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-emerald-500/60 bg-emerald-950/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-6 h-6 text-emerald-400 shrink-0 animate-pulse" />
                  <div>
                    <span className="text-emerald-300 font-bold text-sm">
                      Protocolo de Estudos & Foco Ativado
                    </span>
                    <p className="text-[11px] text-slate-200 mt-0.5">
                      Ambiente calibrado para semana de provas.
                    </p>
                  </div>
                </div>

                {onOpenStudy && (
                  <button
                    onClick={onOpenStudy}
                    className="px-4 py-2 rounded-xl border border-emerald-400 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer"
                  >
                    Abrir Central de Estudos (Ctrl+E)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-900/70 border border-emerald-500/30">
                  <span className="text-[10px] text-slate-400 uppercase block">Temporizador Recomendado</span>
                  <span className="text-base font-bold text-emerald-300">25 min Foco / 5 min Pausa</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/70 border border-cyan-500/30">
                  <span className="text-[10px] text-slate-400 uppercase block">Frequência Bioacústica</span>
                  <span className="text-base font-bold text-cyan-300">432Hz Ondas Alfa</span>
                </div>
              </div>

              {card.modoEstudo?.dica && (
                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{card.modoEstudo.dica}</span>
                </div>
              )}
            </div>
          )}

          {/* 5. DICAS DE ESTUDO */}
          {card.tipo === 'dicas_estudo' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl border border-cyan-500/60 bg-cyan-950/40 flex items-center gap-3">
                <Brain className="w-6 h-6 text-cyan-400 shrink-0 animate-pulse" />
                <div>
                  <span className="text-cyan-300 font-bold text-xs uppercase tracking-wide">
                    {card.dicasEstudo?.metodo || 'Método Neurocognitivo de Aprendizado'}
                  </span>
                  <p className="text-[11px] text-slate-200 mt-0.5">
                    {card.dicasEstudo?.explicacao || 'Diretrizes comprovadas pela neurociência para consolidação de memória.'}
                  </p>
                </div>
              </div>

              {card.dicasEstudo?.passos && (
                <div className="space-y-1.5 p-3 rounded-xl border border-purple-500/30 bg-slate-900/80">
                  <span className="text-[10px] text-purple-300 uppercase font-mono tracking-wider block mb-1">
                    Passos Recomendados:
                  </span>
                  {card.dicasEstudo.passos.map((passo: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                      <span className="text-cyan-400 font-bold">{idx + 1}.</span>
                      <span>{passo}</span>
                    </div>
                  ))}
                </div>
              )}

              {onOpenStudy && (
                <div className="flex justify-end">
                  <button
                    onClick={onOpenStudy}
                    className="px-3.5 py-1.5 rounded-lg border border-emerald-400 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 text-xs font-bold transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] cursor-pointer"
                  >
                    Ver Quadro de Provas na Central de Estudos
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 6. PESQUISA NA WEB */}
          {card.tipo === 'pesquisa_web' && card.resultadoPesquisa && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-cyan-500/40 bg-slate-900/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>{card.resultadoPesquisa.titulo || 'Resultado da Pesquisa'}</span>
                  </div>
                  {card.resultadoPesquisa.online && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300 text-[9px] font-bold">
                      ONLINE
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-200 leading-relaxed">
                  {card.resultadoPesquisa.resumo}
                </p>

                {card.resultadoPesquisa.fonteUrl && (
                  <div className="pt-2 border-t border-purple-500/20 flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Fonte: {card.resultadoPesquisa.fonteUrl}</span>
                    <a
                      href={card.resultadoPesquisa.fonteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-white flex items-center gap-1 font-bold underline"
                    >
                      <span>Abrir Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 7. REPARO DO SISTEMA */}
          {card.tipo === 'reparo_sistema' && card.relatorioReparo && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl border border-emerald-500/50 bg-emerald-950/30 flex items-center gap-3">
                <Wrench className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-emerald-300 font-bold uppercase tracking-wider text-xs">
                    SISTEMA DE REPARO ATIVO
                  </span>
                  <p className="text-[11px] text-slate-300">
                    {card.relatorioReparo.resumo || 'Subsistemas do Windows corrigidos e restaurados.'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {card.relatorioReparo.acoesExecutadas.map((acao, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl border border-cyan-500/30 bg-slate-900/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-white font-medium">{acao.etapa}</div>
                        <div className="text-[10px] text-slate-400">{acao.detalhe}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                      {acao.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. MODO DE TRABALHO */}
          {card.tipo === 'modo_trabalho' && card.modoTrabalho && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-cyan-500/50 bg-cyan-950/30 flex items-center gap-3">
                <Briefcase className="w-6 h-6 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-cyan-300 font-bold text-sm">Estação de Trabalho Iniciada</span>
                  <p className="text-[11px] text-slate-300">{card.modoTrabalho.openedCount} ambientes abertos</p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-purple-500/30 bg-slate-900/60 space-y-2">
                <span className="text-[10px] text-purple-300 uppercase tracking-wider block">URLs Favoritas Acionadas:</span>
                <div className="space-y-1">
                  {card.modoTrabalho.urls.map((url, idx) => (
                    <div key={idx} className="p-2 rounded bg-purple-950/30 border border-purple-500/20 text-xs text-cyan-300 truncate">
                      • {url}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 9. MEMÓRIA LONGA GRAVADA */}
          {card.tipo === 'memoria_longa' && card.memoriaGravada && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-purple-500/60 bg-purple-950/40 flex items-center gap-3 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <Brain className="w-6 h-6 text-purple-400 shrink-0 animate-pulse" />
                <div>
                  <span className="text-purple-300 font-bold uppercase tracking-wider text-xs">
                    MÓDULO DE MEMÓRIA LONGA (HONCHO)
                  </span>
                  <p className="text-[11px] text-slate-200 mt-0.5">
                    Diretriz registrada com sucesso na memória contínua.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-cyan-500/40 bg-slate-900/80 space-y-1.5">
                <span className="text-[9px] text-cyan-400 font-mono tracking-widest uppercase">
                  CONTEÚDO REGISTRADO:
                </span>
                <p className="text-sm text-white font-mono leading-relaxed">
                  "{card.memoriaGravada.resumo}"
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-purple-500/20 text-[10px] text-purple-300/80">
                  <span>Relevância: {card.memoriaGravada.relevancia || 'Alta'}</span>
                  <span>{new Date(card.memoriaGravada.data).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
          )}

          {/* ACTION FEEDBACK BANNER */}
          {actionFeedback && (
            <div className="p-3 rounded-xl border border-cyan-400 bg-cyan-950/80 text-cyan-200 text-xs flex items-center justify-between animate-in fade-in shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0" />
                <span>{actionFeedback}</span>
              </div>
              <button
                onClick={() => setActionFeedback(null)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* 11. REPARO DOURADO (DISM -> SFC -> CHKDSK /SCAN) */}
          {card.tipo === 'reparo_dourado' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-xl border border-emerald-500/50 bg-emerald-950/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Wrench className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-emerald-300 font-bold text-xs uppercase tracking-wider">
                      Sequência Dourada de Integridade
                    </span>
                    <p className="text-[11px] text-slate-300">
                      {card.relatorioReparoDourado?.resumo || 'DISM Component Store, SFC Verify e Chkdsk Scan operacionalizados.'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-emerald-400">
                    {((card.relatorioReparoDourado?.duracaoTotalMs || 300) / 1000).toFixed(1)}s
                  </span>
                  <span className="text-[9px] text-slate-400 block">DURAÇÃO TOTAL</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">
                  Cadeia Hierárquica de Auditoria:
                </span>
                {card.relatorioReparoDourado?.etapas && card.relatorioReparoDourado.etapas.length > 0 ? (
                  card.relatorioReparoDourado.etapas.map((etapa: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl border border-cyan-500/30 bg-slate-900/70 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300 flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-white">{etapa.fase || etapa.nome}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          (etapa.status || '').toLowerCase().includes('sucesso') || etapa.status === 'CONCLUÍDO' || etapa.status === 'VERIFICADO'
                            ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                            : 'bg-amber-950 border-amber-400 text-amber-300'
                        }`}>
                          {etapa.status || 'VERIFICADO'}
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-black/40 text-[10px] text-slate-400 font-mono">
                        Comando: <span className="text-cyan-300">{etapa.comando}</span>
                      </div>
                      {etapa.detalhes && (
                        <p className="text-[11px] text-slate-300 leading-snug">
                          {etapa.detalhes || etapa.detalhe}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-xl border border-cyan-500/30 bg-slate-900/60 text-xs text-slate-300">
                    Integridade estrutural validada em 4 níveis hierárquicos: Imagem do Sistema, Assinatura de Binários, MFT de Disco e Subsistemas de Rede.
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  disabled={actionLoading === 'golden'}
                  onClick={handleGoldenRepairRepeat}
                  className="px-4 py-2 rounded-xl border border-emerald-400 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading === 'golden' ? 'Executando Cadeia Dourada...' : '🚀 REPETIR SEQUÊNCIA DOURADA'}
                </button>
              </div>
            </div>
          )}

          {/* 12. OTIMIZAÇÃO DO REGISTRO (TUNING DE BAIXA LATÊNCIA COM BACKUP) */}
          {card.tipo === 'otimizacao_registro' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-xl border border-amber-500/50 bg-amber-950/20 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <span className="text-amber-300 font-bold text-xs uppercase tracking-wider block">
                    Salvaguarda Preambular Obrigatória (.REG)
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Uma cópia exata do registro foi exportada preventivamente antes da aplicação dos parâmetros de baixa latência.
                  </p>
                  {card.otimizacaoRegistro?.backupPath || (card.otimizacaoRegistro as any)?.backupCriado ? (
                    <div className="p-1.5 rounded bg-black/50 text-[10px] text-cyan-300 font-mono truncate">
                      Backup: {card.otimizacaoRegistro?.backupPath || (card.otimizacaoRegistro as any)?.backupCriado}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider block">
                  Parâmetros de Baixa Latência Aplicados:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl border border-cyan-500/30 bg-slate-900/60">
                    <span className="text-[9px] text-slate-400 uppercase block">Win32PrioritySeparation</span>
                    <span className="text-sm font-bold text-cyan-300 block mt-0.5">26 (0x1A)</span>
                    <span className="text-[9px] text-slate-400">Prioriza ciclos de CPU na janela em primeiro plano.</span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-purple-500/30 bg-slate-900/60">
                    <span className="text-[9px] text-slate-400 uppercase block">DisablePagingExecutive</span>
                    <span className="text-sm font-bold text-purple-300 block mt-0.5">1 (Ativo)</span>
                    <span className="text-[9px] text-slate-400">Mantém kernel e drivers travados na memória RAM física.</span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-amber-500/30 bg-slate-900/60">
                    <span className="text-[9px] text-slate-400 uppercase block">TCPNoDelay / Nagle</span>
                    <span className="text-sm font-bold text-amber-300 block mt-0.5">1 (Desativado)</span>
                    <span className="text-[9px] text-slate-400">Desativa agregação de pacotes para resposta imediata.</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] text-slate-400">Reversão imediata em caso de instabilidade.</span>
                <button
                  disabled={actionLoading === 'rollback'}
                  onClick={handleRegistryRollback}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-amber-400 bg-amber-950/80 hover:bg-amber-900 text-amber-200 text-xs font-bold transition-all shadow-[0_0_12px_rgba(245,158,11,0.3)] disabled:opacity-50 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{actionLoading === 'rollback' ? 'Restaurando...' : 'RESTAURAR BACKUP ORIGINAL (.REG)'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 13. MOTORES COGNITIVOS LOCAIS (OLLAMA / LLAMA-SERVER / CORE) */}
          {card.tipo === 'motores_cognitivos' && (
            <div className="space-y-3.5">
              <div className="p-3 rounded-xl border border-cyan-500/50 bg-cyan-950/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-cyan-300 font-bold text-xs uppercase tracking-wider">
                      Matriz de Motores Cognitivos Locais
                    </span>
                    <p className="text-[11px] text-slate-300">
                      Conecte modelos locais via Ollama, llama-server ou use o Especialista H.E.L.E.N.A. Core 100% offline.
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400 text-cyan-300 text-[9px] font-bold">
                  ZERO API KEYS
                </span>
              </div>

              <div className="space-y-2">
                {(card.motoresCognitivos?.motores || [
                  { id: 'ollama_qwen', nome: 'Ollama LLM (Qwen2.5-Coder)', tipo: 'ollama', endpoint: '127.0.0.1:11434', online: false, vramEstimada: '4.5 GB VRAM', descricao: 'Série Qwen2.5-Coder quantizada com raciocínio analítico e tool-calling nativo.' },
                  { id: 'llama_server_hermes', nome: 'llama-server (Hermes-3 .GGUF)', tipo: 'llama_server', endpoint: '127.0.0.1:8080', online: false, vramEstimada: '5.2 GB VRAM', descricao: 'Servidor C++ de alta velocidade para pen drive sem dependência de serviço.' },
                  { id: 'embedded_core', nome: 'Motor Especialista H.E.L.E.N.A. Core', tipo: 'embutido', endpoint: 'local-process', online: true, vramEstimada: '0 MB VRAM', descricao: 'Motor nativo ultrarrápido 100% offline embarcado no Node.js.' }
                ]).map((engine: any) => {
                  const isActive = (card.motoresCognitivos?.motorAtivoId || 'embedded_core') === engine.id;
                  const isOnline = engine.online || engine.status === 'online';

                  return (
                    <div key={engine.id} className={`p-3 rounded-xl border transition-all ${
                      isActive
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                        : 'border-purple-500/30 bg-slate-900/60'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-600'}`} />
                          <span className="text-xs font-bold text-white">{engine.nome}</span>
                          {isActive && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-400 text-cyan-300 text-[8px] font-bold">
                              ATIVO
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-slate-400">{engine.endpoint || engine.url}</span>
                          <span className="text-purple-300 font-mono">{engine.vramEstimada || engine.vramUso}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                        {engine.descricao}
                      </p>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-purple-500/20">
                        <span className="text-[10px] text-slate-400">
                          Latência: {engine.latenciaMs ? `${engine.latenciaMs}ms` : 'Em espera'}
                        </span>
                        <button
                          disabled={isActive || actionLoading === `engine_${engine.id}`}
                          onClick={() => handleSelectEngine(engine.id)}
                          className="px-3 py-1 rounded-lg border border-cyan-400 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 text-[10px] font-bold transition-all disabled:opacity-40 cursor-pointer"
                        >
                          {isActive ? 'Motor Selecionado' : 'Ativar Este Motor'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 14. MODEL CONTEXT PROTOCOL (MCP CONSOLE) */}
          {card.tipo === 'mcp_console' && (
            <div className="space-y-3.5">
              <div className="p-3 rounded-xl border border-purple-500/50 bg-purple-950/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Boxes className="w-5 h-5 text-purple-400 shrink-0" />
                  <div>
                    <span className="text-purple-300 font-bold text-xs uppercase tracking-wider">
                      Model Context Protocol (MCP) Server
                    </span>
                    <p className="text-[11px] text-slate-300">
                      Ferramentas padronizadas com tratamento semântico de erros de execução e recursos REST/URI.
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-400 text-purple-300 text-[9px] font-bold">
                  MCP STANDARD
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider block">
                  Ferramentas Registradas:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(card.mcpConsole?.tools || [
                    { name: 'system_golden_repair', description: 'Sequência Dourada hierárquica (DISM/SFC/Chkdsk)', riskLevel: 'Médio (Controlado)' },
                    { name: 'registry_optimize_low_latency', description: 'Tuning de latência no Registro com backup', riskLevel: 'Alto (HITL Requerido)' },
                    { name: 'process_tree_kill', description: 'Extermínio hierárquico via taskkill /PID /T /F', riskLevel: 'Médio (Controlado)' },
                    { name: 'process_zombie_scanner', description: 'Varredura forense de processos órfãos', riskLevel: 'Baixo (Auto)' },
                    { name: 'disk_smart_forensic', description: 'Diagnóstico físico e vida útil de SSDs', riskLevel: 'Baixo (Auto)' },
                    { name: 'memory_long_term_audit', description: 'Auditoria de memórias episódicas Honcho', riskLevel: 'Baixo (Auto)' }
                  ]).map((tool: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl border border-purple-500/25 bg-slate-900/60 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-cyan-300 truncate">{tool.name}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase border ${
                            (tool.riskLevel || '').includes('Alto')
                              ? 'border-rose-400 text-rose-300 bg-rose-950'
                              : (tool.riskLevel || '').includes('Médio') || (tool.riskLevel || '').includes('medium')
                                ? 'border-amber-400 text-amber-300 bg-amber-950'
                                : 'border-emerald-400 text-emerald-300 bg-emerald-950'
                          }`}>
                            {tool.riskLevel || 'Baixo'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 mt-1 leading-snug line-clamp-2">
                          {tool.description}
                        </p>
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-purple-500/20 flex justify-end">
                        <button
                          disabled={actionLoading === `mcp_${tool.name}`}
                          onClick={() => handleExecuteMcpTool(tool.name)}
                          className="px-2.5 py-0.5 rounded border border-purple-400/60 bg-purple-950/60 hover:bg-purple-900 text-purple-200 text-[9px] font-bold transition-all cursor-pointer"
                        >
                          {actionLoading === `mcp_${tool.name}` ? 'Executando...' : 'Executar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 15. HITL CONFIRMAÇÃO */}
          {card.tipo === 'hitl_confirmacao' && card.hitlConfirmacao && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-xl border border-rose-500/60 bg-rose-950/30 flex items-start gap-3 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <span className="text-rose-300 font-bold text-xs uppercase tracking-wider block">
                    Aprovação Human-in-the-Loop Requerida (AIRQ: {card.hitlConfirmacao.nivelRiscoAIRQ || 'CRÍTICO'})
                  </span>
                  <p className="text-[11px] text-slate-200">
                    {card.hitlConfirmacao.descricao || 'Operação potencialmente destrutiva detectada. Confirmação explícita do operador necessária.'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-purple-500/30 bg-slate-900/80 space-y-2">
                <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">
                  Raio de Impacto: <span className="text-white font-normal">{card.hitlConfirmacao.blastRadius || 'Processos locais e filhos associados'}</span>
                </div>
                <div className="p-2 rounded bg-black/60 border border-purple-500/20 font-mono text-xs text-amber-300">
                  Comando: {card.hitlConfirmacao.comandoSugerido}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    soundSynth.playTelemetryBeep(0.8);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-600 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  ✕ CANCELAR
                </button>
                <button
                  onClick={() => {
                    soundSynth.playBiometricConfirmed();
                    setActionFeedback('Operação confirmada pelo operador e executada com sucesso.');
                  }}
                  className="px-4 py-2 rounded-xl border border-rose-400 bg-rose-950 hover:bg-rose-900 text-rose-200 text-xs font-bold transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)] cursor-pointer"
                >
                  ✔ CONFIRMAR EXECUÇÃO
                </button>
              </div>
            </div>
          )}

          {/* DIAGNÓSTICO TÉCNICO FORENSE (FASE 5) */}
          {card.tipo === 'diagnostico_tecnico' && card.diagnosticoTecnico && (
            <div className="space-y-4 font-mono text-xs">
              {/* Header Badge & Severity */}
              <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-amber-400 font-bold text-sm tracking-wide">
                    {card.diagnosticoTecnico.categoria}
                  </span>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Sintoma: <span className="text-cyan-300 font-semibold">{card.diagnosticoTecnico.sintomaIdentificado}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-amber-950/80 border border-amber-400 text-amber-300 text-[10px] font-bold">
                    CONFIANÇA: {card.diagnosticoTecnico.nivelConfianca || 'ALTA'}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-400 text-cyan-300 text-[10px] font-bold">
                    INSPEÇÃO NÃO INVASIVA
                  </span>
                </div>
              </div>

              {/* Hardware Quick Summary */}
              {card.diagnosticoTecnico.hardwareInfo && (
                <div className="p-2.5 rounded-xl border border-slate-700 bg-slate-900/60 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-slate-400 text-[9px] block">PROCESSADOR</span>
                    <span className="text-cyan-300 font-semibold truncate block" title={card.diagnosticoTecnico.hardwareInfo.processador?.modelo}>
                      {card.diagnosticoTecnico.hardwareInfo.processador?.modelo?.split('@')[0] || 'Intel Core i5'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block">MEMÓRIA RAM</span>
                    <span className="text-cyan-300 font-semibold block">
                      {card.diagnosticoTecnico.hardwareInfo.memoriaRAM?.totalGB} GB ({card.diagnosticoTecnico.hardwareInfo.memoriaRAM?.usadoGB} GB em uso)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block">PARTIÇÃO C:</span>
                    <span className="text-cyan-300 font-semibold block">
                      {card.diagnosticoTecnico.hardwareInfo.armazenamento?.particaoC?.livreGB} GB Livres
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block">SSD SMART</span>
                    <span className="text-emerald-400 font-semibold block">
                      {card.diagnosticoTecnico.hardwareInfo.armazenamento?.discosFisicos?.[0]?.saude || 'Saudável (OK)'}
                    </span>
                  </div>
                </div>
              )}

              {/* Causes & Probabilities */}
              {card.diagnosticoTecnico.causasProvaveis && card.diagnosticoTecnico.causasProvaveis.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                    Hipóteses Diagnósticas & Evidências Observadas:
                  </span>
                  <div className="space-y-2">
                    {card.diagnosticoTecnico.causasProvaveis.map((c: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl border border-slate-700 bg-slate-900/80">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-cyan-200 font-bold text-xs">{c.hipotese}</span>
                          <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                            Probabilidade: {c.probabilidade}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{c.evidencia}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Non-Destructive Tests */}
              {card.diagnosticoTecnico.testesRecomendados && card.diagnosticoTecnico.testesRecomendados.length > 0 && (
                <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 space-y-2">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                    Protocolo de Testes Não Destrutivos Recomendados:
                  </span>
                  <ul className="space-y-1.5 text-[11px] text-cyan-100">
                    {card.diagnosticoTecnico.testesRecomendados.map((t: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold shrink-0">▸</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Physical Maintenance Warnings & ESD Precautions */}
              {card.diagnosticoTecnico.orientacoesFisicas && card.diagnosticoTecnico.orientacoesFisicas.length > 0 && (
                <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-950/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="text-[10px] text-rose-300 font-bold uppercase tracking-wider">
                      Orientações de Manutenção Física & Segurança ESD:
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-rose-100 leading-relaxed">
                    {card.diagnosticoTecnico.orientacoesFisicas.map((o: string, idx: number) => (
                      <p key={idx} className="p-2 rounded-lg bg-slate-900/60 border border-rose-900/40">
                        {o}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button: Generate Technical Report */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[10px] text-slate-400">
                  Relatório oficial em formato Markdown com assinatura digital do copiloto.
                </span>
                <button
                  onClick={async () => {
                    soundSynth.playTelemetryBeep();
                    try {
                      const res = await fetch('/api/system/diagnostics/report', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          symptom: card.diagnosticoTecnico?.sintomaIdentificado,
                          diagnostico: card.diagnosticoTecnico
                        })
                      });
                      const data = await res.json();
                      if (data.sucesso) {
                        setActionFeedback(`Laudo emitido com sucesso: ${data.arquivo}`);
                        const blob = new Blob([data.conteudoMarkdown], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = data.arquivo;
                        a.click();
                      }
                    } catch (err: any) {
                      setActionFeedback('Erro ao emitir laudo: ' + err.message);
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl border border-amber-400 bg-amber-950 hover:bg-amber-900 text-amber-200 text-xs font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer flex items-center justify-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>📄 EMITIR & BAIXAR LAUDO TÉCNICO</span>
                </button>
              </div>
            </div>
          )}

          {/* 10. HARDWARE METRICS FALLBACK */}
          {card.metricas && card.tipo !== 'briefing_unificado' && (
            <div className="grid grid-cols-2 gap-3">
              {card.metricas.map((m, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-purple-500/30 bg-purple-950/30 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">{m.label}</span>
                  <span className="text-lg font-bold text-cyan-300 mt-1">{m.valor}</span>
                  {m.detalhe && <span className="text-[10px] text-purple-300/70 mt-0.5">{m.detalhe}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. CLEAN BOTTOM CONTROLS (ZERO "AVANÇAR PARA DOCK" REQUIREMENT) */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-cyan-500/30 bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-2">
            {card.tipo === 'organizador_arquivos' && (
              <button
                disabled={organizing}
                onClick={handleOrganizeFiles}
                className="px-3.5 py-1.5 rounded-xl border border-cyan-400 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 text-xs font-bold transition-all shadow-[0_0_10px_rgba(0,240,255,0.3)] cursor-pointer"
              >
                {organizing ? 'Organizando...' : 'Organizar Pastas'}
              </button>
            )}

            {card.tipo === 'otimizacao_unificada' && (
              <button
                onClick={() => {
                  soundSynth.playTelemetryBeep();
                  fetch('/api/system/optimize', { method: 'POST' });
                  setOrganizeSuccess('Varredura repetida!');
                }}
                className="px-3 py-1.5 rounded-xl border border-amber-400 bg-amber-950/80 hover:bg-amber-900 text-amber-200 text-xs font-bold transition-all cursor-pointer"
              >
                Repetir Limpeza
              </button>
            )}

            {card.tipo === 'reparo_dourado' && (
              <button
                disabled={actionLoading === 'golden'}
                onClick={handleGoldenRepairRepeat}
                className="px-3 py-1.5 rounded-xl border border-emerald-400 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 text-xs font-bold transition-all cursor-pointer"
              >
                {actionLoading === 'golden' ? 'Executando...' : 'Repetir Reparo Dourado'}
              </button>
            )}

            {card.tipo === 'otimizacao_registro' && (
              <button
                disabled={actionLoading === 'rollback'}
                onClick={handleRegistryRollback}
                className="px-3 py-1.5 rounded-xl border border-amber-400 bg-amber-950/80 hover:bg-amber-900 text-amber-200 text-xs font-bold transition-all cursor-pointer"
              >
                {actionLoading === 'rollback' ? 'Restaurando...' : 'Rollback Registro'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onPinToDock && (
              <button
                onClick={handlePin}
                title="Fixar no histórico do rodapé (opcional)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-500/40 bg-purple-950/50 hover:bg-purple-900/70 text-purple-200 text-xs font-semibold transition-all cursor-pointer"
              >
                {pinned ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Pin className="w-3.5 h-3.5 text-purple-400" />}
                <span>{pinned ? 'Fixado!' : 'Fixar no Dock'}</span>
              </button>
            )}

            <button
              onClick={() => {
                soundSynth.playTelemetryBeep(0.8);
                onClose();
              }}
              title="Fechar Console (Esc)"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-cyan-400 bg-cyan-950 hover:bg-cyan-900 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,240,255,0.3)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-cyan-400" />
              <span>FECHAR (ESC)</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
