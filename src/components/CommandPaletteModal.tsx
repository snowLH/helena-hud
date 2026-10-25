import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Sparkles,
  Zap,
  Wrench,
  Gauge,
  Wifi,
  BatteryCharging,
  Power,
  Calculator,
  Rocket,
  Clock,
  FileText,
  Terminal,
  Activity,
  ArrowRight,
  Briefcase,
  FolderOpen,
  Brain
} from 'lucide-react';
import { soundSynth } from '../audio/synth';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (command: string) => void;
}

interface CommandItem {
  id: string;
  category: 'otimizacao' | 'reparo' | 'diagnostico' | 'calculo' | 'sistema';
  command: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onExecuteCommand
}) => {
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  const commandsList: CommandItem[] = useMemo(
    () => [
      // 1. Otimização
      {
        id: 'cmd-opt',
        category: 'otimizacao',
        command: 'Helena, otimizar computador',
        title: 'Otimizar Sistema Operacional',
        description: 'Purga arquivos temporários em %TEMP%, limpa cache DNS e ativa plano de Alto Desempenho.',
        icon: <Zap className="w-4 h-4 text-amber-400" />,
        badge: 'DESEMPENHO'
      },
      {
        id: 'cmd-work-mode',
        category: 'otimizacao',
        command: 'Helena, iniciar modo de trabalho',
        title: 'Iniciar Modo de Trabalho',
        description: 'Abre automaticamente navegador e ferramentas favoritas configuradas no perfil do operador.',
        icon: <Briefcase className="w-4 h-4 text-cyan-400" />,
        badge: 'PRODUTIVIDADE'
      },
      {
        id: 'cmd-files-organize',
        category: 'sistema',
        command: 'Helena, organizar meus arquivos',
        title: 'Organizador de Arquivos Locais',
        description: 'Varre Downloads e Documentos, categorizando PDFs, imagens, instaladores e planilhas.',
        icon: <FolderOpen className="w-4 h-4 text-purple-400" />,
        badge: 'ARQUIVOS'
      },
      {
        id: 'cmd-memory-save',
        category: 'sistema',
        command: 'Helena, lembre-se que foco total hoje',
        title: 'Gravar Memória Contínua (Honcho)',
        description: 'Registra diretrizes, regras e fatos persistentes na memória de longo prazo da Helena.',
        icon: <Brain className="w-4 h-4 text-purple-300" />,
        badge: 'MEMÓRIA'
      },
      {
        id: 'cmd-profile-view',
        category: 'sistema',
        command: 'Helena, ver memória e perfil',
        title: 'Painel de Memória & Perfil',
        description: 'Abre o console visual para inspecionar padrões aprendidos e editar preferências do usuário.',
        icon: <Brain className="w-4 h-4 text-cyan-400" />,
        badge: 'PERFIL'
      },
      {
        id: 'cmd-briefing',
        category: 'otimizacao',
        command: 'Helena, bom dia',
        title: 'Briefing Matinal Completo',
        description: 'Verificação biométrica, sincronização da agenda, prioridades do dia e telemetria.',
        icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
        badge: 'ROTINA'
      },
      {
        id: 'cmd-startup',
        category: 'otimizacao',
        command: 'Helena, programas de inicialização',
        title: 'Gerenciar Inicialização (Boot)',
        description: 'Mapeia aplicativos que iniciam com o Windows e desativa itens de alto impacto.',
        icon: <Power className="w-4 h-4 text-purple-400" />,
        badge: 'BOOT'
      },

      // 2. Reparo
      {
        id: 'cmd-repair',
        category: 'reparo',
        command: 'Helena, reparar o PC',
        title: 'Suíte de Reparo & Conserto',
        description: 'Restaura Winsock de rede, higieniza cache do Explorer, limpa fila WER e recicla spooler.',
        icon: <Wrench className="w-4 h-4 text-emerald-400" />,
        badge: 'REPARO'
      },
      {
        id: 'cmd-diag-net',
        category: 'reparo',
        command: 'Helena, diagnóstico de rede',
        title: 'Diagnóstico de Rede & DNS',
        description: 'Mede tempo de ida e volta para Cloudflare 1.1.1.1, Google 8.8.8.8, DNS e detecta IP externo.',
        icon: <Wifi className="w-4 h-4 text-cyan-400" />,
        badge: 'REDE'
      },
      {
        id: 'cmd-procs',
        category: 'reparo',
        command: 'Helena, processos pesados',
        title: 'Monitor de Processos & RAM',
        description: 'Lista processos que mais ocupam memória física e permite encerramento seguro.',
        icon: <Activity className="w-4 h-4 text-rose-400" />,
        badge: 'MEMÓRIA'
      },

      // 3. Diagnósticos
      {
        id: 'cmd-bench',
        category: 'diagnostico',
        command: 'Helena, fazer benchmark',
        title: 'Benchmark de Performance',
        description: 'Avaliação aritmética de números primos, 25.000 iterações SHA-256 e throughput de RAM.',
        icon: <Gauge className="w-4 h-4 text-cyan-400" />,
        badge: 'BENCHMARK'
      },
      {
        id: 'cmd-battery',
        category: 'diagnostico',
        command: 'Helena, nível de bateria',
        title: 'Telemetria de Bateria e Energia',
        description: 'Informa carga percentual, estado de alimentação na tomada e estimativa de autonomia.',
        icon: <BatteryCharging className="w-4 h-4 text-emerald-400" />,
        badge: 'ENERGIA'
      },
      {
        id: 'cmd-relatorio',
        category: 'diagnostico',
        command: 'Helena, relatório do sistema',
        title: 'Relatório Consolidado da Máquina',
        description: 'Diagnóstico geral com modelo de processador, núcleos, RAM alocada e espaço em disco.',
        icon: <Terminal className="w-4 h-4 text-purple-400" />,
        badge: 'STATUS'
      },

      // 4. Cálculo & Dados
      {
        id: 'cmd-math-percent',
        category: 'calculo',
        command: 'Helena, quanto é 15% de 800',
        title: 'Cálculo de Porcentagem',
        description: 'Calcula porcentagens imediatas com precisão decimal e narrador neural.',
        icon: <Calculator className="w-4 h-4 text-cyan-400" />,
        badge: 'ARITMÉTICA'
      },
      {
        id: 'cmd-math-sqrt',
        category: 'calculo',
        command: 'Helena, quanto é a raiz de 144',
        title: 'Cálculo de Raiz Quadrada',
        description: 'Extração rápida de raízes e potências matemáticas.',
        icon: <Calculator className="w-4 h-4 text-cyan-400" />,
        badge: 'ARITMÉTICA'
      },
      {
        id: 'cmd-notes',
        category: 'calculo',
        command: 'Helena, minhas anotações',
        title: 'Bloco de Notas Tático',
        description: 'Exibe registros de anotações persistidas diretamente no armazenamento local.',
        icon: <FileText className="w-4 h-4 text-purple-400" />,
        badge: 'NOTAS'
      },
      {
        id: 'cmd-timer',
        category: 'calculo',
        command: 'Helena, timer de 5 minutos',
        title: 'Temporizador Digital Tático',
        description: 'Inicia contagem regressiva em segundo plano com aviso acústico na conclusão.',
        icon: <Clock className="w-4 h-4 text-amber-400" />,
        badge: 'TEMPO'
      },

      // 5. Sistema & Web
      {
        id: 'cmd-weather',
        category: 'sistema',
        command: 'Helena, como está o clima em Curitiba?',
        title: 'Previsão do Tempo Dinâmica',
        description: 'Consulta meteorológica via satélite Open-Meteo com temperatura, vento e umidade.',
        icon: <Rocket className="w-4 h-4 text-cyan-400" />,
        badge: 'METEOROLOGIA'
      },
      {
        id: 'cmd-search',
        category: 'sistema',
        command: 'Helena, o que é inteligência artificial?',
        title: 'Pesquisa na Rede Mundial',
        description: 'Busca instantânea de tópicos enciclopédicos com resumo e link de referência.',
        icon: <Sparkles className="w-4 h-4 text-purple-400" />,
        badge: 'WEB'
      },
      {
        id: 'cmd-app-calc',
        category: 'sistema',
        command: 'Helena, abrir calculadora',
        title: 'Abrir Aplicativo do Windows',
        description: 'Inicia calculadora, bloco de notas, painel de controle, explorer ou terminal.',
        icon: <Rocket className="w-4 h-4 text-rose-400" />,
        badge: 'EXECUTOR'
      }
    ],
    []
  );

  const filteredCommands = useMemo(() => {
    return commandsList.filter((item) => {
      const matchCat = selectedCategory === 'todos' || item.category === selectedCategory;
      const term = search.toLowerCase().trim();
      const matchSearch =
        !term ||
        item.title.toLowerCase().includes(term) ||
        item.command.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.badge.toLowerCase().includes(term);
      return matchCat && matchSearch;
    });
  }, [commandsList, selectedCategory, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono select-none">
      <div className="relative w-full max-w-2xl rounded-2xl border-2 border-cyan-400/60 bg-slate-950 p-6 shadow-[0_0_50px_rgba(0,240,255,0.35)] text-left flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/30">
          <div className="flex items-center gap-2 text-cyan-300 font-bold text-base">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <span>CATÁLOGO DE COMANDOS TÁTICOS // H.E.L.E.N.A.</span>
          </div>
          <button
            onClick={() => {
              soundSynth.playClick();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-cyan-950/40 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="my-3 relative">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar comando por nome, categoria ou função..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-cyan-500/40 bg-slate-900/80 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all font-mono"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 pb-2.5 mb-2 border-b border-purple-500/20 overflow-x-auto scrollbar-none text-[10px]">
          {[
            { id: 'todos', label: 'TODOS' },
            { id: 'otimizacao', label: 'OTIMIZAÇÃO' },
            { id: 'reparo', label: 'REPARO' },
            { id: 'diagnostico', label: 'DIAGNÓSTICOS' },
            { id: 'calculo', label: 'CÁLCULO & NOTAS' },
            { id: 'sistema', label: 'SISTEMA & WEB' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                soundSynth.playClick();
                setSelectedCategory(cat.id);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-cyan-950 border border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                  : 'text-slate-400 hover:text-cyan-200 bg-slate-900/50 border border-purple-500/20'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Commands List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin text-xs">
          {filteredCommands.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              Nenhum comando encontrado para o termo pesquisado.
            </div>
          ) : (
            filteredCommands.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  soundSynth.playTelemetryBeep();
                  onExecuteCommand(item.command);
                  onClose();
                }}
                className="p-3 rounded-xl border border-purple-500/30 bg-slate-900/50 hover:bg-cyan-950/40 hover:border-cyan-400/80 transition-all cursor-pointer group flex items-start justify-between gap-3 shadow-inner"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-950 border border-purple-500/40 group-hover:border-cyan-400 transition-colors shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-white text-xs group-hover:text-cyan-300 transition-colors">
                        {item.title}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-bold border border-purple-400/40 bg-purple-950/60 text-purple-300">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-1 leading-relaxed">
                      {item.description}
                    </p>
                    <code className="text-[9.5px] font-mono text-cyan-300/90 bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-500/20 block truncate max-w-[420px]">
                      "{item.command}"
                    </code>
                  </div>
                </div>

                <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="px-2.5 py-1 rounded bg-cyan-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 shadow-[0_0_10px_#00f0ff]">
                    <span>EXECUTAR</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="mt-3 pt-2.5 border-t border-cyan-500/20 flex items-center justify-between text-[10px] text-slate-400">
          <span>Dica: Pressione <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">Ctrl+K</kbd> para abrir</span>
          <span>{filteredCommands.length} comandos catalogados</span>
        </div>
      </div>
    </div>
  );
};
