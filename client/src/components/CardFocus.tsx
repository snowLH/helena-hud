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
  Rocket
} from 'lucide-react';

interface CardFocusProps {
  card: HelenaCard;
  isSpeaking: boolean;
  onNext?: () => void;
}

export const CardFocus: React.FC<CardFocusProps> = ({ card, isSpeaking, onNext }) => {
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
        {card.tipo === 'processos_pesados' && card.processos && (
          <div className="space-y-2">
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
