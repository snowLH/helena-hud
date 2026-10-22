import React, { useState, useEffect } from 'react';
import type { HelenaState } from '../types';
import { Volume2, VolumeX, Maximize2, Minimize2, Sliders, Radio, Globe, Mic, Check, Download, Smartphone, Power, Wrench } from 'lucide-react';
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
      const year = now.getFullYear();
      setTimeStr(`${day}/${month}/${year} // ${hours}:${minutes}:${seconds} [UTC-3]`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    // Track active voice preset
    const checkVoice = () => {
      setCurrentVoiceName(speechController.getActivePreset().name);
    };
    const voiceInterval = setInterval(checkVoice, 500);

    // Fetch network url
    fetch('/api/network/info')
      .then(r => r.json())
      .then(info => {
        if (info.networkUrl) setNetworkUrl(info.networkUrl);
      })
      .catch(() => {});

    // PWA Install Prompt Listener
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
      // In iOS or Chrome where prompt is in address bar
      alert('Para instalar a H.E.L.E.N.A. como Aplicativo no seu dispositivo:\n\n• No Chrome/Edge: Clique no ícone de "Instalar" na barra de endereços (ao lado da estrela de favoritos).\n• No Celular (Android/iOS): Clique no menu do navegador (3 pontinhos ou Compartilhar) e selecione "Adicionar à tela de início" ou "Instalar Aplicativo".');
    }
  };

  return (
    <header className="relative w-full px-6 pt-3 pb-2 z-30 select-none border-b border-purple-500/20 bg-slate-950/40 backdrop-blur-md">
      {/* Top technical strip */}
      <div className="flex items-center justify-between text-xs font-mono tracking-wider text-purple-300/70 mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-cyan-400 font-semibold tracking-widest text-[11px]">SISTEMA NEURAL OFFLINE</span>
          <span className="text-purple-400/40">•</span>
          <span className="text-[11px] text-slate-400">HOST NATIVO (100% LOCAL)</span>
        </div>

        {/* Action Buttons: Network Share & PWA Install & System Tools */}
        <div className="flex items-center gap-2">
          {/* Startup Apps Button */}
          <button
            onClick={() => onOpenSettings('startup')}
            title="Gerenciar Aplicativos de Inicialização do Windows"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-purple-500/60 bg-purple-950/70 hover:bg-purple-900 text-[10px] text-purple-300 hover:text-white font-mono transition-all shadow-[0_0_10px_rgba(168,85,247,0.3)] cursor-pointer"
          >
            <Power className="w-3 h-3 text-purple-400" />
            <span className="font-bold">BOOT / STARTUP</span>
          </button>

          {/* System Repair Button */}
          <button
            onClick={() => onOpenSettings('reparo')}
            title="Abrir Suíte de Conserto & Reparo do Windows"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/60 bg-emerald-950/70 hover:bg-emerald-900 text-[10px] text-emerald-300 hover:text-white font-mono transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            <Wrench className="w-3 h-3 text-emerald-400" />
            <span className="font-bold">REPARAR PC</span>
          </button>

          <button
            onClick={copyNetworkLink}
            title="Clique para copiar o endereço de acesso pela rede local"
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/50 bg-emerald-950/60 hover:bg-emerald-900/80 text-[10px] text-emerald-300 font-mono transition-all shadow-[0_0_10px_rgba(52,211,153,0.3)] cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Globe className="w-3 h-3 text-emerald-400 animate-pulse" />}
            <span className="font-bold">{copied ? 'LINK COPIADO!' : `NO AR: ${networkUrl.replace('http://', '')}`}</span>
          </button>

          {/* PWA Install Button */}
          <button
            onClick={handleInstallPWA}
            title="Instalar H.E.L.E.N.A. como Aplicativo PWA (Windows, Android ou iOS)"
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-cyan-400/80 bg-cyan-950/70 hover:bg-cyan-900 text-[10px] text-cyan-300 hover:text-white font-mono transition-all shadow-[0_0_12px_rgba(0,240,255,0.4)] cursor-pointer"
          >
            {isInstalled ? <Smartphone className="w-3 h-3 text-emerald-400" /> : <Download className="w-3 h-3 text-cyan-400 animate-bounce" />}
            <span className="font-bold">{isInstalled ? 'PWA INSTALADO' : 'BAIXAR APP (PWA)'}</span>
          </button>
        </div>

        <div className="text-[11px] text-cyan-300/80 font-mono tracking-widest hidden md:block">
          {timeStr}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Active Voice badge */}
          <button
            onClick={onOpenSettings}
            title="Clique para trocar a voz da Helena"
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-purple-500/40 bg-purple-950/60 hover:border-cyan-400 text-[10px] text-purple-200 hover:text-cyan-300 font-mono transition-all"
          >
            <Mic className="w-3 h-3 text-cyan-400" />
            <span className="max-w-[150px] truncate">{currentVoiceName.replace('J.A.R.V.I.S. Feminina (', '').replace(')', '')}</span>
          </button>

          <button
            onClick={toggleSound}
            className="p-1 rounded hover:bg-purple-900/40 transition-colors text-purple-300 hover:text-cyan-300"
            title={soundEnabled ? 'Silenciar Áudio' : 'Ativar Áudio'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1 rounded hover:bg-purple-900/40 transition-colors text-purple-300 hover:text-cyan-300"
            title="Configurar Voz e Dados Pessoais"
          >
            <Sliders className="w-4 h-4 text-purple-300" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1 rounded hover:bg-purple-900/40 transition-colors text-purple-300 hover:text-cyan-300"
            title="Alternar Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Brand & Status Row */}
      <div className="flex flex-col items-center justify-center">
        {/* Name in technical minimalist typography */}
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-mono font-bold tracking-[0.35em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-300 to-cyan-400 drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            H.E.L.E.N.A.
          </h1>
          <p className="text-[9px] md:text-[10px] tracking-[0.25em] font-mono text-purple-400/80 uppercase -mt-0.5">
            Heurística de Execução Local e Estruturação Neural Autônoma
          </p>
        </div>

        {/* 3 Top Indicator Pills */}
        <div className="flex items-center gap-2.5 mt-2.5">
          {/* Pill 1: RECONHECIDO */}
          <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider flex items-center gap-1.5 transition-all duration-300 ${
            biometricConfirmed
              ? 'bg-emerald-950/80 border border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
              : 'bg-slate-900/70 border border-purple-500/40 text-purple-300/70'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${biometricConfirmed ? 'bg-emerald-400 animate-pulse' : 'bg-purple-500/50'}`} />
            RECONHECIDO
          </div>

          {/* Pill 2: CONSOLIDADO */}
          <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider flex items-center gap-1.5 transition-all duration-300 ${
            consolidated
              ? 'bg-cyan-950/80 border border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
              : 'bg-slate-900/70 border border-purple-500/40 text-purple-300/70'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${consolidated ? 'bg-cyan-400 animate-pulse' : 'bg-purple-500/50'}`} />
            CONSOLIDADO
          </div>

          {/* Pill 3: BRIEFING ON */}
          <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider flex items-center gap-1.5 transition-all duration-300 ${
            briefingOn
              ? 'bg-purple-950/90 border border-purple-400 text-purple-200 shadow-[0_0_14px_rgba(168,85,247,0.5)]'
              : 'bg-slate-900/70 border border-purple-500/40 text-purple-300/70'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${briefingOn ? 'bg-purple-400 animate-ping' : 'bg-purple-500/50'}`} />
            BRIEFING ON
          </div>
        </div>

        {/* Main State Indicator Badge (FALANDO ou EM ESPERA) */}
        <div className="mt-2">
          {isSpeaking || state === 'FALANDO' ? (
            <div className="px-4 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400/90 text-cyan-200 shadow-[0_0_20px_rgba(0,240,255,0.7)] flex items-center gap-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
              <span className="text-xs font-mono font-bold tracking-[0.25em]">FALANDO</span>
            </div>
          ) : (
            <div className="px-4 py-0.5 rounded-md bg-purple-950/40 border border-purple-500/50 text-purple-300/90 shadow-[0_0_10px_rgba(168,85,247,0.3)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400/60" />
              <span className="text-xs font-mono font-medium tracking-[0.2em]">EM ESPERA</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
