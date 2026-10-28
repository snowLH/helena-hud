import React, { useState, useEffect } from 'react';
import type { PersonalData, StartupApp, RepairReport, ProcessItem, BenchmarkResult, NetworkDiagnostics } from '../types';
import {
  X,
  Save,
  Plus,
  Trash2,
  Check,
  Play,
  Wifi,
  Copy,
  Sparkles,
  Radio,
  Bot,
  Power,
  Wrench,
  CheckCircle2,
  Rocket,
  Activity,
  Gauge,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Sliders,
  Battery,
  BatteryCharging,
  Globe
} from 'lucide-react';
import { soundSynth } from '../audio/synth';
import { speechController, JARVIS_VOICE_PRESETS } from '../audio/speech';

export type SettingsTabType =
  | 'jarvis_voz'
  | 'ia_provedores'
  | 'diagnostico_hardware'
  | 'processos'
  | 'benchmark'
  | 'diagnostico_rede'
  | 'startup'
  | 'reparo'
  | 'rede'
  | 'perfil'
  | 'agenda'
  | 'prioridades'
  | 'raw';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  personalData: PersonalData | null;
  onSave: (newData: PersonalData) => Promise<void>;
  initialTab?: SettingsTabType;
}

const DEFAULT_FALLBACK_DATA: PersonalData = {
  usuario: {
    nome: "Comandante",
    titulo: "Usuário",
    preferenciaVoz: "Thalita",
    cidade: "São Paulo"
  },
  clima: {
    cidade: "São Paulo",
    condicao: "Céu Limpo",
    temperatura: 24,
    minima: 18,
    maxima: 28,
    umidade: 55,
    ventoKmH: 12,
    probabilidadeChuva: "10%"
  },
  agenda: [],
  prioridades: [],
  metas: []
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  personalData,
  onSave,
  initialTab = 'jarvis_voz'
}) => {
  const [data, setData] = useState<PersonalData>(personalData || DEFAULT_FALLBACK_DATA);
  const [activeTab, setActiveTab] = useState<SettingsTabType>(initialTab);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [rawJson, setRawJson] = useState<string>(JSON.stringify(personalData || DEFAULT_FALLBACK_DATA, null, 2));

  // J.A.R.V.I.S. Voice state
  const [activePresetId, setActivePresetId] = useState<string>(speechController.activePresetId);
  const [holographicEffect, setHolographicEffect] = useState<boolean>(speechController.holographicEffect);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [customRate, setCustomRateState] = useState<string>(speechController.customRate);
  const [customPitch, setCustomPitchState] = useState<string>(speechController.customPitch);

  // Processes state
  const [processesList, setProcessesList] = useState<ProcessItem[]>([]);
  const [loadingProcesses, setLoadingProcesses] = useState<boolean>(false);
  const [killingPid, setKillingPid] = useState<number | null>(null);

  // Benchmark state
  const [benchResult, setBenchResult] = useState<BenchmarkResult | null>(null);
  const [runningBench, setRunningBench] = useState<boolean>(false);

  // Diagnostics state
  const [diagResult, setDiagResult] = useState<NetworkDiagnostics | null>(null);
  const [runningDiag, setRunningDiag] = useState<boolean>(false);

  // Startup Apps state
  const [startupApps, setStartupApps] = useState<StartupApp[]>([]);
  const [loadingStartup, setLoadingStartup] = useState<boolean>(false);
  const [togglingApp, setTogglingApp] = useState<string | null>(null);

  // Repair state
  const [repairReport, setRepairReport] = useState<RepairReport | null>(null);
  const [isRepairing, setIsRepairing] = useState<boolean>(false);

  // Network state
  const [networkInfo, setNetworkInfo] = useState<{ localUrl: string; networkUrl: string; ip: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // AI Hub state
  const [aiConfig, setAiConfig] = useState<any>(null);
  const [maskedCreds, setMaskedCreds] = useState<any>(null);
  const [providersMeta, setProvidersMeta] = useState<any>(null);
  const [geminiKeyInput, setGeminiKeyInput] = useState<string>('');
  const [openaiKeyInput, setOpenaiKeyInput] = useState<string>('');
  const [claudeKeyInput, setClaudeKeyInput] = useState<string>('');
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ [key: string]: any }>({});
  const [savingAiKeys, setSavingAiKeys] = useState<boolean>(false);

  // Hardware Diagnostics state
  const [hwDiag, setHwDiag] = useState<any>(null);
  const [loadingHwDiag, setLoadingHwDiag] = useState<boolean>(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    const current = personalData || DEFAULT_FALLBACK_DATA;
    setData(JSON.parse(JSON.stringify(current)));
    setRawJson(JSON.stringify(current, null, 2));

    setActivePresetId(speechController.activePresetId);
    setHolographicEffect(speechController.holographicEffect);

    // Fetch network info
    fetch('/api/network/info')
      .then(r => r.json())
      .then(info => setNetworkInfo(info))
      .catch(() => {});

    // Fetch startup apps, AI config & HW diag
    fetchStartupApps();
    fetchAiConfig();
    fetchHwDiag();
  }, [personalData, isOpen]);

  const fetchAiConfig = async () => {
    try {
      const res = await fetch('/api/ai/config');
      if (res.ok) {
        const d = await res.json();
        setAiConfig(d.config);
        setMaskedCreds(d.maskedCredentials);
        setProvidersMeta(d.provedores);
      }
    } catch (_) {}
  };

  const fetchHwDiag = async () => {
    setLoadingHwDiag(true);
    try {
      const res = await fetch('/api/system/diagnostics/hardware');
      if (res.ok) {
        const d = await res.json();
        setHwDiag(d);
      }
    } catch (_) {}
    finally {
      setLoadingHwDiag(false);
    }
  };

  const handleSaveAiCredentials = async () => {
    setSavingAiKeys(true);
    soundSynth.playTelemetryBeep();
    try {
      const body: any = {};
      if (geminiKeyInput.trim()) body.geminiKey = geminiKeyInput.trim();
      if (openaiKeyInput.trim()) body.openaiKey = openaiKeyInput.trim();
      if (claudeKeyInput.trim()) body.claudeKey = claudeKeyInput.trim();

      const res = await fetch('/api/ai/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const d = await res.json();
        setMaskedCreds(d.maskedCredentials);
        setGeminiKeyInput('');
        setOpenaiKeyInput('');
        setClaudeKeyInput('');
        soundSynth.playBiometricConfirmed();
        alert('Credenciais salvas com segurança no armazenamento local!');
      }
    } catch (err: any) {
      alert('Erro ao salvar credenciais: ' + err.message);
    } finally {
      setSavingAiKeys(false);
    }
  };

  const handleTestProvider = async (providerId: string) => {
    setTestingProvider(providerId);
    soundSynth.playTelemetryBeep();
    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId })
      });
      const data = await res.json();
      setTestResult(prev => ({ ...prev, [providerId]: data }));
      if (data.success) {
        soundSynth.playBiometricConfirmed();
      }
    } catch (err: any) {
      setTestResult(prev => ({ ...prev, [providerId]: { success: false, erro: err.message } }));
    } finally {
      setTestingProvider(null);
    }
  };

  const handleSelectActiveProvider = async (providerId: string, model?: string) => {
    soundSynth.playTelemetryBeep();
    try {
      const res = await fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeProvider: providerId, activeModel: model })
      });
      if (res.ok) {
        const d = await res.json();
        setAiConfig(d.config);
      }
    } catch (_) {}
  };

  const handleExportConfig = () => {
    soundSynth.playTelemetryBeep();
    window.open('/api/system/config/export', '_blank');
  };

  const fetchStartupApps = async () => {
    setLoadingStartup(true);
    try {
      const res = await fetch('/api/system/startup');
      if (res.ok) {
        const apps = await res.json();
        setStartupApps(apps);
      }
    } catch (_) {}
    finally {
      setLoadingStartup(false);
    }
  };

  const handleToggleStartupApp = async (app: StartupApp) => {
    setTogglingApp(app.name);
    soundSynth.playTelemetryBeep(1.2);
    try {
      const res = await fetch('/api/system/startup/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: app.name,
          command: app.command,
          enable: !app.enabled
        })
      });

      if (res.ok) {
        setStartupApps(prev =>
          prev.map(a => a.name === app.name ? { ...a, enabled: !app.enabled } : a)
        );
        soundSynth.playBiometricConfirmed();
      }
    } catch (err) {
      console.error('Erro ao alternar app:', err);
    } finally {
      setTogglingApp(null);
    }
  };

  const handleRunRepair = async () => {
    setIsRepairing(true);
    soundSynth.playOptimizationSurge();
    try {
      const res = await fetch('/api/system/repair', { method: 'POST' });
      if (res.ok) {
        const rep = await res.json();
        setRepairReport(rep);
        soundSynth.playBiometricConfirmed();
        speechController.speak('Reparo do sistema concluído com êxito. Todos os subsistemas foram recalibrados.');
      }
    } catch (err) {
      console.error('Erro no reparo:', err);
    } finally {
      setIsRepairing(false);
    }
  };

  if (!isOpen) return null;

  const handleSelectPreset = (presetId: string) => {
    soundSynth.playTelemetryBeep();
    setActivePresetId(presetId);
    speechController.setActivePreset(presetId);
  };

  const handleToggleHolo = (enabled: boolean) => {
    soundSynth.playTelemetryBeep(1.3);
    setHolographicEffect(enabled);
    speechController.setHolographicEffect(enabled);
  };

  const handlePreview = async (presetId: string) => {
    setPreviewingId(presetId);
    soundSynth.playTelemetryBeep(1.2);
    try {
      await speechController.previewVoice(
        presetId,
        'Olá Comandante. Reconhecimento confirmado. Todos os sistemas e diagnósticos estão prontos para sua ordem.'
      );
    } finally {
      setPreviewingId(null);
    }
  };

  const fetchProcesses = async () => {
    setLoadingProcesses(true);
    try {
      const res = await fetch('/api/system/processes?limit=30');
      if (res.ok) {
        const data = await res.json();
        setProcessesList(data);
      }
    } catch (_) {}
    finally {
      setLoadingProcesses(false);
    }
  };

  const handleKillProcess = async (proc: ProcessItem) => {
    if (proc.isCritical) return;
    setKillingPid(proc.pid);
    soundSynth.playTelemetryBeep();
    try {
      const res = await fetch('/api/system/processes/kill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid: proc.pid, name: proc.name })
      });
      if (res.ok) {
        setProcessesList(prev => prev.filter(p => p.pid !== proc.pid));
        soundSynth.playBiometricConfirmed();
      } else {
        const err = await res.json();
        alert(err.error || 'Falha ao finalizar processo');
      }
    } catch (_) {}
    finally {
      setKillingPid(null);
    }
  };

  const handleRunBench = async () => {
    setRunningBench(true);
    soundSynth.playOptimizationSurge();
    try {
      const res = await fetch('/api/system/benchmark', { method: 'POST' });
      if (res.ok) {
        const bench = await res.json();
        setBenchResult(bench);
        soundSynth.playBiometricConfirmed();
        speechController.speak(`Benchmark concluído. Pontuação: ${bench.score} de 1000 pontos com classificação ${bench.rating}.`);
      }
    } catch (_) {}
    finally {
      setRunningBench(false);
    }
  };

  const handleRunDiag = async () => {
    setRunningDiag(true);
    soundSynth.playTelemetryBeep();
    try {
      const res = await fetch('/api/network/diagnostics');
      if (res.ok) {
        const diag = await res.json();
        setDiagResult(diag);
        soundSynth.playBiometricConfirmed();
        speechController.speak(`Diagnóstico concluído. Latência de rede em ${diag.latencyMs} milissegundos.`);
      }
    } catch (_) {}
    finally {
      setRunningDiag(false);
    }
  };

  const handleRateChange = (newRate: string) => {
    setCustomRateState(newRate);
    speechController.setCustomRate(newRate);
  };

  const handlePitchChange = (newPitch: string) => {
    setCustomPitchState(newPitch);
    speechController.setCustomPitch(newPitch);
  };

  const handleCopyNetworkUrl = () => {
    if (networkInfo?.networkUrl) {
      navigator.clipboard.writeText(networkInfo.networkUrl);
      setCopiedLink(true);
      soundSynth.playBiometricConfirmed();
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    soundSynth.playTelemetryBeep();
    try {
      let finalData = data;
      if (activeTab === 'raw') {
        finalData = JSON.parse(rawJson);
      }
      await onSave(finalData);
      setSaveSuccess(true);
      soundSynth.playBiometricConfirmed();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      alert('Erro ao salvar dados. Verifique a sintaxe JSON caso tenha editado diretamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono select-none">
      <div className="relative w-full max-w-2xl rounded-2xl border-2 border-purple-500/60 bg-slate-950 p-6 shadow-[0_0_50px_rgba(168,85,247,0.4)] text-left flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-purple-500/30">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
            <Bot className="w-5 h-5 text-cyan-400" />
            <span>CENTRAL NEURAL // H.E.L.E.N.A. ASSISTENTE</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-purple-900/40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 my-3 border-b border-purple-500/20 pb-2 text-xs flex-wrap">
          {(
            [
              { id: 'jarvis_voz', label: 'Voz Helena' },
              { id: 'ia_provedores', label: 'IA & Provedores' },
              { id: 'diagnostico_hardware', label: 'Hardware' },
              { id: 'processos', label: 'Processos' },
              { id: 'benchmark', label: 'Benchmark' },
              { id: 'diagnostico_rede', label: 'Diagnóstico' },
              { id: 'startup', label: 'Boot' },
              { id: 'reparo', label: 'Reparo' },
              { id: 'rede', label: 'Rede Local' },
              { id: 'perfil', label: 'Perfil' },
              { id: 'agenda', label: 'Agenda' },
              { id: 'prioridades', label: 'Prioridades' },
              { id: 'raw', label: 'JSON' }
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundSynth.playTelemetryBeep();
                setActiveTab(tab.id);
                if (tab.id === 'processos' && processesList.length === 0) {
                  fetchProcesses();
                }
                if (tab.id === 'ia_provedores') {
                  fetchAiConfig();
                }
                if (tab.id === 'diagnostico_hardware') {
                  fetchHwDiag();
                }
              }}
              className={`px-2.5 py-1 rounded-lg uppercase tracking-wider font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-900/80 text-cyan-300 border border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                  : 'text-slate-400 hover:text-purple-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-slate-300">
          {/* TAB 1: NATURAL STUDIO VOICES */}
          {activeTab === 'jarvis_voz' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-cyan-500/50 bg-cyan-950/40 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm mb-1">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>Voz Humana de Estúdio Neural (100% Natural)</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Adeus à voz robótica mecânica. A H.E.L.E.N.A. agora utiliza modelos neurais de estúdio (Edge & Google Neural) com dicção aveludada, entonação humana e cadência fluida.
                </p>
              </div>

              {/* Natural vs Holographic Toggle */}
              <div className="p-3 rounded-xl border border-purple-500/40 bg-slate-900/70 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-white font-bold text-xs mb-0.5">
                    <Radio className="w-4 h-4 text-purple-400" />
                    <span>Realce Acústico Sci-Fi</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {holographicEffect
                      ? 'Ativo: reforço sutil de equalização e compressão broadcast.'
                      : 'Desativado: voz pura, direta e cristalina de estúdio.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleHolo(!holographicEffect)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                    holographicEffect
                      ? 'border-cyan-400 bg-cyan-950/80 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                      : 'border-slate-700 bg-slate-900 text-slate-400'
                  }`}
                >
                  {holographicEffect ? 'ATIVADO' : 'VOZ PURA (PADRÃO)'}
                </button>
              </div>

              {/* Presets List */}
              <div className="space-y-2.5">
                <span className="text-[10px] text-purple-300 uppercase tracking-wider block">
                  Modelos de Voz Disponíveis
                </span>

                {JARVIS_VOICE_PRESETS.map((preset) => {
                  const isSelected = activePresetId === preset.id;
                  const isPreviewing = previewingId === preset.id;

                  return (
                    <div
                      key={preset.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/50 shadow-[0_0_20px_rgba(0,240,255,0.35)]'
                          : 'border-purple-500/30 bg-slate-900/60 hover:border-purple-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{preset.name}</span>
                          {preset.isJarvisDefault && (
                            <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-400 text-amber-300 text-[9px] font-bold">
                              RECOMENDADA
                            </span>
                          )}
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400 text-cyan-300 text-[9px] font-bold">
                              ATIVA
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePreview(preset.id)}
                            disabled={isPreviewing}
                            className="px-3 py-1 rounded-lg border border-purple-400/50 bg-purple-950/80 hover:bg-purple-900 text-purple-200 hover:text-white flex items-center gap-1.5 text-xs font-semibold shadow-[0_0_10px_rgba(168,85,247,0.3)] disabled:opacity-50"
                          >
                            <Play className={`w-3.5 h-3.5 ${isPreviewing ? 'animate-spin' : ''}`} />
                            <span>{isPreviewing ? 'Ouvindo...' : 'Testar Voz'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectPreset(preset.id)}
                            className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all ${
                              isSelected
                                ? 'border-cyan-400 bg-cyan-400 text-slate-950 shadow-[0_0_12px_#00f0ff]'
                                : 'border-purple-500/40 bg-slate-950 text-slate-300 hover:text-cyan-300'
                            }`}
                          >
                            {isSelected ? 'Em Uso' : 'Selecionar'}
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300/90 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Sliders de Calibração */}
              <div className="p-3.5 rounded-xl border border-cyan-500/40 bg-slate-900/80 space-y-3">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Calibração Fina Acústica</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Velocidade da Fala:</span>
                    <span className="text-cyan-300 font-bold">{customRate}</span>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    step="5"
                    value={parseInt(customRate.replace('%', ''), 10) || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const formatted = val >= 0 ? `+${val}%` : `${val}%`;
                      handleRateChange(formatted);
                    }}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-950 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>Mais Lenta (-20%)</span>
                    <span>Padrão (0%)</span>
                    <span>Mais Rápida (+20%)</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Tom da Voz (Pitch):</span>
                    <span className="text-purple-300 font-bold">{customPitch}</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="2"
                    value={parseInt(customPitch.replace('Hz', ''), 10) || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const formatted = val >= 0 ? `+${val}Hz` : `${val}Hz`;
                      handlePitchChange(formatted);
                    }}
                    className="w-full accent-purple-400 h-1.5 bg-slate-950 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>Mais Grave (-10Hz)</span>
                    <span>Natural (0Hz)</span>
                    <span>Mais Agudo (+10Hz)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: IA & PROVEDORES UNIVERSAIS (FASE 2 & C) */}
          {activeTab === 'ia_provedores' && (
            <div className="space-y-4">
              {/* Header Box */}
              <div className="p-3.5 rounded-xl border border-cyan-500/50 bg-cyan-950/40 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    <span>Núcleo de Inteligência Multi-Provedores</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-400 text-emerald-300 text-[10px] font-bold">
                    PROVEDOR ATIVO: {aiConfig?.activeProvider?.toUpperCase() || 'CORE'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  A H.E.L.E.N.A. alterna dinamicamente entre IA em nuvem de alta potência (Gemini, OpenAI, Claude) e processamento 100% local e privado (Ollama, Core Offline). As chaves são mantidas estritamente no seu computador.
                </p>
              </div>

              {/* Provider Selection Cards */}
              <div className="space-y-2">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                  Selecione o Provedor Cognitivo Ativo:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {providersMeta && Object.entries(providersMeta).map(([pId, meta]: [string, any]) => {
                    const isSelected = (aiConfig?.activeProvider || 'core') === pId;
                    const test = testResult[pId];
                    return (
                      <div
                        key={pId}
                        onClick={() => handleSelectActiveProvider(pId, meta.modeloPadrao)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-950/70 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-white font-bold text-xs">{meta.nome}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                              meta.tipo === 'cloud'
                                ? 'bg-purple-950 border border-purple-500/50 text-purple-300'
                                : 'bg-emerald-950 border border-emerald-500/50 text-emerald-300'
                            }`}>
                              {meta.tipo}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mb-2 leading-tight">{meta.descricao}</p>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-[9px] text-cyan-300 font-mono">
                            Modelo: {meta.modeloPadrao}
                          </span>
                          <button
                            type="button"
                            disabled={testingProvider === pId}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestProvider(pId);
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[9px] font-bold border border-slate-600 cursor-pointer"
                          >
                            {testingProvider === pId ? 'Testando...' : 'Testar Conexão'}
                          </button>
                        </div>

                        {test && (
                          <div className={`mt-2 p-1.5 rounded text-[9px] font-mono ${
                            test.success ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-300' : 'bg-rose-950/80 border border-rose-500 text-rose-300'
                          }`}>
                            {test.success ? `✔ Conectado (${test.duracaoMs}ms)` : `✕ ${test.erro}`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* API Keys Configuration */}
              <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-3">
                <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">
                  Gerenciamento Seguro de Chaves de API (Nuvem):
                </span>

                {/* Gemini */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] text-slate-300">Google Gemini API Key</label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Status: {maskedCreds?.hasGemini ? <span className="text-emerald-400 font-bold">Ativa ({maskedCreds.geminiKey})</span> : <span className="text-amber-400">Não configurada</span>}
                    </span>
                  </div>
                  <input
                    type="password"
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    placeholder="Cole aqui nova AIzaSy..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                  />
                </div>

                {/* OpenAI */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] text-slate-300">OpenAI API Key (GPT-4o)</label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Status: {maskedCreds?.hasOpenAI ? <span className="text-emerald-400 font-bold">Ativa ({maskedCreds.openaiKey})</span> : <span className="text-amber-400">Não configurada</span>}
                    </span>
                  </div>
                  <input
                    type="password"
                    value={openaiKeyInput}
                    onChange={(e) => setOpenaiKeyInput(e.target.value)}
                    placeholder="Cole aqui nova sk-proj-..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Claude */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] text-slate-300">Anthropic Claude API Key</label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Status: {maskedCreds?.hasClaude ? <span className="text-emerald-400 font-bold">Ativa ({maskedCreds.claudeKey})</span> : <span className="text-amber-400">Não configurada</span>}
                    </span>
                  </div>
                  <input
                    type="password"
                    value={claudeKeyInput}
                    onChange={(e) => setClaudeKeyInput(e.target.value)}
                    placeholder="Cole aqui nova sk-ant-..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  type="button"
                  disabled={savingAiKeys || (!geminiKeyInput && !openaiKeyInput && !claudeKeyInput)}
                  onClick={handleSaveAiCredentials}
                  className="w-full py-2 rounded-xl border border-purple-400 bg-purple-950 hover:bg-purple-900 text-purple-200 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(168,85,247,0.3)] cursor-pointer"
                >
                  {savingAiKeys ? 'Salvando...' : '💾 SALVAR CREDENCIAIS COM SEGURANÇA'}
                </button>
              </div>
            </div>
          )}

          {/* TAB: DIAGNÓSTICO FORENSE DE HARDWARE REAL & LAUDO (FASE 5) */}
          {activeTab === 'diagnostico_hardware' && (
            <div className="space-y-4">
              {/* Header Box */}
              <div className="p-3.5 rounded-xl border border-amber-500/50 bg-amber-950/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                    <Wrench className="w-4 h-4 text-amber-400" />
                    <span>Diagnóstico Forense de Hardware do Computador</span>
                  </div>
                  <button
                    onClick={fetchHwDiag}
                    disabled={loadingHwDiag}
                    className="px-2 py-0.5 rounded bg-slate-800 border border-slate-600 text-slate-300 text-[10px] font-bold hover:text-white cursor-pointer"
                  >
                    {loadingHwDiag ? 'Lendo WMI...' : 'Atualizar Dados'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Inspeção em tempo real das especificações físicas, BIOS, topologia de núcleos, integridade SMART do SSD e histórico de erros críticos do Windows Event Viewer.
                </p>
              </div>

              {hwDiag && (
                <div className="space-y-3 font-mono">
                  {/* Grid 1: Host & CPU */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl border border-slate-700 bg-slate-900/80">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">DISPOSITIVO & BIOS</span>
                      <span className="text-white font-bold text-xs mt-1 block">{hwDiag.computador?.modelo} ({hwDiag.hostname})</span>
                      <span className="text-[10px] text-slate-300 mt-1 block">Fabricante: {hwDiag.computador?.fabricante}</span>
                      <span className="text-[10px] text-cyan-300 block">BIOS: {hwDiag.computador?.bios} ({hwDiag.computador?.dataBios})</span>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-700 bg-slate-900/80">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">PROCESSADOR (CPU)</span>
                      <span className="text-cyan-300 font-bold text-xs mt-1 block">{hwDiag.processador?.modelo}</span>
                      <span className="text-[10px] text-slate-300 mt-1 block">
                        Topologia: {hwDiag.processador?.nucleosFisicos} Núcleos Físicos / {hwDiag.processador?.threadsLogicos} Threads Lógicos ({hwDiag.processador?.arquitetura})
                      </span>
                    </div>
                  </div>

                  {/* Grid 2: RAM & SSD */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl border border-slate-700 bg-slate-900/80">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">MEMÓRIA RAM</span>
                      <span className="text-white font-bold text-sm mt-1 block">{hwDiag.memoriaRAM?.totalGB} GB Total</span>
                      <span className="text-[10px] text-slate-300 block">
                        Usado: {hwDiag.memoriaRAM?.usadoGB} GB | Livre: {hwDiag.memoriaRAM?.livreGB} GB
                      </span>
                      {hwDiag.memoriaRAM?.modulos?.[0] && (
                        <span className="text-[9px] text-emerald-300 block mt-1">
                          Slot: {hwDiag.memoriaRAM.modulos[0].slot} @ {hwDiag.memoriaRAM.modulos[0].velocidadeMHz}MHz ({hwDiag.memoriaRAM.modulos[0].fabricante})
                        </span>
                      )}
                    </div>

                    <div className="p-3 rounded-xl border border-slate-700 bg-slate-900/80">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">ARMAZENAMENTO & SMART</span>
                      <span className="text-cyan-300 font-bold text-xs mt-1 block">
                        {hwDiag.armazenamento?.discosFisicos?.[0]?.modelo || 'Samsung NVMe SSD'}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-300">
                          Partição C: {hwDiag.armazenamento?.particaoC?.livreGB} GB Livres ({hwDiag.armazenamento?.particaoC?.percentualUso}% ocupado)
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 text-[9px] font-bold">
                          {hwDiag.armazenamento?.discosFisicos?.[0]?.saude || 'Saudável'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Windows Event Viewer Crash / Critical Logs */}
                  <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-950/20 space-y-2">
                    <span className="text-[10px] text-rose-300 font-bold uppercase tracking-wider block">
                      Auditoria Forense de Falhas do Windows (Event Viewer Level 1 & 2):
                    </span>
                    {hwDiag.logsEventViewer && hwDiag.logsEventViewer.length > 0 ? (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {hwDiag.logsEventViewer.map((ev: any, idx: number) => (
                          <div key={idx} className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[10px]">
                            <div className="flex justify-between text-rose-400 font-bold">
                              <span>Origem: {ev.origem} (ID {ev.eventoId})</span>
                              <span className="text-slate-400 font-normal">{ev.dataHora}</span>
                            </div>
                            <p className="text-slate-300 mt-0.5 text-[9px] truncate">{ev.mensagem}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-emerald-400">
                        ✔ Nenhum evento crítico de kernel ou BSOD recente registrado no log do sistema.
                      </p>
                    )}
                  </div>

                  {/* Export & Portability Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={handleExportConfig}
                      className="flex-1 py-2 rounded-xl border border-cyan-400 bg-cyan-950 hover:bg-cyan-900 text-cyan-200 text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] cursor-pointer"
                    >
                      💾 EXPORTAR CONFIGURAÇÃO COMPLETA (JSON)
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        soundSynth.playTelemetryBeep();
                        try {
                          const res = await fetch('/api/system/diagnostics/report', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ symptom: 'Inspeção Completa de Rotina' })
                          });
                          const data = await res.json();
                          if (data.sucesso) {
                            alert('Laudo emitido com sucesso: ' + data.arquivo);
                            const blob = new Blob([data.conteudoMarkdown], { type: 'text/markdown' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = data.arquivo;
                            a.click();
                          }
                        } catch (err: any) {
                          alert('Erro ao emitir laudo: ' + err.message);
                        }
                      }}
                      className="flex-1 py-2 rounded-xl border border-amber-400 bg-amber-950 hover:bg-amber-900 text-amber-200 text-xs font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
                    >
                      📄 EMITIR & BAIXAR LAUDO TÉCNICO
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: GERENCIADOR DE PROCESSOS */}
          {activeTab === 'processos' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-cyan-500/40 bg-cyan-950/30 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm mb-0.5">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>Gerenciador de Processos Ativos</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Processos com maior consumo de memória física. Itens críticos do Windows são protegidos contra encerramento.
                  </p>
                </div>
                <button
                  onClick={fetchProcesses}
                  disabled={loadingProcesses}
                  className="px-3 py-1.5 rounded-lg border border-cyan-400/50 bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 flex items-center gap-1.5 text-xs font-bold transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingProcesses ? 'animate-spin' : ''}`} />
                  <span>{loadingProcesses ? 'Atualizando...' : 'Atualizar'}</span>
                </button>
              </div>

              {processesList.length === 0 && !loadingProcesses ? (
                <div className="text-center py-6">
                  <p className="text-slate-400 text-xs mb-3">Nenhum processo carregado na lista.</p>
                  <button
                    onClick={fetchProcesses}
                    className="px-4 py-1.5 rounded-lg border border-cyan-400 bg-cyan-950 text-cyan-300 text-xs font-bold"
                  >
                    Carregar Processos
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {processesList.map((proc) => (
                    <div
                      key={proc.pid}
                      className="p-2.5 rounded-lg border border-purple-500/30 bg-slate-900/60 flex items-center justify-between hover:border-purple-400 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {proc.isCritical ? (
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs truncate max-w-[200px]">
                              {proc.name}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">PID {proc.pid}</span>
                          </div>
                          <span className="text-[10px] text-purple-300/80 font-mono">
                            {proc.memoryMB} MB RAM
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {proc.isCritical ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold border border-emerald-500/40 bg-emerald-950/40 text-emerald-300">
                            PROTEGIDO
                          </span>
                        ) : (
                          <button
                            onClick={() => handleKillProcess(proc)}
                            disabled={killingPid === proc.pid}
                            className="px-2.5 py-1 rounded text-[10px] font-bold border border-rose-500/50 bg-rose-950/50 hover:bg-rose-900 text-rose-300 hover:text-white transition-all disabled:opacity-50"
                          >
                            {killingPid === proc.pid ? 'ENCERRANDO...' : 'FINALIZAR'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: BENCHMARK DO SISTEMA */}
          {activeTab === 'benchmark' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-purple-500/40 bg-purple-950/30 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm mb-0.5">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                    <span>Benchmark de Performance de Hardware</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Bateria de computação aritmética de números primos, SHA-256 e taxa de transferência de memória.
                  </p>
                </div>
                <button
                  onClick={handleRunBench}
                  disabled={runningBench}
                  className="px-3.5 py-1.5 rounded-lg border border-cyan-400 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 flex items-center gap-2 text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50"
                >
                  <Rocket className={`w-3.5 h-3.5 ${runningBench ? 'animate-bounce' : ''}`} />
                  <span>{runningBench ? 'AVALIANDO...' : 'EXECUTAR TESTE'}</span>
                </button>
              </div>

              {benchResult ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl border-2 border-cyan-400/60 bg-gradient-to-r from-cyan-950/40 via-purple-950/40 to-slate-900/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-cyan-300 tracking-widest uppercase">PONTUAÇÃO GERAL</span>
                      <div className="text-3xl font-extrabold font-mono text-cyan-300 mt-0.5 flex items-baseline gap-1.5">
                        <span>{benchResult.score}</span>
                        <span className="text-xs text-slate-400">/ 1000 PONTOS</span>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-400 bg-emerald-950 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.35)]">
                      {benchResult.rating}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-3 rounded-lg border border-purple-500/30 bg-slate-900/60">
                      <span className="text-slate-400 block mb-0.5">CPU SPEED (PRIMOS)</span>
                      <span className="text-cyan-300 font-bold text-sm">{benchResult.cpuSpeedMs} ms</span>
                    </div>
                    <div className="p-3 rounded-lg border border-purple-500/30 bg-slate-900/60">
                      <span className="text-slate-400 block mb-0.5">TAXA HASH SHA-256</span>
                      <span className="text-purple-300 font-bold text-sm">{benchResult.hashesPerSec.toLocaleString('pt-BR')} h/s</span>
                    </div>
                    <div className="p-3 rounded-lg border border-purple-500/30 bg-slate-900/60">
                      <span className="text-slate-400 block mb-0.5">THROUGHPUT DE RAM</span>
                      <span className="text-emerald-400 font-bold text-sm">{benchResult.ramThroughputMBps} MB/s</span>
                    </div>
                    <div className="p-3 rounded-lg border border-purple-500/30 bg-slate-900/60">
                      <span className="text-slate-400 block mb-0.5">DISCO I/O SPEED</span>
                      <span className="text-amber-400 font-bold text-sm">{benchResult.diskThroughputMBps} MB/s</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-purple-500/20 bg-slate-900/40 text-[10px] text-slate-400 flex justify-between">
                    <span>{benchResult.cpuModel}</span>
                    <span className="text-cyan-300">{benchResult.nucleos} Núcleos Virtuais</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-purple-500/30 rounded-xl">
                  <Gauge className="w-10 h-10 text-cyan-400/60 mx-auto mb-2" />
                  <p className="text-slate-300 text-xs font-bold">Nenhum benchmark registrado nesta sessão.</p>
                  <p className="text-slate-500 text-[10px] mt-1">Clique no botão acima para iniciar a avaliação em tempo real.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: DIAGNÓSTICO DE REDE */}
          {activeTab === 'diagnostico_rede' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-cyan-500/40 bg-cyan-950/30 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm mb-0.5">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Diagnóstico Avançado de Conexão & DNS</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Medição de tempo de ida e volta (RTT) para servidores de borda globais e resolução DNS.
                  </p>
                </div>
                <button
                  onClick={handleRunDiag}
                  disabled={runningDiag}
                  className="px-3.5 py-1.5 rounded-lg border border-cyan-400 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 flex items-center gap-2 text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${runningDiag ? 'animate-spin' : ''}`} />
                  <span>{runningDiag ? 'TESTANDO...' : 'TESTAR REDE'}</span>
                </button>
              </div>

              {diagResult ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-cyan-400/50 bg-slate-900/70 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Wifi className={`w-5 h-5 ${diagResult.online ? 'text-emerald-400' : 'text-rose-500'}`} />
                      <div>
                        <span className="text-xs font-bold text-white">STATUS DO ENLACE</span>
                        <p className="text-[10px] text-slate-400">
                          {diagResult.online ? 'Conexão estável com a rede mundial.' : 'Falha na comunicação de borda.'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded text-xs font-bold border ${diagResult.online ? 'border-emerald-500 bg-emerald-950 text-emerald-300' : 'border-rose-500 bg-rose-950 text-rose-300'}`}>
                      {diagResult.online ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="p-3 rounded-lg border border-purple-500/30 bg-slate-900/60">
                      <span className="text-slate-400 block mb-0.5">CLOUDFLARE 1.1.1.1</span>
                      <span className="text-cyan-300 font-bold text-sm">{diagResult.pingCloudflare} ms</span>
                    </div>
                    <div className="p-3 rounded-lg border border-purple-500/30 bg-slate-900/60">
                      <span className="text-slate-400 block mb-0.5">GOOGLE 8.8.8.8</span>
                      <span className="text-cyan-300 font-bold text-sm">{diagResult.pingGoogle} ms</span>
                    </div>
                    <div className="p-3 rounded-lg border border-purple-500/30 bg-slate-900/60">
                      <span className="text-slate-400 block mb-0.5">RESOLUÇÃO DNS</span>
                      <span className="text-purple-300 font-bold text-sm">{diagResult.dnsSpeedMs} ms</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-purple-500/30 bg-slate-900/50 text-[11px] space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Endereço IP Externo (WAN):</span>
                      <span className="text-cyan-300 font-bold">{diagResult.publicIp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Endereço IP Local (LAN):</span>
                      <span className="text-purple-300 font-bold">{diagResult.localIp}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-cyan-500/30 rounded-xl">
                  <Globe className="w-10 h-10 text-cyan-400/60 mx-auto mb-2" />
                  <p className="text-slate-300 text-xs font-bold">Nenhum teste de rede recente.</p>
                  <p className="text-slate-500 text-[10px] mt-1">Clique em "Testar Rede" para medir latência e resolução DNS.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: APLICATIVOS DE INICIALIZAÇÃO (STARTUP) */}
          {activeTab === 'startup' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-purple-500/40 bg-purple-950/30 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm mb-0.5">
                    <Power className="w-4 h-4 text-cyan-400" />
                    <span>Aplicativos que Iniciam com o Windows</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Desative programas pesados para acelerar a inicialização do seu computador em até 60%.
                  </p>
                </div>
                <button
                  onClick={fetchStartupApps}
                  className="px-2.5 py-1 rounded bg-purple-900 border border-purple-400 text-purple-200 text-xs font-bold"
                >
                  Atualizar
                </button>
              </div>

              {loadingStartup ? (
                <div className="text-center py-8 text-cyan-400 animate-pulse">
                  Mapeando programas de inicialização...
                </div>
              ) : startupApps.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  Nenhum programa de inicialização mapeado.
                </div>
              ) : (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {startupApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-3 rounded-xl border border-purple-500/30 bg-slate-900/60 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-white font-bold text-xs truncate">{app.name}</span>
                          <span
                            className={`text-[9px] px-2 py-0.2 rounded font-bold uppercase ${
                              app.impact === 'ALTO'
                                ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                                : app.impact === 'MÉDIO'
                                ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            Impacto {app.impact}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate max-w-[340px] font-mono">
                          {app.command}
                        </p>
                      </div>

                      <button
                        onClick={() => handleToggleStartupApp(app)}
                        disabled={togglingApp === app.name}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shrink-0 ${
                          app.enabled
                            ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:bg-rose-950/60 hover:border-rose-400 hover:text-rose-300'
                            : 'border-slate-700 bg-slate-900 text-slate-500 hover:text-emerald-300 hover:border-emerald-500'
                        }`}
                      >
                        {togglingApp === app.name
                          ? 'ALTERANDO...'
                          : app.enabled
                          ? 'ATIVADO'
                          : 'DESATIVADO'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONSERTO & REPARO DO SISTEMA */}
          {activeTab === 'reparo' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/30">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm mb-1">
                  <Wrench className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span>Suíte de Reparo & Calibração do Windows</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Restaura o catálogo Winsock, purga cache DNS corrompido, limpa relatórios de falhas acumulados do WER e higieniza miniaturas e cache do Explorer.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-cyan-400/50 bg-slate-900/80 flex items-center justify-between">
                <div>
                  <span className="text-white font-bold text-xs block mb-0.5">
                    Executar Bateria de Reparo Imediata
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Operação 100% segura para qualquer computador.
                  </span>
                </div>
                <button
                  onClick={handleRunRepair}
                  disabled={isRepairing}
                  className="px-4 py-2 rounded-xl border border-emerald-400 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.4)] disabled:opacity-50"
                >
                  <Rocket className="w-4 h-4 text-emerald-400" />
                  <span>{isRepairing ? 'REPARANDO...' : 'INICIAR REPARO'}</span>
                </button>
              </div>

              {repairReport && (
                <div className="p-3.5 rounded-xl border border-emerald-500/50 bg-slate-900/90 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{repairReport.resumo}</span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {repairReport.acoesExecutadas.map((acao, idx) => (
                      <div key={idx} className="p-2 rounded bg-slate-950 border border-purple-500/20 flex justify-between items-center text-[10px]">
                        <div>
                          <span className="text-slate-200 font-bold block">{acao.etapa}</span>
                          <span className="text-slate-400">{acao.detalhe}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                          {acao.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COLOCAR NO AR (REDE LOCAL) */}
          {activeTab === 'rede' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/30">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm mb-1">
                  <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>H.E.L.E.N.A. Disponível na Rede Local</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  O servidor está ouvindo em <strong>0.0.0.0:3000</strong>. Qualquer dispositivo (celular, tablet ou outro computador) conectado à mesma rede Wi-Fi pode acessar a H.E.L.E.N.A. em tela cheia!
                </p>
              </div>

              {/* Network Cards */}
              <div className="space-y-3">
                <div className="p-3 rounded-xl border border-purple-500/30 bg-slate-900/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Acesso no seu Celular / Rede Wi-Fi</span>
                    <div className="text-base font-bold text-cyan-300 font-mono mt-0.5">
                      {networkInfo?.networkUrl || 'http://192.168.0.6:3000'}
                    </div>
                  </div>
                  <button
                    onClick={handleCopyNetworkUrl}
                    className="px-3 py-1.5 rounded-lg border border-cyan-400 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
                  </button>
                </div>

                <div className="p-3 rounded-xl border border-purple-500/30 bg-slate-900/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Acesso Local no Próprio PC</span>
                    <div className="text-base font-bold text-purple-200 font-mono mt-0.5">
                      {networkInfo?.localUrl || 'http://localhost:3000'}
                    </div>
                  </div>
                  <a
                    href="http://localhost:3000"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg border border-purple-400/50 bg-purple-950/60 hover:bg-purple-900 text-purple-200 text-xs font-semibold"
                  >
                    Abrir Nova Aba
                  </a>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-purple-500/20 bg-slate-950/70 text-[11px] text-slate-400 space-y-1.5">
                <span className="text-purple-300 font-semibold block">Dica para Celular:</span>
                <p>1. Conecte seu celular na mesma rede Wi-Fi do computador.</p>
                <p>2. Abra o Chrome ou Safari no celular e digite: <strong>{networkInfo?.networkUrl || 'http://192.168.0.6:3000'}</strong></p>
                <p>3. Adicione à tela inicial para ter o HUD em tela cheia como aplicativo!</p>
              </div>
            </div>
          )}

          {/* TAB 5: PERFIL */}
          {activeTab === 'perfil' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-purple-300 uppercase mb-1">Título do Operador</label>
                <input
                  type="text"
                  value={data.usuario.titulo}
                  onChange={(e) => setData({ ...data, usuario: { ...data.usuario, titulo: e.target.value } })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-purple-500/30 text-white outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-[10px] text-purple-300 uppercase mb-1">Nome do Operador</label>
                <input
                  type="text"
                  value={data.usuario.nome}
                  onChange={(e) => setData({ ...data, usuario: { ...data.usuario, nome: e.target.value } })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-purple-500/30 text-white outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-[10px] text-purple-300 uppercase mb-1">Cidade / Região</label>
                <input
                  type="text"
                  value={data.clima.cidade}
                  onChange={(e) => setData({ ...data, clima: { ...data.clima, cidade: e.target.value } })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-purple-500/30 text-white outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          )}

          {/* TAB 6: AGENDA */}
          {activeTab === 'agenda' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400">Compromissos para o Briefing Matinal</span>
                <button
                  type="button"
                  onClick={() => {
                    const newItem = {
                      id: `ag-${Date.now()}`,
                      horario: "10:00",
                      titulo: "Novo Compromisso Estratégico",
                      status: "Confirmado",
                      local: "Estação Local",
                      prioridade: "Alta"
                    };
                    setData({ ...data, agenda: [...data.agenda, newItem] });
                  }}
                  className="px-2 py-1 rounded bg-purple-950 border border-purple-400 text-cyan-300 flex items-center gap-1 text-[11px]"
                >
                  <Plus className="w-3 h-3" /> Adicionar
                </button>
              </div>

              {data.agenda.map((item, idx) => (
                <div key={item.id} className="p-3 rounded-lg border border-purple-500/30 bg-slate-900/60 flex items-center gap-3">
                  <input
                    type="text"
                    value={item.horario}
                    onChange={(e) => {
                      const updated = [...data.agenda];
                      updated[idx].horario = e.target.value;
                      setData({ ...data, agenda: updated });
                    }}
                    className="w-16 px-2 py-1 rounded bg-slate-950 border border-purple-500/40 text-cyan-300 text-center font-bold"
                  />
                  <input
                    type="text"
                    value={item.titulo}
                    onChange={(e) => {
                      const updated = [...data.agenda];
                      updated[idx].titulo = e.target.value;
                      setData({ ...data, agenda: updated });
                    }}
                    className="flex-1 px-2 py-1 rounded bg-slate-950 border border-purple-500/40 text-white"
                  />
                  <button
                    onClick={() => {
                      const updated = data.agenda.filter((_, i) => i !== idx);
                      setData({ ...data, agenda: updated });
                    }}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 7: PRIORIDADES */}
          {activeTab === 'prioridades' && (
            <div className="space-y-3">
              {data.prioridades.map((item, idx) => (
                <div key={item.id} className="p-3 rounded-lg border border-purple-500/30 bg-slate-900/60 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={item.titulo}
                      onChange={(e) => {
                        const updated = [...data.prioridades];
                        updated[idx].titulo = e.target.value;
                        setData({ ...data, prioridades: updated });
                      }}
                      className="flex-1 px-2 py-1 rounded bg-slate-950 border border-purple-500/40 text-white font-semibold"
                    />
                    <select
                      value={item.urgencia}
                      onChange={(e) => {
                        const updated = [...data.prioridades];
                        updated[idx].urgencia = e.target.value;
                        setData({ ...data, prioridades: updated });
                      }}
                      className="px-2 py-1 rounded bg-slate-950 border border-purple-500/40 text-amber-300"
                    >
                      <option value="Crítica">Crítica</option>
                      <option value="Alta">Alta</option>
                      <option value="Média">Média</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    value={item.descricao}
                    onChange={(e) => {
                      const updated = [...data.prioridades];
                      updated[idx].descricao = e.target.value;
                      setData({ ...data, prioridades: updated });
                    }}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-purple-500/20 text-slate-400 text-[11px]"
                  />
                </div>
              ))}
            </div>
          )}

          {/* TAB 8: RAW JSON */}
          {activeTab === 'raw' && (
            <div>
              <textarea
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
                rows={14}
                className="w-full p-3 rounded-lg bg-slate-900 border border-purple-500/30 text-cyan-300 font-mono text-[11px] outline-none"
              />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-purple-500/30 flex justify-between items-center">
          <span className="text-[10px] text-slate-400">Gravado diretamente em dados_pessoais.json</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-purple-500/30 text-slate-300 hover:text-white text-xs"
            >
              Fechar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-1.5 rounded-lg border border-cyan-400 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 hover:text-white text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>SALVO COM SUCESSO!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'SALVANDO...' : 'SALVAR NO PEN DRIVE'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
