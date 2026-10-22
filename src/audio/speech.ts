// Ultra-Natural Studio Voice & Audio Processing Engine for H.E.L.E.N.A.

export interface JarvisVoicePreset {
  id: string;
  name: string;
  voiceKey: string;
  description: string;
  rate: string;
  pitch: string;
  isJarvisDefault?: boolean;
}

export const JARVIS_VOICE_PRESETS: JarvisVoicePreset[] = [
  {
    id: 'helena_multilingual',
    name: 'Helena Ultra-Natural (Multilingual Neural)',
    voiceKey: 'pt-BR-ThalitaMultilingualNeural',
    description: 'Voz feminina humana de última geração. Sem tom robótico, prosódia fluida e respiração realista.',
    rate: '+0%',
    pitch: '+0Hz',
    isJarvisDefault: true
  },
  {
    id: 'jarvis_francisca',
    name: 'Helena Clássica (Francisca Neural)',
    voiceKey: 'pt-BR-FranciscaNeural',
    description: 'Voz feminina aveludada, refinada e suave estilo assistente executiva.',
    rate: '+0%',
    pitch: '+0Hz'
  },
  {
    id: 'helena_google',
    name: 'Helena Estúdio (Google Neural)',
    voiceKey: 'google_pt_br',
    description: 'Voz limpa em streaming direto de alta definição para navegadores e nuvem.',
    rate: '+0%',
    pitch: '+0Hz'
  }
];

class SpeechController {
  private currentAudio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private speakingListeners: Array<(speaking: boolean) => void> = [];
  public isSpeaking: boolean = false;
  public enabled: boolean = true;

  // Selected Neural Voice
  public activePresetId: string = 'helena_multilingual';
  public holographicEffect: boolean = false; // Padrão 100% natural sem metalizado

  constructor() {
    try {
      const savedPreset = localStorage.getItem('helena_jarvis_preset');
      if (savedPreset && JARVIS_VOICE_PRESETS.some((p) => p.id === savedPreset)) {
        this.activePresetId = savedPreset;
      } else {
        this.activePresetId = 'helena_multilingual';
      }

      const savedHolo = localStorage.getItem('helena_holographic_fx');
      if (savedHolo !== null) this.holographicEffect = savedHolo === 'true';
    } catch (_) {}
  }

  public getActivePreset(): JarvisVoicePreset {
    return (
      JARVIS_VOICE_PRESETS.find((p) => p.id === this.activePresetId) ||
      JARVIS_VOICE_PRESETS[0]
    );
  }

  public setActivePreset(presetId: string) {
    this.activePresetId = presetId;
    try {
      localStorage.setItem('helena_jarvis_preset', presetId);
    } catch (_) {}
  }

  public setHolographicEffect(enabled: boolean) {
    this.holographicEffect = enabled;
    try {
      localStorage.setItem('helena_holographic_fx', String(enabled));
    } catch (_) {}
  }

  public onSpeakingChange(cb: (speaking: boolean) => void) {
    this.speakingListeners.push(cb);
    return () => {
      this.speakingListeners = this.speakingListeners.filter((l) => l !== cb);
    };
  }

  private setSpeaking(val: boolean) {
    this.isSpeaking = val;
    this.speakingListeners.forEach((cb) => cb(val));
  }

  public stop() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (_) {}
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    this.setSpeaking(false);
  }

  // Pure Studio Mastering DSP (sem metalizado ou eco distorcido)
  private setupStudioAudioDsp(audioElement: HTMLAudioElement) {
    if (!this.holographicEffect) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const source = this.audioCtx.createMediaElementSource(audioElement);

      const warmth = this.audioCtx.createBiquadFilter();
      warmth.type = 'lowshelf';
      warmth.frequency.value = 180;
      warmth.gain.value = 1.5;

      const clarity = this.audioCtx.createBiquadFilter();
      clarity.type = 'peaking';
      clarity.frequency.value = 3200;
      clarity.gain.value = 1.8;

      const comp = this.audioCtx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 8;
      comp.ratio.value = 2.5;
      comp.attack.value = 0.005;
      comp.release.value = 0.1;

      source.connect(warmth);
      warmth.connect(clarity);
      clarity.connect(comp);
      comp.connect(this.audioCtx.destination);
    } catch (_) {}
  }

  public previewVoice(presetId?: string, text?: string): Promise<void> {
    const original = this.activePresetId;
    if (presetId) this.activePresetId = presetId;
    const sampleText =
      text ||
      'Olá Comandante. Interface de voz natural calibrada. Todos os sistemas operacionais e diagnósticos estão em prontidão.';
    return this.speak(sampleText).finally(() => {
      this.activePresetId = original;
    });
  }

  // Primary Speech method (Studio Neural with automatic streaming fallback)
  public async speak(text: string): Promise<void> {
    if (!text || !this.enabled) return;

    this.stop();
    this.setSpeaking(true);

    const cleanText = text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_#`~]/g, '')
      .trim();

    const preset = this.getActivePreset();

    try {
      // 1. Call backend Studio Neural TTS (/api/tts)
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          voice: preset.voiceKey,
          rate: preset.rate,
          pitch: preset.pitch
        })
      });

      const contentType = response.headers.get('content-type') || '';

      if (response.ok && (contentType.includes('audio/mpeg') || contentType.includes('audio/wav'))) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        return new Promise<void>((resolve) => {
          const audio = new Audio(audioUrl);
          this.currentAudio = audio;

          this.setupStudioAudioDsp(audio);

          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            this.currentAudio = null;
            this.setSpeaking(false);
            resolve();
          };

          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            this.currentAudio = null;
            this.fallbackBrowserSpeech(cleanText).then(resolve);
          };

          audio.play().catch(() => {
            this.fallbackBrowserSpeech(cleanText).then(resolve);
          });
        });
      }
    } catch (err) {
      console.warn('Neural TTS request failed, using fallback:', err);
    }

    // 2. Fallback to Browser Speech if completely offline
    return this.fallbackBrowserSpeech(cleanText);
  }

  private fallbackBrowserSpeech(cleanText: string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setTimeout(() => {
          this.setSpeaking(false);
          resolve();
        }, Math.max(1500, cleanText.length * 50));
        return;
      }

      const synth = window.speechSynthesis;
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'pt-BR';

      const selectBestVoice = () => {
        const voices = synth.getVoices();
        const naturalFemale = voices.find(
          (v) =>
            v.lang.toLowerCase().replace('_', '-').startsWith('pt') &&
            (v.name.toLowerCase().includes('thalita') ||
              v.name.toLowerCase().includes('francisca') ||
              v.name.toLowerCase().includes('leticia') ||
              v.name.toLowerCase().includes('maria') ||
              v.name.toLowerCase().includes('luciana') ||
              (v.name.toLowerCase().includes('natural') && !v.name.toLowerCase().includes('antonio') && !v.name.toLowerCase().includes('daniel')) ||
              (v.name.toLowerCase().includes('online') && !v.name.toLowerCase().includes('antonio') && !v.name.toLowerCase().includes('daniel')) ||
              v.name.toLowerCase().includes('google português'))
        );

        const anyPt =
          naturalFemale ||
          voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith('pt'));

        if (anyPt) {
          utterance.voice = anyPt;
        }
      };

      selectBestVoice();
      if (!utterance.voice && 'onvoiceschanged' in synth) {
        synth.onvoiceschanged = () => selectBestVoice();
      }

      utterance.pitch = 1.0;
      utterance.rate = 1.0;

      let hasEnded = false;
      const finish = () => {
        if (!hasEnded) {
          hasEnded = true;
          this.setSpeaking(false);
          resolve();
        }
      };

      utterance.onstart = () => this.setSpeaking(true);
      utterance.onend = finish;
      utterance.onerror = finish;

      const safetyTimer = setTimeout(finish, Math.max(2500, cleanText.length * 80));
      try {
        synth.speak(utterance);
      } catch (_) {
        clearTimeout(safetyTimer);
        finish();
      }
    });
  }
}

export const speechController = new SpeechController();
