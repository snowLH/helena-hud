import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Smartphone,
  QrCode,
  ShieldCheck,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  ExternalLink,
  Copy,
  Check,
  Laptop,
  Power,
  FileText
} from 'lucide-react';
import { soundSynth } from '../audio/synth';

interface MobilePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMobilePreview?: () => void;
}

export const MobilePairingModal: React.FC<MobilePairingModalProps> = ({
  isOpen,
  onClose,
  onOpenMobilePreview
}) => {
  const [activeTab, setActiveTab] = useState<'pair' | 'approvals' | 'devices' | 'desktop'>('pair');
  const [loading, setLoading] = useState<boolean>(false);
  const [pin, setPin] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [networkUrl, setNetworkUrl] = useState<string>('');
  const [devices, setDevices] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Desktop OS Integration State
  const [autoStartEnabled, setAutoStartEnabled] = useState<boolean>(false);
  const [desktopFeedback, setDesktopFeedback] = useState<string>('');

  const fetchPairingStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/mobile/pair/status');
      if (res.ok) {
        const data = await res.json();
        setNetworkUrl(data.networkUrl || 'http://localhost:3000/?mode=mobile');
        setDevices(data.devices || []);
        setPendingApprovals(data.pendingApprovals || []);
        setAuditLogs(data.auditLogs || []);
        if (data.challenge?.active && data.challenge.pin) {
          setPin(data.challenge.pin);
        }
      }
      const autoRes = await fetch('/api/system/autostart');
      if (autoRes.ok) {
        const autoData = await autoRes.json();
        setAutoStartEnabled(Boolean(autoData.enabled));
      }
    } catch (_) {}
  }, []);

  const generateNewChallenge = useCallback(async () => {
    setLoading(true);
    soundSynth.playTelemetryBeep();
    try {
      const res = await fetch('/api/mobile/pair/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setPin(data.pin || '');
        setQrCodeDataUrl(data.qrCodeDataUrl || '');
        if (data.networkUrl) setNetworkUrl(data.networkUrl);
        fetchPairingStatus();
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, [fetchPairingStatus]);

  useEffect(() => {
    if (!isOpen) return;
    fetchPairingStatus();
    if (!pin) {
      generateNewChallenge();
    }
    const interval = setInterval(fetchPairingStatus, 3000);
    return () => clearInterval(interval);
  }, [isOpen, pin, fetchPairingStatus, generateNewChallenge]);

  if (!isOpen) return null;

  const handleRevokeDevice = async (deviceId: string) => {
    soundSynth.playTelemetryBeep();
    try {
      await fetch('/api/mobile/devices/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      });
      fetchPairingStatus();
    } catch (_) {}
  };

  const handleResolveApproval = async (id: string, decision: 'approve' | 'deny') => {
    soundSynth.playBiometricConfirmed();
    try {
      await fetch(`/api/mobile/approval/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
      });
      fetchPairingStatus();
    } catch (_) {}
  };

  const handleToggleAutoStart = async () => {
    const next = !autoStartEnabled;
    try {
      const res = await fetch('/api/system/autostart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: next })
      });
      const data = await res.json();
      if (data.success) {
        setAutoStartEnabled(next);
        setDesktopFeedback(data.message);
      }
    } catch (_) {}
  };

  const handleCreateShortcuts = async () => {
    setDesktopFeedback('Criando atalhos no Windows...');
    try {
      const res = await fetch('/api/system/shortcuts/create', { method: 'POST' });
      const data = await res.json();
      setDesktopFeedback(data.message || 'Atalhos criados com sucesso!');
    } catch (_) {
      setDesktopFeedback('Erro ao criar atalhos.');
    }
  };

  const pendingCount = pendingApprovals.filter(a => a.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md font-mono select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl border-2 border-cyan-500/70 bg-slate-950 p-5 sm:p-6 shadow-[0_0_50px_rgba(0,240,255,0.3)] text-left flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-cyan-500/30 shrink-0">
          <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-sm sm:text-base">
            <Smartphone className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span>CONTROLE MOBILE SEGURO & INTEGRAÇÃO DESKTOP</span>
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 pt-3 pb-2 border-b border-slate-800 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('pair')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pair' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Parear Celular (QR / PIN)</span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'approvals' ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Confirmações ({pendingCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'devices' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Dispositivos ({devices.filter(d => d.status === 'active').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('desktop')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'desktop' ? 'bg-emerald-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Instalador & Windows</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs text-slate-300 pr-1">
          
          {/* TAB 1: QR CODE & PIN PAIRING */}
          {activeTab === 'pair' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
              {/* Left: QR Code Box */}
              <div className="p-5 rounded-2xl border border-cyan-500/40 bg-slate-900/60 flex flex-col items-center text-center space-y-3">
                <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  Escaneie com a Câmera do Celular
                </div>
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code de Pareamento"
                    className="w-48 h-48 rounded-xl border-2 border-cyan-400 p-1 bg-slate-950 shadow-[0_0_25px_rgba(0,240,255,0.25)]"
                  />
                ) : (
                  <div className="w-48 h-48 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
                  </div>
                )}
                <div className="text-[11px] text-slate-400 font-sans">
                  Conecte o celular na mesma rede Wi-Fi deste computador e aponte a câmera.
                </div>
              </div>

              {/* Right: 6-digit PIN & Network Link */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl border-2 border-cyan-500/50 bg-cyan-950/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-cyan-300 font-bold uppercase">
                      Código PIN Temporário (6 Dígitos)
                    </span>
                    <button
                      onClick={generateNewChallenge}
                      disabled={loading}
                      className="text-[11px] text-cyan-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                      <span>Novo PIN</span>
                    </button>
                  </div>
                  <div className="text-3xl font-black tracking-[0.35em] text-white py-2 text-center bg-slate-950 rounded-xl border border-cyan-500/40">
                    {pin || '------'}
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans">
                    Uso único • Expira automaticamente em 5 minutos para sua segurança.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-2">
                  <div className="text-[11px] text-slate-300 font-bold">
                    Endereço Direto na Rede Local:
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 rounded-lg bg-black/60 border border-slate-800 text-cyan-300 text-[11px] select-all truncate">
                      {networkUrl}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(networkUrl);
                        setCopiedUrl(true);
                        setTimeout(() => setCopiedUrl(false), 2000);
                      }}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 cursor-pointer"
                    >
                      {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {onOpenMobilePreview && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenMobilePreview();
                    }}
                    className="w-full py-3 rounded-xl border border-cyan-500/50 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <span>ABRIR E TESTAR INTERFACE MOBILE AGORA</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PENDING APPROVALS (HITL) */}
          {activeTab === 'approvals' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-950/20 text-amber-200 text-xs font-sans">
                <strong>Proteção Human-in-the-Loop:</strong> Nenhuma ação sensível enviada pelo celular é executada sem a sua confirmação explícita nesta tela.
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Nenhuma solicitação remota aguardando confirmação.
                </div>
              ) : (
                pendingApprovals.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-white text-xs flex items-center gap-2">
                        <span>{item.actionLabel}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                          {item.deviceName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        IP: {item.ip} • Status: {item.status.toUpperCase()}
                      </div>
                    </div>

                    {item.status === 'pending' ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleResolveApproval(item.id, 'approve')}
                          className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>APROVAR</span>
                        </button>
                        <button
                          onClick={() => handleResolveApproval(item.id, 'deny')}
                          className="px-3.5 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-black text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>NEGAR</span>
                        </button>
                      </div>
                    ) : (
                      <span className={`text-xs font-bold ${item.status === 'approved' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.status === 'approved' ? '✅ APROVADO' : '❌ NEGADO'}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: PAIRED DEVICES & AUDIT LOG */}
          {activeTab === 'devices' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-bold text-cyan-400 uppercase text-xs">
                  Dispositivos Pareados
                </h4>
                {devices.length === 0 ? (
                  <p className="text-slate-500 py-3">Nenhum celular pareado ainda.</p>
                ) : (
                  devices.map((d) => (
                    <div
                      key={d.deviceId}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{d.deviceName}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            d.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {d.status === 'active' ? 'ATIVO' : 'REVOGADO'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          IP: {d.ip} • Último acesso: {new Date(d.lastActive).toLocaleTimeString('pt-BR')}
                        </div>
                      </div>

                      {d.status === 'active' && (
                        <button
                          onClick={() => handleRevokeDevice(d.deviceId)}
                          className="px-3 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Revogar</span>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <h4 className="font-bold text-slate-400 uppercase text-xs">
                  Registro de Auditoria Recente
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-1.5">
                  {auditLogs.slice(0, 12).map((log) => (
                    <div key={log.id} className="p-2 rounded bg-slate-900/40 border border-slate-800/70 text-[10px] flex items-center justify-between">
                      <div>
                        <span className="text-cyan-300 font-bold">[{log.source}]</span>{' '}
                        <span className="text-white">{log.action}</span> —{' '}
                        <span className="text-slate-400">{log.details}</span>
                      </div>
                      <span className="text-slate-500 shrink-0 ml-2">
                        {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WINDOWS DESKTOP INSTALLATION & AUTOSTART */}
          {activeTab === 'desktop' && (
            <div className="space-y-4">
              {desktopFeedback && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 text-xs">
                  {desktopFeedback}
                </div>
              )}

              <div className="p-4 rounded-xl border border-cyan-500/30 bg-slate-900/60 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-white text-xs flex items-center gap-2">
                    <Power className="w-4 h-4 text-cyan-400" />
                    <span>Iniciar H.E.L.E.N.A. automaticamente com o Windows</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Registra a H.E.L.E.N.A. na chave de inicialização do usuário atual (HKCU\...\Run).
                  </p>
                </div>
                <button
                  onClick={handleToggleAutoStart}
                  className={`px-4 py-2 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                    autoStartEnabled
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {autoStartEnabled ? 'ATIVADO' : 'DESATIVADO'}
                </button>
              </div>

              <div className="p-4 rounded-xl border border-cyan-500/30 bg-slate-900/60 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-white text-xs flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-cyan-400" />
                    <span>Criar Atalhos Nativos (Área de Trabalho e Menu Iniciar)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Gera os atalhos oficiais (.lnk) com o ícone da H.E.L.E.N.A. no seu Windows.
                  </p>
                </div>
                <button
                  onClick={handleCreateShortcuts}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Criar Atalhos Agora
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
