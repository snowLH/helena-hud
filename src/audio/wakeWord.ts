// Continuous Wake Word ("HELENA") Engine for Browser + Backend Windows SAPI5 Sync
import { soundSynth } from './synth';
import { speechController } from './speech';

export interface WakeWordHistoryEntry {
  id: string;
  timestamp: string;
  rawTranscript: string;
  cleanCommand: string;
  intent: string;
  source: string;
  status: string;
  responseSummary: string;
}

export interface WakeWordStatus {
  config: {
    enabled: boolean;
    wakeWord: string;
    aliases: string[];
    sensitivity: number;
    noiseSuppression: boolean;
    bargeInInterrupt: boolean;
    selectedDeviceId: string;
    playActivationChime: boolean;
    backgroundAutoSpeak: boolean;
    commandTimeoutMs: number;
  };
  listenerState: 'PASSIVE_LISTENING' | 'AWAITING_COMMAND' | 'PROCESSING_COMMAND' | 'DISABLED';
  lastWakeDetectedAt: string | null;
  lastCommandText: string | null;
  lastResponseText: string | null;
  daemonRunning: boolean;
  audioDevices: Array<{ id: string; name: string; status: string; isDefault?: boolean }>;
  history: WakeWordHistoryEntry[];
}

type CommandCallback = (command: string, fromWakeWord: boolean) => void;
type StatusCallback = (status: Partial<WakeWordStatus>) => void;

class WakeWordClientController {
  private recognition: any = null;
  private isListening: boolean = false;
  private awaitingFollowUpUntil: number = 0;
  private commandCallback: CommandCallback | null = null;
  private statusCallbacks: Set<StatusCallback> = new Set();
  private eventSource: EventSource | null = null;
  private enabled: boolean = true;
  private sensitivity: number = 0.75;
  private lastDispatchedText: string = '';
  private lastDispatchedAt: number = 0;

  public init(onCommand: CommandCallback) {
    this.commandCallback = onCommand;
    this.connectSse();
    this.syncBackendStatus();
  }

  public subscribe(cb: StatusCallback) {
    this.statusCallbacks.add(cb);
    return () => {
      this.statusCallbacks.delete(cb);
    };
  }

  private notifyListeners(partial: Partial<WakeWordStatus>) {
    this.statusCallbacks.forEach((cb) => {
      try { cb(partial); } catch (_) {}
    });
  }

  public async syncBackendStatus(): Promise<WakeWordStatus | null> {
    try {
      const res = await fetch('/api/wakeword/status');
      if (!res.ok) return null;
      const data: WakeWordStatus = await res.json();
      this.enabled = data.config.enabled;
      this.sensitivity = data.config.sensitivity;
      this.notifyListeners(data);
      if (this.enabled && !this.isListening) {
        this.startContinuousBrowserRecognition();
      } else if (!this.enabled && this.isListening) {
        this.stopContinuousBrowserRecognition();
      }
      return data;
    } catch (_) {
      return null;
    }
  }

  private connectSse() {
    if (typeof window === 'undefined' || this.eventSource) return;
    try {
      const es = new EventSource('/api/wakeword/stream');
      this.eventSource = es;
      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload.event === 'wakeword_status' || payload.event === 'wakeword_config') {
            if (payload.data?.config) {
              this.enabled = payload.data.config.enabled;
              this.sensitivity = payload.data.config.sensitivity;
            }
            this.notifyListeners(payload.data);
          } else if (payload.event === 'wakeword_detected') {
            soundSynth.playBiometricConfirmed();
            this.notifyListeners({
              listenerState: payload.data?.state || 'AWAITING_COMMAND',
              lastWakeDetectedAt: payload.data?.timestamp
            });
          } else if (payload.event === 'wakeword_completed') {
            this.syncBackendStatus();
          }
        } catch (_) {}
      };
      es.onerror = () => {
        try { es.close(); } catch (_) {}
        this.eventSource = null;
        setTimeout(() => this.connectSse(), 5000);
      };
    } catch (_) {}
  }

  public startContinuousBrowserRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec || this.isListening) return;

    try {
      const rec = new SpeechRec();
      rec.lang = 'pt-BR';
      rec.continuous = true;
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onresult = (event: any) => {
        if (!this.enabled) return;
        const lastIdx = event.results.length - 1;
        const transcript = (event.results[lastIdx]?.[0]?.transcript || '').trim();
        const confidence = event.results[lastIdx]?.[0]?.confidence ?? 0.85;
        if (!transcript) return;

        // Filter out ambient noise below sensitivity threshold
        const minConf = Math.max(0.15, 0.9 - this.sensitivity * 0.7);
        if (confidence < minConf && transcript.length < 5) return;

        this.processSpokenPhrase(transcript);
      };

      rec.onerror = () => {};
      rec.onend = () => {
        this.isListening = false;
        if (this.enabled) {
          setTimeout(() => {
            if (this.enabled && !this.isListening) {
              this.startContinuousBrowserRecognition();
            }
          }, 1200);
        }
      };

      rec.start();
      this.recognition = rec;
      this.isListening = true;
    } catch (_) {
      this.isListening = false;
    }
  }

  public stopContinuousBrowserRecognition() {
    this.isListening = false;
    if (this.recognition) {
      try { this.recognition.stop(); } catch (_) {}
      this.recognition = null;
    }
  }

  public processSpokenPhrase(rawTranscript: string) {
    const clean = rawTranscript.trim();
    const lower = clean.toLowerCase();
    const now = Date.now();

    // Prevent duplicate dispatch within 2 seconds
    if (clean === this.lastDispatchedText && now - this.lastDispatchedAt < 2000) {
      return;
    }

    // Check barge-in stop command
    if (
      lower === 'helena pare' ||
      lower === 'helena cancelar' ||
      lower === 'helena silêncio' ||
      lower === 'pare de falar'
    ) {
      speechController.stop();
      this.awaitingFollowUpUntil = 0;
      fetch('/api/wakeword/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'voice_barge_in' })
      }).catch(() => {});
      return;
    }

    const wakeMatch = clean.match(/^(?:ol[aá]\s+|ei\s+|oi\s+|ok\s+)?(?:helena|elena|h\.e\.l\.e\.n\.a\.)[,:\s!.?]*(.*)$/i);

    if (wakeMatch) {
      const remainder = (wakeMatch[1] || '').trim();
      soundSynth.playBiometricConfirmed();

      // Interrupt current speech on wake word (barge-in)
      speechController.stop();

      if (!remainder) {
        // User just said "HELENA" -> await command for 8 seconds
        this.awaitingFollowUpUntil = now + 8000;
        this.notifyListeners({
          listenerState: 'AWAITING_COMMAND',
          lastWakeDetectedAt: new Date().toISOString()
        });
        fetch('/api/wakeword/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: 'HELENA', source: 'browser_wake_word' })
        }).catch(() => {});
        return;
      }

      // User said "HELENA, <command>" in one phrase
      this.awaitingFollowUpUntil = 0;
      this.lastDispatchedText = clean;
      this.lastDispatchedAt = now;
      if (this.commandCallback) {
        this.commandCallback(clean, true);
      }
      return;
    }

    // Check if we are within the 8-second follow-up window after saying "HELENA"
    if (now < this.awaitingFollowUpUntil) {
      this.awaitingFollowUpUntil = 0;
      this.lastDispatchedText = clean;
      this.lastDispatchedAt = now;
      if (this.commandCallback) {
        this.commandCallback(`HELENA, ${clean}`, true);
      }
    }
  }
}

export const wakeWordController = new WakeWordClientController();
