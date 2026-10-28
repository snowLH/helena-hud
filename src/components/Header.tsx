import React, { useState, useEffect, useRef } from 'react';
import type { HelenaState, SystemStatus } from '../types';
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
  Gauge,
  Terminal,
  Brain,
  ChevronDown,
  GraduationCap,
  Zap,
  Boxes,
  Cpu,
  Usb
} from 'lucide-react';
import { soundSynth } from '../audio/synth';
import { speechController } from '../audio/speech';

interface HeaderProps {
  state: HelenaState;
  status?: SystemStatus | null;
  isSpeaking: boolean;
  biometricConfirmed: boolean;
  consolidated: boolean;
  briefingOn: boolean;
  onOpenSettings: (tab?: any) => void;
  onOpenCommands: () => void;
  onOpenMemoryProfile?: () => void;
  onOpenStudy?: () => void;
  onOpenDownload?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  status,
  isSpeaking,
  biometricConfirmed,
  consolidated,
  briefingOn,
  onOpenSettings,
  onOpenCommands,
  onOpenMemoryProfile,
  onOpenStudy,
  onOpenDownload
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [currentVoiceName, setCurrentVoiceName] = useState<string>(speechController.getActivePreset().name);
  const [networkUrl, setNetworkUrl] = useState<string>('http://192.168.0.6:3000');
  const [copied, setCopied] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [toolsOpen, setToolsOpen] = useState<boolean>(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const getCleanVoiceName = (name: string) => {
    if (name.includes('Camila')) return 'Camila (Voz Web)';
    if (name.includes('Vitória') || name.includes('Vitoria')) return 'Vitória (Voz Web)';
    if (name.includes('Thalita')) return 'Thalita (Neural)';
    if (name.includes('Francisca')) return 'Francisca (Neural)';
    return name.replace('Helena ', '').split(' ')[0] || 'Voz Neural';
  };

  return (
    <header className="relative w-full h-14 px-3 sm:px-4 z-30 select-none border-b border-purple-500/25 bg-slate-950/90 backdrop-blur-xl flex items-center justify-between gap-2 shrink-0">
      {/* 1. Left: Identity & State Indicators */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-950/70 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,240,255,0.35)]">
            <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-mono font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-300 to-cyan-300 drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]">
                H.E.L.E.N.A.
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono border font-semibold tracking-wider ${
                status?.isLocalAgent
                  ? 'bg-emerald-950/80 border-emerald-400/50 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                  : 'bg-purple-950/80 border-purple-400/50 text-purple-300'
              }`}>
                {status?.isLocalAgent ? 'NATIVO PC' : 'LOCAL'}
              </span>
            </div>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="h-5 w-[1px] bg-purple-500/30 hidden sm:block" />

        {/* State Badge */}
        <div className="flex items-center">
          {isSpeaking || state === 'FALANDO' ? (
            <div className="px-2 sm:px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.6)] flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]" />
              <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-widest">FALANDO</span>
            </div>
          ) : (
            <div className="px-2 sm:px-2.5 py-0.5 rounded-full bg-purple-950/50 border border-purple-500/40 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.2)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400/70" />
              <span className="text-[9px] sm:text-[10px] font-mono font-medium tracking-widest">EM ESPERA</span>
            </div>
          )}
        </div>

        {/* Indicators Cluster: RECONHECIDO, MEMÓRIA ATIVA, AGENTE ON (visible on lg+) */}
        <div className="hidden lg:flex items-center gap-1.5">
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
            title="Módulo Honcho de Memória Contínua Ativo"
            className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold tracking-wider flex items-center gap-1 transition-all bg-purple-950/80 border border-purple-400 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.3)]"
          >
            <span className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />
            MEMÓRIA ATIVA
          </div>

          <div
            title={status?.isLocalAgent ? 'Hardware real do seu PC conectado (Intel Core i5, 16GB RAM)' : 'Acesso ao hardware local em espera'}
            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold tracking-wider flex items-center gap-1 transition-all ${
              status?.isLocalAgent
                ? 'bg-emerald-950/80 border border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                : 'bg-cyan-950/80 border border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
            }`}
          >
            <span className={`w-1 h-1 rounded-full ${status?.isLocalAgent ? 'bg-emerald-400' : 'bg-cyan-400'} shadow-[0_0_6px_#00f0ff]`} />
            {status?.isLocalAgent ? 'PC HOST REAL' : 'AGENTE ON'}
          </div>
        </div>
      </div>

      {/* 2. Center: Tactical Action Hub (Comandos, Memória & Perfil, Ferramentas Dropdown) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {onOpenMemoryProfile && (
          <button
            onClick={() => {
              soundSynth.playTelemetryBeep();
              onOpenMemoryProfile();
            }}
            title="Visualizar Memória Longa (Honcho) e Perfil do Usuário"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-purple-500/60 bg-purple-950/70 hover:bg-purple-900/90 hover:border-purple-300 text-[10px] text-purple-200 hover:text-white font-mono transition-all cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.3)] shrink-0"
          >
            <Brain className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="font-semibold hidden sm:inline">MEMÓRIA & PERFIL</span>
          </button>
        )}

        <button
          onClick={() => {
            soundSynth.playTelemetryBeep();
            onOpenCommands();
          }}
          title="Abrir Catálogo de Comandos Táticos (Ctrl+K)"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-cyan-400/60 bg-cyan-950/70 hover:bg-cyan-900/90 hover:border-cyan-300 text-[10px] text-cyan-200 hover:text-white font-mono transition-all cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.3)] shrink-0"
        >
          <Terminal className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="font-semibold hidden sm:inline">COMANDOS</span>
        </button>

        {/* Dropdown: Ferramentas de Sistema */}
        <div className="relative" ref={toolsRef}>
          <button
            onClick={() => {
              soundSynth.playTelemetryBeep();
              setToolsOpen(!toolsOpen);
            }}
            title="Menu de Ferramentas do Sistema & Diagnóstico"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-mono transition-all cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.2)] shrink-0 ${
              toolsOpen
                ? 'border-cyan-300 bg-cyan-900/80 text-white shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'border-cyan-500/40 bg-cyan-950/50 hover:bg-cyan-900/70 hover:border-cyan-300 text-cyan-300'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold">FERRAMENTAS</span>
            <ChevronDown className={`w-3 h-3 text-cyan-400 transition-transform duration-200 ${toolsOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Floating Glassmorphism Tools Dropdown Menu */}
          {toolsOpen && (
            <div className="absolute right-0 sm:left-0 mt-2 w-64 p-2 rounded-xl border border-cyan-500/40 bg-slate-950/95 backdrop-blur-2xl shadow-[0_15px_35px_rgba(0,0,0,0.85)] z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-cyan-400/80 border-b border-purple-500/20 mb-1 flex items-center justify-between">
                <span>Suíte do Sistema</span>
                <span className="text-[8px] text-purple-400">H.E.L.E.N.A.</span>
              </div>

              {onOpenStudy && (
                <button
                  onClick={() => {
                    setToolsOpen(false);
                    onOpenStudy();
                  }}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-mono text-emerald-200 hover:text-white hover:bg-emerald-950/70 border border-emerald-500/30 hover:border-emerald-400 transition-all cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                >
                  <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
                  <div>
                    <div className="font-semibold text-[11px] text-emerald-300">Central de Estudos & Provas</div>
                    <div className="text-[9px] text-emerald-400/80">Timer Pomodoro, 432Hz e Agenda (Ctrl+E)</div>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  setToolsOpen(false);
                  onOpenSettings('processos');
                }}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-mono text-cyan-200 hover:text-white hover:bg-cyan-950/70 border border-transparent hover:border-cyan-500/40 transition-all cursor-pointer"
              >
                <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="font-semibold text-[11px]">Gerenciador de Processos</div>
                  <div className="text-[9px] text-cyan-400/70">Monitor de RAM e CPU em tempo real</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setToolsOpen(false);
                  onOpenSettings('benchmark');
                }}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-mono text-purple-200 hover:text-white hover:bg-purple-950/70 border border-transparent hover:border-purple-500/40 transition-all cursor-pointer"
              >
                <Gauge className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <div className="font-semibold text-[11px]">Benchmark de Velocidade</div>
                  <div className="text-[9px] text-purple-400/70">Teste de poder de computação local</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setToolsOpen(false);
                  onOpenSettings('startup');
                }}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-mono text-purple-200 hover:text-white hover:bg-purple-950/70 border border-transparent hover:border-purple-500/40 transition-all cursor-pointer"
              >
                <Power className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <div className="font-semibold text-[11px]">Inicialização (Startup)</div>
                  <div className="text-[9px] text-purple-400/70">Controle de programas no boot do Windows</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setToolsOpen(false);
                  onOpenSettings('reparo');
                }}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-mono text-emerald-200 hover:text-white hover:bg-emerald-950/70 border border-transparent hover:border-emerald-500/40 transition-all cursor-pointer"
              >
                <Wrench className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold text-[11px]">Reparo & Otimização PC</div>
                  <div className="text-[9px] text-emerald-400/70">Flush DNS, limpeza temp e modo turbo</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setToolsOpen(false);
                  onOpenCommands();
                }}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-mono text-cyan-200 hover:text-white hover:bg-cyan-950/70 border border-transparent hover:border-cyan-500/40 transition-all cursor-pointer"
              >
                <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="font-semibold text-[11px]">Central Copilot // Qwen & MCP</div>
                  <div className="text-[9px] text-cyan-400/70">Sequência Dourada, Regedit e Motores IA</div>
                </div>
              </button>

              <div className="border-t border-purple-500/20 my-1" />

              <button
                onClick={() => {
                  copyNetworkLink();
                }}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-mono text-cyan-200 hover:text-white hover:bg-cyan-950/70 border border-transparent hover:border-cyan-500/40 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Globe className="w-4 h-4 text-cyan-400 shrink-0" />}
                <div>
                  <div className="font-semibold text-[11px]">{copied ? 'Link Copiado!' : 'Acesso na Rede Local'}</div>
                  <div className="text-[9px] text-cyan-400/70">{networkUrl.replace('http://', '')}</div>
                </div>
              </button>

              {onOpenDownload && (
                <button
                  onClick={() => {
                    setToolsOpen(false);
                    onOpenDownload();
                  }}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-mono text-cyan-200 hover:text-white hover:bg-cyan-950/70 border border-transparent hover:border-cyan-500/40 transition-all cursor-pointer"
                >
                  <Usb className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-[11px]">Baixar para Pen Drive (.zip / .bat)</div>
                    <div className="text-[9px] text-cyan-400/70">Execução portátil 100% local em qualquer PC</div>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  setToolsOpen(false);
                  handleInstallPWA();
                }}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-mono text-amber-200 hover:text-white hover:bg-amber-950/70 border border-transparent hover:border-amber-500/40 transition-all cursor-pointer"
              >
                {isInstalled ? <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" /> : <Download className="w-4 h-4 text-amber-400 shrink-0" />}
                <div>
                  <div className="font-semibold text-[11px]">{isInstalled ? 'App Instalado' : 'Instalar Aplicativo (PWA)'}</div>
                  <div className="text-[9px] text-amber-400/70">{isInstalled ? 'Rodando em modo nativo' : 'Adicionar ao Desktop / Celular'}</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Right: Voice Pill + Controls + Clock */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {onOpenDownload && (
          <button
            onClick={() => {
              soundSynth.playTelemetryBeep();
              onOpenDownload();
            }}
            title="Baixar H.E.L.E.N.A. Portátil para Pen Drive"
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border text-[10px] font-mono transition-all cursor-pointer ${
              status?.isCloudSandbox
                ? 'border-amber-400 bg-amber-950/80 hover:bg-amber-900 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse'
                : 'border-cyan-500/50 bg-cyan-950/60 hover:bg-cyan-900/80 hover:border-cyan-300 text-cyan-200 shadow-[0_0_10px_rgba(0,240,255,0.25)]'
            }`}
          >
            <Usb className={`w-3.5 h-3.5 ${status?.isCloudSandbox ? 'text-amber-400' : 'text-cyan-400'}`} />
            <span className="font-semibold hidden sm:inline">PEN DRIVE</span>
          </button>
        )}

        {/* Active Voice Pill */}
        <button
          onClick={() => onOpenSettings('jarvis_voz')}
          title="Clique para configurar o motor de voz ultra-natural"
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border border-cyan-500/50 bg-cyan-950/60 hover:bg-cyan-900/80 hover:border-cyan-300 text-[10px] text-cyan-200 font-mono transition-all cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.25)]"
        >
          <Mic className="w-3 h-3 text-cyan-400 animate-pulse shrink-0" />
          <span className="font-semibold tracking-wide">
            {getCleanVoiceName(currentVoiceName)}
          </span>
        </button>

        {/* Digital Clock */}
        <div className="text-[10px] text-cyan-300/80 font-mono tracking-wider hidden md:block px-2 py-1 rounded bg-slate-900/70 border border-purple-500/25">
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
