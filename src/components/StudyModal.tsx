import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  BookOpen,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  GraduationCap,
  Brain,
  Lightbulb,
  CheckSquare,
  Flame,
  ArrowRight
} from 'lucide-react';
import { soundSynth } from '../audio/synth';
import { speechController } from '../audio/speech';
import type { ExamItem } from '../types';

interface StudyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_EXAMS: ExamItem[] = [
  {
    id: 'exam-1',
    materia: 'Cálculo & Análise Matemática',
    dataHora: 'Amanhã às 09:00',
    status: 'Revisando',
    topicos: ['Derivadas Parciais', 'Integrais Múltiplas', 'Teorema de Green', 'Séries de Taylor'],
    progresso: 75
  },
  {
    id: 'exam-2',
    materia: 'Estruturas de Dados & Algoritmos',
    dataHora: 'Em 2 dias às 14:00',
    status: 'A Iniciar',
    topicos: ['Grafos e BFS/DFS', 'Árvores AVL e Red-Black', 'Programação Dinâmica', 'Complexidade Big-O'],
    progresso: 35
  },
  {
    id: 'exam-3',
    materia: 'Engenharia de Software & Sistemas',
    dataHora: 'Em 4 dias às 10:30',
    status: 'Dominado',
    topicos: ['Padrões Arquiteturais Clean Arch', 'CI/CD e DevOps', 'Princípios SOLID', 'Testes Automatizados'],
    progresso: 95
  }
];

export const StudyModal: React.FC<StudyModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'timer' | 'provas' | 'dicas'>('timer');

  // Pomodoro Timer State
  const [targetSeconds, setTargetSeconds] = useState<number>(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerMode, setTimerMode] = useState<'foco' | 'pausa' | 'imersao'>('foco');
  const [isDronePlaying, setIsDronePlaying] = useState<boolean>(false);

  // Exams State
  const [exams, setExams] = useState<ExamItem[]>(() => {
    try {
      const saved = localStorage.getItem('helena_study_exams');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return DEFAULT_EXAMS;
  });

  const [newMateria, setNewMateria] = useState<string>('');
  const [newDataHora, setNewDataHora] = useState<string>('');
  const [newTopicos, setNewTopicos] = useState<string>('');
  const [isAddingExam, setIsAddingExam] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  // Save exams to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('helena_study_exams', JSON.stringify(exams));
    } catch (_) {}
  }, [exams]);

  // Pomodoro Countdown Logic
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsTimerRunning(false);
            soundSynth.playPomodoroAlert('complete');
            speechController.speak('Sessão de estudos concluída, Comandante. Excelente trabalho de concentração. Faça uma pausa tática de 5 minutos.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Handle focus drone
  const toggleDrone = () => {
    if (isDronePlaying) {
      soundSynth.stopFocusBinauralDrone();
      setIsDronePlaying(false);
    } else {
      soundSynth.startFocusBinauralDrone('alpha_432');
      setIsDronePlaying(true);
      soundSynth.playTelemetryBeep(1.5);
    }
  };

  const setTimerPreset = (minutes: number, mode: 'foco' | 'pausa' | 'imersao') => {
    soundSynth.playTelemetryBeep();
    setIsTimerRunning(false);
    setTimerMode(mode);
    setTargetSeconds(minutes * 60);
    setSecondsLeft(minutes * 60);
  };

  const toggleTimer = () => {
    soundSynth.playTelemetryBeep(1.2);
    if (!isTimerRunning) {
      soundSynth.playPomodoroAlert('focus_start');
      if (secondsLeft === targetSeconds) {
        speechController.speak('Temporizador de foco iniciado. Concentração total.');
      }
    }
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    soundSynth.playTelemetryBeep(0.8);
    setIsTimerRunning(false);
    setSecondsLeft(targetSeconds);
  };

  // Add exam
  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMateria.trim()) return;

    const newExam: ExamItem = {
      id: `exam-${Date.now()}`,
      materia: newMateria.trim(),
      dataHora: newDataHora.trim() || 'Data a definir',
      status: 'A Iniciar',
      topicos: newTopicos
        ? newTopicos.split(',').map((t) => t.trim()).filter(Boolean)
        : ['Revisão Geral da Ementa'],
      progresso: 10
    };

    setExams((prev) => [newExam, ...prev]);
    setNewMateria('');
    setNewDataHora('');
    setNewTopicos('');
    setIsAddingExam(false);
    soundSynth.playBiometricConfirmed();
  };

  // Delete exam
  const handleDeleteExam = (id: string) => {
    soundSynth.playTelemetryBeep(0.9);
    setExams((prev) => prev.filter((e) => e.id !== id));
  };

  // Cycle status
  const handleCycleStatus = (id: string) => {
    soundSynth.playTelemetryBeep();
    setExams((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (item.status === 'A Iniciar') {
          return { ...item, status: 'Revisando', progresso: 50 };
        } else if (item.status === 'Revisando') {
          return { ...item, status: 'Dominado', progresso: 100 };
        } else {
          return { ...item, status: 'A Iniciar', progresso: 0 };
        }
      })
    );
  };

  // Helena narrating study briefing
  const handleNarrateBriefing = () => {
    soundSynth.playTransitionPulse();
    const total = exams.length;
    const dominadas = exams.filter((e) => e.status === 'Dominado').length;
    const revisando = exams.filter((e) => e.status === 'Revisando').length;
    const proximas = exams.map((e) => `${e.materia}: ${e.dataHora}`).join('. ');

    const texto = `Comandante, aqui está o seu briefing tático da semana de provas. Você possui ${total} avaliações cadastradas. ${dominadas} matérias estão dominadas e ${revisando} estão em fase ativa de revisão. Cronograma prioritário: ${proximas}. Mantenha a serenidade, revise os tópicos principais e confie no seu preparo. Desejo excelente desempenho!`;

    speechController.speak(texto);
  };

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressRatio = targetSeconds > 0 ? (targetSeconds - secondsLeft) / targetSeconds : 0;
  const strokeDashoffset = 440 - 440 * progressRatio;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-emerald-500/40 bg-slate-950/95 backdrop-blur-2xl shadow-[0_0_50px_rgba(16,185,129,0.25)] overflow-hidden font-mono text-slate-100">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-emerald-500/30 bg-emerald-950/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-white tracking-wide">
                  CENTRAL DE ESTUDOS // SEMANA DE PROVAS
                </span>
                <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-900/60 border border-emerald-400/60 text-emerald-300 font-bold uppercase">
                  MODO TÁTICO
                </span>
              </div>
              <span className="text-[10px] text-emerald-400/70 tracking-wider">
                TEMPORIZADOR POMODORO // ONDAS ALFA 432Hz // CRONOGRAMA DE REVISÃO
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              soundSynth.playTelemetryBeep();
              onClose();
            }}
            className="p-1.5 rounded-lg border border-purple-500/30 hover:border-emerald-400 bg-slate-900/60 hover:bg-emerald-950/50 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 pb-2 border-b border-purple-500/20 bg-slate-900/40 shrink-0 overflow-x-auto">
          <button
            onClick={() => {
              soundSynth.playTelemetryBeep();
              setActiveTab('timer');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'timer'
                ? 'bg-emerald-950/80 border border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>TIMER DE FOCO (POMODORO)</span>
          </button>

          <button
            onClick={() => {
              soundSynth.playTelemetryBeep();
              setActiveTab('provas');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'provas'
                ? 'bg-emerald-950/80 border border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>MINHAS PROVAS ({exams.length})</span>
          </button>

          <button
            onClick={() => {
              soundSynth.playTelemetryBeep();
              setActiveTab('dicas');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'dicas'
                ? 'bg-emerald-950/80 border border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-emerald-400" />
            <span>MÉTODOS & DICAS NEURAIS</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
          {/* TAB 1: TIMER DE FOCO POMODORO */}
          {activeTab === 'timer' && (
            <div className="flex flex-col items-center justify-center space-y-6 py-2">
              {/* Presets Row */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button
                  onClick={() => setTimerPreset(25, 'foco')}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    targetSeconds === 25 * 60
                      ? 'border-emerald-400 bg-emerald-950/80 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                      : 'border-purple-500/30 bg-slate-900/60 text-slate-300 hover:border-emerald-500/50'
                  }`}
                >
                  25 MIN // FOCO CLÁSSICO
                </button>

                <button
                  onClick={() => setTimerPreset(50, 'imersao')}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    targetSeconds === 50 * 60
                      ? 'border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.35)]'
                      : 'border-purple-500/30 bg-slate-900/60 text-slate-300 hover:border-cyan-500/50'
                  }`}
                >
                  50 MIN // IMERSÃO PROFUNDA
                </button>

                <button
                  onClick={() => setTimerPreset(10, 'foco')}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    targetSeconds === 10 * 60
                      ? 'border-purple-400 bg-purple-950/80 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.35)]'
                      : 'border-purple-500/30 bg-slate-900/60 text-slate-300 hover:border-purple-500/50'
                  }`}
                >
                  10 MIN // REVISÃO EXPRESS
                </button>

                <button
                  onClick={() => setTimerPreset(5, 'pausa')}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    targetSeconds === 5 * 60
                      ? 'border-amber-400 bg-amber-950/80 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                      : 'border-purple-500/30 bg-slate-900/60 text-slate-300 hover:border-amber-500/50'
                  }`}
                >
                  5 MIN // PAUSA TÁTICA
                </button>
              </div>

              {/* Circular SVG Timer */}
              <div className="relative flex items-center justify-center w-56 h-56 select-none">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="rgba(168, 85, 247, 0.2)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke={timerMode === 'pausa' ? '#f59e0b' : '#10b981'}
                    strokeWidth="8"
                    strokeDasharray="440"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-linear drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-4xl sm:text-5xl font-mono font-bold tracking-widest text-white drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]">
                    {timeFormatted}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-emerald-400/90 font-semibold mt-1">
                    {isTimerRunning ? 'EM PROGRESSO' : 'EM ESPERA'}
                  </span>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleTimer}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border text-sm font-bold tracking-wider transition-all cursor-pointer ${
                    isTimerRunning
                      ? 'border-amber-400 bg-amber-950/80 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                      : 'border-emerald-400 bg-emerald-950/90 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:bg-emerald-900'
                  }`}
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-4 h-4 text-amber-400" />
                      <span>PAUSAR FOCO</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 text-emerald-400" />
                      <span>INICIAR SESSÃO</span>
                    </>
                  )}
                </button>

                <button
                  onClick={resetTimer}
                  title="Reiniciar Temporizador"
                  className="p-2.5 rounded-xl border border-purple-500/40 bg-slate-900/60 hover:bg-purple-950/50 text-purple-300 hover:text-white transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* 432Hz Binaural Drone Toggle */}
                <button
                  onClick={toggleDrone}
                  title={isDronePlaying ? 'Desligar Som de Foco 432Hz' : 'Ligar Ondas Alfa 432Hz para Concentração'}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    isDronePlaying
                      ? 'border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                      : 'border-purple-500/40 bg-slate-900/60 text-purple-300 hover:text-cyan-300 hover:border-cyan-400/50'
                  }`}
                >
                  {isDronePlaying ? <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
                  <span>{isDronePlaying ? '432Hz ONDAS ALFA ATIVAS' : 'SOM DE FOCO'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 text-center max-w-md">
                O som sintetizado em 432Hz gera frequências binaurais suaves de 10Hz (ondas alfa cerebrais), reduzindo a ansiedade de prova e estimulando a concentração profunda.
              </p>
            </div>
          )}

          {/* TAB 2: PROVAS E MATÉRIAS */}
          {activeTab === 'provas' && (
            <div className="space-y-4">
              {/* Header Action Buttons */}
              <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    Quadro Tático de Avaliações
                  </span>
                  <span className="text-[10px] text-slate-400">({exams.length} cadastradas)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleNarrateBriefing}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-purple-500/50 bg-purple-950/60 hover:bg-purple-900 text-purple-200 text-xs font-semibold cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
                    <span>Briefing pela Helena</span>
                  </button>

                  <button
                    onClick={() => setIsAddingExam(!isAddingExam)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-emerald-500/50 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-200 text-xs font-semibold cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Adicionar Prova</span>
                  </button>
                </div>
              </div>

              {/* Add Exam Form */}
              {isAddingExam && (
                <form
                  onSubmit={handleAddExam}
                  className="p-3.5 rounded-xl border border-emerald-500/40 bg-slate-900/80 space-y-2.5 animate-in fade-in"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] text-emerald-400 uppercase tracking-wider block mb-1">
                        Nome da Matéria / Prova
                      </label>
                      <input
                        type="text"
                        required
                        value={newMateria}
                        onChange={(e) => setNewMateria(e.target.value)}
                        placeholder="Ex: Física II, Banco de Dados, etc."
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-purple-500/30 text-white text-xs outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-emerald-400 uppercase tracking-wider block mb-1">
                        Data e Horário
                      </label>
                      <input
                        type="text"
                        value={newDataHora}
                        onChange={(e) => setNewDataHora(e.target.value)}
                        placeholder="Ex: Amanhã às 10:00 ou Quarta-feira"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-purple-500/30 text-white text-xs outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-emerald-400 uppercase tracking-wider block mb-1">
                      Tópicos Principais (separados por vírgula)
                    </label>
                    <input
                      type="text"
                      value={newTopicos}
                      onChange={(e) => setNewTopicos(e.target.value)}
                      placeholder="Ex: Teorema X, Exercícios 1 a 10, Fórmulas da Cap. 3"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-purple-500/30 text-white text-xs outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingExam(false)}
                      className="px-3 py-1 rounded-lg border border-slate-700 text-slate-400 text-xs hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1 rounded-lg bg-emerald-950 border border-emerald-400 text-emerald-300 text-xs font-bold hover:bg-emerald-900"
                    >
                      Salvar Prova
                    </button>
                  </div>
                </form>
              )}

              {/* Exams Cards List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-3.5 rounded-xl border border-purple-500/30 bg-slate-900/60 hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex-1">
                          <h4 className="font-bold text-white text-sm tracking-wide">{exam.materia}</h4>
                          <span className="text-[10px] text-cyan-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {exam.dataHora}
                          </span>
                        </div>

                        <button
                          onClick={() => handleCycleStatus(exam.id)}
                          title="Clique para alternar status"
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${
                            exam.status === 'Dominado'
                              ? 'bg-emerald-950 border border-emerald-400 text-emerald-300'
                              : exam.status === 'Revisando'
                              ? 'bg-cyan-950 border border-cyan-400 text-cyan-300'
                              : 'bg-amber-950 border border-amber-400 text-amber-300'
                          }`}
                        >
                          {exam.status}
                        </button>
                      </div>

                      {/* Topics */}
                      <div className="mt-2 space-y-1">
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block">
                          Tópicos de Revisão:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {exam.topicos.map((topico, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-purple-950/50 border border-purple-500/20 text-[9px] text-purple-200"
                            >
                              • {topico}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-purple-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 mr-3">
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              exam.status === 'Dominado'
                                ? 'bg-emerald-400'
                                : exam.status === 'Revisando'
                                ? 'bg-cyan-400'
                                : 'bg-amber-400'
                            }`}
                            style={{ width: `${exam.progresso}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-300 font-bold">{exam.progresso}%</span>
                      </div>

                      <button
                        onClick={() => handleDeleteExam(exam.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Remover matéria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MÉTODOS E DICAS NEURAIS */}
          {activeTab === 'dicas' && (
            <div className="space-y-3.5">
              <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/20 flex items-center gap-3">
                <Lightbulb className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Diretriz da Helena para Semana de Provas:</strong> Evite a ilusão de competência (apenas reler o material). O cérebro só retém conhecimento quando é forçado a recuperar a informação da memória ativa.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Técnica Feynman */}
                <div className="p-3.5 rounded-xl border border-purple-500/30 bg-slate-900/60 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wide">
                    <Brain className="w-4 h-4 text-cyan-400" />
                    <span>1. Técnica Feynman (Aprenda Ensinando)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Escolha um conceito da matéria e finja que está explicando para uma pessoa que nunca ouviu falar do assunto. Quando você travar ou usar palavras complicadas sem saber o porquê, ali está o buraco no seu entendimento.
                  </p>
                  <div className="p-2 rounded bg-purple-950/40 border border-purple-500/20 text-[10px] text-purple-300">
                    💡 <em>"Se você não consegue explicar de forma simples, você não entendeu suficientemente bem."</em>
                  </div>
                </div>

                {/* 2. Recordação Ativa */}
                <div className="p-3.5 rounded-xl border border-purple-500/30 bg-slate-900/60 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                    <span>2. Recordação Ativa (Active Recall)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Feche os olhos ou o caderno e tente escrever ou falar em voz alta tudo o que você lembra do tópico. Resolva provas antigas ou faça simulados cronometrados sem consultar gabarito até o final.
                  </p>
                  <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/20 text-[10px] text-emerald-300">
                    🎯 <em>Aumenta a retenção de longo prazo em até 300% em comparação com a releitura passiva.</em>
                  </div>
                </div>

                {/* 3. Repetição Espaçada */}
                <div className="p-3.5 rounded-xl border border-purple-500/30 bg-slate-900/60 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wide">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>3. Curva do Esquecimento de Ebbinghaus</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    O cérebro descarta 70% do conteúdo após 24 horas se não houver um reforço. Faça uma revisão rápida de 5 minutos hoje, outra em 3 dias e outra na véspera da prova para consolidar de vez.
                  </p>
                  <div className="p-2 rounded bg-amber-950/40 border border-amber-500/20 text-[10px] text-amber-300">
                    ⏳ <em>Poucos minutos espaçados valem mais que 6 horas seguidas de madrugada.</em>
                  </div>
                </div>

                {/* 4. Sono & Consolidação Sináptica */}
                <div className="p-3.5 rounded-xl border border-purple-500/30 bg-slate-900/60 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wide">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>4. Sono REM & Consolidação Neural</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Não vire a noite antes da prova. É durante o sono profundo e REM que o hipocampo transfere a memória de curto prazo para o córtex permanente. Dormir 7 horas após estudar é o que fixa o aprendizado.
                  </p>
                  <div className="p-2 rounded bg-purple-950/40 border border-purple-500/20 text-[10px] text-purple-300">
                    🧠 <em>Privação de sono reduz o raciocínio lógico e velocidade cognitiva em até 40%.</em>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-purple-500/20 bg-slate-950 shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            <span>SISTEMA TÁTICO DE ESTUDOS OPERACIONAL</span>
          </div>

          <button
            onClick={() => {
              soundSynth.playTelemetryBeep();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg border border-purple-500/40 bg-purple-950/60 hover:bg-purple-900 text-purple-200 hover:text-white transition-all font-semibold cursor-pointer"
          >
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
};
