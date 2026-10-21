// Neural Studio TTS & J.A.R.V.I.S. Hologram Acoustic DSP Engine for H.E.L.E.N.A.

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
    id: 'jarvis_francisca',
    name: 'J.A.R.V.I.S. Feminina (Francisca Neural)',
    voiceKey: 'pt-BR-FranciscaNeural',
    description: 'Voz refinada, aveludada, confiante e elegante — idêntica à postura do assistente de Tony Stark.',
    rate: '+2%',
    pitch: '-2Hz',
    isJarvisDefault: true
  },
  {
    id: 'friday_thalita',
    name: 'F.R.I.D.A.Y. Tática (Thalita Neural)',
    voiceKey: 'pt-BR-ThalitaNeural',
    description: 'Voz jovem, ágil, fluida e de alta precisão tecnológica.',
    rate: '+3%',
    pitch: '-1Hz'
  },
  {
    id: 'protocol_elza',
    name: 'Protocolo Tático (Elza Neural)',
    voiceKey: 'pt-BR-ElzaNeural',
    description: 'Voz sóbria, analítica, militar e altamente focada em diretrizes.',
    rate: '+1%',
    pitch: '-3Hz'
  }
];

class SpeechController {
  private currentAudio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private speakingListeners: Array<(speaking: boolean) => void> = [];
  public isSpeaking: boolean = false;
  public enabled: boolean = true;

  // Selected Neural Voice
  public activePresetId: string = 'jarvis_francisca';
  public holographicEffect: boolean = true;

  constructor() {
    try {
      const savedPreset = localStorage.getItem('helena_jarvis_preset');
      if (savedPreset) this.activePresetId = savedPreset;

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

  // J.A.R.V.I.S. Hologram Audio DSP Chain
  private setupHolographicDsp(audioElement: HTMLAudioElement) {
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

      // 1. Warmth Filter (Low-shelf boost around 220Hz for velvety presence)
      const warmth = this.audioCtx.createBiquadFilter();
      warmth.type = 'lowshelf';
      warmth.frequency.value = 220;
      warmth.gain.value = 3.0;

      // 2. Articulation Filter (Peak at 3.4kHz for crisp diction)
      const clarity = this.audioCtx.createBiquadFilter();
      clarity.type = 'peaking';
      clarity.frequency.value = 3400;
      clarity.Q.value = 1.2;
      clarity.gain.value = 2.5;

      // 3. Holographic Room Ambience (Subtle 18ms comb reflection)
      const delay = this.audioCtx.createDelay();
      delay.delayTime.value = 0.018; // 18ms holographic reflection

      const delayFeedback = this.audioCtx.createGain();
      delayFeedback.gain.value = 0.18;

      const delayMix = this.audioCtx.createGain();
      delayMix.gain.value = 0.22;

      // 4. Dynamic Compressor for Broadcast Clarity
      const comp = this.audioCtx.createDynamicsCompressor();
      comp.threshold.value = -22;
      comp.knee.value = 12;
      comp.ratio.value = 4;
      comp.attack.value = 0.003;
      comp.release.value = 0.15;

      // Connect Chain
      source.connect(warmth);
      warmth.connect(clarity);
      clarity.connect(comp);

      // Delay branch
      clarity.connect(delay);
      delay.connect(delayFeedback);
      delayFeedback.connect(delay);
      delay.connect(delayMix);
      delayMix.connect(comp);

      comp.connect(this.audioCtx.destination);
    } catch (_) {
      // Audio element will play through standard direct output if AudioContext already attached
    }
  }

  public previewVoice(presetId?: string, text?: string): Promise<void> {
    const original = this.activePresetId;
    if (presetId) this.activePresetId = presetId;
    const sampleText =
      text ||
      'Bom dia, Comandante. Interface neural conectada. Todos os sistemas operacionais calibrados para sua diretriz.';
    return this.speak(sampleText).finally(() => {
      this.activePresetId = original;
    });
  }

  // Primary Speech method (Studio Neural with automatic fallback)
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
      // 1. Call backend Neural Studio TTS (/api/tts)
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

          this.setupHolographicDsp(audio);

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

    // 2. Fallback to Browser Speech if offline / backend error
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

      const voices = synth.getVoices();
      const naturalVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('pt') &&
          (v.name.toLowerCase().includes('natural') ||
            v.name.toLowerCase().includes('neural') ||
            v.name.toLowerCase().includes('google'))
      );

      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      utterance.pitch = 1.0;
      utterance.rate = 1.02;

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

      const safetyTimer = setTimeout(finish, Math.max(2500, cleanText.length * 90));
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
