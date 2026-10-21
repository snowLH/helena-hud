import React, { useState, useEffect } from 'react';
import type { PersonalData } from '../types';
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
  Bot
} from 'lucide-react';
import { soundSynth } from '../audio/synth';
import { speechController, JARVIS_VOICE_PRESETS } from '../audio/speech';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  personalData: PersonalData | null;
  onSave: (newData: PersonalData) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  personalData,
  onSave
}) => {
  const [data, setData] = useState<PersonalData | null>(null);
  const [activeTab, setActiveTab] = useState<'jarvis_voz' | 'rede' | 'perfil' | 'agenda' | 'prioridades' | 'raw'>('jarvis_voz');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [rawJson, setRawJson] = useState<string>('');

  // J.A.R.V.I.S. Voice state
  const [activePresetId, setActivePresetId] = useState<string>(speechController.activePresetId);
  const [holographicEffect, setHolographicEffect] = useState<boolean>(speechController.holographicEffect);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  // Network state
  const [networkInfo, setNetworkInfo] = useState<{ localUrl: string; networkUrl: string; ip: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    if (personalData) {
      setData(JSON.parse(JSON.stringify(personalData)));
      setRawJson(JSON.stringify(personalData, null, 2));
    }

    setActivePresetId(speechController.activePresetId);
    setHolographicEffect(speechController.holographicEffect);

    // Fetch network info
    fetch('/api/network/info')
      .then(r => r.json())
      .then(info => setNetworkInfo(info))
      .catch(() => {});
  }, [personalData, isOpen]);

  if (!isOpen || !data) return null;

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
        'Bom dia, Comandante. Reconhecimento biométrico confirmado. Sistemas calibrados com protocolo J.A.R.V.I.S.'
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
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      alert('Erro ao salvar JSON. Verifique a sintaxe.');
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
            <span>CENTRAL NEURAL // J.A.R.V.I.S. FEMININA</span>
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
              { id: 'jarvis_voz', label: 'Voz J.A.R.V.I.S.' },
              { id: 'rede', label: 'Colocar no Ar (Rede)' },
              { id: 'perfil', label: 'Perfil' },
              { id: 'agenda', label: 'Agenda' },
              { id: 'prioridades', label: 'Prioridades' },
              { id: 'raw', label: 'JSON Pen Drive' }
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundSynth.playTelemetryBeep();
                setActiveTab(tab.id as any);
              }}
              className={`px-3 py-1 rounded-lg uppercase tracking-wider font-semibold transition-all ${
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
          {/* TAB 1: J.A.R.V.I.S. FEMALE VOICES */}
          {activeTab === 'jarvis_voz' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-cyan-500/50 bg-cyan-950/40 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm mb-1">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>Voz Studio Neural Estilo J.A.R.V.I.S. / F.R.I.D.A.Y.</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Sem a voz mecânica e robótica do Windows. A H.E.L.E.N.A. agora utiliza modelos neurais de estúdio com processamento acústico holográfico, entonação refinada e dicção aveludada.
                </p>
              </div>

              {/* Holographic Acoustic Treatment Toggle */}
              <div className="p-3 rounded-xl border border-purple-500/40 bg-slate-900/70 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-white font-bold text-xs mb-0.5">
                    <Radio className="w-4 h-4 text-purple-400" />
                    <span>Efeito Acústico Holográfico J.A.R.V.I.S.</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Aplica compressão broadcast, reforço de presença (3.4kHz) e ressonância de sala holográfica.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleHolo(!holographicEffect)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                    holographicEffect
                      ? 'border-cyan-400 bg-cyan-950/80 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                      : 'border-slate-700 bg-slate-900 text-slate-500'
                  }`}
                >
                  {holographicEffect ? 'ATIVADO' : 'DESATIVADO'}
                </button>
              </div>

              {/* Presets List */}
              <div className="space-y-2.5">
                <span className="text-[10px] text-purple-300 uppercase tracking-wider block">
                  Modelos de Voz de Estúdio
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
                              RECOMENDADA J.A.R.V.I.S.
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

          {/* TAB 2: COLOCAR NO AR (REDE LOCAL) */}
          {activeTab === 'rede' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/30">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm mb-1">
                  <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>H.E.L.E.N.A. Disponível na Rede Local</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  O servidor está ouvindo em <strong>0.0.0.0:3000</strong>. Qualquer dispositivo (celular, tablet ou outro computador) conectado à mesma rede Wi-Fi ou cabo Ethernet pode acessar a H.E.L.E.N.A. em tela cheia!
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

          {/* TAB 3: PERFIL */}
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

          {/* TAB 4: AGENDA */}
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

          {/* TAB 5: PRIORIDADES */}
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

          {/* TAB 6: RAW JSON */}
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
