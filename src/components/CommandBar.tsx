import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Terminal, Sparkles, Zap, Trash2, Cpu, Wrench, Power, Globe, Rocket } from 'lucide-react';
import { soundSynth } from '../audio/synth';

interface CommandBarProps {
  onExecuteCommand: (command: string) => void;
  isProcessing: boolean;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  onExecuteCommand,
  isProcessing
}) => {
  const [inputVal, setInputVal] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onstart = () => {
        setIsListening(true);
        soundSynth.playTelemetryBeep(1.4);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        const currentText = (final || interim).trim();
        setLiveTranscript(currentText);

        if (final.trim()) {
          soundSynth.playTelemetryBeep();
          onExecuteCommand(final.trim());
          setLiveTranscript('');
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
          console.warn('SpeechRecognition notice:', e.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (_) {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, [onExecuteCommand]);

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition start exception:', err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isProcessing) return;
    soundSynth.playTelemetryBeep();
    onExecuteCommand(inputVal.trim());
    setInputVal('');
  };

  const quickPills = [
    { label: 'Helena, bom dia', icon: <Sparkles className="w-3 h-3 text-cyan-400" /> },
    { label: 'Helena, otimizar computador', icon: <Zap className="w-3 h-3 text-amber-400" /> },
    { label: 'Helena, reparar o PC', icon: <Wrench className="w-3 h-3 text-emerald-400" /> },
    { label: 'Helena, programas de inicialização', icon: <Power className="w-3 h-3 text-purple-400" /> },
    { label: 'Helena, abrir calculadora', icon: <Rocket className="w-3 h-3 text-rose-400" /> },
    { label: 'Helena, o que é IA?', icon: <Globe className="w-3 h-3 text-cyan-400" /> }
  ];

  return (
    <div className="w-full max-w-[780px] flex flex-col items-center gap-2 z-30 select-none pointer-events-auto">
      {/* Quick Action Pill Buttons */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {quickPills.map((pill, idx) => (
          <button
            key={idx}
            disabled={isProcessing}
            onClick={() => {
              soundSynth.playTelemetryBeep(1.1);
              onExecuteCommand(pill.label);
            }}
            className="px-3 py-1 rounded-full border border-purple-500/40 bg-slate-950/70 hover:bg-purple-950/60 hover:border-cyan-400 transition-all text-[11px] font-mono text-purple-200 hover:text-white flex items-center gap-1.5 shadow-[0_0_12px_rgba(11,4,16,0.6)] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] disabled:opacity-50"
          >
            {pill.icon}
            <span>{pill.label}</span>
          </button>
        ))}
      </div>

      {/* Main Command Input Box & Microphone Button */}
      <form
        onSubmit={handleSubmit}
        className="w-full flex items-center gap-2 p-1.5 rounded-2xl border-2 border-purple-500/40 bg-slate-950/80 backdrop-blur-xl shadow-[0_0_25px_rgba(11,4,16,0.8)] focus-within:border-cyan-400/80 transition-all"
      >
        {/* Terminal Icon Prefix */}
        <div className="pl-3 pr-1 text-cyan-400">
          <Terminal className="w-4 h-4" />
        </div>

        {/* Text Input */}
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={
            isListening
              ? liveTranscript || "Ouvindo... Diga 'Helena, bom dia' ou 'Helena, otimizar o PC'..."
              : "Digite um comando ou fale com a H.E.L.E.N.A...."
          }
          disabled={isProcessing}
          className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-white placeholder-slate-500 px-1 py-1"
        />

        {/* Live speech feedback badge */}
        {isListening && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400 text-[10px] font-mono text-cyan-300 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>ESCUTANDO</span>
          </div>
        )}

        {/* Microphone Button */}
        {speechSupported && (
          <button
            type="button"
            onClick={toggleMic}
            className={`p-2 rounded-xl transition-all border ${
              isListening
                ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse'
                : 'bg-purple-950/60 border-purple-500/40 text-purple-300 hover:text-cyan-300 hover:border-cyan-400'
            }`}
            title={isListening ? 'Desativar Microfone' : 'Ativar Microfone Contínuo'}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
        )}

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputVal.trim() || isProcessing}
          className="px-3.5 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(0,240,255,0.3)]"
          title="Executar Comando"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
