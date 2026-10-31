/**
 * Procedural Web Audio API Synthesizer
 * Zero external audio files/404s. Generates rich retro-cyber synth sounds,
 * laser blasts, explosions, overclocks, and background synthwave arpeggios.
 */

class SoundSynth {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private bgmInterval: number | null = null;
  private isBgmPlaying: boolean = false;
  private bgmTempo: number = 128; // BPM
  private bgmStep: number = 0;
  private isOverclocked: boolean = false;

  constructor() {
    // Read mute preference from localStorage
    try {
      this.isMuted = localStorage.getItem('kernel_muted') === 'true';
    } catch {
      this.isMuted = false;
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.45, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : 0.2, this.ctx.currentTime);
      this.bgmGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('kernel_muted', String(muted));
    } catch {
      // ignore
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.45, this.ctx.currentTime);
    }
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(muted ? 0 : 0.2, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // --- Sound Effects ---

  /** Laser Blaster Shot */
  public playShoot() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    // Frequency drop for laser chirp
    const startFreq = this.isOverclocked ? 980 : 820;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.09);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  /** Enemy Hit (Crunchy impact) */
  public playHit(heavy: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const dur = heavy ? 0.16 : 0.08;

    // Noise buffer for impact crunch
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(heavy ? 600 : 1200, t);
    filter.Q.setValueAtTime(3, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(heavy ? 0.45 : 0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
  }

  /** Garbage Collection Shockwave Blast */
  public playGarbageCollect() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    // Sub-bass thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 0.45);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.5);

    // Filtered noise sweep
    const dur = 0.4;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3500, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + dur);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(t);
  }

  /** Overclock Activation */
  public playOverclock() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const notes = [330, 440, 554, 659, 880, 1108]; // E major arpeggio
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const noteTime = t + idx * 0.04;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.2, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(noteTime);
      osc.stop(noteTime + 0.16);
    });
  }

  /** Dash / Git Force Push */
  public playDash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.18);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  /** Memory Crystal / XP Pickup */
  public playPickup() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const note = 880 + Math.random() * 400;
    osc.frequency.setValueAtTime(note, t);
    osc.frequency.exponentialRampToValueAtTime(note * 1.5, t + 0.08);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  /** Level Up / Tech Stack Upgraded */
  public playLevelUp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const chords = [
      [440, 554, 659], // A
      [554, 659, 830], // C#m
      [659, 830, 987], // E
      [880, 1108, 1318] // A high
    ];

    chords.forEach((chord, i) => {
      const stepTime = t + i * 0.08;
      chord.forEach(freq => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, stepTime);

        gain.gain.setValueAtTime(0.18, stepTime);
        gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(stepTime);
        osc.stop(stepTime + 0.25);
      });
    });
  }

  /** Player Damaged / Shield Crack */
  public playPlayerHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.22);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  /** Boss Alarm / Siren */
  public playBossAlarm() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const stepTime = t + i * 0.25;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(440, stepTime);
      osc.frequency.linearRampToValueAtTime(880, stepTime + 0.2);

      gain.gain.setValueAtTime(0.3, stepTime);
      gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.24);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(stepTime);
      osc.stop(stepTime + 0.24);
    }
  }

  /** Game Over Kernel Panic */
  public playGameOver() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 1.2);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 1.2);
  }

  // --- Adaptive Procedural Synthwave BGM ---
  public startBGM() {
    if (this.isBgmPlaying) return;
    this.initCtx();
    this.isBgmPlaying = true;
    this.bgmStep = 0;

    // 16-step bassline & synth sequence
    const bassline = [
      110, 110, 110, 165, // A2, A2, A2, E3
      110, 110, 130.8, 146.8, // A2, A2, C3, D3
      98, 98, 98, 146.8, // G2, G2, G2, D3
      87.3, 87.3, 98, 110 // F2, F2, G2, A2
    ];

    const lead = [
      440, 0, 523.25, 0, 659.25, 0, 587.33, 0,
      392, 0, 440, 523.25, 440, 0, 329.63, 0
    ];

    const stepIntervalMs = (60 / this.bgmTempo / 4) * 1000;

    this.bgmInterval = window.setInterval(() => {
      if (!this.ctx || !this.bgmGain || this.isMuted) return;

      const t = this.ctx.currentTime;
      const step = this.bgmStep % 16;
      this.bgmStep++;

      // Bass note
      const bassFreq = bassline[step];
      if (bassFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bassFreq, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(this.isOverclocked ? 1200 : 600, t);
        filter.frequency.exponentialRampToValueAtTime(150, t + 0.12);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(t);
        osc.stop(t + 0.12);
      }

      // Kick drum on beats 0, 4, 8, 12
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();

        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(140, t);
        kickOsc.frequency.exponentialRampToValueAtTime(35, t + 0.08);

        kickGain.gain.setValueAtTime(0.4, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        kickOsc.connect(kickGain);
        kickGain.connect(this.bgmGain);

        kickOsc.start(t);
        kickOsc.stop(t + 0.09);
      }

      // High Hat on off-beats 2, 6, 10, 14
      if (step % 4 === 2 || (this.isOverclocked && step % 2 === 1)) {
        const hatDur = 0.03;
        const bufferSize = Math.floor(this.ctx.sampleRate * hatDur);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }

        const hatSource = this.ctx.createBufferSource();
        hatSource.buffer = buffer;

        const hatFilter = this.ctx.createBiquadFilter();
        hatFilter.type = 'highpass';
        hatFilter.frequency.setValueAtTime(7000, t);

        const hatGain = this.ctx.createGain();
        hatGain.gain.setValueAtTime(0.08, t);
        hatGain.gain.exponentialRampToValueAtTime(0.001, t + hatDur);

        hatSource.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(this.bgmGain);

        hatSource.start(t);
      }

      // Arpeggio Lead
      const leadFreq = lead[step];
      if (leadFreq > 0) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();

        leadOsc.type = 'square';
        leadOsc.frequency.setValueAtTime(leadFreq, t);

        leadGain.gain.setValueAtTime(0.09, t);
        leadGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        leadOsc.connect(leadGain);
        leadGain.connect(this.bgmGain);

        leadOsc.start(t);
        leadOsc.stop(t + 0.08);
      }
    }, stepIntervalMs);
  }

  public stopBGM() {
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.isBgmPlaying = false;
  }

  public setOverclock(active: boolean) {
    this.isOverclocked = active;
  }
}

export const soundSynth = new SoundSynth();
