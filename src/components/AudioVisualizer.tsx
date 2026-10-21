import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isSpeaking: boolean;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isSpeaking, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;
    const barCount = 28;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      t += isSpeaking ? 0.22 : 0.05;

      const barWidth = (w - (barCount - 1) * 2) / barCount;
      const centerY = h / 2;

      for (let i = 0; i < barCount; i++) {
        // High variation when speaking, gentle breathing wave when idle
        const wave1 = Math.sin(t + i * 0.35);
        const wave2 = Math.cos(t * 1.4 - i * 0.25);
        const wave3 = Math.sin(t * 2.1 + i * 0.6);

        let heightRatio = 0.12;
        if (isSpeaking) {
          const raw = Math.abs(wave1 * 0.45 + wave2 * 0.35 + wave3 * 0.2);
          // Bell curve multiplier so center bars have higher peaks
          const distFromCenter = Math.abs(i - barCount / 2) / (barCount / 2);
          const bell = 1 - distFromCenter * 0.4;
          heightRatio = Math.max(0.1, raw * bell);
        } else {
          heightRatio = 0.08 + Math.abs(Math.sin(t * 0.5 + i * 0.15)) * 0.1;
        }

        const barHeight = Math.max(3, heightRatio * h);
        const x = i * (barWidth + 2);
        const y = centerY - barHeight / 2;

        // Gradient for each bar
        const grad = ctx.createLinearGradient(x, y, x, y + barHeight);
        if (isSpeaking) {
          grad.addColorStop(0, '#00f0ff');
          grad.addColorStop(0.5, '#a855f7');
          grad.addColorStop(1, '#38bdf8');
        } else {
          grad.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
          grad.addColorStop(1, 'rgba(168, 85, 247, 0.2)');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isSpeaking]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-center justify-between w-full mb-1 text-[10px] font-mono tracking-wider text-cyan-400/80">
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-cyan-400 animate-ping' : 'bg-purple-500'}`} />
          MODULAÇÃO DE VOZ
        </span>
        <span className="text-purple-300/70">{isSpeaking ? 'FREQUÊNCIA ATIVA' : 'SQUELCH OK'}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={220}
        height={38}
        className="w-full h-[38px] rounded bg-purple-950/20 border border-purple-500/20 shadow-inner"
      />
    </div>
  );
};
