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
import { SettingsModal } from './components/SettingsModal';
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
  const [settingsTab, setSettingsTab] = useState<'jarvis_voz' | 'startup' | 'reparo' | 'rede' | 'perfil' | 'agenda' | 'prioridades' | 'raw'>('jarvis_voz');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const activeFlowRef = useRef<boolean>(false);

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
      const res = await fetch('/api/system/status');
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
      }
    } catch (_) {}
  }, []);

  const fetchBriefingData = useCallback(async () => {
    try {
      const res = await fetch('/api/briefing/data');
      if (res.ok) {
        const data = await res.json();
        setPersonalData(data);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchTelemetry();
    fetchBriefingData();

    const interval = setInterval(() => {
      fetchTelemetry();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchTelemetry, fetchBriefingData]);

  // Save personal data back to pen drive
  const handleSavePersonalData = async (newData: PersonalData) => {
    const res = await fetch('/api/briefing/data', {
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
  // FLOW A: "Helena, bom dia" (Briefing Matinal Completo)
  // -------------------------------------------------------------
  const executeBriefingFlow = async () => {
    if (activeFlowRef.current) return;
    activeFlowRef.current = true;
    setIsProcessing(true);
    setBriefingOn(true);
    setBiometricConfirmed(false);
    setConsolidated(false);
    setSelectedDockCard(null);

    soundSynth.playTransitionPulse();

    try {
      // 1. Consult brain for tailored speech & cards
      const brainRes = await fetch('/api/helena/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'Helena, bom dia' })
      });
      const brainData = await brainRes.json();

      // 2. Stage: Biometria Facial
      setHelenaState('BIOMETRIA');
      setBiometricActive(true);
      await speechController.speak(
        brainData.biometria?.fala || "Bom dia. Iniciando reconhecimento de usuário."
      );

      // Wait a moment for scanner confirmation chime
      await new Promise((r) => setTimeout(r, 1200));
      setBiometricConfirmed(true);
      setBiometricActive(false);

      // 3. Stage: Consolidação de Heurísticas
      setHelenaState('PROCESSANDO');
      setConsolidationActive(true);
      await speechController.speak(
        brainData.consolidacao?.fala || "Sincronizando heurísticas locais. Os dados do sistema estão consolidados."
      );

      // Wait for consolidation animation to finalize
      await new Promise((r) => setTimeout(r, 2800));
      setConsolidationActive(false);
      setConsolidated(true);

      // 4. Sequential Cards (Center Focus -> Dock)
      const cards: HelenaCard[] = brainData.cartoes || [];
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        setCurrentCard(card);
        setHelenaState('FALANDO');
        soundSynth.playTelemetryBeep(1.0 + i * 0.15);

        await speechController.speak(card.fala);
        await new Promise((r) => setTimeout(r, 600));

        // Slide smoothly to dock
        pushCardToDock(card);
        setCurrentCard(null);
        await new Promise((r) => setTimeout(r, 350));
      }

      soundSynth.playBiometricConfirmed();
    } catch (err) {
      console.error('Erro no fluxo de briefing:', err);
    } finally {
      activeFlowRef.current = false;
      setIsProcessing(false);
      setHelenaState('EM ESPERA');
      setCurrentCard(null);
    }
  };

  // -------------------------------------------------------------
  // FLOW B: "Helena, otimizar computador" (Habilidade de Limpeza Real)
  // -------------------------------------------------------------
  const executeOptimizationFlow = async () => {
    if (activeFlowRef.current) return;
    activeFlowRef.current = true;
    setIsProcessing(true);
    setSelectedDockCard(null);

    soundSynth.playOptimizationSurge();
    setHelenaState('FALANDO');

    try {
      // 1. Brain query for flow structure
      const brainRes = await fetch('/api/helena/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'Helena, otimizar computador' })
      });
      const brainData = await brainRes.json();

      // Intro
      await speechController.speak(
        brainData.intro?.fala || "Protocolo de otimização ativado. Executando bateria diagnóstica e limpeza do sistema."
      );

      // Card 1: Análise de Hardware
      const cardAnalise = brainData.cartoes[0];
      if (cardAnalise) {
        setCurrentCard(cardAnalise);
        soundSynth.playTelemetryBeep();
        await speechController.speak(cardAnalise.fala);
        await new Promise((r) => setTimeout(r, 500));
        pushCardToDock(cardAnalise);
        setCurrentCard(null);
        await new Promise((r) => setTimeout(r, 300));
      }

      // Card 2: Executar Real POST /api/system/optimize
      const optRes = await fetch('/api/system/optimize', { method: 'POST' });
      const optData: OptimizationReport = await optRes.json();

      soundSynth.playOptimizationSurge();
      const cardCache: HelenaCard = {
        id: 'card-cache-clean',
        titulo: 'Limpeza de Cache e Temp',
        tipo: 'limpeza_temp',
        subtitulo: 'Expurgo executado em %TEMP%',
        fala: `Limpeza executada com sucesso. ${optData.etapas[0]?.arquivosRemovidos || 0} arquivos temporários purgados, liberando ${optData.etapas[0]?.espacoLiberadoMB || 0} Megabytes de armazenamento.`,
        resultadoOtimizacao: optData
      };

      setCurrentCard(cardCache);
      await speechController.speak(cardCache.fala);
      await new Promise((r) => setTimeout(r, 500));
      pushCardToDock(cardCache);
      setCurrentCard(null);
      await new Promise((r) => setTimeout(r, 300));

      // Card 3: Rede e Memória
      const cardRede: HelenaCard = {
        id: 'card-rede-perf',
        titulo: 'Rede, Memória e Desempenho',
        tipo: 'rede_memoria',
        subtitulo: 'Ajuste de perfil energético e DNS',
        fala: `Tabelas de DNS purgadas, processos reorganizados e plano de Alto Desempenho do Windows fixado como ativo.`
      };

      setCurrentCard(cardRede);
      soundSynth.playTelemetryBeep(1.3);
      await speechController.speak(cardRede.fala);
      await new Promise((r) => setTimeout(r, 500));
      pushCardToDock(cardRede);
      setCurrentCard(null);

      soundSynth.playBiometricConfirmed();
      await fetchTelemetry(); // refresh stats
    } catch (err) {
      console.error('Erro na otimização:', err);
    } finally {
      activeFlowRef.current = false;
      setIsProcessing(false);
      setHelenaState('EM ESPERA');
      setCurrentCard(null);
    }
  };

  // -------------------------------------------------------------
  // Generic / Custom Command Dispatcher
  // -------------------------------------------------------------
  const handleExecuteCommand = async (command: string) => {
    const cmd = command.toLowerCase().trim();

    if (cmd.includes('bom dia') || cmd.includes('briefing') || cmd.includes('matinal')) {
      return executeBriefingFlow();
    }
    if (cmd.includes('otimizar') || cmd.includes('limpar pc') || cmd.includes('limpar computador')) {
      return executeOptimizationFlow();
    }

    // Custom or free query via brain
    setIsProcessing(true);
    soundSynth.playTelemetryBeep();

    try {
      const brainRes = await fetch('/api/helena/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      const data = await brainRes.json();

      if (data.cartoes && data.cartoes.length > 0) {
        for (let i = 0; i < data.cartoes.length; i++) {
          const card = data.cartoes[i];
          setCurrentCard(card);
          setHelenaState('FALANDO');
          await speechController.speak(card.fala);
          await new Promise((r) => setTimeout(r, 600));
          pushCardToDock(card);
          setCurrentCard(null);
          await new Promise((r) => setTimeout(r, 300));
        }

        if (data.intent === 'repair' || data.intent === 'otimizar') {
          await fetchTelemetry();
        }
      }
    } catch (err) {
      console.error('Erro ao consultar cérebro:', err);
    } finally {
      setIsProcessing(false);
      setHelenaState('EM ESPERA');
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden hud-grid-background text-slate-100 flex flex-col justify-between scanlines">
      {/* Top Header */}
      <Header
        state={helenaState}
        isSpeaking={isSpeaking}
        biometricConfirmed={biometricConfirmed}
        consolidated={consolidated}
        briefingOn={briefingOn}
        onOpenSettings={(tab) => {
          setSettingsTab(tab || 'jarvis_voz');
          setIsSettingsOpen(true);
        }}
      />

      {/* Main HUD Body */}
      <main className="relative flex-1 flex items-center justify-between px-3 sm:px-6 py-1 overflow-hidden min-h-0">
        {/* Left Widget Panel */}
        <div className="hidden lg:flex shrink-0">
          <LeftPanel status={systemStatus} />
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
                      onNext={() => {
                        speechController.stop();
                      }}
                    />
                  </div>
                )}

                {selectedDockCard && !currentCard && !consolidationActive && (
                  <div className="pointer-events-auto">
                    <CardFocus
                      card={selectedDockCard}
                      isSpeaking={false}
                      onNext={() => setSelectedDockCard(null)}
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
    </div>
  );
}

export default App;
