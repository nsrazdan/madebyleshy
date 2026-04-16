/**
 * Precise metronome engine using Web Audio API scheduler.
 * Uses a lookahead pattern: a setInterval checks upcoming beats and
 * schedules them with the AudioContext clock for sample-accurate timing.
 */

export interface MetronomeConfig {
  bpm: number;
  beatsPerMeasure: number;
  subdivision: 1 | 2 | 3 | 4; // quarter, eighth, triplet, sixteenth
  accentFirst: boolean;
  volume: number;        // 0–1
  accentVolume: number;  // 0–1
}

export type BeatCallback = (beat: number, subdivision: number, time: number) => void;

const LOOKAHEAD_MS = 25;    // How often the scheduler runs (ms)
const SCHEDULE_AHEAD = 0.1; // How far ahead to schedule (seconds)

// Click sound frequencies
const ACCENT_FREQ = 1000;
const NORMAL_FREQ = 800;
const SUB_FREQ = 600;

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function scheduleClick(
  ctx: AudioContext,
  time: number,
  freq: number,
  volume: number,
  duration = 0.03,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.frequency.value = freq;
  osc.type = 'square';
  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.start(time);
  osc.stop(time + duration);
}

export class MetronomeEngine {
  private config: MetronomeConfig;
  private onBeat: BeatCallback;
  private running = false;
  private timerID: number | null = null;

  // Scheduling state
  private nextNoteTime = 0;
  private currentBeat = 0;
  private currentSub = 0;

  // Mute control for internal tempo trainer
  private muted = false;

  constructor(config: MetronomeConfig, onBeat: BeatCallback) {
    this.config = { ...config };
    this.onBeat = onBeat;
  }

  get isRunning(): boolean {
    return this.running;
  }

  updateConfig(config: Partial<MetronomeConfig>) {
    Object.assign(this.config, config);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  start() {
    if (this.running) return;
    const ctx = getAudioContext();
    this.running = true;
    this.currentBeat = 0;
    this.currentSub = 0;
    this.nextNoteTime = ctx.currentTime + 0.05; // Small delay to avoid clicks
    this.scheduler();
  }

  stop() {
    this.running = false;
    if (this.timerID !== null) {
      clearInterval(this.timerID);
      this.timerID = null;
    }
  }

  /** Duration of one subdivision tick in seconds */
  private get tickDuration(): number {
    const beatDuration = 60 / this.config.bpm;
    return beatDuration / this.config.subdivision;
  }

  private scheduler() {
    const ctx = getAudioContext();

    this.timerID = window.setInterval(() => {
      while (this.nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
        this.scheduleTick(ctx, this.nextNoteTime);
        this.advanceTick();
      }
    }, LOOKAHEAD_MS);
  }

  private scheduleTick(ctx: AudioContext, time: number) {
    const { accentFirst, volume, accentVolume, subdivision } = this.config;
    const isDownbeat = this.currentBeat === 0 && this.currentSub === 0;
    const isBeat = this.currentSub === 0;

    // Fire callback (for visual updates) — use setTimeout to approximate
    const delay = Math.max(0, (time - ctx.currentTime) * 1000);
    setTimeout(() => {
      this.onBeat(this.currentBeat, this.currentSub, time);
    }, delay);

    // Don't produce sound if muted
    if (this.muted) return;

    if (isBeat) {
      const isAccented = accentFirst && isDownbeat;
      const freq = isAccented ? ACCENT_FREQ : NORMAL_FREQ;
      const vol = isAccented ? accentVolume : volume;
      scheduleClick(ctx, time, freq, vol);
    } else if (subdivision > 1) {
      scheduleClick(ctx, time, SUB_FREQ, volume * 0.6, 0.02);
    }
  }

  private advanceTick() {
    this.currentSub++;
    if (this.currentSub >= this.config.subdivision) {
      this.currentSub = 0;
      this.currentBeat++;
      if (this.currentBeat >= this.config.beatsPerMeasure) {
        this.currentBeat = 0;
      }
    }
    this.nextNoteTime += this.tickDuration;
  }

  dispose() {
    this.stop();
  }
}
