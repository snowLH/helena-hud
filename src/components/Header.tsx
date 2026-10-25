import React, { useState, useEffect } from 'react';
import type { HelenaState } from '../types';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sliders,
  Radio,
  Globe,
  Mic,
  Check,
  Download,
  Smartphone,
  Power,
  Wrench,
  Activity,
  Gauge
} from 'lucide-react';
import { soundSynth } from '../audio/synth';
import { speechController } from '../audio/speech';

interface HeaderProps {
  state: HelenaState;
  isSpeaking: boolean;
  biometricConfirmed: boolean;
  consolidated: boolean;
  briefingOn: boolean;
  onOpenSettings: (tab?: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  isSpeaking,
  biometricConfirmed,
  consolidated,
  briefingOn,
  onOpenSettings
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [currentVoiceName, setCurrentVoiceName] = useState<string>(speechController.getActivePreset().name);
  const [networkUrl, setNetworkUrl] = useState<string>('http://192.168.0.6:3000');
  const [copied, setCopied] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      setTimeStr(`${hours}:${minutes}:${seconds} // ${day}/${month}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    const checkVoice = () => {
      setCurrentVoiceName(speechController.getActivePreset().name);
    };
    const voiceInterval = setInterval(checkVoice, 500);

    fetch('/api/network/info')
      .then(r => r.json())
      .then(info => {
        if (info.networkUrl) setNetworkUrl(info.networkUrl);
      })
      .catch(() => {});

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      clearInterval(interval);
      clearInterval(voiceInterval);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const toggleFullscreen = () => {
    soundSynth.playTelemetryBeep();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundSynth.enabled = next;
    speechController.enabled = next;
    if (next) soundSynth.playTelemetryBeep(1.5);
  };

  const copyNetworkLink = () => {
    navigator.clipboard.writeText(networkUrl);
    setCopied(true);
    soundSynth.playBiometricConfirmed();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInstallPWA = async () => {
    soundSynth.playTelemetryBeep();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        soundSynth.playBiometricConfirmed();
      }
    } else {
      alert('Para instalar a H.E.L.E.N.A. como Aplicativo:\n\n• No Chrome/Edge: Clique no ícone de "Instalar" na barra de endereços.\n• No Celular: No menu do navegador, selecione "Adicionar à tela de início".');
    }
  };

  return (
    <header className="relative w-full h-13 sm:h-14 px-3 sm:px-5 z-30 select-none border-b border-purple-500/25 bg-slate-950/85 backdrop-blur-xl flex items-center justify-between gap-2 shrink-0">
      {/* 1. Left: Identity & State Indicators */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-950/70 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,240,255,0.35)]">
            <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-mono font-bold tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-300 to-cyan-300 drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]">
                H.E.L.E.N.A.
              </span>
              <span className="px-1.5 py-0.2 rounded text-[8px] font-mono bg-purple-950/80 border border-purple-400/50 text-purple-300 font-semibold tracking-wider">
                LOCAL
              </span>
            </div>
            <span className="text-[7.5px] sm:text-[8px] tracking-[0.2em] font-mono text-purple-400/70 uppercase hidden 2xl:block">
              Heurística de Execução Local e Estruturação Neural Autônoma
            </span>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="h-5 w-[1px] bg-purple-500/30 hidden sm:block" />

        {/* State Badge */}
        <div className="flex items-center">
          {isSpeaking || state === 'FALANDO' ? (
            <div className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.6)] flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]" />
              <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-widest">FALANDO</span>
            </div>
          ) : (
            <div className="px-2.5 py-0.5 rounded-full bg-purple-950/50 border border-purple-500/40 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.2)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400/70" />
              <span className="text-[9px] sm:text-[10px] font-mono font-medium tracking-widest">EM ESPERA</span>
            </div>
          )}
        </div>

        {/* Indicators Cluster (ID, Dados, Briefing) */}
        <div className="hidden xl:flex items-center gap-1.5">
          <div
            title={biometricConfirmed ? 'Identidade de Usuário Confirmada' : 'Identidade em Espera'}
            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold tracking-wider flex items-center gap-1 transition-all ${
              biometricConfirmed
                ? 'bg-emerald-950/80 border border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                : 'bg-slate-900/60 border border-purple-500/30 text-purple-400/60'
            }`}
          >
            <span className={`w-1 h-1 rounded-full ${biometricConfirmed ? 'bg-emerald-400' : 'bg-purple-500/40'}`} />
            RECONHECIDO
          </div>

          <div
            title={consolidated ? 'Heurísticas e Dados Consolidados' : 'Heurísticas em Espera'}
            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold tracking-wider flex items-center gap-1 transition-all ${
              consolidated
                ? 'bg-cyan-950/80 border border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                : 'bg-slate-900/60 border border-purple-500/30 text-purple-400/60'
            }`}
          >
            <span className={`w-1 h-1 rounded-full ${consolidated ? 'bg-cyan-400' : 'bg-purple-500/40'}`} />
            CONSOLIDADO
          </div>

          <div
            title={briefingOn ? 'Briefing Matinal Ativo' : 'Briefing em Espera'}
            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold tracking-wider flex items-center gap-1 transition-all ${
              briefingOn
                ? 'bg-purple-950/90 border border-purple-400 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                : 'bg-slate-900/60 border border-purple-500/30 text-purple-400/60'
            }`}
          >
            <span className={`w-1 h-1 rounded-full ${briefingOn ? 'bg-purple-400' : 'bg-purple-500/40'}`} />
            BRIEFING
          </div>
        </div>
      </div>

      {/* 2. Center: Quick System Tools Bar (Adaptive Responsive) */}
      <div className="hidden md:flex items-center gap-1.5">
        <button
          onClick={() => onOpenSettings('processos')}
          title="Gerenciador de Processos e Memória (Task Manager)"
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 hover:border-cyan-300 text-[10px] text-cyan-200 font-mono transition-all cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.2)]"
        >
          <Activity className="w-3 h-3 text-cyan-400" />
          <span className="font-semibold hidden lg:inline">PROCESSOS</span>
        </button>

        <button
          onClick={() => onOpenSettings('benchmark')}
          title="Executar Benchmark de Velocidade da Máquina"
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 hover:border-purple-300 text-[10px] text-purple-200 font-mono transition-all cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.2)]"
        >
          <Gauge className="w-3 h-3 text-purple-400" />
          <span className="font-semibold hidden lg:inline">BENCHMARK</span>
        </button>

        <button
          onClick={() => onOpenSettings('startup')}
          title="Gerenciar Inicialização do Windows (Boot Apps)"
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 hover:border-purple-300 text-[10px] text-purple-200 font-mono transition-all cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.2)]"
        >
          <Power className="w-3 h-3 text-purple-400" />
          <span className="font-semibold hidden lg:inline">STARTUP</span>
        </button>

        <button
          onClick={() => onOpenSettings('reparo')}
          title="Suíte de Reparo & Conserto do Windows"
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/60 hover:border-emerald-300 text-[10px] text-emerald-200 font-mono transition-all cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.2)]"
        >
          <Wrench className="w-3 h-3 text-emerald-400" />
          <span className="font-semibold hidden lg:inline">REPARAR PC</span>
        </button>

        <button
          onClick={copyNetworkLink}
          title="Clique para copiar o IP de acesso na rede local"
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 hover:border-cyan-300 text-[10px] text-cyan-200 font-mono transition-all cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.2)]"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Globe className="w-3 h-3 text-cyan-400" />}
          <span className="font-semibold hidden lg:inline">{copied ? 'COPIADO!' : `REDE: ${networkUrl.replace('http://', '').split(':')[0]}`}</span>
        </button>

        <button
          onClick={handleInstallPWA}
          title="Instalar Helena como PWA Desktop / Mobile"
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/60 hover:border-amber-300 text-[10px] text-amber-200 font-mono transition-all cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.2)]"
        >
          {isInstalled ? <Smartphone className="w-3 h-3 text-emerald-400" /> : <Download className="w-3 h-3 text-amber-400" />}
          <span className="font-semibold hidden lg:inline">{isInstalled ? 'INSTALADO' : 'BAIXAR APP'}</span>
        </button>
      </div>

      {/* 3. Right: Voice Preset + Controls + Clock */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Active Voice Pill */}
        <button
          onClick={() => onOpenSettings('jarvis_voz')}
          title="Clique para configurar o motor de voz ultra-natural"
          className="flex items-center gap-1 px-2 py-1 rounded-lg border border-cyan-500/40 bg-cyan-950/50 hover:bg-cyan-900/70 hover:border-cyan-300 text-[10px] text-cyan-200 font-mono transition-all cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.25)]"
        >
          <Mic className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span className="max-w-[100px] sm:max-w-[125px] truncate font-semibold">
            {currentVoiceName.replace('Helena Ultra-Natural (', '').replace(')', '').replace('Helena ', '')}
          </span>
        </button>

        {/* Digital Clock */}
        <div className="text-[10px] text-cyan-300/80 font-mono tracking-wider hidden sm:block px-2 py-1 rounded bg-slate-900/70 border border-purple-500/25">
          {timeStr}
        </div>

        {/* Audio Mute */}
        <button
          onClick={toggleSound}
          className="p-1.5 rounded-lg border border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 hover:text-cyan-300 transition-colors cursor-pointer"
          title={soundEnabled ? 'Silenciar Áudio' : 'Ativar Áudio'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
        </button>

        {/* Settings Gear */}
        <button
          onClick={() => onOpenSettings('jarvis_voz')}
          className="p-1.5 rounded-lg border border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 hover:text-cyan-300 transition-colors cursor-pointer"
          title="Configurações e Diagnóstico"
        >
          <Sliders className="w-3.5 h-3.5 text-purple-300" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg border border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 hover:text-cyan-300 transition-colors hidden sm:block cursor-pointer"
          title="Tela Cheia"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
