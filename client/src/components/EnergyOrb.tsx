import React, { useEffect, useRef, useState } from 'react';
import type { HelenaState } from '../types';
import { ShieldCheck, UserCheck, Camera } from 'lucide-react';
import { soundSynth } from '../audio/synth';

interface EnergyOrbProps {
  state: HelenaState;
  isSpeaking: boolean;
  biometricActive: boolean;
  biometricConfirmed: boolean;
  onBiometricComplete?: () => void;
}

interface Particle3D {
  x: number;
  y: number;
  z: number;
  baseRadius: number;
  speed: number;
  size: number;
  color: string;
}

export const EnergyOrb: React.FC<EnergyOrbProps> = ({
  state,
  isSpeaking,
  biometricActive,
  biometricConfirmed,
  onBiometricComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState<boolean>(true);
  const [scanProgress, setScanProgress] = useState<number>(0);

  // Handle webcam stream when biometricActive is triggered
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let scanInterval: any = null;

    if (biometricActive) {
      soundSynth.playBiometricScan();

      // Request webcam
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400, facingMode: 'user' } })
          .then((mediaStream) => {
            activeStream = mediaStream;
            setStream(mediaStream);
            setCameraAvailable(true);
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
              videoRef.current.play().catch(() => {});
            }
          })
          .catch(() => {
            setCameraAvailable(false);
          });
      } else {
        setCameraAvailable(false);
      }

      // Simulate biometric scanning progression (0 to 100%)
      setScanProgress(0);
      let progress = 0;
      scanInterval = setInterval(() => {
        progress += 4;
        setScanProgress(Math.min(100, progress));
        if (progress % 20 === 0) {
          soundSynth.playBiometricScan();
        }
        if (progress >= 100) {
          clearInterval(scanInterval);
          soundSynth.playBiometricConfirmed();
          if (onBiometricComplete) {
            setTimeout(onBiometricComplete, 700);
          }
        }
      }, 70);
    } else {
      setScanProgress(0);
    }

    return () => {
      if (scanInterval) clearInterval(scanInterval);
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [biometricActive, onBiometricComplete]);

  // Canvas 3D rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    // Generate 3D Particle Cloud
    const particleCount = 280;
    const particles: Particle3D[] = [];
    const colors = ['#00f0ff', '#a855f7', '#38bdf8', '#c084fc', '#ffffff'];

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 110 + Math.random() * 20;

      particles.push({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi),
        baseRadius: radius,
        speed: (Math.random() * 0.008 + 0.004) * (Math.random() > 0.5 ? 1 : -1),
        size: Math.random() * 2.2 + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Dynamic activity multiplier
      const isHighEnergy = isSpeaking || state === 'FALANDO';
      const speedMultiplier = isHighEnergy ? 2.6 : 1.0;
      const waveAmplitude = isHighEnergy ? 12 : 3;

      angle += 0.015 * speedMultiplier;

      // 1. Draw Central Radial Glow
      const glowRad = isHighEnergy ? 150 : 120;
      const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, glowRad);
      gradient.addColorStop(0, isHighEnergy ? 'rgba(0, 240, 255, 0.45)' : 'rgba(168, 85, 247, 0.25)');
      gradient.addColorStop(0.5, isHighEnergy ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0, 240, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(11, 4, 16, 0)');

      ctx.save();
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, glowRad, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Draw 3D Rotating Gyro Rings
      const ringConfigs = [
        { radius: 130, tiltX: 0.8, tiltY: 0.3, speed: 1.0, color: 'rgba(0, 240, 255, 0.65)', width: 1.8, dashed: [8, 6] },
        { radius: 145, tiltX: -0.6, tiltY: 0.7, speed: -1.3, color: 'rgba(192, 132, 252, 0.6)', width: 1.5, dashed: [14, 10] },
        { radius: 160, tiltX: 0.3, tiltY: -0.9, speed: 0.8, color: 'rgba(56, 189, 248, 0.5)', width: 1.2, dashed: [] },
        { radius: 115, tiltX: 1.1, tiltY: -0.4, speed: -1.8, color: 'rgba(0, 240, 255, 0.8)', width: 2.0, dashed: [4, 4] }
      ];

      ringConfigs.forEach((ring) => {
        ctx.save();
        ctx.translate(cx, cy);

        const currentAngle = angle * ring.speed;
        const pulsate = Math.sin(angle * 3 + ring.radius) * waveAmplitude;
        const currentRadius = ring.radius + pulsate;

        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.width;
        if (ring.dashed.length > 0) {
          ctx.setLineDash(ring.dashed);
          ctx.lineDashOffset = -angle * 40 * ring.speed;
        }

        ctx.beginPath();
        // Elliptical projection of tilted 3D ring
        const rx = currentRadius;
        const ry = currentRadius * Math.abs(Math.sin(currentAngle + ring.tiltX));
        ctx.ellipse(0, 0, rx, Math.max(12, ry), currentAngle * 0.4 + ring.tiltY, 0, Math.PI * 2);
        ctx.stroke();

        // High-tech node beacons on ring perimeter
        const nodeAngle = currentAngle * 1.5;
        const nx = Math.cos(nodeAngle) * rx;
        const ny = Math.sin(nodeAngle) * ry;
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(nx, ny, 3.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // 3. Render 3D Particle Cloud
      const fov = 350;
      particles.forEach((p) => {
        // Rotate around Y and X axis
        const cosY = Math.cos(angle * 0.4 + p.speed);
        const sinY = Math.sin(angle * 0.4 + p.speed);
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;

        const cosX = Math.cos(angle * 0.2);
        const sinX = Math.sin(angle * 0.2);
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;

        // Perspective projection
        const scale = fov / (fov + z2 + 180);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;
        const alpha = Math.max(0.15, Math.min(1, (z2 + 150) / 300));

        if (scale > 0) {
          ctx.save();
          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = isHighEnergy ? 8 : 4;
          ctx.beginPath();
          ctx.arc(px, py, p.size * scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // 4. Rotating Reticle Crosshairs and Degree Ticks
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle * 0.15);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 1;

      for (let i = 0; i < 12; i++) {
        const rad = (i * Math.PI * 2) / 12;
        const x1 = Math.cos(rad) * 170;
        const y1 = Math.sin(rad) * 170;
        const x2 = Math.cos(rad) * (i % 3 === 0 ? 185 : 176);
        const y2 = Math.sin(rad) * (i % 3 === 0 ? 185 : 176);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Outer target brackets
      const bracketSize = 195;
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.strokeRect(-bracketSize / 2, -bracketSize / 2, bracketSize, bracketSize);
      ctx.restore();

      // 5. Pulsating Inner Core
      const corePulse = Math.sin(angle * 5) * (isHighEnergy ? 8 : 3);
      const coreRadius = Math.max(16, 26 + corePulse);

      ctx.save();
      ctx.translate(cx, cy);
      const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, coreRadius);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, '#00f0ff');
      coreGrad.addColorStop(0.8, 'rgba(168, 85, 247, 0.8)');
      coreGrad.addColorStop(1, 'rgba(11, 4, 16, 0)');

      ctx.fillStyle = coreGrad;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = isHighEnergy ? 25 : 15;
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, isSpeaking]);

  return (
    <div className="relative flex items-center justify-center w-[320px] h-[320px] sm:w-[360px] sm:h-[360px] lg:w-[390px] lg:h-[390px] pointer-events-none select-none">
      {/* Decorative Holographic HUD Rings */}
      <div className="absolute inset-0 border border-purple-500/20 rounded-full animate-spin-slow pointer-events-none" />
      <div className="absolute inset-4 border border-dashed border-cyan-400/25 rounded-full animate-reverse-spin pointer-events-none" />
      <div className="absolute inset-10 border border-purple-400/15 rounded-full pointer-events-none" />

      {/* Crosshair accents */}
      <div className="absolute -top-1 w-2 h-0.5 bg-cyan-400/60 shadow-[0_0_6px_#00f0ff]" />
      <div className="absolute -bottom-1 w-2 h-0.5 bg-cyan-400/60 shadow-[0_0_6px_#00f0ff]" />
      <div className="absolute -left-1 w-0.5 h-2 bg-cyan-400/60 shadow-[0_0_6px_#00f0ff]" />
      <div className="absolute -right-1 w-0.5 h-2 bg-cyan-400/60 shadow-[0_0_6px_#00f0ff]" />

      {/* 3D Canvas Layer */}
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="absolute inset-0 w-full h-full z-10"
      />

      {/* Biometric Scanning Overlay (Flow A) */}
      {biometricActive && (
        <div className="absolute z-20 flex flex-col items-center justify-center w-[230px] h-[230px] rounded-full border-2 border-cyan-400 bg-slate-950/80 backdrop-blur-md shadow-[0_0_40px_rgba(0,240,255,0.6)] overflow-hidden">
          {cameraAvailable ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-75"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-cyan-400/80">
              <Camera className="w-10 h-10 mb-2 animate-pulse text-purple-400" />
              <span className="text-[10px] tracking-widest uppercase font-mono">Simulação Holográfica</span>
            </div>
          )}

          {/* Biometric Hologram HUD Reticle */}
          <div className="absolute inset-0 border border-cyan-400/40 rounded-full animate-spin-slow pointer-events-none" />
          <div className="absolute inset-3 border border-dashed border-purple-400/60 rounded-full animate-reverse-spin pointer-events-none" />

          {/* Laser Scanning Sweep Line */}
          <div
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#00f0ff] pointer-events-none transition-all duration-75"
            style={{ top: `${scanProgress}%` }}
          />

          {/* Biometric Status Pill */}
          <div className="absolute bottom-3 px-3 py-1 bg-black/80 border border-cyan-500/80 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            {biometricConfirmed ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-mono tracking-wider font-semibold text-emerald-300">
                  IDENTIDADE CONFIRMADA
                </span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="text-[10px] font-mono tracking-wider text-cyan-300">
                  ESCANEANDO {scanProgress}%
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
