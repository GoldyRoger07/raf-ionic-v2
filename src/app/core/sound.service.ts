import { Injectable, signal } from '@angular/core';

import { storage } from './storage';

export type SoundName =
  | 'tap'
  | 'count'
  | 'go'
  | 'answer'
  | 'tick'
  | 'timeout'
  | 'win'
  | 'lose'
  | 'success'
  | 'error';

const STORAGE_KEY = 'raf.sound';
const MASTER_VOLUME = 0.5;

interface Tone {
  /** Frequence de depart, en Hz. */
  freq: number;
  /** Frequence d'arrivee (glissando), en Hz. */
  to?: number;
  /** Decalage depuis le debut du son, en secondes. */
  at?: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
}

/*
 * Effets sonores du jeu, synthetises avec Web Audio : aucun fichier a charger,
 * le son part sans delai (utile pour un chrono). Fonctionne dans la PWA comme
 * dans la WebView de Capacitor.
 *
 * Les navigateurs et iOS bloquent l'audio tant que l'utilisateur n'a pas touche
 * l'ecran : le contexte audio est cree, ou relance, au premier toucher.
 */
@Injectable({ providedIn: 'root' })
export class SoundService {
  readonly enabled = signal(true);

  private context: AudioContext | null = null;
  private master: GainNode | null = null;

  constructor() {
    void storage.get(STORAGE_KEY).then((value) => this.enabled.set(value !== 'off'));
    if (typeof document !== 'undefined') {
      document.addEventListener('pointerdown', () => this.unlock(), { capture: true, passive: true });
    }
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.enabled.set(enabled);
    await storage.set(STORAGE_KEY, enabled ? 'on' : 'off');
    if (enabled) {
      this.play('success');
    }
  }

  play(name: SoundName): void {
    if (!this.enabled()) {
      return;
    }
    const ctx = this.unlock();
    if (!ctx || !this.master) {
      return;
    }
    const start = ctx.currentTime + 0.01;
    for (const tone of SOUNDS[name]) {
      this.tone(ctx, this.master, start, tone);
    }
  }

  private unlock(): AudioContext | null {
    if (!this.context) {
      const Ctor = typeof window !== 'undefined' ? (window.AudioContext ?? (window as any).webkitAudioContext) : null;
      if (!Ctor) {
        return null;
      }
      this.context = new Ctor() as AudioContext;
      this.master = this.context.createGain();
      this.master.gain.value = MASTER_VOLUME;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') {
      void this.context.resume().catch(() => undefined);
    }
    return this.context;
  }

  private tone(ctx: AudioContext, output: AudioNode, start: number, tone: Tone): void {
    const begin = start + (tone.at ?? 0);
    const end = begin + tone.duration;
    const peak = tone.volume ?? 0.6;

    const osc = ctx.createOscillator();
    osc.type = tone.type ?? 'sine';
    osc.frequency.setValueAtTime(tone.freq, begin);
    if (tone.to) {
      osc.frequency.exponentialRampToValueAtTime(tone.to, end);
    }

    // Attaque breve puis extinction exponentielle : pas de clic en debut ni en fin de son.
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, begin);
    gain.gain.exponentialRampToValueAtTime(peak, begin + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(gain).connect(output);
    osc.start(begin);
    osc.stop(end + 0.02);
  }
}

/** Do majeur : C5 523, E5 659, G5 784, C6 1047. */
const SOUNDS: Record<SoundName, Tone[]> = {
  tap: [{ freq: 900, to: 600, duration: 0.05, type: 'triangle', volume: 0.25 }],
  count: [{ freq: 660, duration: 0.14, type: 'square', volume: 0.18 }],
  go: [
    { freq: 990, duration: 0.3, type: 'square', volume: 0.2 },
    { freq: 1320, duration: 0.3, type: 'sine', volume: 0.25 },
  ],
  // Reponse prise en compte : « pop » montant, neutre (ne dit pas si elle est juste).
  answer: [
    { freq: 520, to: 780, duration: 0.07, type: 'triangle', volume: 0.45 },
    { freq: 1040, at: 0.06, duration: 0.12, type: 'sine', volume: 0.35 },
  ],
  tick: [{ freq: 1500, duration: 0.03, type: 'square', volume: 0.12 }],
  timeout: [
    { freq: 320, to: 140, duration: 0.45, type: 'sawtooth', volume: 0.25 },
    { freq: 330, to: 150, duration: 0.45, type: 'square', volume: 0.12 },
  ],
  win: [
    { freq: 523, at: 0, duration: 0.14, type: 'triangle' },
    { freq: 659, at: 0.12, duration: 0.14, type: 'triangle' },
    { freq: 784, at: 0.24, duration: 0.14, type: 'triangle' },
    { freq: 1047, at: 0.36, duration: 0.5, type: 'triangle' },
    { freq: 1568, at: 0.36, duration: 0.5, type: 'sine', volume: 0.2 },
  ],
  lose: [
    { freq: 392, at: 0, duration: 0.22, type: 'triangle' },
    { freq: 330, at: 0.2, duration: 0.22, type: 'triangle' },
    { freq: 262, at: 0.4, duration: 0.5, type: 'triangle', to: 240 },
  ],
  success: [
    { freq: 784, duration: 0.12, type: 'sine', volume: 0.4 },
    { freq: 1175, at: 0.09, duration: 0.25, type: 'sine', volume: 0.4 },
  ],
  error: [
    { freq: 220, duration: 0.12, type: 'square', volume: 0.18 },
    { freq: 185, at: 0.13, duration: 0.22, type: 'square', volume: 0.18 },
  ],
};
