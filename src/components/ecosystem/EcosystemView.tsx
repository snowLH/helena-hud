import React, { useEffect, useState, useRef } from 'react';
import {
  Sun,
  Sunset,
  Moon,
  Cpu,
  FolderKanban,
  FileText,
  Send,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
  Undo2,
  X,
  Eye,
  Play,
  ArrowLeft,
  Sliders,
  KeyRound,
  Terminal,
  MessageSquare,
  Cloud,
  Compass,
  Users,
  Monitor,
  Upload,
} from 'lucide-react';
import { ThreeOfficeCanvas, type EcosystemAgent, type DataBeamEvent } from './ThreeOfficeCanvas';
import { AGENT_HOME_NODE } from './WaypointSystem';

interface EcosystemViewProps {
  onBackToHud: () => void;
}

export const EcosystemView: React.FC<EcosystemViewProps> = ({ onBackToHud }) => {
  const [agents, setAgents] = useState<Record<string, EcosystemAgent>>({});
  const [files, setFiles] = useState<any[]>([]);
  const [archivistPlan, setArchivistPlan] = useState<any>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [activeBeam, setActiveBeam] = useState<DataBeamEvent | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'night'>('day');
  const [manualTargetByAgent, setManualTargetByAgent] = useState<Record<string, { target: string; ts: number }>>({});

  // Modals & Tabs
  const [sideTab, setSideTab] = useState<'chat' | 'archivist' | 'ai'>('chat');
  const [showMultiIAModal, setShowMultiIAModal] = useState(false);
  const [showCommandModal, setShowCommandModal] = useState(false);
  const [showFilesDrawer, setShowFilesDrawer] = useState(false);
  const [showOfficeControl, setShowOfficeControl] = useState(false);
  const [officeControl, setOfficeControl] = useState<any>(null);
  const [previewFile, setPreviewFile] = useState<{ file: any; content: string } | null>(null);

  // Chat Input
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Command Modal State
  const [missionPrompt, setMissionPrompt] = useState('');
  const [missionFormat, setMissionFormat] = useState('pdf');
  const [missionImage, setMissionImage] = useState<string | null>(null);
  const [isSubmittingMission, setIsSubmittingMission] = useState(false);

  // Archivist Folder Path
  const [folderPathInput, setFolderPathInput] = useState('');
  const [isScanningFolder, setIsScanningFolder] = useState(false);
  const [isOrganizingFolder, setIsOrganizingFolder] = useState(false);

  // Multi-IA Config State
  const [providerCatalog, setProviderCatalog] = useState<Record<string, any>>({});
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({});
  const [testingAgentId, setTestingAgentId] = useState<string | null>(null);
  const [testResultMsg, setTestResultMsg] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchEcosystemState = async () => {
    try {
      const res = await fetch('/api/ecosystem/state');
      if (!res.ok) return;
      const data = await res.json();
      if (data.agents) setAgents(data.agents);
      if (data.files) setFiles(data.files);
      if (data.officeControl) setOfficeControl(data.officeControl);
      if (data.archivistPlan) {
        setArchivistPlan(data.archivistPlan);
        if (!folderPathInput && data.archivistPlan.targetDir) {
          setFolderPathInput(data.archivistPlan.targetDir);
        }
      }
      if (data.providerCatalog) setProviderCatalog(data.providerCatalog);
    } catch (err) {
      console.error('Erro ao carregar estado do Ecossistema 3D:', err);
    }
  };

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/providers');
      if (!res.ok) return;
      const data = await res.json();
      if (data.providers) setProviderCatalog(data.providers);
      if (data.ollamaModels) setOllamaModels(data.ollamaModels);
    } catch (_) {}
  };

  useEffect(() => {
    fetchEcosystemState();
    fetchProviders();

    // Real-time SSE connection
    const es = new EventSource('/api/ecosystem/stream');
    es.onmessage = (event) => {
      try {
        const packet = JSON.parse(event.data);
        if (packet.event === 'init' && packet.data) {
          if (packet.data.agents) setAgents(packet.data.agents);
          if (packet.data.files) setFiles(packet.data.files);
          if (packet.data.officeControl) setOfficeControl(packet.data.officeControl);
          if (packet.data.archivistPlan) setArchivistPlan(packet.data.archivistPlan);
        } else if (packet.event === 'agents:update' && packet.data) {
          setAgents(packet.data);
        } else if (packet.event === 'office:control' && packet.data) {
          setOfficeControl(packet.data);
        } else if (packet.event === 'files:new' && packet.data) {
          setFiles((prev) => [packet.data, ...prev.filter((f) => f.id !== packet.data.id)]);
        } else if (packet.event === 'archivist:plan' && packet.data) {
          setArchivistPlan(packet.data);
        } else if (packet.event === 'agent:beam' && packet.data) {
          setActiveBeam({ ...packet.data, timestamp: Date.now() });
          setTimeout(() => {
            setActiveBeam((curr) => (curr?.id === packet.data.id ? null : curr));
          }, 4200);
        }
      } catch (_) {}
    };

    return () => {
      es.close();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedAgentId, agents]);

  const selectedAgent = selectedAgentId ? agents[selectedAgentId] : null;

  // Send Direct Message to Selected Agent
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedAgentId || !chatInput.trim() || isSendingChat) return;

    const msg = chatInput.trim();
    setChatInput('');
    setIsSendingChat(true);

    try {
      await fetch(`/api/agents/${selectedAgentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      await fetchEcosystemState();
    } catch (err) {
      console.error('Erro ao enviar mensagem ao agente:', err);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Launch Multi-Agent Pipeline Mission
  const handleLaunchMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!missionPrompt.trim() || isSubmittingMission) return;

    setIsSubmittingMission(true);
    try {
      await fetch('/api/tasks/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: missionPrompt,
          format: missionFormat,
          imageBase64: missionImage,
        }),
      });
      setShowCommandModal(false);
      setMissionPrompt('');
      setMissionImage(null);
      setSelectedAgentId('orchestrator');
    } catch (err) {
      console.error('Erro ao disparar missão:', err);
    } finally {
      setIsSubmittingMission(false);
    }
  };

  // Handle Ctrl+V Image Paste inside Command Modal
  const handleCommandPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setMissionImage(ev.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  // Archivist Actions
  const handleScanFolder = async () => {
    setIsScanningFolder(true);
    try {
      const res = await fetch('/api/archivist/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetDir: folderPathInput || undefined }),
      });
      const data = await res.json();
      if (data.plan) {
        setArchivistPlan(data.plan);
        setFolderPathInput(data.plan.targetDir);
      }
    } catch (err) {
      console.error('Erro ao escanear pasta:', err);
    } finally {
      setIsScanningFolder(false);
    }
  };

  const handleExecuteOrganize = async () => {
    setIsOrganizingFolder(true);
    try {
      await fetch('/api/archivist/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetDir: folderPathInput || undefined }),
      });
      await fetchEcosystemState();
    } catch (err) {
      console.error('Erro ao organizar pasta:', err);
    } finally {
      setIsOrganizingFolder(false);
    }
  };

  const handleUndoOrganize = async () => {
    try {
      await fetch('/api/archivist/undo', { method: 'POST' });
      await fetchEcosystemState();
    } catch (err) {
      console.error('Erro ao desfazer organização:', err);
    }
  };

  const handleResetSandbox = async () => {
    try {
      const res = await fetch('/api/archivist/reset-sandbox', { method: 'POST' });
      const data = await res.json();
      if (data.plan) {
        setArchivistPlan(data.plan);
        setFolderPathInput(data.plan.targetDir);
      }
    } catch (err) {
      console.error('Erro ao recriar pasta de demonstração:', err);
    }
  };

  // Preview or Open Deliverable File
  const handlePreviewFile = async (file: any) => {
    try {
      const res = await fetch(`/api/files/preview?path=${encodeURIComponent(file.path)}`);
      const data = await res.json();
      setPreviewFile({ file, content: data.content || '' });
    } catch (_) {}
  };

  const handleOpenInExplorer = async (targetPath?: string) => {
    try {
      await fetch('/api/files/open-explorer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPath }),
      });
    } catch (_) {}
  };

  // Update Agent Provider / Model / API Key
  const handleSaveAgentConfig = async (agentId: string, provider: string, model: string, apiKey?: string) => {
    try {
      await fetch('/api/agents/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, provider, model, apiKey }),
      });
      await fetchEcosystemState();
      await fetchProviders();
    } catch (_) {}
  };

  const handleTestAgentConnection = async (agentId: string) => {
    setTestingAgentId(agentId);
    setTestResultMsg(null);
    try {
      const res = await fetch('/api/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestResultMsg(`✅ [${agentId.toUpperCase()}] Conexão OK (${data.provider} / ${data.model}): "${data.reply}"`);
      } else {
        setTestResultMsg(`❌ [${agentId.toUpperCase()}] Falha (${data.errorCode}): ${data.message}`);
      }
    } catch (err: any) {
      setTestResultMsg(`❌ Erro de rede: ${err.message}`);
    } finally {
      setTestingAgentId(null);
    }
  };

  // Command 3D Avatar to walk to a specific waypoint in real time
  const commandAvatarWalk = (agentId: string, waypointKey: string) => {
    setManualTargetByAgent((prev) => ({
      ...prev,
      [agentId]: { target: waypointKey, ts: Date.now() },
    }));
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* 1. Full-Screen 60 FPS Three.js Mountain Summit Studio Office */}
      <ThreeOfficeCanvas
        agents={agents}
        selectedAgentId={selectedAgentId}
        onSelectAgent={(id) => {
          setSelectedAgentId(id);
          if (id === 'archivist') setSideTab('archivist');
          else setSideTab('chat');
        }}
        activeBeam={activeBeam}
        timeOfDay={timeOfDay}
        manualTargetByAgent={manualTargetByAgent}
      />

      {/* 2. Floating Top Sub-Toolbar inside the 3D Viewport */}
      <div className="pointer-events-none absolute top-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back to HUD & Studio Title Badge */}
        <div className="pointer-events-auto flex items-center gap-2.5 bg-slate-950/85 border border-cyan-500/30 rounded-2xl px-3.5 py-2 shadow-xl backdrop-blur-md">
          <button
            onClick={onBackToHud}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            title="Voltar ao Painel de Controle HUD Clássico"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Painel HUD</span>
          </button>

          <div className="h-5 w-px bg-slate-800" />

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold tracking-wider uppercase text-white">
                QG 3D H.E.L.E.N.A. — Mountain Summit Studio
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Clique em qualquer Agente ou Mesa 3D para inspecionar • Arraste para girar a câmera
            </p>
          </div>
        </div>

        {/* Center/Right: Time of Day Switcher & Quick Action Buttons */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/85 border border-slate-800 rounded-2xl px-3 py-1.5 shadow-xl backdrop-blur-md">
          {/* Time of Day Controls */}
          <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800">
            <button
              onClick={() => setTimeOfDay('day')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                timeOfDay === 'day'
                  ? 'bg-sky-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Dia</span>
            </button>
            <button
              onClick={() => setTimeOfDay('sunset')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                timeOfDay === 'sunset'
                  ? 'bg-orange-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sunset className="w-3.5 h-3.5" />
              <span> Pôr do Sol</span>
            </button>
            <button
              onClick={() => setTimeOfDay('night')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                timeOfDay === 'night'
                  ? 'bg-indigo-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Noite</span>
            </button>
          </div>

          <button
            onClick={() => setShowOfficeControl((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>
              Painel do Escritório ({officeControl?.activeAgents || 0}/{officeControl?.totalAgents || 5})
            </span>
          </button>

          <button
            onClick={() => setShowMultiIAModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Central Multi-IA</span>
          </button>

          <button
            onClick={() => {
              setSelectedAgentId('archivist');
              setSideTab('archivist');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Organizar PC</span>
          </button>

          <button
            onClick={() => setShowFilesDrawer((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/40 text-purple-300 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Entregas ({files.length})</span>
          </button>
        </div>
      </div>

      {/* 3. Active DataBeam Banner when Agents Collaborate */}
      {activeBeam && (
        <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-amber-500/95 text-slate-950 font-bold text-xs px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{activeBeam.label}</span>
        </div>
      )}

      {/* 4. Right Side Agent Inspection & Real Chat / Archivist Panel */}
      {selectedAgent && (
        <div className="pointer-events-auto absolute top-20 right-4 bottom-24 w-[410px] max-w-[92vw] z-20 bg-slate-950/92 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden">
          {/* Agent Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div
                className="w-3.5 h-10 rounded-full"
                style={{ backgroundColor: selectedAgent.color || '#38bdf8' }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    {selectedAgent.name}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 uppercase">
                    {selectedAgent.provider} • {selectedAgent.model}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {(selectedAgent as any).specialty || selectedAgent.role}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedAgentId(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              title="Fechar Painel e Voltar à Visão Geral"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Agent Real-Time Telemetry: State, Task, Progress, Tools & Results (Section 9) */}
          <div className="px-3.5 py-2.5 bg-slate-950/90 border-b border-slate-800 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">
                Estado: <strong className="text-cyan-300 uppercase">{selectedAgent.status}</strong> —{' '}
                <span className="text-slate-200">{selectedAgent.statusText}</span>
              </span>
              <span className="font-mono text-amber-300">{selectedAgent.progress || 0}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, selectedAgent.progress || 0))}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400 pt-0.5">
              <span className="truncate max-w-[230px]" title="Ferramentas autorizadas e utilizadas pelo agente">
                🛠️ Ferramentas:{' '}
                <strong className="text-slate-200 font-mono">
                  {((selectedAgent as any).toolsUsed?.length
                    ? (selectedAgent as any).toolsUsed
                    : (selectedAgent as any).allowedTools || ['ai_query']
                  ).join(', ')}
                </strong>
              </span>
              <span>
                📦 Resultados:{' '}
                <strong className="text-emerald-300 font-mono">
                  {((selectedAgent as any).resultsProduced || []).length}
                </strong>
              </span>
            </div>
          </div>

          {/* 3D Avatar Locomotion Quick Bar */}
          <div className="px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Mover Avatar 3D:
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => commandAvatarWalk(selectedAgent.id, 'balcony_center')}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-sky-500/20 border border-slate-700 text-[10px] text-sky-300 flex items-center gap-1 cursor-pointer"
                title="Caminhar até a Varanda das Nuvens"
              >
                <Cloud className="w-3 h-3" />
                <span>Nuvens</span>
              </button>
              <button
                onClick={() => commandAvatarWalk(selectedAgent.id, 'lounge_plant_corner')}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 text-[10px] text-emerald-300 flex items-center gap-1 cursor-pointer"
                title="Ir para o Sofá Lounge & Jardim"
              >
                <Compass className="w-3 h-3" />
                <span>Lounge</span>
              </button>
              <button
                onClick={() => commandAvatarWalk(selectedAgent.id, 'collab_hub')}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-purple-500/20 border border-slate-700 text-[10px] text-purple-300 flex items-center gap-1 cursor-pointer"
                title="Reunir na Mesa Holográfica Central"
              >
                <Users className="w-3 h-3" />
                <span>Reunião</span>
              </button>
              <button
                onClick={() =>
                  commandAvatarWalk(selectedAgent.id, AGENT_HOME_NODE[selectedAgent.id] || 'desk_orchestrator')
                }
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-500/20 border border-slate-700 text-[10px] text-amber-300 flex items-center gap-1 cursor-pointer"
                title="Voltar para a Estação de Trabalho"
              >
                <Monitor className="w-3 h-3" />
                <span>Mesa</span>
              </button>
            </div>
          </div>

          {/* Sub-navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/40 text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setSideTab('chat')}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                sideTab === 'chat'
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat IA Real</span>
            </button>
            <button
              onClick={() => setSideTab('archivist')}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                sideTab === 'archivist'
                  ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Arquivos PC</span>
            </button>
            <button
              onClick={() => setSideTab('ai')}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                sideTab === 'ai'
                  ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Motor IA</span>
            </button>
          </div>

          {/* TAB 1: REAL CHAT & TERMINAL LOGS */}
          {sideTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Honest Error Banner when Provider has no API key configured */}
              {selectedAgent.lastError && (
                <div className="m-3 p-3 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-red-300 uppercase">
                        Erro Real de IA ({selectedAgent.lastError.code})
                      </div>
                      <p className="text-[11px] text-red-200/90 mt-0.5 leading-relaxed">
                        {selectedAgent.lastError.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setSideTab('ai')}
                      className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-400/50 text-red-200 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Configurar Credencial / Trocar Provedor →
                    </button>
                  </div>
                </div>
              )}

              {/* Chat Messages History */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                {(!selectedAgent.chatHistory || selectedAgent.chatHistory.length === 0) && (
                  <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-center space-y-1.5">
                    <Terminal className="w-6 h-6 text-cyan-400 mx-auto" />
                    <div className="text-xs font-bold text-white">
                      Canal Direto com {selectedAgent.name}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Todas as respostas vêm diretamente do provedor configurado (
                      <span className="text-cyan-300 font-mono">
                        {selectedAgent.provider}/{selectedAgent.model}
                      </span>
                      ). Sem respostas falsas ou pré-gravadas.
                    </p>
                  </div>
                )}

                {selectedAgent.chatHistory?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-100 ml-6'
                        : msg.sender === 'error'
                        ? 'bg-red-950/60 border border-red-500/40 text-red-200 mr-4'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-200 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-bold uppercase text-white">
                        {msg.sender === 'user'
                          ? 'Você'
                          : msg.sender === 'error'
                          ? 'Falha de Provedor'
                          : selectedAgent.shortName}
                      </span>
                      <span>
                        {msg.provider ? `${msg.provider} • ` : ''}
                        {msg.time}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                    {msg.file && (
                      <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] text-emerald-300 font-mono truncate">
                          📄 {msg.file.name}
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handlePreviewFile(msg.file)}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] cursor-pointer"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => handleOpenInExplorer(msg.file.path)}
                            className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] cursor-pointer"
                          >
                            Abrir Pasta
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Recent Live Execution Logs */}
              <div className="px-3.5 py-2 bg-slate-900/70 border-t border-slate-800 max-h-24 overflow-y-auto font-mono text-[10px] space-y-1">
                {selectedAgent.logs?.slice(-4).map((l) => (
                  <div key={l.id} className="text-slate-400 truncate">
                    <span className="text-slate-500">[{l.time}]</span>{' '}
                    <span
                      className={
                        l.type === 'error'
                          ? 'text-red-400'
                          : l.type === 'success'
                          ? 'text-emerald-400'
                          : 'text-slate-300'
                      }
                    >
                      {l.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Direct Chat Input Form */}
              <form
                onSubmit={handleSendChat}
                className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Perguntar para ${selectedAgent.shortName}...`}
                  className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
                <button
                  type="submit"
                  disabled={isSendingChat || !chatInput.trim()}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: REAL LOCAL PC FOLDER ORGANIZER */}
          {sideTab === 'archivist' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                <div className="font-bold text-emerald-300 uppercase flex items-center justify-between">
                  <span>Organizador Real de Arquivos do PC</span>
                  <button
                    onClick={handleResetSandbox}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    title="Recriar arquivos de teste na pasta de demonstração"
                  >
                    Resetar Demo
                  </button>
                </div>
                <p className="text-[11px] text-slate-300">
                  Informe qualquer pasta do seu Windows (ex: Downloads ou a pasta Sandbox segura) para inspecionar, categorizar e organizar com opção de Desfazer.
                </p>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={folderPathInput}
                    onChange={(e) => setFolderPathInput(e.target.value)}
                    placeholder="Caminho da pasta no Windows..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-mono"
                  />
                  <button
                    onClick={handleScanFolder}
                    disabled={isScanningFolder}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] cursor-pointer"
                  >
                    {isScanningFolder ? '...' : 'Escanear'}
                  </button>
                </div>
              </div>

              {archivistPlan && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      Arquivos detectados: <strong className="text-white">{archivistPlan.totalFiles || 0}</strong>
                    </span>
                    <button
                      onClick={() => handleOpenInExplorer(archivistPlan.targetDir)}
                      className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Abrir no Explorer</span>
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {archivistPlan.items?.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div className="truncate">
                          <div className="text-[11px] font-medium text-white truncate">{item.fileName}</div>
                          <div className="text-[10px] text-slate-400">
                            → Pasta: <span className="text-emerald-300 font-mono">{item.targetFolder}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">{item.sizeKB} KB</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleExecuteOrganize}
                      disabled={isOrganizingFolder || !archivistPlan.items?.length}
                      className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aprovar e Organizar Agora</span>
                    </button>
                    <button
                      onClick={handleUndoOrganize}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                      title="Desfazer última organização"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>Desfazer</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PER-AGENT AI ENGINE CONFIGURATION */}
          {sideTab === 'ai' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="font-bold text-amber-300 uppercase">
                  Configurar Cérebro de {selectedAgent.shortName}
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-slate-400 mb-1">Provedor de IA</label>
                  <select
                    value={selectedAgent.provider}
                    onChange={(e) => {
                      const nextProv = e.target.value;
                      const defaultMod =
                        providerCatalog[nextProv]?.defaultModel ||
                        providerCatalog[nextProv]?.models?.[0] ||
                        'gemini-2.5-flash';
                      handleSaveAgentConfig(selectedAgent.id, nextProv, defaultMod);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white"
                  >
                    {Object.entries(providerCatalog).map(([key, info]: [string, any]) => (
                      <option key={key} value={key}>
                        {info.label} {info.configured ? '✓ (Configurado)' : '(Sem Chave)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-slate-400 mb-1">Modelo</label>
                  <input
                    type="text"
                    value={selectedAgent.model}
                    onChange={(e) =>
                      handleSaveAgentConfig(selectedAgent.id, selectedAgent.provider, e.target.value)
                    }
                    list={`models-${selectedAgent.id}`}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white font-mono"
                  />
                  <datalist id={`models-${selectedAgent.id}`}>
                    {(selectedAgent.provider === 'ollama' && ollamaModels.length > 0
                      ? ollamaModels
                      : providerCatalog[selectedAgent.provider]?.models || []
                    ).map((m: string) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>

                {selectedAgent.provider !== 'ollama' && (
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">
                      Chave de API ({selectedAgent.provider.toUpperCase()})
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="password"
                        value={apiKeyInputs[selectedAgent.provider] || ''}
                        onChange={(e) =>
                          setApiKeyInputs((p) => ({ ...p, [selectedAgent.provider]: e.target.value }))
                        }
                        placeholder="Cole sua API Key real aqui..."
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                      <button
                        onClick={() => {
                          const key = apiKeyInputs[selectedAgent.provider];
                          if (key) {
                            handleSaveAgentConfig(
                              selectedAgent.id,
                              selectedAgent.provider,
                              selectedAgent.model,
                              key
                            );
                            setApiKeyInputs((p) => ({ ...p, [selectedAgent.provider]: '' }));
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => handleTestAgentConnection(selectedAgent.id)}
                    disabled={testingAgentId === selectedAgent.id}
                    className="w-full py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${testingAgentId === selectedAgent.id ? 'animate-spin' : ''}`}
                    />
                    <span>Testar Conexão Real deste Agente</span>
                  </button>
                </div>

                {testResultMsg && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-200">
                    {testResultMsg}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5A. Painel de Controle do Escritório (Seção 9) */}
      {showOfficeControl && (
        <div className="pointer-events-auto absolute top-20 left-4 bottom-24 w-[420px] max-w-[92vw] z-30 bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/70">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Painel de Controle do Escritório 3D
              </span>
            </div>
            <button
              onClick={() => setShowOfficeControl(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
            {/* KPI Counters */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-center">
                <div className="text-[10px] text-slate-400 uppercase">Agentes Ativos</div>
                <div className="text-base font-extrabold text-cyan-300 font-mono">
                  {officeControl?.activeAgents || 0} / {officeControl?.totalAgents || 5}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/30 text-center">
                <div className="text-[10px] text-slate-400 uppercase">Pendentes / Em Exec.</div>
                <div className="text-base font-extrabold text-amber-300 font-mono">
                  {officeControl?.pendingCount || 0} / {officeControl?.inProgressCount || 0}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-center">
                <div className="text-[10px] text-slate-400 uppercase">Concluídas / Erros</div>
                <div className="text-base font-extrabold text-emerald-300 font-mono">
                  {officeControl?.completedCount || 0} /{' '}
                  <span className="text-red-400">{officeControl?.errorCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Active & Pending Tasks */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="font-bold text-cyan-300 uppercase text-[11px]">
                Tarefas em Andamento e Recentes
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1.5">
                {[
                  ...(officeControl?.inProgressTasks || []),
                  ...(officeControl?.pendingTasks || []),
                  ...(officeControl?.completedTasks || []).slice(0, 5)
                ].length === 0 ? (
                  <p className="text-[11px] text-slate-500">Nenhuma tarefa registrada no momento.</p>
                ) : (
                  [
                    ...(officeControl?.inProgressTasks || []),
                    ...(officeControl?.pendingTasks || []),
                    ...(officeControl?.completedTasks || []).slice(0, 5)
                  ].map((t: any) => (
                    <div
                      key={t.id}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <div className="text-[11px] text-white font-semibold truncate">{t.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Agente: {t.assignedAgentId?.toUpperCase()} • {t.status.toUpperCase()}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-300 shrink-0">{t.progress || 0}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Collaborations */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="font-bold text-amber-300 uppercase text-[11px]">
                Colaborações Entre Agentes ({officeControl?.collaborations?.length || 0})
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1">
                {(officeControl?.collaborations || []).length === 0 ? (
                  <p className="text-[11px] text-slate-500">Nenhuma colaboração registrada ainda.</p>
                ) : (
                  (officeControl?.collaborations || []).slice(0, 6).map((c: any) => (
                    <div key={c.id} className="text-[11px] text-slate-300 font-mono truncate">
                      ⚡ {c.from?.toUpperCase()} → {c.to?.toUpperCase()}: {c.label}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Activity History */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="font-bold text-purple-300 uppercase text-[11px]">
                Histórico de Atividades do Escritório
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[10px]">
                {(officeControl?.activityHistory || []).length === 0 ? (
                  <p className="text-[11px] text-slate-500 font-sans">Sem atividades recentes.</p>
                ) : (
                  (officeControl?.activityHistory || []).slice(0, 10).map((act: any) => (
                    <div key={act.id} className="text-slate-300 truncate">
                      <span className="text-slate-500">
                        [{new Date(act.timestamp).toLocaleTimeString('pt-BR')}]
                      </span>{' '}
                      <span className="text-cyan-300">[{act.agentId?.toUpperCase()}]</span> {act.summary}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Left Drawer for Generated Real Files */}
      {showFilesDrawer && (
        <div className="pointer-events-auto absolute top-20 left-4 bottom-24 w-[360px] z-20 bg-slate-950/92 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Entregas Reais no PC ({files.length})
              </span>
            </div>
            <button
              onClick={() => setShowFilesDrawer(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {files.map((f) => (
              <div
                key={f.id}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white truncate">{f.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 uppercase">
                    {f.type}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between">
                  <span>{f.sizeKB} KB</span>
                  <span>{f.createdAt}</span>
                </div>
                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={() => handlePreviewFile(f)}
                    className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Inspecionar</span>
                  </button>
                  <button
                    onClick={() => handleOpenInExplorer(f.path)}
                    className="flex-1 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <FolderOpen className="w-3 h-3" />
                    <span>Explorer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Bottom Dock: Overview + 5 Agent Cards + Launch Mission Button */}
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-20 flex items-center justify-center">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 bg-slate-950/90 border border-slate-800 rounded-2xl px-3 py-2 shadow-2xl backdrop-blur-xl">
          <button
            onClick={() => setSelectedAgentId(null)}
            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              selectedAgentId === null
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            🏔️ Visão Geral 3D
          </button>

          <div className="h-6 w-px bg-slate-800 mx-0.5" />

          {Object.values(agents).map((ag) => {
            const isSel = selectedAgentId === ag.id;
            const isWorking =
              ag.status === 'working' ||
              ag.status === 'connecting' ||
              ag.status === 'processing' ||
              ag.status === 'writing';
            const isErr = ag.status === 'error';

            return (
              <button
                key={ag.id}
                onClick={() => setSelectedAgentId(ag.id)}
                className={`px-3 py-1.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  isSel
                    ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/25'
                    : isErr
                    ? 'bg-red-950/40 border-red-500/60 hover:bg-red-950/60'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-600'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isErr ? 'bg-red-500' : isWorking ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                  }`}
                />
                <div>
                  <div className="text-[11px] font-bold text-white leading-tight">{ag.shortName}</div>
                  <div className="text-[9px] text-slate-400 font-mono uppercase">
                    {ag.provider} • {ag.floor}º Andar
                  </div>
                </div>
              </button>
            );
          })}

          <div className="h-6 w-px bg-slate-800 mx-0.5" />

          <button
            onClick={() => setShowCommandModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-cyan-400 hover:from-amber-300 hover:to-cyan-300 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Nova Missão Multi-IA</span>
          </button>
        </div>
      </div>

      {/* 7. MODAL: CENTRAL MULTI-IA CONFIGURATION */}
      {showMultiIAModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                    Central Multi-IA — Credenciais e Roteamento por Agente
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Configure chaves reais (Gemini, OpenAI, Claude, DeepSeek, Groq) ou modelos locais (Ollama).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMultiIAModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* API Keys Bar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {['gemini', 'openai', 'anthropic', 'deepseek', 'groq'].map((prov) => (
                  <div key={prov} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase text-white">
                        {providerCatalog[prov]?.label || prov}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          providerCatalog[prov]?.configured
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {providerCatalog[prov]?.configured ? 'Chave Ativa' : 'Não Configurada'}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="password"
                        value={apiKeyInputs[prov] || ''}
                        onChange={(e) => setApiKeyInputs((p) => ({ ...p, [prov]: e.target.value }))}
                        placeholder={`Inserir chave ${prov.toUpperCase()}...`}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                      <button
                        onClick={() => {
                          const k = apiKeyInputs[prov];
                          if (k) {
                            handleSaveAgentConfig(
                              'orchestrator',
                              agents.orchestrator?.provider || prov,
                              agents.orchestrator?.model || '',
                              k
                            );
                            fetch('/api/agents/config', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ provider: prov, apiKey: k }),
                            }).then(() => {
                              fetchProviders();
                              fetchEcosystemState();
                            });
                            setApiKeyInputs((p) => ({ ...p, [prov]: '' }));
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold cursor-pointer"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Per-Agent Assignment Matrix */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  Provedor e Modelo Individual de Cada Agente 3D
                </h3>
                {Object.values(agents).map((ag) => (
                  <div
                    key={ag.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="min-w-[170px]">
                      <div className="font-bold text-white">{ag.name}</div>
                      <div className="text-[10px] text-slate-400">{ag.role}</div>
                    </div>

                    <div className="flex items-center gap-2 flex-1">
                      <select
                        value={ag.provider}
                        onChange={(e) => {
                          const nextP = e.target.value;
                          const defM =
                            providerCatalog[nextP]?.defaultModel ||
                            providerCatalog[nextP]?.models?.[0] ||
                            'gemini-2.5-flash';
                          handleSaveAgentConfig(ag.id, nextP, defM);
                        }}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        {Object.entries(providerCatalog).map(([k, v]: [string, any]) => (
                          <option key={k} value={k}>
                            {v.label}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={ag.model}
                        onChange={(e) => handleSaveAgentConfig(ag.id, ag.provider, e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono"
                      />

                      <button
                        onClick={() => handleTestAgentConnection(ag.id)}
                        disabled={testingAgentId === ag.id}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold cursor-pointer"
                      >
                        {testingAgentId === ag.id ? 'Testando...' : 'Testar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {testResultMsg && (
                <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/40 text-xs text-cyan-200">
                  {testResultMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: LAUNCH MULTI-AGENT MISSION (WITH CTRL+V IMAGE PASTE) */}
      {showCommandModal && (
        <div
          onPaste={handleCommandPaste}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleLaunchMission}
            className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                    Orquestrar Missão Completa com Esquadrão H.E.L.E.N.A.
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    H.E.L.E.N.A. divide a tarefa, aciona o Acadêmico/Construtor/Revisor e salva o arquivo final no seu PC.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCommandModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1.5">
                  Descreva o Trabalho, Pesquisa, Questão de Prova ou Projeto
                </label>
                <textarea
                  rows={4}
                  value={missionPrompt}
                  onChange={(e) => setMissionPrompt(e.target.value)}
                  placeholder="Ex: Elabore um trabalho acadêmico completo sobre Inteligência Artificial Generativa com referências ABNT, ou cole um print de questão com Ctrl+V..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl p-3 text-xs text-white outline-none"
                />
              </div>

              {/* Ctrl+V Image Paste or Upload */}
              <div className="p-3 rounded-xl bg-slate-950 border border-dashed border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>
                    {missionImage
                      ? '🖼️ Imagem anexada com sucesso para visão multimodal!'
                      : 'Dica: Pressione Ctrl+V para colar print de prova/exercício'}
                  </span>
                </div>
                {missionImage && (
                  <button
                    type="button"
                    onClick={() => setMissionImage(null)}
                    className="text-red-400 hover:underline text-[11px] cursor-pointer"
                  >
                    Remover
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1.5">
                  Formato do Arquivo Real Gerado no PC
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: 'pdf', label: 'PDF (.pdf)' },
                    { id: 'doc', label: 'Word (.doc)' },
                    { id: 'md', label: 'Markdown (.md)' },
                    { id: 'html', label: 'Slides (.html)' },
                    { id: 'csv', label: 'Planilha (.csv)' },
                  ].map((fmt) => (
                    <button
                      type="button"
                      key={fmt.id}
                      onClick={() => setMissionFormat(fmt.id)}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${
                        missionFormat === fmt.id
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCommandModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmittingMission || !missionPrompt.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-cyan-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-40"
              >
                {isSubmittingMission ? 'Iniciando Pipeline...' : 'Disparar Esquadrão 3D'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 9. MODAL: FILE CONTENT PREVIEW */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div>
                <h3 className="text-sm font-bold text-white">{previewFile.file.name}</h3>
                <p className="text-[10px] text-slate-400 font-mono">{previewFile.file.path}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenInExplorer(previewFile.file.path)}
                  className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold cursor-pointer"
                >
                  Mostrar no Windows Explorer
                </button>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-950">
              {previewFile.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
