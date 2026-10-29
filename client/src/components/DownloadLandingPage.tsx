import React, { useState, useEffect } from 'react';
import {
  Download,
  Usb,
  Cpu,
  HardDrive,
  ShieldCheck,
  Zap,
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  ExternalLink,
  Laptop,
  Flame,
  Volume2,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Server,
  Layers,
  ArrowRight
} from 'lucide-react';

interface DownloadLandingPageProps {
  onOpenDemoApp?: () => void;
}

export const DownloadLandingPage: React.FC<DownloadLandingPageProps> = ({ onOpenDemoApp }) => {
  const [isLocalOnline, setIsLocalOnline] = useState<boolean>(false);
  const [checkingLocal, setCheckingLocal] = useState<boolean>(true);
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);

  // Probe if local H.E.L.E.N.A. agent is running on localhost:3000
  useEffect(() => {
    let isMounted = true;
    const probeLocalAgent = async () => {
      try {
        const res = await fetch('http://127.0.0.1:3000/api/system/status', {
          signal: AbortSignal.timeout(1000)
        });
        if (res.ok && isMounted) {
          setIsLocalOnline(true);
        } else if (isMounted) {
          setIsLocalOnline(false);
        }
      } catch (_) {
        if (isMounted) setIsLocalOnline(false);
      } finally {
        if (isMounted) setCheckingLocal(false);
      }
    };

    probeLocalAgent();
    const interval = setInterval(probeLocalAgent, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleCopyGit = () => {
    navigator.clipboard.writeText('git clone https://github.com/snowLH/helena-hud.git');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-black relative overflow-x-hidden">
      {/* Background Cyber Grid & Glow */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 20%, rgba(0, 240, 255, 0.15) 0%, transparent 60%),
                            linear-gradient(rgba(0, 240, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 240, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: '100% 100%, 40px 40px, 40px 40px'
        }}
      />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/10 blur-[140px] pointer-events-none rounded-full" />

      {/* Header */}
      <header className="relative z-10 border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-md sticky top-0 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            <Usb className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-white text-base tracking-widest">H.E.L.E.N.A.</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                v2.5 PORTABLE
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400/70 block">
              COPILOTO AUTÔNOMO PARA O SISTEMA OPERACIONAL
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Local Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/60 font-mono text-xs">
            <span className={`w-2 h-2 rounded-full ${isLocalOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400/80'}`} />
            <span className={isLocalOnline ? 'text-emerald-400' : 'text-slate-400'}>
              {checkingLocal ? 'Verificando PC...' : isLocalOnline ? 'Agente Local Ativo (Porta 3000)' : 'Aguardando Download'}
            </span>
          </div>

          {isLocalOnline ? (
            <a
              href="http://localhost:3000?mode=app"
              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs transition-all flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>ABRIR NO MEU PC</span>
            </a>
          ) : (
            <a
              href="#download"
              className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs transition-all flex items-center gap-1.5 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>BAIXAR AGORA</span>
            </a>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-16 sm:space-y-24">
        
        {/* HERO SECTION */}
        <section className="text-center space-y-6 sm:space-y-8 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 font-mono text-xs tracking-wider uppercase shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Ferramenta Nativa para Windows 10 & 11 • 100% Portátil</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-cyan-300 tracking-tight leading-tight">
            Copiloto Pessoal com Acesso Total ao Seu Computador
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto font-sans">
            A <strong className="text-white font-bold">H.E.L.E.N.A.</strong> é um software desktop autônomo. 
            Ela não roda limitada dentro de um navegador: você baixa a ferramenta e executa diretamente no seu computador ou Pen Drive para ter 
            <span className="text-cyan-300 font-semibold"> diagnósticos reais de hardware</span>, 
            <span className="text-cyan-300 font-semibold"> reparos do Windows (DISM/SFC)</span>, 
            <span className="text-cyan-300 font-semibold"> voz neural contínua</span> e 
            <span className="text-cyan-300 font-semibold"> inteligência artificial local</span>.
          </p>

          {/* Active Local Banner if already running */}
          {isLocalOnline && (
            <div className="p-4 rounded-2xl border-2 border-emerald-500/60 bg-emerald-950/30 backdrop-blur-md flex items-center justify-between gap-4 text-left shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-300 text-sm font-mono">
                    H.E.L.E.N.A. LOCAL DETECTADA EM EXECUÇÃO!
                  </h4>
                  <p className="text-xs text-slate-300">
                    O agente já está ativo no seu computador com acesso irrestrito ao sistema.
                  </p>
                </div>
              </div>
              <a
                href="http://localhost:3000?mode=app"
                className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs font-mono transition-all flex items-center gap-2 shrink-0 shadow-lg"
              >
                <span>ENTRAR NO APP</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* PRIMARY DOWNLOAD BUTTONS */}
          <div id="download" className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Main ZIP Download */}
            <a
              href="/downloads/helena-portatil.zip"
              download="helena-portatil.zip"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-sm sm:text-base transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_35px_rgba(0,240,255,0.5)] flex items-center justify-center gap-3 group cursor-pointer"
            >
              <Download className="w-5 h-5 text-slate-950 group-hover:translate-y-0.5 transition-transform" />
              <div className="text-left font-mono">
                <div className="leading-tight">BAIXAR H.E.L.E.N.A. PORTÁTIL (ZIP)</div>
                <div className="text-[11px] font-normal text-slate-900/80">
                  Pacote Completo • 0.78 MB • Para Pen Drive ou PC
                </div>
              </div>
            </a>

            {/* Direct BAT Launcher */}
            <a
              href="/downloads/HELENA_PENDRIVE.bat"
              download="HELENA_PENDRIVE.bat"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl border-2 border-cyan-500/40 bg-slate-900/80 hover:bg-cyan-950/30 hover:border-cyan-400 text-white font-bold text-sm sm:text-base transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(0,240,255,0.15)] flex items-center justify-center gap-3 group cursor-pointer"
            >
              <Terminal className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform" />
              <div className="text-left font-mono">
                <div className="leading-tight">BAIXAR LAUNCHER (.BAT)</div>
                <div className="text-[11px] font-normal text-slate-400">
                  Inicializador 1-Clique • Auto-configurável
                </div>
              </div>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-slate-400 pt-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              Zero Instalação
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              Sem Direitos de Administrador
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              Compatível com Qualquer Pen Drive
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              100% Gratuito & Aberto
            </span>
          </div>
        </section>

        {/* COMPARISON: NAVEGADOR VS. APLICATIVO NATIVO */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              POR QUE BAIXAR NO SEU COMPUTADOR?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Navegadores rodam páginas web dentro de uma sandbox estrita que impede qualquer acesso real ao computador. Ao baixar a H.E.L.E.N.A., ela passa a operar diretamente no seu sistema operacional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: In the Browser (Limited) */}
            <div className="p-6 rounded-2xl border border-red-500/30 bg-red-950/10 space-y-4">
              <div className="flex items-center gap-3 text-red-400 font-mono font-bold text-sm">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <span>NO NAVEGADOR (SANDBOX ISOLADA)</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 font-sans">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold shrink-0">✕</span>
                  <span><strong>Sem acesso ao hardware:</strong> Não lê a sua CPU real, temperatura, memórias ou saúde dos discos (apenas dados genéricos de nuvem).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold shrink-0">✕</span>
                  <span><strong>Sem comandos do Windows:</strong> Bloqueado de rodar PowerShell, CMD, DISM ou qualquer diagnóstico de sistema.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold shrink-0">✕</span>
                  <span><strong>Sem privacidade local:</strong> Depende de servidores de terceiros para processar suas mensagens.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold shrink-0">✕</span>
                  <span><strong>Não altera nem repara arquivos:</strong> Impossibilitado de corrigir falhas ou otimizar inicializações.</span>
                </li>
              </ul>
            </div>

            {/* Box 2: Native App (Full Access) */}
            <div className="p-6 rounded-2xl border-2 border-emerald-500/50 bg-emerald-950/20 space-y-4 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <div className="flex items-center gap-3 text-emerald-400 font-mono font-bold text-sm">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <span>BAIXADA NO SEU PC (ACESSO REAL AO SISTEMA)</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 font-sans">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Hardware 100% Real:</strong> Identifica exatamente sua CPU (Intel Core i5 / Ryzen), frequência, módulos de RAM física, modelo Lenovo/Dell e integridade do SSD.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Manutenção Completa do Windows:</strong> Executa <code className="text-emerald-300 font-mono">sfc /scannow</code>, <code className="text-emerald-300 font-mono">DISM ScanHealth/RestoreHealth</code> e limpeza de logs corrompidos.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Voz Neural e Automação:</strong> Síntese de voz realista e comandos diretos sem latência de internet.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>IA Local com Ollama / Qwen2.5-Coder:</strong> Executa modelos de linguagem diretamente na sua GPU/CPU com zero vazamento de dados.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3-STEP QUICKSTART */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              COMO USAR NO SEU COMPUTADOR OU PEN DRIVE
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Três passos simples para ter a H.E.L.E.N.A. operando em qualquer máquina Windows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl border border-cyan-500/30 bg-slate-900/60 relative overflow-hidden space-y-3">
              <div className="text-4xl font-mono font-black text-cyan-500/20 absolute top-3 right-4 select-none">
                01
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="font-mono font-bold text-base text-white">1. Baixar o Pacote</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Clique no botão de download acima para baixar o arquivo <code className="text-cyan-300 font-mono font-semibold">helena-portatil.zip</code> (apenas 0.78 MB).
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl border border-cyan-500/30 bg-slate-900/60 relative overflow-hidden space-y-3">
              <div className="text-4xl font-mono font-black text-cyan-500/20 absolute top-3 right-4 select-none">
                02
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Usb className="w-5 h-5" />
              </div>
              <h3 className="font-mono font-bold text-base text-white">2. Extrair no PC ou Pen Drive</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Extraia a pasta em qualquer diretório do seu computador ou copie diretamente para a raiz do seu Pen Drive.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl border-2 border-cyan-400/50 bg-slate-900/90 relative overflow-hidden space-y-3 shadow-[0_0_30px_rgba(0,240,255,0.15)]">
              <div className="text-4xl font-mono font-black text-cyan-500/20 absolute top-3 right-4 select-none">
                03
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <h3 className="font-mono font-bold text-base text-cyan-300">3. Dar Duplo Clique no .BAT</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Execute o arquivo <code className="text-cyan-300 font-mono font-semibold">HELENA_PENDRIVE.bat</code> ou <code className="text-cyan-300 font-mono font-semibold">Iniciar_HELENA.bat</code>. A H.E.L.E.N.A. abrirá em tela cheia com acesso total ao computador!
              </p>
            </div>
          </div>
        </section>

        {/* CORE CAPABILITIES GRID */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              CAPACIDADES DO COPILOTO NATIVO
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Tudo o que é desbloqueado no momento em que você executa a H.E.L.E.N.A. no seu PC.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Capability 1 */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-cyan-500/40 transition-colors space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h4 className="font-mono font-bold text-sm text-white">Diagnóstico Real de Hardware</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Leitura em tempo real do processador (cores e frequências), memória RAM física instalada, discos NVMe/SSD, saúde da bateria e placa-mãe.
              </p>
            </div>

            {/* Capability 2 */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-cyan-500/40 transition-colors space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Terminal className="w-5 h-5" />
              </div>
              <h4 className="font-mono font-bold text-sm text-white">Reparação DISM & SFC</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Ferramentas automatizadas para verificar integridade da imagem do Windows, reparar arquivos corrompidos do sistema e limpar arquivos temporários.
              </p>
            </div>

            {/* Capability 3 */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-cyan-500/40 transition-colors space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Volume2 className="w-5 h-5" />
              </div>
              <h4 className="font-mono font-bold text-sm text-white">Voz Neural Humana</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Interação por voz bidirecional ultra-realista com feedback sonoro e visualização de frequências estilo HUD futurista.
              </p>
            </div>

            {/* Capability 4 */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-cyan-500/40 transition-colors space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-mono font-bold text-sm text-white">IA Híbrida (Local + Nuvem)</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Suporte integrado para modelos Ollama locais (Qwen2.5-Coder / Llama 3) para operação offline e confidencial, ou chaves Gemini, OpenAI e Claude.
              </p>
            </div>

            {/* Capability 5 */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-cyan-500/40 transition-colors space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-mono font-bold text-sm text-white">Memória Persistente</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Guarda histórico de tarefas, notas, rotinas de estudo e comandos favoritos diretamente em arquivos JSON locais na pasta do Pen Drive.
              </p>
            </div>

            {/* Capability 6 */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-cyan-500/40 transition-colors space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Usb className="w-5 h-5" />
              </div>
              <h4 className="font-mono font-bold text-sm text-white">Auto-Download de Runtime</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Se o computador de destino não tiver Node.js instalado, o inicializador faz o download do binário portátil automaticamente para a pasta do Pen Drive.
              </p>
            </div>
          </div>
        </section>

        {/* DEVELOPER / ADVANCED CLONE */}
        <section className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              CLONE DIRETO VIA GIT (DESENVOLVEDORES)
            </span>
            <button
              onClick={handleCopyGit}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmd ? 'COPIADO!' : 'COPIAR'}</span>
            </button>
          </div>
          <div className="p-3 rounded-lg bg-black/60 border border-slate-800 text-cyan-300 text-xs font-mono select-all overflow-x-auto">
            git clone https://github.com/snowLH/helena-hud.git
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950 py-8 px-4 sm:px-8 mt-16 text-center space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-xs text-slate-400">
          <span>H.E.L.E.N.A. © 2026</span>
          <span>•</span>
          <a
            href="https://github.com/snowLH/helena-hud"
            target="_blank"
            rel="noreferrer"
            className="hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <span>GitHub Repository</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span>•</span>
          <a
            href="/downloads/helena-portatil.zip"
            download="helena-portatil.zip"
            className="hover:text-cyan-300 transition-colors"
          >
            Download ZIP
          </a>
          <span>•</span>
          <a
            href="/downloads/HELENA_PENDRIVE.bat"
            download="HELENA_PENDRIVE.bat"
            className="hover:text-cyan-300 transition-colors"
          >
            Download .BAT
          </a>
        </div>

        {/* Demo Mode Link */}
        <div className="pt-2 text-center">
          <p className="text-[11px] font-mono text-slate-500">
            Acessando de um dispositivo sem Windows ou quer testar a interface no navegador?{' '}
            <button
              onClick={() => {
                if (onOpenDemoApp) {
                  onOpenDemoApp();
                } else {
                  window.location.search = '?mode=app';
                }
              }}
              className="text-cyan-400/80 hover:text-cyan-300 underline cursor-pointer"
            >
              Visualizar Demonstração Web no Navegador
            </button>
          </p>
        </div>
      </footer>
    </div>
  );
};
