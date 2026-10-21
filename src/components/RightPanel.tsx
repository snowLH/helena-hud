import React from 'react';
import type { SystemStatus, PersonalData } from '../types';
import { Wifi, HardDrive, Trash2, CloudSun } from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';

interface RightPanelProps {
  status: SystemStatus | null;
  personalData: PersonalData | null;
  isSpeaking: boolean;
  onQuickOptimize: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  status,
  personalData,
  isSpeaking,
  onQuickOptimize
}) => {
  const ping = status?.network.latencyMs ?? 9;
  const networkHost = status?.network.host ?? 'Local';
  const diskFree = status?.disk.freeGB ?? 79.1;
  const diskTotal = status?.disk.totalGB ?? 237.4;
  const diskPercent = status?.disk.usagePercent ?? 67;
  const tempCount = status?.temp.fileCount ?? 178;
  const tempMB = status?.temp.totalMB ?? 41.0;

  const clima = personalData?.clima ?? {
    cidade: "São Paulo",
    temperatura: 24,
    condicao: "Céu Limpo",
    probabilidadeChuva: "10%"
  };

  return (
    <aside className="w-[310px] flex flex-col gap-3 z-20 pointer-events-auto">
      {/* 1. Voice Modulation Wave Oscilloscope */}
      <div className="rounded-xl border border-purple-500/30 bg-slate-950/60 backdrop-blur-md p-3 shadow-[0_0_20px_rgba(11,4,16,0.8)]">
        <AudioVisualizer isSpeaking={isSpeaking} />
      </div>

      {/* 2. Network & Storage Combo Widget */}
      <div className="rounded-xl border border-purple-500/30 bg-slate-950/60 backdrop-blur-md p-3.5 shadow-[0_0_20px_rgba(11,4,16,0.8)] relative overflow-hidden">
        {/* Network section */}
        <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold">
            <Wifi className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>LATÊNCIA DE REDE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-mono font-bold text-emerald-300">{ping} ms</span>
          </div>
        </div>

        <div className="text-[10px] font-mono text-slate-400 mt-1 mb-3 truncate">
          RESOLUÇÃO: {networkHost}
        </div>

        {/* Disk Storage Section */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 text-purple-300 font-mono text-xs font-semibold">
            <HardDrive className="w-4 h-4 text-purple-400" />
            <span>DISCO LOCAL C:</span>
          </div>
          <span className="text-[11px] font-mono text-cyan-300">{diskPercent}% OCUPADO</span>
        </div>

        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xl font-mono font-bold text-purple-200">
            {diskFree} <span className="text-xs font-normal text-slate-400">GB LIVRES</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">TOTAL: {diskTotal} GB</span>
        </div>

        {/* Disk bar */}
        <div className="w-full h-1.5 rounded-full bg-purple-950/50 border border-purple-500/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 shadow-[0_0_8px_#00f0ff]"
            style={{ width: `${diskPercent}%` }}
          />
        </div>
      </div>

      {/* 3. Temp Cache & Quick Clean Widget */}
      <div className="rounded-xl border border-purple-500/30 bg-slate-950/60 backdrop-blur-md p-3.5 shadow-[0_0_20px_rgba(11,4,16,0.8)]">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-semibold">
            <Trash2 className="w-4 h-4 text-amber-400" />
            <span>ARQUIVOS %TEMP%</span>
          </div>
          <span className="text-xs font-mono font-bold text-amber-300">{tempCount} ITENS</span>
        </div>

        <div className="text-[11px] font-mono text-purple-200/80 mb-2.5">
          {tempMB} MB de arquivos residuais e caches efêmeros acumulados.
        </div>

        <button
          onClick={onQuickOptimize}
          className="w-full py-1.5 px-3 rounded-lg border border-cyan-400/50 bg-cyan-950/40 hover:bg-cyan-900/60 transition-all text-xs font-mono font-semibold text-cyan-300 hover:text-white flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(0,240,255,0.25)] hover:shadow-[0_0_20px_rgba(0,240,255,0.5)]"
        >
          <Trash2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>OTIMIZAR AGORA</span>
        </button>
      </div>

      {/* 4. Local Weather & Atmosphere Widget */}
      <div className="rounded-xl border border-purple-500/30 bg-slate-950/60 backdrop-blur-md p-3 shadow-[0_0_20px_rgba(11,4,16,0.8)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-semibold">
            <CloudSun className="w-4 h-4 text-cyan-400" />
            <span>CLIMA • {clima.cidade}</span>
          </div>
          <span className="text-base font-mono font-bold text-white">{clima.temperatura}°C</span>
        </div>
        <div className="text-[10px] font-mono text-purple-300/80 mt-1 flex justify-between">
          <span>{clima.condicao}</span>
          <span>Chuva: {clima.probabilidadeChuva}</span>
        </div>
      </div>
    </aside>
  );
};
