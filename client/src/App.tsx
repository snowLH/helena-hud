import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import type {
  SystemStatus,
  PersonalData,
  HelenaCard,
  HelenaState,
  OptimizationReport
} from './types';
import { Header } from './components/Header';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { EnergyOrb } from './components/EnergyOrb';
import { CardFocus } from './components/CardFocus';
import { BottomDock } from './components/BottomDock';
import { CommandBar } from './components/CommandBar';
import { ConsolidationOverlay } from './components/ConsolidationOverlay';
import { SettingsModal, type SettingsTabType } from './components/SettingsModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { MemoryProfileModal } from './components/MemoryProfileModal';
import { StudyModal } from './components/StudyModal';
import { DownloadModal } from './components/DownloadModal';
import { soundSynth } from './audio/synth';
import { speechController } from './audio/speech';

export function App() {
  // Telemetry & Data
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [personalData, setPersonalData] = useState<PersonalData | null>(null);

  // States
  const [helenaState, setHelenaState] = useState<HelenaState>('EM ESPERA');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [biometricActive, setBiometricActive] = useState<boolean>(false);
  const [biometricConfirmed, setBiometricConfirmed] = useState<boolean>(false);
  const [consolidated, setConsolidated] = useState<boolean>(false);
  const [briefingOn, setBriefingOn] = useState<boolean>(false);
  const [consolidationActive, setConsolidationActive] = useState<boolean>(false);

  // Cards & Dock
  const [currentCard, setCurrentCard] = useState<HelenaCard | null>(null);
  const [dockCards, setDockCards] = useState<HelenaCard[]>([]);
  const [selectedDockCard, setSelectedDockCard] = useState<HelenaCard | null>(null);

  // UI Modals & Processing
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCommandsOpen, setIsCommandsOpen] = useState<boolean>(false);
  const [isMemoryProfileOpen, setIsMemoryProfileOpen] = useState<boolean>(false);
  const [isStudyOpen, setIsStudyOpen] = useState<boolean>(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTabType>('jarvis_voz');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const activeFlowRef = useRef<boolean>(false);
  const [localApiBase, setLocalApiBase] = useState<string>('');

  const isLocalHost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const getEndpoint = useCallback((path: string) => {
    if (isLocalHost) return path;
    if (localApiBase) return `${localApiBase}${path}`;
    return path;
  }, [isLocalHost, localApiBase]);

  // Synchronize speaking state with speechController
  useEffect(() => {
    const unsubscribe = speechController.onSpeakingChange((speaking) => {
      setIsSpeaking(speaking);
      if (speaking) {
        setHelenaState('FALANDO');
      } else if (!activeFlowRef.current) {
        setHelenaState('EM ESPERA');
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch initial telemetry and periodic polling (every 3s)
  const fetchTelemetry = useCallback(async () => {
    try {
      // If running on remote domain (e.g. vercel.app), probe local agent at 127.0.0.1:3000
      if (!isLocalHost && !localApiBase) {
        try {
          const probe = await fetch('http://127.0.0.1:3000/api/system/status', {
            signal: AbortSignal.timeout(800)
          });
          if (probe.ok) {
            const localData = await probe.json();
            setLocalApiBase('http://127.0.0.1:3000');
            setSystemStatus(localData);
            return;
          }
        } catch (_) {}
      }

      const res = await fetch(getEndpoint('/api/system/status'));
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
      }
    } catch (_) {}
  }, [isLocalHost, localApiBase, getEndpoint]);

  const fetchBriefingData = useCallback(async () => {
    try {
      const res = await fetch(getEndpoint('/api/briefing/data'));
      if (res.ok) {
        const data = await res.json();
        setPersonalData(data);
      }
    } catch (_) {}
  }, [getEndpoint]);

  useEffect(() => {
    fetchTelemetry();
    fetchBriefingData();

    const interval = setInterval(() => {
      fetchTelemetry();
    }, 3000);

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        soundSynth.playTelemetryBeep();
        setIsCommandsOpen(prev => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        soundSynth.playTelemetryBeep();
        setIsStudyOpen(prev => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        soundSynth.playTelemetryBeep();
        setIsMemoryProfileOpen(prev => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        executeOptimizationFlow();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        executeBriefingFlow();
      } else if (e.key === 'Escape') {
        speechController.stop();
        activeFlowRef.current = false;
        setIsProcessing(false);
        setCurrentCard(null);
        setSelectedDockCard(null);
        setIsCommandsOpen(false);
        setIsStudyOpen(false);
        setIsSettingsOpen(false);
        setIsMemoryProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fetchTelemetry, fetchBriefingData]);

  // Save personal data back to pen drive
  const handleSavePersonalData = async (newData: PersonalData) => {
    const res = await fetch(getEndpoint('/api/briefing/data'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData)
    });
    if (res.ok) {
      setPersonalData(newData);
    } else {
      throw new Error('Falha ao salvar');
    }
  };

  // Helper to move a card to the dock with sound
  const pushCardToDock = (card: HelenaCard) => {
    soundSynth.playCardGlide();
    setDockCards((prev) => {
      if (prev.some((c) => c.id === card.id)) return prev;
      return [...prev, card];
    });
  };

  // -------------------------------------------------------------
  // FLOW A: "Helena, bom dia" (Briefing Matinal Completo em Tela Única)
  // -------------------------------------------------------------
  const executeBriefingFlow = async () => {
    speechController.stop();
    activeFlowRef.current = true;
    setIsProcessing(true);
    setBriefingOn(true);
    setSelectedDockCard(null);

    soundSynth.playTransitionPulse();
    soundSynth.playBiometricScan();

    try {
      setHelenaState('BIOMETRIA');
      const brainRes = await fetch(getEndpoint('/api/helena/brain'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'Helena, bom dia' })
      });
      const data = await brainRes.json();
      setBiometricConfirmed(true);
      setConsolidated(true);
      soundSynth.playBiometricConfirmed();

      if (data.cartoes && data.cartoes.length > 0) {
        const unifiedBriefingCard = data.cartoes[0];
        setCurrentCard(unifiedBriefingCard);
        setHelenaState('FALANDO');
        await speechController.speak(unifiedBriefingCard.fala);
      }
    } catch (err) {
      console.error('Erro no fluxo de briefing:', err);
    } finally {
      activeFlowRef.current = false;
      setIsProcessing(false);
      setHelenaState('EM ESPERA');
    }
  };

  // -------------------------------------------------------------
  // FLOW B: "Helena, otimizar computador" (Tela Única de Otimização)
  // -------------------------------------------------------------
  const executeOptimizationFlow = async () => {
    speechController.stop();
    activeFlowRef.current = true;
    setIsProcessing(true);
    setSelectedDockCard(null);

    soundSynth.playOptimizationSurge();
    setHelenaState('FALANDO');

    try {
      const brainRes = await fetch(getEndpoint('/api/helena/brain'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'Helena, otimizar computador' })
      });
      const data = await brainRes.json();

      if (data.cartoes && data.cartoes.length > 0) {
        const unifiedOptCard = data.cartoes[0];
        setCurrentCard(unifiedOptCard);
        soundSynth.playBiometricConfirmed();
        await speechController.speak(unifiedOptCard.fala);
        await fetchTelemetry();
      }
    } catch (err) {
      console.error('Erro na otimização:', err);
    } finally {
      activeFlowRef.current = false;
      setIsProcessing(false);
      setHelenaState('EM ESPERA');
    }
  };

  // -------------------------------------------------------------
  // Generic / Custom Command Dispatcher (Tela Única Frontal)
  // -------------------------------------------------------------
  const handleExecuteCommand = async (command: string) => {
    const cmd = command.toLowerCase().trim();

    if (cmd.includes('bom dia') || cmd.includes('briefing') || cmd.includes('matinal')) {
      return executeBriefingFlow();
    }
    if (
      !cmd.includes('registro') &&
      (cmd.includes('otimizar computador') || cmd.includes('otimizar pc') || cmd.includes('limpar pc') || cmd.includes('limpar computador') || cmd === 'otimizar' || cmd === 'helena, otimizar')
    ) {
      return executeOptimizationFlow();
    }
    if (cmd.includes('abrir perfil') || cmd.includes('ver perfil') || cmd.includes('ver memória') || cmd.includes('abrir memória') || cmd.includes('memória e perfil')) {
      soundSynth.playTelemetryBeep();
      setIsMemoryProfileOpen(true);
      await speechController.speak("Módulo de memória contínua e perfil do usuário aberto no console.");
      return;
    }
    if (cmd.includes('estudo') || cmd.includes('estudos') || cmd.includes('modo prova') || cmd.includes('semana de prova') || cmd.includes('minhas provas') || cmd.includes('pomodoro') || cmd.includes('foco nos estudos')) {
      soundSynth.playTelemetryBeep();
      setIsStudyOpen(true);
      await speechController.speak("Central de estudos e foco tático ativada, Comandante. O temporizador e frequências de concentração estão prontos.");
      return;
    }

    // Custom or free query via brain - APRESENTA APENAS UMA TELA NA FRENTE
    setIsProcessing(true);
    soundSynth.playTelemetryBeep();

    try {
      const brainRes = await fetch(getEndpoint('/api/helena/brain'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      const data = await brainRes.json();

      if (data.cartoes && data.cartoes.length > 0) {
        // Exibe UMA tela frontal consolidada sem avançar cards
        const singleCard = data.cartoes[0];
        setCurrentCard(singleCard);
        setHelenaState('FALANDO');
        setIsProcessing(false);

        if (data.intent === 'repair' || data.intent === 'otimizar') {
          fetchTelemetry();
        }

        // Fala de forma não bloqueante com barge-in habilitado
        speechController.speak(singleCard.fala).finally(() => {
          setHelenaState('EM ESPERA');
        });
      }
    } catch (err) {
      console.error('Erro ao consultar cérebro:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden hud-grid-background text-slate-100 flex flex-col justify-between scanlines">
      {/* Top Header */}
      <Header
        state={helenaState}
        status={systemStatus}
        isSpeaking={isSpeaking}
        biometricConfirmed={biometricConfirmed}
        consolidated={consolidated}
        briefingOn={briefingOn}
        onOpenSettings={(tab) => {
          setSettingsTab(tab || 'jarvis_voz');
          setIsSettingsOpen(true);
        }}
        onOpenCommands={() => {
          soundSynth.playTelemetryBeep();
          setIsCommandsOpen(true);
        }}
        onOpenMemoryProfile={() => {
          soundSynth.playTelemetryBeep();
          setIsMemoryProfileOpen(true);
        }}
        onOpenStudy={() => {
          soundSynth.playTelemetryBeep();
          setIsStudyOpen(true);
        }}
        onOpenDownload={() => {
          soundSynth.playTelemetryBeep();
          setIsDownloadOpen(true);
        }}
      />

      {/* Cloud Sandbox Notice Banner (Shown ONLY if accessed on remote cloud and local agent is not bridged) */}
      {systemStatus?.isCloudSandbox && !isLocalHost && !localApiBase && (
        <div className="w-full bg-amber-950/90 border-b border-amber-500/60 px-4 py-1.5 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-amber-200 z-40 backdrop-blur-md animate-in slide-in-from-top shrink-0">
          <div className="flex items-center gap-2 mb-1 sm:mb-0">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span>
              <strong>MODO CLOUD SANDBOX (INTEL XEON / VERCEL):</strong> Esta aba está visualizando a nuvem. Para controlar o seu computador real (Core i5, 16GB RAM) e executar ferramentas locais, inicie o app local no seu Desktop ou baixe no Pen Drive.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsDownloadOpen(true)}
              className="px-3 py-0.5 rounded-lg bg-amber-900/90 border border-amber-400 text-amber-200 hover:text-white font-bold text-[11px] shadow-[0_0_10px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
            >
              💾 BAIXAR PARA PEN DRIVE
            </button>
            <button
              onClick={() => {
                window.location.href = 'http://127.0.0.1:3000';
              }}
              className="px-3 py-0.5 rounded-lg bg-cyan-950 border border-cyan-400 text-cyan-300 hover:text-white font-bold text-[11px] shadow-[0_0_10px_rgba(0,240,255,0.4)] transition-all cursor-pointer"
            >
              ABRIR LOCALHOST:3000 ↗
            </button>
            <button
              onClick={() => fetchTelemetry()}
              className="px-2 py-0.5 rounded-lg bg-amber-950 border border-amber-500/50 text-amber-300 hover:text-white text-[11px] transition-colors cursor-pointer"
            >
              Conectar Agente
            </button>
          </div>
        </div>
      )}

      {/* Main HUD Body */}
      <main className="relative flex-1 flex items-center justify-between px-3 sm:px-6 py-1 overflow-hidden min-h-0">
        {/* Left Widget Panel */}
        <div className="hidden lg:flex shrink-0">
          <LeftPanel status={systemStatus} onOpenDownload={() => setIsDownloadOpen(true)} />
        </div>

        {/* Central Stage: 3D Energy Orb & Active Focus Cards */}
        <div className="relative flex-1 flex flex-col items-center justify-center h-full px-2 sm:px-4 min-h-0">
          {/* Energy Orb Canvas Layer */}
          <div className="relative flex items-center justify-center">
            <EnergyOrb
              state={helenaState}
              isSpeaking={isSpeaking}
              biometricActive={biometricActive}
              biometricConfirmed={biometricConfirmed}
            />

            {/* Overlaid Animated Card in Center Focus */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <AnimatePresence mode="wait">
                {consolidationActive && (
                  <div className="pointer-events-auto">
                    <ConsolidationOverlay onComplete={() => {}} />
                  </div>
                )}

                {currentCard && !consolidationActive && (
                  <div className="pointer-events-auto">
                    <CardFocus
                      card={currentCard}
                      isSpeaking={isSpeaking}
                      onClose={() => {
                        speechController.stop();
                        activeFlowRef.current = false;
                        setIsProcessing(false);
                        setCurrentCard(null);
                      }}
                      onPinToDock={() => {
                        pushCardToDock(currentCard);
                      }}
                      onOpenStudy={() => setIsStudyOpen(true)}
                      onReplaySpeech={(text) => speechController.speak(text)}
                    />
                  </div>
                )}

                {selectedDockCard && !currentCard && !consolidationActive && (
                  <div className="pointer-events-auto">
                    <CardFocus
                      card={selectedDockCard}
                      isSpeaking={false}
                      onClose={() => setSelectedDockCard(null)}
                      onOpenStudy={() => setIsStudyOpen(true)}
                      onReplaySpeech={(text) => speechController.speak(text)}
                    />
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Widget Panel */}
        <div className="hidden lg:flex shrink-0">
          <RightPanel
            status={systemStatus}
            personalData={personalData}
            isSpeaking={isSpeaking}
            onQuickOptimize={executeOptimizationFlow}
          />
        </div>
      </main>

      {/* Footer Area: Bottom Dock + Quick Command Bar */}
      <footer className="w-full flex flex-col items-center pb-2 px-3 sm:px-6 z-30 gap-1.5 shrink-0">
        <BottomDock
          cards={dockCards}
          onSelectCard={(card) => {
            setSelectedDockCard(card);
          }}
          onClearDock={() => setDockCards([])}
          activeCardId={selectedDockCard?.id || currentCard?.id}
        />

        <CommandBar
          onExecuteCommand={handleExecuteCommand}
          isProcessing={isProcessing}
        />
      </footer>

      {/* Settings Modal (dados_pessoais.json editor, voz, startup & reparo) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        personalData={personalData}
        onSave={handleSavePersonalData}
        initialTab={settingsTab}
      />

      {/* Tactical Command Palette Modal (Ctrl+K) */}
      <CommandPaletteModal
        isOpen={isCommandsOpen}
        onClose={() => setIsCommandsOpen(false)}
        onExecuteCommand={handleExecuteCommand}
      />

      {/* Persistent User Profile & Honcho Continuous Memory Modal */}
      <MemoryProfileModal
        isOpen={isMemoryProfileOpen}
        onClose={() => setIsMemoryProfileOpen(false)}
      />

      {/* Central de Estudos & Semana de Provas (Ctrl+E) */}
      <StudyModal
        isOpen={isStudyOpen}
        onClose={() => setIsStudyOpen(false)}
      />

      {/* Central de Download Portátil (Pen Drive & Instalador) */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        status={systemStatus}
      />
    </div>
  );
}

export default App;
