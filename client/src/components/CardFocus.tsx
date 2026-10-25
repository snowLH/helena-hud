import React from 'react';
import { motion } from 'framer-motion';
import type { HelenaCard } from '../types';
import {
  Wifi,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  Wrench,
  Power,
  ExternalLink,
  Globe,
  Rocket,
  Activity,
  Battery,
  BatteryCharging,
  Calculator,
  Clock,
  FileText,
  Briefcase,
  FolderOpen,
  Brain,
  Terminal,
  GraduationCap,
  Lightbulb
} from 'lucide-react';

interface CardFocusProps {
  card: HelenaCard;
  isSpeaking: boolean;
  onNext?: () => void;
  onOpenStudy?: () => void;
}

export const CardFocus: React.FC<CardFocusProps> = ({ card, isSpeaking, onNext, onOpenStudy }) => {
  return (
    <motion.div
      key={card.id}
      initial={{ scale: 0.82, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.75, opacity: 0, y: 180 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-30 w-full max-w-[520px] rounded-2xl border-2 border-cyan-400/70 bg-slate-950/95 backdrop-blur-xl p-4 sm:p-5 shadow-[0_0_50px_rgba(0,240,255,0.4)] text-left"
    >
      {/* Corner Sci-Fi Tech Brackets */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
      <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

      {/* Header of the Card */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-cyan-500/30">
        <div>
          <span className="text-[9px] font-mono tracking-[0.2em] text-cyan-400/90 uppercase">
            H.E.L.E.N.A. // FOCO TÁTICO
          </span>
          <h2 className="text-lg font-mono font-bold text-white tracking-wide flex items-center gap-2 mt-0.5">
            {card.titulo}
          </h2>
          <p className="text-[11px] font-mono text-purple-300/80">{card.subtitulo}</p>
        </div>

        {isSpeaking && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400 text-[9px] font-mono font-bold text-cyan-300 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]" />
            NARRANDO
          </div>
        )}
      </div>

      {/* Card Content based on type */}
      <div className="space-y-3 text-xs font-mono max-h-[min(320px,calc(100vh-240px))] overflow-y-auto pr-1 scrollbar-thin">
        {/* 1. Hardware & Network Metrics */}
        {card.metricas && (
          <div className="grid grid-cols-2 gap-3">
            {card.metricas.map((m, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-purple-500/30 bg-purple-950/30 shadow-inner flex flex-col justify-between"
              >
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{m.label}</span>
                <span className="text-lg font-bold text-cyan-300 mt-1">{m.valor}</span>
                {m.detalhe && (
                  <span className="text-[10px] text-purple-300/70 mt-0.5">{m.detalhe}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 2. Reparo e Conserto do Sistema */}
        {card.tipo === 'reparo_sistema' && card.relatorioReparo && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-emerald-500/50 bg-emerald-950/30 flex items-center gap-3">
              <Wrench className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <span className="text-emerald-300 font-bold uppercase tracking-wider text-xs">
                  SISTEMA DE REPARO ATIVO
                </span>
                <p className="text-[11px] text-slate-300">
                  {card.relatorioReparo.resumo || 'Subsistemas do Windows corrigidos e restaurados.'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {card.relatorioReparo.acoesExecutadas.map((acao, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-cyan-500/30 bg-slate-900/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-white font-medium text-xs">{acao.etapa}</div>
                      <div className="text-[10px] text-slate-400">{acao.detalhe}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                    {acao.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Pesquisa na Internet em Tempo Real */}
        {card.tipo === 'pesquisa_web' && card.resultadoPesquisa && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl border border-cyan-500/40 bg-slate-900/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>{card.resultadoPesquisa.titulo || 'Resultado da Pesquisa'}</span>
                </div>
                {card.resultadoPesquisa.online && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300 text-[9px] font-bold">
                    ONLINE
                  </span>
                )}
              </div>

              {card.resultadoPesquisa.imagemUrl && (
                <div className="w-full h-32 rounded-lg overflow-hidden border border-cyan-500/30 relative">
                  <img
                    src={card.resultadoPesquisa.imagemUrl}
                    alt={card.resultadoPesquisa.titulo}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                </div>
              )}

              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {card.resultadoPesquisa.resumo}
              </p>

              {card.resultadoPesquisa.fonteUrl && (
                <div className="pt-2 border-t border-purple-500/20 flex justify-end">
                  <a
                    href={card.resultadoPesquisa.fonteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-[10px] hover:text-white transition-all"
                  >
                    <span>Abrir Fonte Completa</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. Gerenciador de Inicialização (Boot) */}
        {card.tipo === 'startup_manager' && card.startupApps && (
          <div className="space-y-2.5">
            <div className="p-2 rounded bg-purple-950/40 border border-purple-500/30 flex justify-between items-center text-[10px] text-purple-300">
              <span>Programas mapeados no boot do Windows:</span>
              <span className="text-cyan-300 font-bold">{card.startupApps.length} itens</span>
            </div>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {card.startupApps.slice(0, 7).map((app, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg border border-purple-500/30 bg-slate-900/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Power className={`w-3.5 h-3.5 ${app.enabled ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <div className="truncate">
                      <div className="text-slate-200 font-medium text-xs truncate">{app.name}</div>
                      <div className="text-[9px] text-slate-500 truncate max-w-[240px]">{app.command}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                        app.impact === 'ALTO'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50'
                          : app.impact === 'MÉDIO'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50'
                          : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                      }`}
                    >
                      {app.impact}
                    </span>
                    <span className={`text-[9px] font-bold ${app.enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {app.enabled ? 'ATIVADO' : 'INATIVO'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Lançador de Aplicativos */}
        {card.tipo === 'app_launcher' && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-cyan-400/50 bg-cyan-950/40 flex items-center gap-3">
              <Rocket className="w-8 h-8 text-cyan-400 shrink-0 animate-bounce" />
              <div>
                <span className="text-white font-bold text-sm tracking-wide">
                  {card.appLancado || 'Aplicativo'} Iniciado
                </span>
                <p className="text-[11px] text-cyan-300/80">
                  O programa solicitado foi executado com sucesso no Windows.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-purple-500/30 bg-slate-900/60">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-2">
                Atalhos Rápidos de Aplicativos do Sistema:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Calculadora', key: 'calc' },
                  { label: 'Bloco de Notas', key: 'notepad' },
                  { label: 'Gerenciador', key: 'taskmgr' },
                  { label: 'Painel Controle', key: 'control' },
                  { label: 'Explorador', key: 'explorer' },
                  { label: 'Configurações', key: 'settings' }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      fetch('/api/system/launch-app', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ app: item.key })
                      });
                    }}
                    className="p-2 rounded bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-[10px] text-cyan-200 hover:text-white transition-all text-center truncate"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. Agenda Items */}
        {card.tipo === 'agenda_local' && card.itens && (
          <div className="space-y-2">
            {card.itens.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg border border-cyan-500/20 bg-slate-900/60 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold">
                    {item.horario}
                  </span>
                  <div>
                    <div className="text-slate-200 font-medium text-[11px]">{item.titulo}</div>
                    <div className="text-[10px] text-purple-300/70">{item.local}</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/40">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 7. Priorities Items */}
        {card.tipo === 'prioridades' && card.itens && (
          <div className="space-y-2.5">
            {card.itens.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-purple-500/30 bg-purple-950/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-200 font-semibold">{item.titulo}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                      item.urgencia === 'Crítica'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-500/60'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-500/60'
                    }`}
                  >
                    {item.urgencia}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mb-2">{item.descricao}</p>
                <div className="w-full h-1.5 rounded-full bg-slate-900 border border-purple-500/20 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-400"
                    style={{ width: `${item.progresso}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 8. Cache & Temp Clean Result */}
        {card.tipo === 'limpeza_temp' && card.resultadoOtimizacao && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-950/30">
              <div className="flex items-center gap-2 text-emerald-300 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>EXPURGO DE DISCO CONCLUÍDO</span>
              </div>
              <p className="text-xs text-slate-300">{card.resultadoOtimizacao.resumo}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded border border-purple-500/30 bg-slate-900/50">
                <span className="text-[10px] text-slate-400">ARQUIVOS REMOVIDOS</span>
                <div className="text-lg font-bold text-cyan-300">
                  {card.resultadoOtimizacao.etapas[0]?.arquivosRemovidos ?? 95} itens
                </div>
              </div>
              <div className="p-2.5 rounded border border-purple-500/30 bg-slate-900/50">
                <span className="text-[10px] text-slate-400">ESPAÇO RECUPERADO</span>
                <div className="text-lg font-bold text-emerald-400">
                  {card.resultadoOtimizacao.etapas[0]?.espacoLiberadoMB ?? 3.1} MB
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 9. Network & Memory Step */}
        {card.tipo === 'rede_memoria' && (
          <div className="space-y-2.5">
            <div className="p-3 rounded-lg border border-cyan-500/40 bg-cyan-950/30 flex items-center gap-3">
              <Wifi className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="text-slate-200 font-bold">DNS FLUSH CONCLUÍDO</span>
                <p className="text-[10px] text-slate-400">Cache do resolvedor limpo via ipconfig /flushdns.</p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-purple-500/40 bg-purple-950/30 flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <span className="text-slate-200 font-bold">ALTO DESEMPENHO ATIVO</span>
                <p className="text-[10px] text-slate-400">Perfil energético de alta performance fixado no Windows.</p>
              </div>
            </div>
          </div>
        )}

        {/* 10. Heavy Processes */}
        {(card.tipo === 'processos_pesados' || card.tipo === 'analise_hardware') && card.processos && (
          <div className="space-y-1.5 mt-2">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
              Top 5 Processos Consumidores de RAM:
            </span>
            <div className="space-y-1.5">
              {card.processos.map((proc, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded border border-purple-500/30 bg-slate-900/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-purple-950 flex items-center justify-center text-[10px] text-cyan-400 font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-slate-200 font-medium">{proc.name}</span>
                    <span className="text-[9px] text-slate-500">PID: {proc.pid}</span>
                  </div>
                  <span className="text-cyan-300 font-bold">{proc.memoryMB} MB</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 11. Finalização */}
        {card.tipo === 'finalizacao' && (
          <div className="p-4 rounded-xl border border-cyan-400/50 bg-cyan-950/30 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-cyan-400 mx-auto animate-pulse" />
            <p className="text-sm font-semibold text-white tracking-wide">
              {card.mensagem || "Hoje, mantenha o foco no essencial."}
            </p>
            <p className="text-[11px] text-cyan-300/80">
              Todos os módulos em prontidão. Sistema em espera operacional.
            </p>
          </div>
        )}

        {/* 12. Resposta Livre / Neural */}
        {card.tipo === 'resposta_neural' && (
          <div className="p-4 rounded-xl border border-purple-400/50 bg-purple-950/30 space-y-2">
            <p className="text-sm text-slate-100 leading-relaxed font-sans">
              {card.texto}
            </p>
            {card.motor && (
              <div className="pt-2 border-t border-purple-500/30 flex justify-between text-[10px] text-purple-300">
                <span>Origem do Processamento:</span>
                <span className="text-cyan-300 font-bold">{card.motor}</span>
              </div>
            )}
          </div>
        )}

        {/* 13. Benchmark de Performance */}
        {card.tipo === 'benchmark' && card.resultadoBenchmark && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-cyan-400/50 bg-gradient-to-r from-cyan-950/40 via-purple-950/40 to-slate-900/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-cyan-300 tracking-widest uppercase">ÍNDICE DE PERFORMANCE</span>
                <div className="text-2xl font-bold font-mono text-cyan-300 flex items-baseline gap-1">
                  <span>{card.resultadoBenchmark.score}</span>
                  <span className="text-xs text-slate-400">/ 1000</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-md text-xs font-bold border border-emerald-400/60 bg-emerald-950/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                {card.resultadoBenchmark.rating}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2.5 rounded-lg border border-purple-500/30 bg-slate-900/50">
                <span className="text-slate-400 block mb-0.5">CPU SPEED (PRIMES)</span>
                <span className="text-cyan-300 font-bold text-xs">{card.resultadoBenchmark.cpuSpeedMs} ms</span>
              </div>
              <div className="p-2.5 rounded-lg border border-purple-500/30 bg-slate-900/50">
                <span className="text-slate-400 block mb-0.5">SHA-256 HASH RATE</span>
                <span className="text-purple-300 font-bold text-xs">{card.resultadoBenchmark.hashesPerSec.toLocaleString('pt-BR')} h/s</span>
              </div>
              <div className="p-2.5 rounded-lg border border-purple-500/30 bg-slate-900/50">
                <span className="text-slate-400 block mb-0.5">RAM THROUGHPUT</span>
                <span className="text-emerald-400 font-bold text-xs">{card.resultadoBenchmark.ramThroughputMBps} MB/s</span>
              </div>
              <div className="p-2.5 rounded-lg border border-purple-500/30 bg-slate-900/50">
                <span className="text-slate-400 block mb-0.5">DISK I/O RATE</span>
                <span className="text-amber-400 font-bold text-xs">{card.resultadoBenchmark.diskThroughputMBps} MB/s</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 flex justify-between px-1">
              <span>{card.resultadoBenchmark.cpuModel}</span>
              <span className="text-cyan-400">{card.resultadoBenchmark.nucleos} Núcleos Virtuais</span>
            </div>
          </div>
        )}

        {/* 14. Bateria & Energia */}
        {card.tipo === 'bateria' && card.infoBateria && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-cyan-400/50 bg-slate-900/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {card.infoBateria.isCharging ? (
                  <BatteryCharging className="w-8 h-8 text-emerald-400 animate-pulse" />
                ) : (
                  <Battery className="w-8 h-8 text-cyan-400" />
                )}
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider">NÍVEL DE CARGA</span>
                  <div className="text-2xl font-bold font-mono text-cyan-300">{card.infoBateria.percent}%</div>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${card.infoBateria.isCharging ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300' : 'border-cyan-500/50 bg-cyan-950/60 text-cyan-300'}`}>
                {card.infoBateria.isCharging ? 'ALIMENTAÇÃO ATIVA' : 'BATERIA'}
              </span>
            </div>

            <div className="space-y-1">
              <div className="w-full h-2 rounded-full bg-slate-900 border border-purple-500/30 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${card.infoBateria.percent > 40 ? 'bg-gradient-to-r from-cyan-400 to-emerald-400' : card.infoBateria.percent > 20 ? 'bg-amber-400' : 'bg-red-500'}`}
                  style={{ width: `${card.infoBateria.percent}%` }}
                />
              </div>
              <p className="text-[10px] text-purple-300/80 text-right">{card.infoBateria.statusText}</p>
            </div>
          </div>
        )}

        {/* 15. Diagnóstico de Rede */}
        {card.tipo === 'diagnostico_rede' && card.diagnosticoRede && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl border border-cyan-500/40 bg-slate-900/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200">ESTADO DA CONEXÃO</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${card.diagnosticoRede.online ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300' : 'border-red-500/50 bg-red-950/60 text-red-300'}`}>
                {card.diagnosticoRede.online ? 'ONLINE' : 'DESCONECTADO'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px] text-center">
              <div className="p-2.5 rounded-lg border border-purple-500/30 bg-slate-900/50">
                <span className="text-slate-400 block mb-0.5">CLOUDFLARE</span>
                <span className="text-cyan-300 font-bold text-xs">{card.diagnosticoRede.pingCloudflare} ms</span>
              </div>
              <div className="p-2.5 rounded-lg border border-purple-500/30 bg-slate-900/50">
                <span className="text-slate-400 block mb-0.5">GOOGLE DNS</span>
                <span className="text-cyan-300 font-bold text-xs">{card.diagnosticoRede.pingGoogle} ms</span>
              </div>
              <div className="p-2.5 rounded-lg border border-purple-500/30 bg-slate-900/50">
                <span className="text-slate-400 block mb-0.5">DNS LOOKUP</span>
                <span className="text-purple-300 font-bold text-xs">{card.diagnosticoRede.dnsSpeedMs} ms</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-purple-500/30 bg-slate-900/40 text-[10px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">IP Público (WAN):</span>
                <span className="text-cyan-300 font-mono">{card.diagnosticoRede.publicIp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">IP Local (LAN):</span>
                <span className="text-purple-300 font-mono">{card.diagnosticoRede.localIp}</span>
              </div>
            </div>
          </div>
        )}

        {/* 16. Cálculo Matemático */}
        {card.tipo === 'calculo' && card.calculo && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl border-2 border-cyan-400/60 bg-gradient-to-br from-cyan-950/40 to-purple-950/40 text-center space-y-1 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-mono mb-1">
                <Calculator className="w-4 h-4 text-cyan-400" />
                <span>{card.calculo.expressao}</span>
              </div>
              <div className="text-3xl font-extrabold font-mono text-cyan-300 tracking-wider">
                = {card.calculo.resultado}
              </div>
            </div>
            <p className="text-[10px] text-purple-300/80 text-center">Processado localmente pelo motor aritmético de precisão.</p>
          </div>
        )}

        {/* 17. Clima Dinâmico (Open-Meteo) */}
        {card.tipo === 'clima_dinamico' && card.resultadoClima && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-cyan-400/50 bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase">{card.resultadoClima.city}</span>
                <div className="text-3xl font-extrabold font-mono text-cyan-300 mt-0.5">
                  {card.resultadoClima.temp}°C
                </div>
                <span className="text-[11px] text-purple-300">{card.resultadoClima.condition}</span>
              </div>
              <div className="text-right space-y-1 text-[11px] font-mono">
                <div className="text-slate-300">Umidade: <span className="text-cyan-300 font-bold">{card.resultadoClima.humidity}%</span></div>
                <div className="text-slate-300">Vento: <span className="text-cyan-300 font-bold">{card.resultadoClima.windKmH} km/h</span></div>
                <div className="text-[9px] text-emerald-400">Open-Meteo Satélite</div>
              </div>
            </div>
          </div>
        )}

        {/* 18. Temporizador / Timer Tático */}
        {card.tipo === 'timer' && card.timer && (
          <div className="p-4 rounded-xl border border-cyan-400/50 bg-slate-900/80 text-center space-y-2">
            <Clock className="w-7 h-7 text-cyan-400 mx-auto animate-pulse" />
            <div className="text-2xl font-mono font-bold text-white tracking-widest">
              {card.timer.label}
            </div>
            <p className="text-[11px] text-cyan-300/80">
              Contagem ativa. Alerta sonoro será emitido na expiração do período.
            </p>
          </div>
        )}

        {/* 19. Anotações Rápidas */}
        {card.tipo === 'anotacoes' && card.anotacoes && (
          <div className="space-y-2">
            {card.anotacoes.length === 0 ? (
              <p className="text-center text-slate-400 py-4 text-xs">Nenhuma anotação registrada ainda.</p>
            ) : (
              card.anotacoes.slice(0, 5).map(nota => (
                <div key={nota.id} className="p-2.5 rounded-lg border border-purple-500/30 bg-slate-900/60 flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-xs break-words">{nota.texto}</p>
                    <span className="text-[9px] text-purple-400 font-mono mt-0.5 block">{nota.data}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 20. Modo de Trabalho */}
        {card.tipo === 'modo_trabalho' && (
          <div className="space-y-2.5">
            <div className="p-3 rounded-lg border border-cyan-500/50 bg-cyan-950/30 flex items-center gap-3">
              <Briefcase className="w-6 h-6 text-cyan-400 shrink-0" />
              <div>
                <span className="text-cyan-300 font-bold uppercase tracking-wider text-xs">
                  AMBIENTE DE TRABALHO ATIVADO
                </span>
                <p className="text-[11px] text-slate-300">
                  Navegador padrão e ferramentas de desenvolvimento carregados.
                </p>
              </div>
            </div>

            {card.modoTrabalho && (
              <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-950/30 space-y-2">
                <span className="text-[10px] text-purple-300 font-bold tracking-wider uppercase block">
                  URLs e Aplicações Iniciadas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {card.modoTrabalho.urls.map((u, i) => (
                    <a
                      key={i}
                      href={u}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-400/40 text-[10px] text-cyan-200 hover:text-white hover:border-cyan-300 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 text-cyan-400" />
                      <span>{u.replace('https://', '').replace('www.', '')}</span>
                    </a>
                  ))}
                  {card.modoTrabalho.apps.map((app, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-400/40 text-[10px] text-purple-200"
                    >
                      <Terminal className="w-3 h-3 text-purple-400" />
                      <span>{app}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 21. Organizador de Arquivos Locais */}
        {card.tipo === 'organizador_arquivos' && card.arquivosScan && (
          <div className="space-y-2.5">
            <div className="p-3 rounded-lg border border-cyan-500/50 bg-cyan-950/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-6 h-6 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-cyan-300 font-bold uppercase tracking-wider text-xs">
                    VARREDURA DE DOCUMENTOS
                  </span>
                  <p className="text-[11px] text-slate-300">
                    {card.arquivosScan.totalFilesFound} arquivos mapeados em disco
                  </p>
                </div>
              </div>

              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/helena/tools/files/organize', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ folder: 'downloads' })
                    });
                    const d = await res.json();
                    alert(d.message || 'Arquivos organizados com sucesso!');
                  } catch (_) {
                    alert('Erro ao organizar arquivos.');
                  }
                }}
                className="px-2.5 py-1 rounded border border-cyan-400 bg-cyan-950/80 hover:bg-cyan-900 text-[10px] font-mono text-cyan-200 hover:text-white transition-all shadow-[0_0_10px_rgba(0,240,255,0.3)] cursor-pointer"
              >
                Organizar Pastas
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 rounded bg-purple-950/30 border border-purple-500/30">
                <span className="text-slate-400 uppercase block">Downloads</span>
                <span className="text-sm font-bold text-cyan-300">
                  {card.arquivosScan.downloads?.totalFiles || 0} arquivos
                </span>
              </div>
              <div className="p-2 rounded bg-purple-950/30 border border-purple-500/30">
                <span className="text-slate-400 uppercase block">Documentos</span>
                <span className="text-sm font-bold text-purple-300">
                  {card.arquivosScan.documents?.totalFiles || 0} arquivos
                </span>
              </div>
            </div>

            {card.arquivosScan.downloads?.categories && (
              <div className="p-2 rounded bg-slate-900/60 border border-purple-500/20 space-y-1">
                <span className="text-[9px] text-purple-400 uppercase font-mono tracking-wider block">
                  Categorias Identificadas em Downloads:
                </span>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div className="flex justify-between text-slate-300">
                    <span>PDFs:</span>
                    <span className="font-bold text-cyan-300">{card.arquivosScan.downloads.categories.pdf?.count || 0}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Imagens:</span>
                    <span className="font-bold text-purple-300">{card.arquivosScan.downloads.categories.imagens?.count || 0}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Instaladores:</span>
                    <span className="font-bold text-amber-300">{card.arquivosScan.downloads.categories.instaladores?.count || 0}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Textos/Planilhas:</span>
                    <span className="font-bold text-emerald-300">{card.arquivosScan.downloads.categories.textos_planilhas?.count || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 22. Memória de Longo Prazo Gravada */}
        {card.tipo === 'memoria_longa' && card.memoriaGravada && (
          <div className="space-y-2.5">
            <div className="p-3 rounded-lg border border-purple-500/60 bg-purple-950/40 flex items-center gap-3 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Brain className="w-6 h-6 text-purple-400 shrink-0 animate-pulse" />
              <div>
                <span className="text-purple-300 font-bold uppercase tracking-wider text-xs">
                  MÓDULO DE MEMÓRIA LONGA (HONCHO)
                </span>
                <p className="text-[11px] text-slate-200 mt-0.5">
                  Diretriz registrada com sucesso na memória contínua.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-cyan-500/40 bg-slate-900/80 space-y-1.5">
              <span className="text-[9px] text-cyan-400 font-mono tracking-widest uppercase">
                CONTEÚDO REGISTRADO:
              </span>
              <p className="text-xs text-white font-mono leading-relaxed">
                "{card.memoriaGravada.resumo}"
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-purple-500/20 text-[9px] text-purple-300/80">
                <span>Relevância: {card.memoriaGravada.relevancia || 'Alta'}</span>
                <span>{new Date(card.memoriaGravada.data).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
        )}

        {/* 23. Modo de Estudos & Semana de Provas */}
        {card.tipo === 'modo_estudo' && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-emerald-500/60 bg-emerald-950/40 flex items-center justify-between shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-emerald-400 shrink-0 animate-pulse" />
                <div>
                  <span className="text-emerald-300 font-bold uppercase tracking-wider text-xs">
                    PROTOCOLO DE ESTUDOS ATIVADO
                  </span>
                  <p className="text-[11px] text-slate-200 mt-0.5">
                    Ambiente otimizado para imersão e retenção neural.
                  </p>
                </div>
              </div>

              {onOpenStudy && (
                <button
                  onClick={onOpenStudy}
                  className="px-3 py-1.5 rounded-lg border border-emerald-400 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 text-xs font-bold transition-all shadow-[0_0_10px_rgba(16,185,129,0.4)] cursor-pointer"
                >
                  Abrir Central (Ctrl+E)
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2.5 rounded bg-slate-900/70 border border-emerald-500/30">
                <span className="text-slate-400 uppercase block">Temporizador Recomendado</span>
                <span className="text-sm font-bold text-emerald-300">25 min Foco / 5 min Pausa</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900/70 border border-cyan-500/30">
                <span className="text-slate-400 uppercase block">Frequência Bioacústica</span>
                <span className="text-sm font-bold text-cyan-300">432Hz Ondas Alfa</span>
              </div>
            </div>

            {card.modoEstudo?.dica && (
              <div className="p-2.5 rounded bg-purple-950/40 border border-purple-500/30 text-[11px] text-purple-200 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{card.modoEstudo.dica}</span>
              </div>
            )}
          </div>
        )}

        {/* 24. Dicas de Estudo & Neurociência */}
        {card.tipo === 'dicas_estudo' && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-cyan-500/60 bg-cyan-950/40 flex items-center gap-3 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Brain className="w-6 h-6 text-cyan-400 shrink-0 animate-pulse" />
              <div>
                <span className="text-cyan-300 font-bold uppercase tracking-wider text-xs">
                  {card.dicasEstudo?.metodo || 'Método Neurocognitivo de Aprendizado'}
                </span>
                <p className="text-[11px] text-slate-200 mt-0.5">
                  {card.dicasEstudo?.explicacao || 'Diretrizes comprovadas pela neurociência para consolidação de memória.'}
                </p>
              </div>
            </div>

            {card.dicasEstudo?.passos && (
              <div className="space-y-1.5 p-3 rounded-lg border border-purple-500/30 bg-slate-900/80">
                <span className="text-[10px] text-purple-300 uppercase font-mono tracking-wider block">
                  Etapas Práticas:
                </span>
                {card.dicasEstudo.passos.map((passo: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                    <span className="text-cyan-400 font-bold">{idx + 1}.</span>
                    <span>{passo}</span>
                  </div>
                ))}
              </div>
            )}

            {onOpenStudy && (
              <div className="flex justify-end">
                <button
                  onClick={onOpenStudy}
                  className="px-3 py-1.5 rounded-lg border border-emerald-400 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 text-xs font-bold transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] cursor-pointer"
                >
                  Ver Todas as Dicas na Central de Estudos
                </button>
              </div>
            )}
          </div>
        )}

        {/* Speech text readout box */}
        <div className="p-3 rounded-lg border border-purple-500/20 bg-slate-950/90 text-purple-300/90 text-[11px] leading-relaxed italic">
          "{card.fala}"
        </div>
      </div>

      {/* Advance / Skip Button */}
      {onNext && (
        <div className="mt-4 pt-3 border-t border-cyan-500/20 flex justify-end">
          <button
            onClick={onNext}
            className="px-4 py-1.5 rounded-lg border border-cyan-400 bg-cyan-950/60 hover:bg-cyan-900/80 transition-all text-xs font-mono font-bold text-cyan-200 hover:text-white flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.3)] hover:shadow-[0_0_20px_rgba(0,240,255,0.6)]"
          >
            <span>AVANÇAR PARA DOCK</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </motion.div>
  );
};
