import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  User,
  Clock,
  Briefcase,
  Cpu,
  Globe,
  Plus,
  Trash2,
  Save,
  X,
  Sparkles,
  Zap,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  FolderOpen
} from 'lucide-react';
import { soundSynth } from '../audio/synth';
import type { UserProfile, LongTermMemory } from '../types';

interface MemoryProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryProfileModal: React.FC<MemoryProfileModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'perfil' | 'memoria'>('perfil');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [memory, setMemory] = useState<LongTermMemory | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // New memory input
  const [newMemoryText, setNewMemoryText] = useState<string>('');
  const [newMemoryType, setNewMemoryType] = useState<string>('fato_usuario');

  useEffect(() => {
    if (isOpen) {
      soundSynth.playTelemetryBeep();
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profRes, memRes] = await Promise.all([
        fetch('/api/helena/profile'),
        fetch('/api/helena/memory')
      ]);
      if (profRes.ok) {
        const p = await profRes.json();
        setProfile(p);
      }
      if (memRes.ok) {
        const m = await memRes.json();
        setMemory(m);
      }
    } catch (err) {
      console.warn('Erro ao carregar dados de memória e perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    soundSynth.playTelemetryBeep(1.2);
    try {
      const res = await fetch('/api/helena/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        setSaveSuccess(true);
        soundSynth.playBiometricConfirmed();
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (_) {
      alert('Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;
    soundSynth.playTelemetryBeep();
    try {
      const res = await fetch('/api/helena/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: newMemoryType,
          resumo: newMemoryText.trim(),
          relevancia: 'Alta'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMemory(data.memoria);
        setNewMemoryText('');
        soundSynth.playBiometricConfirmed();
      }
    } catch (_) {
      alert('Erro ao gravar memória.');
    }
  };

  const handleClearMemories = async () => {
    if (!window.confirm('Deseja realmente limpar o histórico episódico de memórias?')) return;
    soundSynth.playTelemetryBeep(0.8);
    try {
      const res = await fetch('/api/helena/memory/clear', { method: 'POST' });
      if (res.ok) {
        if (memory) {
          setMemory({ ...memory, memoriasEpisodicas: [] });
        }
        soundSynth.playBiometricConfirmed();
      }
    } catch (_) {}
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-slate-950/95 border-2 border-purple-500/60 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.35)] flex flex-col overflow-hidden text-slate-100 font-mono"
        >
          {/* Tech Corner Brackets */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-purple-400" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-purple-400" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-purple-400" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-purple-400" />

          {/* Modal Header */}
          <div className="px-5 py-3.5 border-b border-purple-500/30 flex items-center justify-between bg-slate-900/60 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-950/80 border border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                <Brain className="w-5 h-5 text-purple-300 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] text-purple-400 uppercase tracking-widest block">
                  H.E.L.E.N.A. // ARQUITETURA MODULAR
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Memória Contínua (Honcho) & Perfil do Operador
                </h2>
              </div>
            </div>

            <button
              onClick={() => {
                soundSynth.playTelemetryBeep(0.9);
                onClose();
              }}
              className="p-1.5 rounded-lg border border-purple-500/30 bg-purple-950/40 hover:bg-rose-950/60 hover:border-rose-400 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-purple-500/25 bg-slate-950/60 shrink-0">
            <button
              onClick={() => {
                soundSynth.playHover();
                setActiveTab('perfil');
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === 'perfil'
                  ? 'bg-purple-900/80 border border-purple-400 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'bg-slate-900/50 border border-purple-500/20 text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5 text-purple-400" />
              <span>Quem Você É (Perfil)</span>
            </button>

            <button
              onClick={() => {
                soundSynth.playHover();
                setActiveTab('memoria');
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === 'memoria'
                  ? 'bg-cyan-950/80 border border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'bg-slate-900/50 border border-purple-500/20 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-cyan-400" />
              <span>Memória Longa (Honcho)</span>
              {memory?.memoriasEpisodicas && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-cyan-900/90 border border-cyan-400/50 text-cyan-200">
                  {memory.memoriasEpisodicas.length}
                </span>
              )}
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 p-5 overflow-y-auto scrollbar-thin space-y-5">
            {loading ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
                <Brain className="w-8 h-8 text-purple-400 animate-spin" />
                <span>Carregando módulo de persistência local...</span>
              </div>
            ) : activeTab === 'perfil' && profile ? (
              /* TAB 1: PERFIL DO USUÁRIO */
              <div className="space-y-5">
                {/* 1. Identificação */}
                <div className="p-4 rounded-xl border border-purple-500/30 bg-slate-900/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                    <User className="w-4 h-4 text-purple-400" />
                    <span>Identificação e Tratamento</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase block mb-1">Nome do Operador</label>
                      <input
                        type="text"
                        value={profile.usuario?.nome || ''}
                        onChange={(e) =>
                          setProfile({ ...profile, usuario: { ...profile.usuario, nome: e.target.value } })
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-purple-500/40 text-slate-100 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase block mb-1">Título / Tratamento</label>
                      <input
                        type="text"
                        value={profile.usuario?.titulo || ''}
                        onChange={(e) =>
                          setProfile({ ...profile, usuario: { ...profile.usuario, titulo: e.target.value } })
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-purple-500/40 text-slate-100 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase block mb-1">Cidade Padrão</label>
                      <input
                        type="text"
                        value={profile.usuario?.cidade || ''}
                        onChange={(e) =>
                          setProfile({ ...profile, usuario: { ...profile.usuario, cidade: e.target.value } })
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-purple-500/40 text-slate-100 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase block mb-1">Preferência de Voz</label>
                      <input
                        type="text"
                        value={profile.usuario?.preferenciaVoz || ''}
                        onChange={(e) =>
                          setProfile({ ...profile, usuario: { ...profile.usuario, preferenciaVoz: e.target.value } })
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-purple-500/40 text-slate-100 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Rotina e Foco */}
                <div className="p-4 rounded-xl border border-cyan-500/30 bg-slate-900/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>Rotina Operacional & Foco</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase block mb-1">Horário de Início Matinal</label>
                      <input
                        type="text"
                        value={profile.rotina?.horarioInicio || ''}
                        onChange={(e) =>
                          setProfile({ ...profile, rotina: { ...profile.rotina, horarioInicio: e.target.value } })
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-cyan-500/40 text-slate-100 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase block mb-1">Intervalos / Pausas</label>
                      <input
                        type="text"
                        value={profile.rotina?.intervalos || ''}
                        onChange={(e) =>
                          setProfile({ ...profile, rotina: { ...profile.rotina, intervalos: e.target.value } })
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-cyan-500/40 text-slate-100 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-400 uppercase block mb-1">Foco Principal Diário</label>
                      <input
                        type="text"
                        value={profile.rotina?.focoPrincipal || ''}
                        onChange={(e) =>
                          setProfile({ ...profile, rotina: { ...profile.rotina, focoPrincipal: e.target.value } })
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-cyan-500/40 text-slate-100 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Projetos Atuais */}
                <div className="p-4 rounded-xl border border-purple-500/30 bg-slate-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                      <Briefcase className="w-4 h-4 text-purple-400" />
                      <span>Projetos Atuais do Usuário</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newPrj = {
                          id: `prj-${Date.now()}`,
                          nome: 'Novo Projeto',
                          descricao: 'Descrição do projeto operacional',
                          status: 'Ativo'
                        };
                        setProfile({
                          ...profile,
                          projetosAtuais: [...(profile.projetosAtuais || []), newPrj]
                        });
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/80 border border-purple-400/50 text-[10px] text-purple-300 hover:text-white transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar Projeto</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {profile.projetosAtuais?.map((prj, idx) => (
                      <div
                        key={prj.id || idx}
                        className="p-3 rounded-lg border border-purple-500/20 bg-slate-950/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5"
                      >
                        <div className="flex-1 space-y-1 w-full">
                          <input
                            type="text"
                            value={prj.nome}
                            onChange={(e) => {
                              const updated = [...profile.projetosAtuais];
                              updated[idx].nome = e.target.value;
                              setProfile({ ...profile, projetosAtuais: updated });
                            }}
                            className="font-bold text-cyan-300 bg-transparent border-b border-cyan-400/30 text-xs w-full focus:outline-none focus:border-cyan-400"
                          />
                          <input
                            type="text"
                            value={prj.descricao}
                            onChange={(e) => {
                              const updated = [...profile.projetosAtuais];
                              updated[idx].descricao = e.target.value;
                              setProfile({ ...profile, projetosAtuais: updated });
                            }}
                            className="text-[11px] text-slate-300 bg-transparent border-b border-purple-500/30 w-full focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="text"
                            value={prj.status}
                            onChange={(e) => {
                              const updated = [...profile.projetosAtuais];
                              updated[idx].status = e.target.value;
                              setProfile({ ...profile, projetosAtuais: updated });
                            }}
                            className="text-[10px] px-2 py-0.5 rounded bg-purple-950 border border-purple-400/40 text-purple-300 w-24 text-center focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = profile.projetosAtuais.filter((_, i) => i !== idx);
                              setProfile({ ...profile, projetosAtuais: updated });
                            }}
                            className="p-1 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Preferências do PC & Modo de Trabalho */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* PC Preferences */}
                  <div className="p-4 rounded-xl border border-cyan-500/30 bg-slate-900/50 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      <span>Preferências de Desempenho PC</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase block mb-1">Plano de Energia Alvo</label>
                        <input
                          type="text"
                          value={profile.preferenciasPC?.modoEnergia || 'Alto Desempenho'}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              preferenciasPC: { ...profile.preferenciasPC, modoEnergia: e.target.value }
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-cyan-500/40 text-slate-100 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase block mb-1">Alerta de RAM (%)</label>
                        <input
                          type="number"
                          value={profile.preferenciasPC?.alertaRAM || 85}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              preferenciasPC: { ...profile.preferenciasPC, alertaRAM: parseInt(e.target.value, 10) }
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-cyan-500/40 text-slate-100 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Work Mode Settings */}
                  <div className="p-4 rounded-xl border border-purple-500/30 bg-slate-900/50 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                      <Globe className="w-4 h-4 text-purple-400" />
                      <span>Modo de Trabalho (URLs e Apps)</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase block mb-1">URLs Favoritas (separadas por vírgula)</label>
                        <input
                          type="text"
                          value={(profile.modoTrabalho?.urls || []).join(', ')}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              modoTrabalho: {
                                ...profile.modoTrabalho,
                                urls: e.target.value.split(',').map((u) => u.trim()).filter(Boolean)
                              }
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-purple-500/40 text-slate-100 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase block mb-1">Aplicativos Locais (ex: code)</label>
                        <input
                          type="text"
                          value={(profile.modoTrabalho?.aplicativos || []).join(', ')}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              modoTrabalho: {
                                ...profile.modoTrabalho,
                                aplicativos: e.target.value.split(',').map((a) => a.trim()).filter(Boolean)
                              }
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-purple-500/40 text-slate-100 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'memoria' && memory ? (
              /* TAB 2: MEMÓRIA CONTÍNUA (ESTILO HONCHO) */
              <div className="space-y-5">
                {/* 1. Statistics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 flex flex-col justify-between">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider">Interações Totais</span>
                    <span className="text-xl font-bold text-cyan-300 mt-1">{memory.estatisticas?.totalInteracoes || 0}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 flex flex-col justify-between">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider">Otimizações PC</span>
                    <span className="text-xl font-bold text-amber-300 mt-1">{memory.estatisticas?.otimizacoesRealizadas || 0}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-950/20 flex flex-col justify-between">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider">Briefings Feitos</span>
                    <span className="text-xl font-bold text-purple-300 mt-1">{memory.estatisticas?.briefingsExecutados || 0}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col justify-between">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider">Arquivos Organizados</span>
                    <span className="text-xl font-bold text-emerald-300 mt-1">{memory.estatisticas?.arquivosOrganizados || 0}</span>
                  </div>
                </div>

                {/* 2. Padrões Aprendidos */}
                <div className="p-4 rounded-xl border border-purple-500/30 bg-slate-900/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span>Padrões Comportamentais Aprendidos (Honcho Engine)</span>
                  </div>

                  <div className="space-y-2.5">
                    {memory.padroesAprendidos?.map((padrao, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-purple-500/20 bg-slate-950/70 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-cyan-300 text-xs">{padrao.padrao}</span>
                          <span className="px-2 py-0.2 rounded-full text-[9px] bg-purple-950 border border-purple-400/50 text-purple-300 font-bold">
                            {padrao.confianca}% Confiança
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">{padrao.observacao}</p>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-cyan-400 to-purple-400 h-full rounded-full"
                            style={{ width: `${padrao.confianca}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Gravar Nova Memória Manualmente */}
                <form onSubmit={handleAddMemory} className="p-4 rounded-xl border border-cyan-500/30 bg-slate-900/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
                    <Plus className="w-4 h-4 text-cyan-400" />
                    <span>Gravar Nova Memória de Longo Prazo</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={newMemoryType}
                      onChange={(e) => setNewMemoryType(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-slate-950 border border-cyan-500/40 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="fato_usuario">Fato do Usuário</option>
                      <option value="preferencia">Preferência Operacional</option>
                      <option value="diretriz">Diretriz Estratégica</option>
                      <option value="projeto">Nota de Projeto</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Ex: Operador prefere respostas ultra-rápidas sem explicações desnecessárias..."
                      value={newMemoryText}
                      onChange={(e) => setNewMemoryText(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-cyan-500/40 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />

                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg border border-cyan-400 bg-cyan-950/80 hover:bg-cyan-900 text-xs font-bold text-cyan-200 hover:text-white transition-all shadow-[0_0_10px_rgba(0,240,255,0.3)] shrink-0"
                    >
                      Gravar
                    </button>
                  </div>
                </form>

                {/* 4. Linha do Tempo Episódica */}
                <div className="p-4 rounded-xl border border-purple-500/30 bg-slate-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span>Linha do Tempo Episódica ({memory.memoriasEpisodicas?.length || 0})</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleClearMemories}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-mono flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Limpar Episódios</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
                    {(!memory.memoriasEpisodicas || memory.memoriasEpisodicas.length === 0) ? (
                      <p className="text-center text-slate-500 py-6 text-xs">Nenhum evento registrado na memória episódica ainda.</p>
                    ) : (
                      memory.memoriasEpisodicas.map((mem) => (
                        <div
                          key={mem.id}
                          className="p-3 rounded-lg border border-purple-500/20 bg-slate-950/70 flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.2 rounded text-[9px] uppercase font-bold bg-purple-950/80 border border-purple-400/40 text-purple-300">
                                {mem.tipo}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">
                                {new Date(mem.data).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-200 leading-relaxed">{mem.resumo}</p>
                          </div>

                          <span className="text-[9px] text-cyan-400 uppercase font-mono tracking-wider shrink-0">
                            {mem.relevancia}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3 border-t border-purple-500/30 bg-slate-900/70 flex items-center justify-between shrink-0">
            <div className="text-[10px] text-slate-400 font-mono">
              Persistência local 100% offline // Pen drive seguro
            </div>

            <div className="flex items-center gap-2.5">
              {activeTab === 'perfil' && (
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-cyan-400 bg-cyan-950/80 hover:bg-cyan-900 text-xs font-bold text-cyan-200 hover:text-white transition-all shadow-[0_0_12px_rgba(0,240,255,0.3)] cursor-pointer"
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Salvo com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{saving ? 'Gravando...' : 'Salvar Perfil'}</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg border border-purple-500/30 bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
