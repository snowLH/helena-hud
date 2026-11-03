import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Smartphone,
  ShieldCheck,
  Lock,
  Cpu,
  HardDrive,
  Activity,
  Battery,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Terminal,
  Play,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  LogOut,
  MessageSquare,
  Zap,
  Bell,
  Layers,
  Laptop
} from 'lucide-react';
import { speechController } from '../audio/speech';
import { soundSynth } from '../audio/synth';

interface MobileControllerViewProps {
  onExitMobileMode?: () => void;
}

type MobileTab = 'chat' | 'telemetry' | 'commands' | 'activity';

export const MobileControllerView: React.FC<MobileControllerViewProps> = ({ onExitMobileMode }) => {
  // Authentication State
  const [sessionToken, setSessionToken] = useState<string>(() => localStorage.getItem('helena_mobile_token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [pinInput, setPinInput] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('pin') || '';
  });
  const [deviceNameInput, setDeviceNameInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [deviceInfo, setDeviceInfo] = useState<{ deviceId: string; deviceName: string; ip: string } | null>(null);

  // Navigation & UI
  const [activeTab, setActiveTab] = useState<MobileTab>('chat');
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);

  // Telemetry & PC State
  const [pcConnected, setPcConnected] = useState<boolean>(false);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [ecosystemState, setEcosystemState] = useState<any>(null);

  // Chat State
  const [chatInput, setChatInput] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: string; cardTitle?: string }>>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Remote Action Feedback
  const [actionStatusMsg, setActionStatusMsg] = useState<string>('');

  // Verify existing token on mount
  const verifySession = useCallback(async (tokenToVerify: string) => {
    if (!tokenToVerify) {
      setIsAuthenticated(false);
      setAuthChecking(false);
      return;
    }
    try {
      const res = await fetch('/api/mobile/session/verify', {
        headers: { 'x-helena-device-token': tokenToVerify }
      });
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(true);
        setDeviceInfo(data.device);
        setPcConnected(true);
      } else {
        localStorage.removeItem('helena_mobile_token');
        setSessionToken('');
        setIsAuthenticated(false);
      }
    } catch (_) {
      setPcConnected(false);
    } finally {
      setAuthChecking(false);
    }
  }, []);

  useEffect(() => {
    verifySession(sessionToken);
  }, [sessionToken, verifySession]);

  // Poll telemetry when authenticated
  const fetchMobileTelemetry = useCallback(async () => {
    if (!sessionToken || !isAuthenticated) return;
    try {
      const res = await fetch('/api/mobile/telemetry', {
        headers: { 'x-helena-device-token': sessionToken }
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('helena_mobile_token');
        setSessionToken('');
        setIsAuthenticated(false);
        setAuthError('Sessão revogada ou expirada pelo computador principal.');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
        setPcConnected(true);
        if (Array.isArray(data.recentHistory) && messages.length === 0) {
          setMessages(data.recentHistory);
        }
      }
      try {
        const ecoRes = await fetch('/api/ecosystem/state');
        if (ecoRes.ok) {
          setEcosystemState(await ecoRes.json());
        }
      } catch (_) {}
    } catch (_) {
      setPcConnected(false);
    }
  }, [sessionToken, isAuthenticated, messages.length]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchMobileTelemetry();
    const interval = setInterval(fetchMobileTelemetry, 3500);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchMobileTelemetry]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Pairing Submit
  const handlePairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!pinInput || pinInput.trim().length < 6) {
      setAuthError('Digite o código PIN de 6 dígitos gerado no computador.');
      return;
    }

    try {
      const res = await fetch('/api/mobile/pair/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: pinInput.trim(),
          deviceName: deviceNameInput.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.error || 'Falha no pareamento. Verifique o código PIN.');
        return;
      }

      localStorage.setItem('helena_mobile_token', data.sessionToken);
      setSessionToken(data.sessionToken);
      setDeviceInfo({
        deviceId: data.deviceId,
        deviceName: data.deviceName,
        ip: 'Rede Local'
      });
      setIsAuthenticated(true);
      soundSynth.playBiometricConfirmed();
    } catch (err: any) {
      setAuthError('Erro de conexão com o computador: ' + (err.message || 'Verifique o Wi-Fi.'));
    }
  };

  // Handle Logout / End Session
  const handleLogout = async () => {
    if (deviceInfo?.deviceId && sessionToken) {
      try {
        await fetch('/api/mobile/devices/revoke', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-helena-device-token': sessionToken
          },
          body: JSON.stringify({ deviceId: deviceInfo.deviceId })
        });
      } catch (_) {}
    }
    localStorage.removeItem('helena_mobile_token');
    setSessionToken('');
    setIsAuthenticated(false);
    setDeviceInfo(null);
  };

  // Send message to HELENA Brain
  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = (textOverride ?? chatInput).trim();
    if (!textToSend || isSending) return;

    setChatInput('');
    setIsSending(true);

    const userMsg = {
      id: 'm-u-' + Date.now(),
      role: 'user' as const,
      content: textToSend,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch('/api/helena/brain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-helena-device-token': sessionToken
        },
        body: JSON.stringify({ command: textToSend })
      });
      if (res.ok) {
        const data = await res.json();
        const card = data.cartoes?.[0];
        const replyText = card?.fala || card?.texto || 'Comando processado com sucesso.';
        const assistantMsg = {
          id: 'm-a-' + Date.now(),
          role: 'assistant' as const,
          content: replyText,
          cardTitle: card?.titulo,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMsg]);
        if (soundOn) {
          speechController.speak(replyText);
        }
        fetchMobileTelemetry();
      }
    } catch (_) {
      setMessages(prev => [
        ...prev,
        {
          id: 'm-err-' + Date.now(),
          role: 'assistant',
          content: 'Erro de comunicação com o computador. Verifique se a H.E.L.E.N.A. está aberta no PC.',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Voice Input on Mobile (Web Speech Recognition)
  const toggleVoiceListen = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Reconhecimento de voz não suportado neste navegador mobile.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        handleSendMessage(transcript);
      }
    };

    recognition.start();
  };

  // Trigger Remote Action on PC
  const sendRemoteAction = async (actionType: string, actionLabel: string, payload: any = {}) => {
    setActionStatusMsg(`Enviando comando: ${actionLabel}...`);
    try {
      const res = await fetch('/api/mobile/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-helena-device-token': sessionToken
        },
        body: JSON.stringify({ actionType, actionLabel, payload })
      });
      const data = await res.json();
      if (data.requiresApproval) {
        setActionStatusMsg(`🔒 Aguardando confirmação na tela do computador para: "${actionLabel}"`);
      } else if (data.success) {
        setActionStatusMsg(`✅ Executado no PC: ${actionLabel}`);
      } else {
        setActionStatusMsg(`❌ Erro: ${data.error || 'Falha ao executar'}`);
      }
      fetchMobileTelemetry();
    } catch (err: any) {
      setActionStatusMsg(`❌ Falha de conexão: ${err.message}`);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 text-cyan-300 flex flex-col items-center justify-center p-6 font-mono">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mb-3" />
        <p className="text-xs tracking-widest uppercase">Verificando Sessão Criptografada...</p>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // TELA DE PAREAMENTO INICIAL (BLOQUEIO DE SEGURANÇA OBRIGATÓRIO)
  // -------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-5 font-mono select-none">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-sm tracking-wider text-white">H.E.L.E.N.A. MOBILE</span>
          </div>
          {onExitMobileMode && (
            <button
              onClick={onExitMobileMode}
              className="text-xs text-slate-400 hover:text-cyan-300 underline cursor-pointer"
            >
              Voltar ao Desktop
            </button>
          )}
        </div>

        <div className="my-auto max-w-sm w-full mx-auto space-y-6 py-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border-2 border-cyan-400/60 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(0,240,255,0.25)]">
              <Lock className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-xl font-black text-white tracking-wide pt-2">
              PAREAMENTO DE SEGURANÇA
            </h1>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Para controlar seu computador pelo celular, abra a H.E.L.E.N.A. no PC, clique em <strong className="text-cyan-300">[ 📱 CELULAR ]</strong> e digite o código temporário de 6 dígitos abaixo.
            </p>
          </div>

          <form onSubmit={handlePairSubmit} className="space-y-4 bg-slate-900/70 border border-cyan-500/30 rounded-2xl p-5 shadow-xl">
            <div>
              <label className="block text-[11px] text-cyan-300 font-bold mb-1.5 uppercase">
                Código PIN Temporário (6 Dígitos)
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center text-2xl tracking-[0.4em] font-black py-3 rounded-xl bg-slate-950 border-2 border-cyan-500/50 text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1 uppercase">
                Nome deste Dispositivo (Opcional)
              </label>
              <input
                type="text"
                value={deviceNameInput}
                onChange={(e) => setDeviceNameInput(e.target.value)}
                placeholder="Ex: Meu Smartphone"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2 font-sans">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs tracking-wider uppercase shadow-[0_0_25px_rgba(0,240,255,0.4)] cursor-pointer transition-all"
            >
              🔒 CONECTAR E AUTORIZAR DISPOSITIVO
            </button>
          </form>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 text-[11px] text-slate-400 space-y-1 font-sans">
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Protocolo de Segurança Ativo</span>
            </div>
            <p>
              Nenhum dispositivo na rede local tem acesso sem pareamento. Ações administrativas exigem confirmação na tela do computador.
            </p>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-600">
          H.E.L.E.N.A. Mobile Remote Link • Criptografia SHA-256
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // PAINEL MOBILE AUTENTICADO
  // -------------------------------------------------------------------------
  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden font-sans select-none">
      {/* Top Mobile Status Bar */}
      <header className="px-4 py-3 bg-slate-900/90 border-b border-cyan-500/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${pcConnected ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-rose-500'}`} />
          <div>
            <div className="font-mono font-bold text-xs text-white flex items-center gap-1.5">
              <span>{telemetry?.hostname || 'COMPUTADOR HOST'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                {pcConnected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              {deviceInfo?.deviceName || 'Dispositivo Pareado'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = !soundOn;
              setSoundOn(next);
              speechController.enabled = next;
              if (!next) speechController.stop();
            }}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 cursor-pointer"
            title="Alternar Voz"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>

          {onExitMobileMode && (
            <button
              onClick={onExitMobileMode}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
              title="Modo Desktop"
            >
              <Laptop className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 cursor-pointer"
            title="Encerrar Sessão"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Quick Telemetry Strip */}
      {telemetry && (
        <div className="px-4 py-1.5 bg-slate-950 border-b border-slate-800/80 grid grid-cols-4 gap-2 text-center font-mono text-[10px] shrink-0">
          <div className="bg-slate-900/80 rounded py-1 border border-slate-800">
            <span className="text-slate-400 block">CPU</span>
            <span className="text-cyan-300 font-bold">{telemetry.cpu?.loadPercent || 0}%</span>
          </div>
          <div className="bg-slate-900/80 rounded py-1 border border-slate-800">
            <span className="text-slate-400 block">RAM</span>
            <span className="text-purple-300 font-bold">{telemetry.ram?.usagePercent || 0}%</span>
          </div>
          <div className="bg-slate-900/80 rounded py-1 border border-slate-800">
            <span className="text-slate-400 block">DISCO C:</span>
            <span className="text-emerald-300 font-bold">{telemetry.disks?.[0]?.freeGB || 0}GB</span>
          </div>
          <div className="bg-slate-900/80 rounded py-1 border border-slate-800">
            <span className="text-slate-400 block">BATERIA</span>
            <span className="text-amber-300 font-bold">
              {telemetry.battery?.present ? `${telemetry.battery.percentage}%` : 'AC'}
            </span>
          </div>
        </div>
      )}

      {/* Main Content Area by Active Tab */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* TAB 1: CONVERSAR COM A HELENA */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full justify-between space-y-3">
            {/* Quick Suggestion Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
              {[
                'Por que meu computador está lento?',
                'Qual o status do sistema?',
                'Quais processos estão consumindo mais RAM?',
                'Minimizar todas as janelas',
                'Abrir calculadora no PC'
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="px-3 py-1.5 rounded-full bg-slate-900 border border-cyan-500/30 text-cyan-200 text-xs whitespace-nowrap font-mono hover:bg-cyan-950/50 cursor-pointer shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {messages.length === 0 ? (
                <div className="text-center py-12 space-y-2 text-slate-500">
                  <MessageSquare className="w-8 h-8 mx-auto text-cyan-500/40" />
                  <p className="text-xs font-mono">
                    Conexão estabelecida com {telemetry?.hostname || 'seu computador'}. Envie uma mensagem ou comando de voz para a H.E.L.E.N.A.
                  </p>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-cyan-500 text-slate-950 font-semibold rounded-br-none'
                          : 'bg-slate-900 border border-cyan-500/30 text-slate-200 rounded-bl-none'
                      }`}
                    >
                      {m.cardTitle && (
                        <div className="text-[10px] font-mono font-bold text-cyan-400 mb-1 uppercase">
                          {m.cardTitle}
                        </div>
                      )}
                      <div className="whitespace-pre-line">{m.content}</div>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="pt-2 border-t border-slate-800 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleVoiceListen}
                className={`p-3 rounded-xl border transition-all cursor-pointer shrink-0 ${
                  isListening
                    ? 'bg-rose-500 border-rose-400 text-white animate-pulse'
                    : 'bg-slate-900 border-cyan-500/40 text-cyan-400'
                }`}
                title="Enviar por Voz"
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Converse ou envie comando para o PC..."
                className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
              />

              <button
                type="button"
                disabled={isSending || !chatInput.trim()}
                onClick={() => handleSendMessage()}
                className="p-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold cursor-pointer shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: TELEMETRIA E ESTADO DO COMPUTADOR */}
        {activeTab === 'telemetry' && telemetry && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" /> PROCESSADOR (CPU)
                </span>
                <span className="text-xs font-mono font-bold text-white">{telemetry.cpu?.loadPercent || 0}%</span>
              </div>
              <p className="text-xs text-slate-300 font-mono">{telemetry.cpu?.model}</p>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, telemetry.cpu?.loadPercent || 5)}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Núcleos: {telemetry.cpu?.physicalCores} Físicos / {telemetry.cpu?.logicalProcessors} Lógicos • Uptime: {telemetry.uptimeHours}h
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4" /> MEMÓRIA RAM FÍSICA
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  {telemetry.ram?.usedGB} / {telemetry.ram?.totalGB} GB ({telemetry.ram?.usagePercent}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, telemetry.ram?.usagePercent || 0)}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Memória Livre Disponível: {telemetry.ram?.freeGB} GB
              </div>
            </div>

            {/* Top Processes on PC */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="text-xs font-mono font-bold text-amber-400 flex items-center justify-between">
                <span>PROCESSOS MAIS PESADOS NO PC</span>
                <span className="text-[10px] text-slate-400">Top RAM</span>
              </div>
              <div className="space-y-2">
                {(telemetry.topProcesses || []).map((proc: any) => (
                  <div
                    key={proc.pid}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono"
                  >
                    <div>
                      <div className="text-white font-bold">{proc.name}</div>
                      <div className="text-[10px] text-slate-500">PID: {proc.pid} • {proc.memoryMB} MB</div>
                    </div>
                    <button
                      onClick={() => sendRemoteAction('kill_process', `Encerrar processo ${proc.name} (PID ${proc.pid})`, { pid: proc.pid, name: proc.name })}
                      className="px-2.5 py-1 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-300 text-[10px] hover:bg-rose-900 cursor-pointer"
                    >
                      Encerrar (Pedir Permissão)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COMANDOS E CONTROLE DO PC */}
        {activeTab === 'commands' && (
          <div className="space-y-4">
            {actionStatusMsg && (
              <div className="p-3 rounded-xl bg-cyan-950/50 border border-cyan-500/40 text-cyan-200 text-xs font-mono">
                {actionStatusMsg}
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase">
                Abertura Rápida de Programas no PC
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'calc', label: 'Calculadora' },
                  { id: 'notepad', label: 'Bloco de Notas' },
                  { id: 'explorer', label: 'Windows Explorer' },
                  { id: 'taskmgr', label: 'Gerenciador Tarefas' },
                  { id: 'cmd', label: 'Prompt de Comando' },
                  { id: 'ms-settings:', label: 'Configurações Windows' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => sendRemoteAction('open_app', `Abrir ${item.label}`, { app: item.id })}
                    className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 text-left font-mono text-xs text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>{item.label}</span>
                    <Play className="w-3.5 h-3.5 text-cyan-400" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold text-purple-400 uppercase">
                Controle de Janelas da Área de Trabalho
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => sendRemoteAction('minimize_windows', 'Minimizar Todas as Janelas')}
                  className="p-3.5 rounded-xl bg-slate-900 border border-purple-500/30 text-left font-mono text-xs text-purple-200 cursor-pointer"
                >
                  Minimizar Janelas (Desktop)
                </button>
                <button
                  onClick={() => sendRemoteAction('restore_windows', 'Restaurar Janelas na Tela')}
                  className="p-3.5 rounded-xl bg-slate-900 border border-purple-500/30 text-left font-mono text-xs text-purple-200 cursor-pointer"
                >
                  Restaurar Janelas
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold text-amber-400 uppercase">
                Manutenção Sensível (Exige Confirmação no PC)
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => sendRemoteAction('optimize_pc', 'Otimizar PC e Limpar Temporários')}
                  className="w-full p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-left font-mono text-xs text-amber-200 flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="font-bold">⚡ Executar Otimização & Flush DNS</div>
                    <div className="text-[10px] text-amber-300/70">Solicita aprovação na tela do computador</div>
                  </div>
                  <Lock className="w-4 h-4 text-amber-400" />
                </button>

                <button
                  onClick={() => sendRemoteAction('golden_repair', 'Executar Sequência Dourada (DISM + SFC)')}
                  className="w-full p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-left font-mono text-xs text-emerald-200 flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="font-bold">🛡️ Sequência Dourada de Reparo Windows</div>
                    <div className="text-[10px] text-emerald-300/70">Solicita aprovação na tela do computador</div>
                  </div>
                  <Lock className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ALERTAS E FILA DE APROVAÇÃO */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            {/* Multi-Agent & 3D Office Live Status + Interrupt Button (Section 12) */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> AGENTES & ESCRITÓRIO 3D ({ecosystemState?.officeControl?.activeAgents || 0}/5 ATIVOS)
                </h3>
                <button
                  onClick={async () => {
                    speechController.stop();
                    await fetch('/api/wakeword/cancel', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ reason: 'mobile_remote_interrupt' })
                    });
                    setActionStatusMsg('Escuta e fala interrompidas remotamente.');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 text-[10px] font-mono font-bold cursor-pointer"
                >
                  ⏹ INTERROMPER
                </button>
              </div>
              <div className="space-y-1.5">
                {Object.values(ecosystemState?.agents || {}).map((ag: any) => (
                  <div
                    key={ag.id}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="font-bold text-white">{ag.shortName || ag.name}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                        {ag.statusText || ag.role}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300">
                      {ag.status?.toUpperCase()} • {ag.progress || 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <h3 className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                <Bell className="w-4 h-4" /> ALERTAS E DIAGNÓSTICO ATUAL
              </h3>
              <ul className="space-y-2 text-xs text-slate-300 font-mono">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Arquivos temporários em %TEMP%: {telemetry?.tempFiles?.fileCount || 0} arquivos ({telemetry?.tempFiles?.sizeMB || 0} MB)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Memória RAM: {telemetry?.ram?.usedGB || 0} GB usados de {telemetry?.ram?.totalGB || 0} GB</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h3 className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> SOLICITAÇÕES ENVIADAS AO PC
              </h3>
              {(telemetry?.pendingApprovals || []).length === 0 ? (
                <p className="text-xs text-slate-500 font-mono">Nenhuma solicitação sensível pendente.</p>
              ) : (
                <div className="space-y-2">
                  {(telemetry?.pendingApprovals || []).map((req: any) => (
                    <div key={req.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{req.actionLabel}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' :
                          req.status === 'denied' ? 'bg-rose-500/20 text-rose-300' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>
                          {req.status === 'approved' ? 'APROVADO' : req.status === 'denied' ? 'NEGADO' : 'AGUARDANDO PC'}
                        </span>
                      </div>
                      {req.result?.message && (
                        <div className="text-[11px] text-slate-400">{req.result.message}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Bottom Mobile Navigation Bar */}
      <nav className="grid grid-cols-4 bg-slate-900 border-t border-cyan-500/30 py-2 px-2 shrink-0 font-mono">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-1 py-1 rounded-xl cursor-pointer ${
            activeTab === 'chat' ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-400'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-[10px]">Conversar</span>
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex flex-col items-center gap-1 py-1 rounded-xl cursor-pointer ${
            activeTab === 'telemetry' ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-400'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span className="text-[10px]">Estado PC</span>
        </button>

        <button
          onClick={() => setActiveTab('commands')}
          className={`flex flex-col items-center gap-1 py-1 rounded-xl cursor-pointer ${
            activeTab === 'commands' ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-400'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span className="text-[10px]">Comandos</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex flex-col items-center gap-1 py-1 rounded-xl cursor-pointer ${
            activeTab === 'activity' ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-400'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span className="text-[10px]">Alertas</span>
        </button>
      </nav>
    </div>
  );
};
