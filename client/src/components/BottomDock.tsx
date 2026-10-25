import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HelenaCard } from '../types';
import {
  Cpu,
  Calendar,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Zap,
  Trash2,
  Layers,
  Wrench,
  Power,
  Globe,
  Rocket,
  Briefcase,
  FolderOpen,
  Brain
} from 'lucide-react';
import { soundSynth } from '../audio/synth';

interface BottomDockProps {
  cards: HelenaCard[];
  onSelectCard: (card: HelenaCard) => void;
  activeCardId?: string;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  cards,
  onSelectCard,
  activeCardId
}) => {
  if (cards.length === 0) return null;

  const getCardIcon = (tipo: HelenaCard['tipo']) => {
    switch (tipo) {
      case 'hardware_network':
      case 'analise_hardware':
        return <Cpu className="w-3.5 h-3.5 text-cyan-400" />;
      case 'agenda_local':
        return <Calendar className="w-3.5 h-3.5 text-purple-400" />;
      case 'prioridades':
        return <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;
      case 'limpeza_temp':
        return <Trash2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'rede_memoria':
        return <Zap className="w-3.5 h-3.5 text-cyan-400" />;
      case 'reparo_sistema':
        return <Wrench className="w-3.5 h-3.5 text-emerald-400" />;
      case 'startup_manager':
        return <Power className="w-3.5 h-3.5 text-purple-400" />;
      case 'pesquisa_web':
        return <Globe className="w-3.5 h-3.5 text-cyan-400" />;
      case 'app_launcher':
        return <Rocket className="w-3.5 h-3.5 text-amber-400" />;
      case 'modo_trabalho':
        return <Briefcase className="w-3.5 h-3.5 text-cyan-400" />;
      case 'organizador_arquivos':
        return <FolderOpen className="w-3.5 h-3.5 text-purple-400" />;
      case 'memoria_longa':
        return <Brain className="w-3.5 h-3.5 text-purple-300" />;
      case 'finalizacao':
        return <Sparkles className="w-3.5 h-3.5 text-cyan-300" />;
      default:
        return <CheckCircle className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  return (
    <div className="w-full flex flex-col items-center z-20 pointer-events-auto select-none mt-2">
      {/* Dock Header Tag */}
      <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-t-lg bg-slate-950/80 border-t border-x border-purple-500/30 text-[9px] font-mono text-cyan-300 tracking-widest uppercase">
        <Layers className="w-3 h-3 text-cyan-400" />
        <span>DOCK CONSOLIDADO // {cards.length} CARTÕES ARQUIVADOS</span>
      </div>

      {/* Horizontal Cards Bar */}
      <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl border border-purple-500/40 bg-slate-950/70 backdrop-blur-xl shadow-[0_0_30px_rgba(11,4,16,0.9)] max-w-full overflow-x-auto scrollbar-none">
        <AnimatePresence>
          {cards.map((card, idx) => {
            const isSelected = activeCardId === card.id;

            return (
              <motion.button
                key={card.id}
                layout
                initial={{ scale: 0.6, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                onClick={() => {
                  soundSynth.playTelemetryBeep(1.2);
                  onSelectCard(card);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left font-mono transition-all duration-200 border group shrink-0 ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/80 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                    : 'border-purple-500/30 bg-slate-900/60 hover:bg-purple-950/40 hover:border-cyan-400/60'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-purple-950/60 border border-purple-500/30 group-hover:scale-110 transition-transform">
                  {getCardIcon(card.tipo)}
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    FASE 0{idx + 1}
                  </span>
                  <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate max-w-[140px]">
                    {card.titulo}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
