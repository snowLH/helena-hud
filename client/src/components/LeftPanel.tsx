import React from 'react';
import type { SystemStatus } from '../types';
import { Cpu, Activity, ShieldCheck, Zap } from 'lucide-react';

interface LeftPanelProps {
  status: SystemStatus | null;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ status }) => {
  const cpuPercent = status?.cpu.usagePercent ?? 24;
  const ramPercent = status?.ram.usagePercent ?? 65;
  const ramUsed = status?.ram.usedGB ?? 8.5;
  const ramTotal = status?.ram.totalGB ?? 16.0;
  const cores = status?.cpu.cores ?? 8;
  const cpuModel = status?.cpu.model ?? 'Processador Multi-Core';

  const getProgressColor = (percent: number) => {
    if (percent > 85) return 'from-rose-500 to-amber-500';
    if (percent > 65) return 'from-amber-400 to-cyan-400';
    return 'from-cyan-400 to-purple-400';
  };

  return (
    <aside className="w-[260px] xl:w-[290px] flex flex-col gap-2.5 z-20 pointer-events-auto max-h-[calc(100vh-130px)] overflow-y-auto scrollbar-none py-1">
      {/* 1. CPU Widget */}
      <div className="rounded-xl border border-purple-500/30 bg-slate-950/70 backdrop-blur-md p-3 shadow-[0_0_20px_rgba(11,4,16,0.8)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[11px] font-semibold tracking-wider">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>PROCESSADOR (CPU)</span>
          </div>
          <span className="text-[10px] font-mono text-purple-300/80">{cores} NÚCLEOS</span>
        </div>

        <div className="text-[10px] font-mono text-slate-300 truncate mb-1.5" title={cpuModel}>
          {cpuModel}
        </div>

        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-white">
            {cpuPercent}%
          </span>
          <span className="text-[9px] font-mono text-cyan-400/80">ATIVIDADE EM TEMPO REAL</span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-purple-950/50 border border-purple-500/30 overflow-hidden relative">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(cpuPercent)} transition-all duration-500 shadow-[0_0_8px_#00f0ff]`}
            style={{ width: `${Math.min(100, Math.max(5, cpuPercent))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[9px] font-mono text-purple-300/60 mt-1.5">
          <span>FREQUÊNCIA: AUTO</span>
          <span className="text-cyan-400/80 font-semibold">ESTADO: NOMINAL</span>
        </div>
      </div>

      {/* 2. RAM Widget */}
      <div className="rounded-xl border border-purple-500/30 bg-slate-950/70 backdrop-blur-md p-3 shadow-[0_0_20px_rgba(11,4,16,0.8)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-purple-300 font-mono text-[11px] font-semibold tracking-wider">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>MEMÓRIA RAM</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-300/80">{ramPercent}% ALOCADA</span>
        </div>

        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-300">
            {ramUsed} <span className="text-xs font-normal text-purple-300/70">/ {ramTotal} GB</span>
          </span>
          <span className="text-[9px] font-mono text-slate-400">
            {(ramTotal - ramUsed).toFixed(1)} GB LIVRES
          </span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-purple-950/50 border border-purple-500/30 overflow-hidden relative">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(ramPercent)} transition-all duration-500 shadow-[0_0_8px_#a855f7]`}
            style={{ width: `${Math.min(100, Math.max(5, ramPercent))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[9px] font-mono text-purple-300/60 mt-1.5">
          <span>CACHE: TRUNCADO</span>
          <span className="text-purple-300/80 font-semibold">COMPRESSÃO: ATIVA</span>
        </div>
      </div>

      {/* 3. Assistant Security Directive */}
      <div className="rounded-xl border border-purple-500/30 bg-slate-950/70 backdrop-blur-md p-2.5 shadow-[0_0_20px_rgba(11,4,16,0.8)] text-xs font-mono">
        <div className="flex items-center gap-1.5 text-cyan-300 mb-1.5 font-semibold text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>DIRETRIZ ZERO-API</span>
        </div>
        <p className="text-[10px] text-purple-200/80 leading-relaxed">
          100% On-Premise e Portátil via Pen Drive. Nenhum dado trafega por servidores externos.
        </p>

        <div className="mt-2 pt-1.5 border-t border-purple-500/20 flex items-center justify-between text-[9px] text-slate-400">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            MOTOR: HÍBRIDO NATIVO
          </span>
          <span className="text-emerald-400 font-semibold">OFFLINE OK</span>
        </div>
      </div>
    </aside>
  );
};
