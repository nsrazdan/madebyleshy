/**
 * Precise metronome engine using Web Audio API scheduler.
 * Uses a lookahead pattern: a setInterval checks upcoming beats and
 * schedules them with the AudioContext clock for sample-accurate timing.
 */

/** Per-beat accent level: 0 = muted, 1 = normal, 2 = medium, 3 = loud */
export type AccentLevel = 0 | 1 | 2 | 3;

export type ClickSound =
  | 'click' | 'beep' | 'wood' | 'tick'
  | 'mechanical' | 'woodblock' | 'pling' | 'pulse' | 'hiclick';

export const SYNTH_SOUNDS: { value: ClickSound; label: string }[] = [
  { value: 'click', label: 'click' },
  { value: 'beep', label: 'beep' },
  { value: 'wood', label: 'wood' },
  { value: 'tick', label: 'tick' },
];

export const SAMPLE_SOUNDS: { value: ClickSound; label: string; file: string }[] = [
  { value: 'mechanical', label: 'mechanical', file: '/samples/metronome/mechanical.mp3' },
  { value: 'woodblock', label: 'woodblock', file: '/samples/metronome/woodblock.mp3' },
  { value: 'pling', label: 'pling', file: '/samples/metronome/pling.mp3' },
  { value: 'pulse', label: 'pulse', file: '/samples/metronome/pulse.mp3' },
  { value: 'hiclick', label: 'hi-click', file: '/samples/metronome/hiclick.mp3' },
];

// Derived from SAMPLE_SOUNDS — single source of truth
const SAMPLE_FILES = new Map<ClickSound, string>(
  SAMPLE_SOUNDS.map(s => [s.value, s.file])
);

export interface MetronomeConfig {
  bpm: number;
  beatsPerMeasure: number;
  subdivision: 1 | 2 | 3 | 4;
  accents: AccentLevel[];  // one per beat; length === beatsPerMeasure
  volume: number;          // 0–1 master volume
  clickSound: ClickSound;
}

export interface InternalTrainerConfig {
  playBars: number;
  muteBars: number;
}

/** beat, subdivision, audioTime, isMuted (for internal trainer visual) */
export type BeatCallback = (beat: number, subdivision: number, time: number, isMuted: boolean) => void;

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.1;

// Click frequencies per accent level (0 is muted — no sound)
const FREQ: Record<AccentLevel, number> = { 0: 0, 1: 800, 2: 900, 3: 1000 };
const VOL_SCALE: Record<AccentLevel, number> = { 0: 0, 1: 0.7, 2: 0.85, 3: 1.0 };
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

// ── Sample buffer cache ─────────────────────────────

const sampleCache = new Map<string, AudioBuffer>();
const loadingPromises = new Map<string, Promise<AudioBuffer | null>>();

export function isSampleSound(sound: ClickSound): boolean {
  return SAMPLE_FILES.has(sound);
}

export async function preloadSample(sound: ClickSound): Promise<void> {
  const file = SAMPLE_FILES.get(sound);
  if (!file || sampleCache.has(file)) return;
  if (loadingPromises.has(file)) {
    await loadingPromises.get(file);
    return;
  }

  const promise = (async () => {
    try {
      const ctx = getAudioContext();
      const resp = await fetch(file);
      const arrayBuf = await resp.arrayBuffer();
      const audioBuf = await ctx.decodeAudioData(arrayBuf);
      sampleCache.set(file, audioBuf);
      return audioBuf;
    } catch {
      return null;
    } finally {
      loadingPromises.delete(file);
    }
  })();

  loadingPromises.set(file, promise);
  await promise;
}

function getSampleBuffer(sound: ClickSound): AudioBuffer | null {
  const file = SAMPLE_FILES.get(sound);
  return file ? sampleCache.get(file) ?? null : null;
}

// ── Click scheduling ────────────────────────────────

function scheduleSound(
  ctx: AudioContext,
  time: number,
  freq: number,
  volume: number,
  sound: ClickSound,
  isSub: boolean,
) {
  if (volume <= 0) return;

  // Sample-based sounds
  if (isSampleSound(sound)) {
    const buffer = getSampleBuffer(sound);
    if (buffer) {
      scheduleSampleClick(ctx, time, buffer, volume, isSub ? 0.6 : 1.0);
    }
    return;
  }

  // Synthesized sounds
  if (freq <= 0) return;
  switch (sound) {
    case 'click':
      scheduleSquareClick(ctx, time, freq, volume, 0.03);
      break;
    case 'beep':
      scheduleSineBeep(ctx, time, freq, volume);
      break;
    case 'wood':
      scheduleNoiseClick(ctx, time, volume, 600, 1200, 0.04);
      break;
    case 'tick':
      scheduleNoiseClick(ctx, time, volume, 2000, 6000, 0.015);
      break;
  }
}

function scheduleSampleClick(
  ctx: AudioContext,
  time: number,
  buffer: AudioBuffer,
  volume: number,
  pitchRate: number,
) {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = pitchRate;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, time);

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(time);
}

function scheduleSquareClick(
  ctx: AudioContext,
  time: number,
  freq: number,
  volume: number,
  duration: number,
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

function scheduleSineBeep(
  ctx: AudioContext,
  time: number,
  freq: number,
  volume: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = freq;
  osc.type = 'sine';
  gain.gain.setValueAtTime(volume * 0.8, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
  osc.start(time);
  osc.stop(time + 0.08);
}

// Pre-generated noise buffer — created once, reused for all noise-based clicks.
// 0.05s at 48kHz = 2400 samples. Enough for any noise click duration.
let noiseBuffer: AudioBuffer | null = null;

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) return noiseBuffer;
  const length = Math.ceil(ctx.sampleRate * 0.05);
  noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function scheduleNoiseClick(
  ctx: AudioContext,
  time: number,
  volume: number,
  lowFreq: number,
  highFreq: number,
  duration: number,
) {
  const source = ctx.createBufferSource();
  source.buffer = getNoiseBuffer(ctx);

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = (lowFreq + highFreq) / 2;
  bandpass.Q.value = 1.5;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  source.connect(bandpass);
  bandpass.connect(gain);
  gain.connect(ctx.destination);
  source.start(time);
  source.stop(time + duration);
}

/** Build a default accent array: first beat loud, rest normal */
export function defaultAccents(beatsPerMeasure: number): AccentLevel[] {
  return Array.from({ length: beatsPerMeasure }, (_, i) => (i === 0 ? 3 : 1)) as AccentLevel[];
}

export class MetronomeEngine {
  private config: MetronomeConfig;
  private onBeat: BeatCallback;
  private running = false;
  private timerID: number | null = null;

  private nextNoteTime = 0;
  private currentBeat = 0;
  private currentSub = 0;

  // Internal trainer — managed inside the engine for sample-accurate mute
  private internalTrainer: InternalTrainerConfig | null = null;
  private barCount = 0;
  private muted = false;

  constructor(config: MetronomeConfig, onBeat: BeatCallback) {
    this.config = { ...config };
    this.onBeat = onBeat;
  }

  get isRunning(): boolean {
    return this.running;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  updateConfig(config: Partial<MetronomeConfig>) {
    Object.assign(this.config, config);
  }

  setInternalTrainer(config: InternalTrainerConfig | null) {
    this.internalTrainer = config;
    if (!config) {
      this.muted = false;
    }
  }

  start() {
    if (this.running) return;
    const ctx = getAudioContext();
    this.running = true;
    this.currentBeat = 0;
    this.currentSub = 0;
    this.barCount = 0;
    this.muted = false;
    this.nextNoteTime = ctx.currentTime + 0.05;
    this.scheduler();
  }

  stop() {
    this.running = false;
    if (this.timerID !== null) {
      clearInterval(this.timerID);
      this.timerID = null;
    }
  }

  private get tickDuration(): number {
    return 60 / this.config.bpm / this.config.subdivision;
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
    const { volume, subdivision, accents, clickSound } = this.config;
    const isBeat = this.currentSub === 0;
    const accent = accents[this.currentBeat] ?? 1;

    // Capture beat/sub before advanceTick changes them
    const beat = this.currentBeat;
    const sub = this.currentSub;

    // Update mute state on bar boundaries (beat 0, sub 0) BEFORE scheduling sound
    if (beat === 0 && sub === 0) {
      if (this.internalTrainer) {
        const { playBars, muteBars } = this.internalTrainer;
        const cycle = playBars + muteBars;
        const posInCycle = this.barCount % cycle;
        this.muted = posInCycle >= playBars;
      }
      this.barCount++;
    }

    const currentlyMuted = this.muted;

    const delay = Math.max(0, (time - ctx.currentTime) * 1000);
    setTimeout(() => {
      this.onBeat(beat, sub, time, currentlyMuted);
    }, delay);

    // Don't produce sound if globally muted (internal trainer)
    if (currentlyMuted) return;

    if (isBeat) {
      if (accent > 0) {
        scheduleSound(ctx, time, FREQ[accent], volume * VOL_SCALE[accent], clickSound, false);
      }
    } else if (subdivision > 1) {
      if (accent > 0) {
        scheduleSound(ctx, time, SUB_FREQ, volume * 0.5, clickSound, true);
      }
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
