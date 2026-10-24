import React, { useState, useEffect } from 'react';
import type { PersonalData, StartupApp, RepairReport } from '../types';
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
  Rocket
} from 'lucide-react';
import { soundSynth } from '../audio/synth';
import { speechController, JARVIS_VOICE_PRESETS } from '../audio/speech';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  personalData: PersonalData | null;
  onSave: (newData: PersonalData) => Promise<void>;
  initialTab?: 'jarvis_voz' | 'startup' | 'reparo' | 'rede' | 'perfil' | 'agenda' | 'prioridades' | 'raw';
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
  const [activeTab, setActiveTab] = useState<'jarvis_voz' | 'startup' | 'reparo' | 'rede' | 'perfil' | 'agenda' | 'prioridades' | 'raw'>(initialTab);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [rawJson, setRawJson] = useState<string>(JSON.stringify(personalData || DEFAULT_FALLBACK_DATA, null, 2));

  // J.A.R.V.I.S. Voice state
  const [activePresetId, setActivePresetId] = useState<string>(speechController.activePresetId);
  const [holographicEffect, setHolographicEffect] = useState<boolean>(speechController.holographicEffect);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

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

    // Fetch startup apps
    fetchStartupApps();
  }, [personalData, isOpen]);

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
        <div className="flex gap-2 my-3 border-b border-purple-500/20 pb-2 text-xs flex-wrap">
          {(
            [
              { id: 'jarvis_voz', label: 'Voz da Helena' },
              { id: 'startup', label: 'Inicialização (Boot)' },
              { id: 'reparo', label: 'Conserto & Reparo' },
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
                setActiveTab(tab.id as any);
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
