import React, { useEffect, useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  X,
  Radio,
  Sliders,
  History,
  Trash2,
  Play,
  ShieldCheck,
  Monitor,
  Cpu,
  StopCircle
} from 'lucide-react';
import { wakeWordController, type WakeWordStatus } from '../audio/wakeWord';
import { soundSynth } from '../audio/synth';

interface WakeWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (cmd: string) => void;
}

const BENCHMARK_VOICE_COMMANDS = [
  'HELENA, abra o Discord.',
  'HELENA, organize minha pasta de Downloads.',
  'HELENA, verifique o desempenho do meu computador.',
  'HELENA, pesquise sobre inteligência artificial.',
  'HELENA, crie uma pasta chamada Projetos.',
  'HELENA, abra meu projeto no Antigravity.',
  'HELENA, quero desenvolver um aplicativo para organizar meus estudos.'
];

export const WakeWordModal: React.FC<WakeWordModalProps> = ({
  isOpen,
  onClose,
  onExecuteCommand
}) => {
  const [status, setStatus] = useState<WakeWordStatus | null>(null);
  const [desktopMode, setDesktopMode] = useState<'background' | 'hud'>('background');
  const [autoStartEnabled, setAutoStartEnabled] = useState<boolean>(false);
  const [customPhrase, setCustomPhrase] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  const loadAll = async () => {
    const st = await wakeWordController.syncBackendStatus();
    if (st) setStatus(st);
    try {
      const dRes = await fetch('/api/system/desktop-config');
      if (dRes.ok) {
        const dData = await dRes.json();
        setDesktopMode(dData.desktopConfig?.startupMode || 'background');
        setAutoStartEnabled(Boolean(dData.autoStart?.enabled));
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (!isOpen) return;
    loadAll();
    const unsub = wakeWordController.subscribe(() => {
      wakeWordController.syncBackendStatus().then((st) => {
        if (st) setStatus(st);
      });
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const updateWakeConfig = async (patch: Record<string, any>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/wakeword/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      });
      if (res.ok) {
        const updated = await res.json();
        setStatus(updated);
        wakeWordController.syncBackendStatus();
      }
    } catch (_) {}
    setSaving(false);
  };

  const updateDesktopStartup = async (mode: 'background' | 'hud', autoStart: boolean) => {
    setSaving(true);
    try {
      const res = await fetch('/api/system/desktop-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupMode: mode,
          autoStartWindows: autoStart,
          keepAliveOnWindowClose: true,
          minimizeToTray: true
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDesktopMode(data.desktopConfig?.startupMode || mode);
        setAutoStartEnabled(Boolean(data.autoStart?.enabled));
      }
    } catch (_) {}
    setSaving(false);
  };

  const handleCancelListening = async () => {
    soundSynth.playTelemetryBeep(0.7);
    await fetch('/api/wakeword/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'manual_hud_cancel' })
    });
    loadAll();
  };

  const handleClearHistory = async () => {
    await fetch('/api/wakeword/history/clear', { method: 'POST' });
    loadAll();
  };

  const handleTriggerPhrase = async (phrase: string) => {
    soundSynth.playBiometricConfirmed();
    await fetch('/api/wakeword/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: phrase, source: 'wake_word_console', speakInBackground: false })
    });
    onExecuteCommand(phrase);
    onClose();
  };

  const cfg = status?.config || {
    enabled: true,
    wakeWord: 'HELENA',
    sensitivity: 0.75,
    noiseSuppression: true,
    bargeInInterrupt: true,
    selectedDeviceId: 'default',
    playActivationChime: true,
    backgroundAutoSpeak: true
  };

  const listenerBadge = () => {
    const st = status?.listenerState || 'PASSIVE_LISTENING';
    if (!cfg.enabled || st === 'DISABLED') {
      return { label: 'DESATIVADO', color: 'text-red-400 border-red-500/40 bg-red-950/30' };
    }
    if (st === 'AWAITING_COMMAND') {
      return { label: 'AGUARDANDO COMANDO ("HELENA" DETECTADO!)', color: 'text-amber-300 border-amber-400/60 bg-amber-950/40 animate-pulse' };
    }
    if (st === 'PROCESSING_COMMAND') {
      return { label: 'EXECUTANDO COMANDO...', color: 'text-cyan-300 border-cyan-400/60 bg-cyan-950/40 animate-pulse' };
    }
    return { label: 'ESCUTA PASSIVA ATIVA ("HELENA")', color: 'text-emerald-300 border-emerald-500/50 bg-emerald-950/30' };
  };

  const badge = listenerBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-cyan-500/40 bg-[#070b14]/95 text-cyan-50 shadow-[0_0_50px_rgba(0,240,255,0.2)] p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/10">
              <Radio className="h-6 w-6 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wider text-cyan-300 uppercase">
                Ativação por Voz Permanente — Wake Word ("HELENA")
              </h2>
              <p className="text-xs text-cyan-400/70">
                Escuta contínua em segundo plano (Windows SAPI5 + Web Speech) e Modos de Execução Desktop
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-[11px] font-mono border ${badge.color}`}>
              {badge.label}
            </span>
            <button
              onClick={onClose}
              className="rounded-lg border border-cyan-500/30 p-2 text-cyan-400 hover:bg-cyan-500/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          {/* Coluna 1: Controles de Wake Word & Dispositivo */}
          <div className="space-y-4">
            <div className="rounded-xl border border-cyan-500/25 bg-slate-900/60 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {cfg.enabled ? <Mic className="h-5 w-5 text-emerald-400" /> : <MicOff className="h-5 w-5 text-red-400" />}
                  <span className="font-semibold text-sm text-cyan-200">
                    Escuta Permanente ("HELENA")
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancelListening}
                    className="flex items-center gap-1 px-2.5 py-1 rounded border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs hover:bg-amber-500/20"
                    title="Cancelar escuta atual e interromper fala"
                  >
                    <StopCircle className="h-3.5 w-3.5" />
                    Cancelar Escuta
                  </button>
                  <button
                    disabled={saving}
                    onClick={() => updateWakeConfig({ enabled: !cfg.enabled })}
                    className={`px-3 py-1 rounded font-mono text-xs border transition ${
                      cfg.enabled
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                        : 'border-red-400/50 bg-red-500/10 text-red-300'
                    }`}
                  >
                    {cfg.enabled ? 'ATIVO' : 'DESATIVADO'}
                  </button>
                </div>
              </div>

              {/* Sensibilidade */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-cyan-300/80">
                  <span className="flex items-center gap-1">
                    <Sliders className="h-3.5 w-3.5" /> Sensibilidade da Palavra de Ativação
                  </span>
                  <span className="font-mono text-cyan-300">{Math.round((cfg.sensitivity || 0.75) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={Math.round((cfg.sensitivity || 0.75) * 100)}
                  onChange={(e) => updateWakeConfig({ sensitivity: Number(e.target.value) / 100 })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  Valores maiores detectam sussurros à distância; valores menores exigem pronúncia clara de "HELENA".
                </p>
              </div>

              {/* Seleção de Dispositivo de Entrada */}
              <div className="space-y-1">
                <label className="block text-xs text-cyan-300/80">Dispositivo de Entrada de Áudio (Microfone)</label>
                <select
                  value={cfg.selectedDeviceId || 'default'}
                  onChange={(e) => updateWakeConfig({ selectedDeviceId: e.target.value })}
                  className="w-full rounded-lg border border-cyan-500/30 bg-slate-950 px-3 py-2 text-xs text-cyan-100"
                >
                  {(status?.audioDevices || [{ id: 'default', name: 'Microfone Padrão do Sistema (Windows)' }]).map((dev) => (
                    <option key={dev.id} value={dev.id}>
                      {dev.name} ({dev.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggles de Ruído, Barge-In e Chime */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <label className="flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-slate-950/60 p-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(cfg.noiseSuppression)}
                    onChange={(e) => updateWakeConfig({ noiseSuppression: e.target.checked })}
                    className="accent-cyan-400"
                  />
                  <span>Filtro de Ruído Ambiente</span>
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-slate-950/60 p-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(cfg.bargeInInterrupt)}
                    onChange={(e) => updateWakeConfig({ bargeInInterrupt: e.target.checked })}
                    className="accent-cyan-400"
                  />
                  <span>Interromper Fala (Barge-In)</span>
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-slate-950/60 p-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(cfg.playActivationChime)}
                    onChange={(e) => updateWakeConfig({ playActivationChime: e.target.checked })}
                    className="accent-cyan-400"
                  />
                  <span>Sinal Sonoro ("Chime")</span>
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-slate-950/60 p-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(cfg.backgroundAutoSpeak)}
                    onChange={(e) => updateWakeConfig({ backgroundAutoSpeak: e.target.checked })}
                    className="accent-cyan-400"
                  />
                  <span>Voz em 2º Plano (SAPI5)</span>
                </label>
              </div>
            </div>

            {/* Modos de Execução Desktop (Modo 1 vs Modo 2 - Seção 3) */}
            <div className="rounded-xl border border-purple-500/30 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-purple-400" />
                  <span className="font-semibold text-sm text-purple-200">
                    Modos de Operação no Windows (Seção 3)
                  </span>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-purple-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoStartEnabled}
                    onChange={(e) => updateDesktopStartup(desktopMode, e.target.checked)}
                    className="accent-purple-400"
                  />
                  Iniciar com o Windows
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateDesktopStartup('background', autoStartEnabled)}
                  className={`rounded-lg border p-2.5 text-left transition ${
                    desktopMode === 'background'
                      ? 'border-purple-400 bg-purple-500/20 text-purple-100'
                      : 'border-slate-700 bg-slate-950/50 text-slate-400 hover:border-purple-500/40'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center gap-1">
                    <Cpu className="h-3.5 w-3.5 text-purple-300" /> Modo 1: 2º Plano
                  </div>
                  <p className="text-[11px] opacity-80 mt-1">
                    Inicia silenciosamente na Bandeja (--background) com escuta "HELENA" ativa e baixo consumo.
                  </p>
                </button>

                <button
                  onClick={() => updateDesktopStartup('hud', autoStartEnabled)}
                  className={`rounded-lg border p-2.5 text-left transition ${
                    desktopMode === 'hud'
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
                      : 'border-slate-700 bg-slate-950/50 text-slate-400 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center gap-1">
                    <Monitor className="h-3.5 w-3.5 text-cyan-300" /> Modo 2: HUD + 3D
                  </div>
                  <p className="text-[11px] opacity-80 mt-1">
                    Abre a interface completa (HUD + Escritório 3D). Fechar a janela mantém a HELENA ativa na bandeja.
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Coluna 2: Benchmark de Comandos de Voz (Seção 4) & Histórico */}
          <div className="space-y-4">
            <div className="rounded-xl border border-cyan-500/25 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-cyan-200 flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-cyan-400" />
                  Comandos de Voz Diretos ("HELENA, ...")
                </span>
                <span className="text-[11px] text-cyan-400/70 font-mono">Clique para disparar ou fale no microfone</span>
              </div>

              <div className="space-y-1.5">
                {BENCHMARK_VOICE_COMMANDS.map((phrase, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTriggerPhrase(phrase)}
                    className="w-full flex items-center justify-between rounded-lg border border-cyan-500/20 bg-slate-950/80 px-3 py-2 text-left text-xs text-cyan-100 hover:border-cyan-400 hover:bg-cyan-500/15 transition"
                  >
                    <span className="font-mono">{phrase}</span>
                    <Play className="h-3.5 w-3.5 text-cyan-400 shrink-0 ml-2" />
                  </button>
                ))}
              </div>

              {/* Simulador de frase personalizada */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={customPhrase}
                  onChange={(e) => setCustomPhrase(e.target.value)}
                  placeholder='Ex: "HELENA, crie uma pasta chamada Estudos"'
                  className="flex-1 rounded-lg border border-cyan-500/30 bg-slate-950 px-3 py-1.5 text-xs text-cyan-100"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customPhrase.trim()) {
                      handleTriggerPhrase(customPhrase.trim());
                    }
                  }}
                />
                <button
                  onClick={() => customPhrase.trim() && handleTriggerPhrase(customPhrase.trim())}
                  className="rounded-lg border border-cyan-400/50 bg-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/30"
                >
                  Disparar
                </button>
              </div>
            </div>

            {/* Histórico de Comandos por Voz */}
            <div className="rounded-xl border border-cyan-500/25 bg-slate-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-cyan-200 flex items-center gap-2">
                  <History className="h-4 w-4 text-cyan-400" />
                  Histórico de Comandos por Voz ({status?.history?.length || 0})
                </span>
                <button
                  onClick={handleClearHistory}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Limpar
                </button>
              </div>

              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                {(!status?.history || status.history.length === 0) ? (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    Nenhum comando de voz registrado ainda. Diga "HELENA, ..." ou clique em um comando acima.
                  </p>
                ) : (
                  status.history.slice(0, 12).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-slate-800 bg-slate-950/70 p-2 text-xs"
                    >
                      <div className="flex justify-between text-[11px] text-cyan-400 font-mono">
                        <span>"{item.rawTranscript}"</span>
                        <span>{new Date(item.timestamp).toLocaleTimeString('pt-BR')}</span>
                      </div>
                      <div className="text-slate-300 mt-0.5 line-clamp-2">
                        → {item.responseSummary}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-4 flex items-center justify-between border-t border-cyan-500/20 pt-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>
              Daemon SAPI5 Windows: <strong className="text-emerald-300">{status?.daemonRunning ? 'Conectado em 2º Plano' : 'Modo Web Speech Ativo'}</strong>
            </span>
          </div>
          <span>Diga "HELENA, pare" a qualquer momento para interromper a fala imediatamente.</span>
        </div>
      </div>
    </div>
  );
};
