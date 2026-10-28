import React, { useState } from 'react';
import {
  X,
  Download,
  HardDrive,
  Usb,
  Cpu,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Terminal,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { soundSynth } from '../audio/synth';
import type { SystemStatus } from '../types';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  status?: SystemStatus | null;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  status
}) => {
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyGit = () => {
    soundSynth.playTelemetryBeep();
    navigator.clipboard.writeText('git clone https://github.com/snowLH/helena-hud.git');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md font-mono select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border-2 border-cyan-500/70 bg-slate-950 p-5 sm:p-6 shadow-[0_0_50px_rgba(0,240,255,0.3)] text-left flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-cyan-500/30 shrink-0">
          <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-sm sm:text-base">
            <Usb className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span>CENTRAL DE DOWNLOAD // H.E.L.E.N.A. PORTÁTIL</span>
          </div>
          <button
            onClick={() => {
              soundSynth.playTelemetryBeep();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1 text-xs text-slate-300">
          
          {/* Status Alert Banner */}
          {status?.isCloudSandbox ? (
            <div className="p-3.5 rounded-xl border border-amber-500/50 bg-amber-950/30 flex items-start gap-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-amber-300 text-xs tracking-wide">
                  MODO NUVEM DETECTADO (ACESSO LIMITADO AO HARDWARE)
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Você está visualizando a H.E.L.E.N.A. no navegador em nuvem. Para controlar o hardware físico do seu computador (diagnósticos reais de processador, memórias, reparo do Windows e comandos locais), baixe o pacote portátil e execute diretamente no PC ou via Pen Drive!
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-emerald-500/50 bg-emerald-950/30 flex items-start gap-3 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-emerald-300 text-xs tracking-wide">
                  AGENTE LOCAL ATIVO — PREPARADOR DE PEN DRIVE
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Seu computador já está conectado ao agente local. Você pode baixar o pacote portátil completo para copiar em um Pen Drive e utilizar a H.E.L.E.N.A. em qualquer outro notebook ou desktop com Windows.
                </p>
              </div>
            </div>
          )}

          {/* Download Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Option 1: Full Portable ZIP */}
            <div className="p-4 rounded-xl border border-cyan-500/40 bg-cyan-950/20 hover:border-cyan-400 transition-all flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-white font-bold text-xs flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-cyan-400" />
                    PACOTE PORTÁTIL (.ZIP)
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-400 text-cyan-300 text-[9px] font-bold">
                    RECOMENDADO
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Pacote autônomo com a interface HUD pré-compilada, servidor Express, ferramentas forenses e iniciador <code className="text-cyan-300">HELENA_PENDRIVE.bat</code>.
                </p>
                <div className="mt-2 text-[10px] text-slate-400 font-mono">
                  Tamanho: <span className="text-cyan-300 font-bold">~0.3 MB</span> (Ultra Leve)
                </div>
              </div>

              <a
                href="/api/download/portable"
                download="helena-portatil.zip"
                onClick={() => soundSynth.playTelemetryBeep()}
                className="w-full py-2.5 rounded-xl border border-cyan-400 bg-cyan-950 hover:bg-cyan-900 text-cyan-200 hover:text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>BAIXAR PACOTE (.ZIP)</span>
              </a>
            </div>

            {/* Option 2: Standalone Pen Drive BAT Launcher */}
            <div className="p-4 rounded-xl border border-purple-500/40 bg-purple-950/20 hover:border-purple-400 transition-all flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-white font-bold text-xs flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-purple-400" />
                    INICIADOR PEN DRIVE (.BAT)
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-950 border border-purple-400 text-purple-300 text-[9px] font-bold">
                    1-CLIQUE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Script de inicialização inteligente. Se o computador host não possuir Node.js instalado, ele baixa automaticamente sem necessitar de privilégios de administrador.
                </p>
                <div className="mt-2 text-[10px] text-slate-400 font-mono">
                  Formato: <span className="text-purple-300 font-bold">Script Windows (.bat)</span>
                </div>
              </div>

              <a
                href="/api/download/launcher"
                download="HELENA_PENDRIVE.bat"
                onClick={() => soundSynth.playTelemetryBeep()}
                className="w-full py-2.5 rounded-xl border border-purple-400 bg-purple-950 hover:bg-purple-900 text-purple-200 hover:text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.3)] cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>BAIXAR INICIADOR (.BAT)</span>
              </a>
            </div>

          </div>

          {/* Step-by-Step Pen Drive Guide */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2.5">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
              COMO USAR NO SEU PEN DRIVE (PASSO A PASSO):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
              <div className="p-2.5 rounded-lg border border-slate-700/60 bg-slate-950/60">
                <span className="text-cyan-300 font-bold block mb-1">1. COPIAR NO PEN DRIVE</span>
                <p className="text-slate-400 text-[10px]">
                  Baixe o arquivo <code className="text-cyan-300">helena-portatil.zip</code> e extraia todos os arquivos na raiz ou em uma pasta do seu Pen Drive.
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-700/60 bg-slate-950/60">
                <span className="text-cyan-300 font-bold block mb-1">2. PLUGAR EM QUALQUER PC</span>
                <p className="text-slate-400 text-[10px]">
                  Conecte o Pen Drive em qualquer computador ou notebook Windows (10 ou 11) que você queira diagnosticar ou utilizar.
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-700/60 bg-slate-950/60">
                <span className="text-cyan-300 font-bold block mb-1">3. DUPLO CLIQUE & PRONTO</span>
                <p className="text-slate-400 text-[10px]">
                  Execute <code className="text-amber-300">HELENA_PENDRIVE.bat</code>. O HUD abrirá automaticamente em tela cheia com acesso total ao sistema!
                </p>
              </div>
            </div>
          </div>

          {/* GitHub Open Source Box */}
          <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300 text-[11px]">
                Código fonte aberto, releases e documentação no GitHub:
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyGit}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-600 flex items-center gap-1 cursor-pointer"
              >
                {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{copiedCmd ? 'Copiado!' : 'Copiar Git Clone'}</span>
              </button>
              <a
                href="https://github.com/snowLH/helena-hud"
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 transition-colors"
                title="Abrir no GitHub"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-cyan-500/20 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
          <span>Portabilidade Total • Zero Rastreamento • 100% On-Premise</span>
          <button
            onClick={() => {
              soundSynth.playTelemetryBeep();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold transition-all cursor-pointer"
          >
            FECHAR
          </button>
        </div>

      </div>
    </div>
  );
};
