/**
 * HUNTR — Web Audio Service & Acoustic Synthesizer
 * 1:1 Parity with Flutter AudioService (lib/services/audio_service.dart)
 * Generates zero-latency acoustic chimes and signals using browser Web Audio API.
 */

class AudioService {
  private static _instance: AudioService;
  private _soundEnabled: boolean = true;
  private _audioCtx: AudioContext | null = null;

  private constructor() {
    try {
      const saved = localStorage.getItem('hunter_sound_enabled');
      if (saved !== null) {
        this._soundEnabled = saved === 'true';
      }
    } catch {
      this._soundEnabled = true;
    }
  }

  public static get instance(): AudioService {
    if (!AudioService._instance) {
      AudioService._instance = new AudioService();
    }
    return AudioService._instance;
  }

  public get soundEnabled(): boolean {
    return this._soundEnabled;
  }

  public set soundEnabled(val: boolean) {
    this._soundEnabled = val;
    try {
      localStorage.setItem('hunter_sound_enabled', String(val));
    } catch {}
  }

  public isMuted(): boolean {
    return !this._soundEnabled;
  }

  public setMuted(val: boolean): void {
    this.soundEnabled = !val;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this._audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this._audioCtx = new AudioCtxClass();
      }
    }
    if (this._audioCtx && this._audioCtx.state === 'suspended') {
      this._audioCtx.resume().catch(() => {});
    }
    return this._audioCtx;
  }

  /**
   * Click / Tap UI Feedback
   */
  public playClick(): void {
    if (!this._soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  /**
   * Quest Cleared / Task Success chime
   */
  public playSuccess(): void {
    if (!this._soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [587.33, 880, 1174.66]; // D5, A5, D6

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.12, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.3);
      });
    } catch {}
  }

  /**
   * Level Up / Rank Promotion / Victory Fanfare
   */
  public playLevelUp(): void {
    if (!this._soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Solo Leveling Power Surge Chords: C5, E5, G5, B5, C6
      const freqs = [523.25, 659.25, 783.99, 987.77, 1046.50];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.15, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.5);
      });
    } catch {}
  }

  /**
   * System Awakening Ceremony
   */
  public playAwakening(): void {
    if (!this._soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Deep resonant awakening sweep: 110Hz up to 880Hz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.6);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.7);
    } catch {}
  }

  /**
   * Red Gate / Emergency Dungeon Alert Pulse
   */
  public playDungeonAlert(): void {
    if (!this._soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Low pulsing dual alarm tone: 220Hz and 165Hz
      [220, 165, 220, 165].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);

        gain.gain.setValueAtTime(0.15, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.13);
      });
    } catch {}
  }
}

export const audioService = AudioService.instance;
