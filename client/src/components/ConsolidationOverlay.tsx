import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { soundSynth } from '../audio/synth';

interface ConsolidationOverlayProps {
  onComplete: () => void;
}

const modules = [
  { id: 'm1', name: 'AGENDA & DIRETRIZES', detail: 'Sincronizando compromissos locais...' },
  { id: 'm2', name: 'TELEMETRIA DE HARDWARE', detail: 'Inspecionando CPU, RAM e I/O de disco...' },
  { id: 'm3', name: 'RADAR DE SEGURANÇA OFFLINE', detail: 'Validando isolamento Zero-API do pen drive...' },
  { id: 'm4', name: 'PERFIL ENERGÉTICO & CACHE', detail: 'Consolidando métricas e heurísticas...' }
];

export const ConsolidationOverlay: React.FC<ConsolidationOverlayProps> = ({ onComplete }) => {
  const [completedIndex, setCompletedIndex] = useState<number>(0);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setCompletedIndex(current);
      soundSynth.playTelemetryBeep(1.0 + current * 0.2);

      if (current >= modules.length) {
        clearInterval(interval);
        setTimeout(() => {
          soundSynth.playBiometricConfirmed();
          onComplete();
        }, 600);
      }
    }, 700);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="relative z-30 w-full max-w-[520px] rounded-2xl border-2 border-purple-500/60 bg-slate-950/90 backdrop-blur-xl p-6 shadow-[0_0_50px_rgba(168,85,247,0.4)] text-left font-mono"
    >
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-purple-500/30">
        <div>
          <span className="text-[10px] tracking-[0.2em] text-cyan-400 uppercase">
            H.E.L.E.N.A. // SINCRONIZAÇÃO HEURÍSTICA
          </span>
          <h2 className="text-xl font-bold text-white tracking-wide mt-0.5">
            Consolidação de Módulos
          </h2>
          <p className="text-xs text-purple-300/80">
            Sincronizando heurísticas locais. Os dados do sistema estão consolidados.
          </p>
        </div>
        <div className="p-2 rounded-lg bg-purple-950/80 border border-purple-400">
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
        </div>
      </div>

      <div className="space-y-3">
        {modules.map((mod, idx) => {
          const isDone = idx < completedIndex;
          const isCurrent = idx === completedIndex;

          return (
            <div
              key={mod.id}
              className={`p-3 rounded-lg border transition-all duration-300 ${
                isDone
                  ? 'border-emerald-500/50 bg-emerald-950/20'
                  : isCurrent
                  ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                  : 'border-purple-500/20 bg-slate-900/40 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-200">{mod.name}</span>
                {isDone ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    CONCLUÍDO
                  </span>
                ) : isCurrent ? (
                  <span className="flex items-center gap-1 text-[10px] text-cyan-300 font-bold animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    ANALISANDO...
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">PENDENTE</span>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-900 border border-purple-500/30 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isDone
                      ? 'w-full bg-emerald-400'
                      : isCurrent
                      ? 'w-2/3 bg-cyan-400 animate-pulse'
                      : 'w-0'
                  }`}
                />
              </div>

              <div className="text-[10px] text-slate-400 mt-1">{mod.detail}</div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
