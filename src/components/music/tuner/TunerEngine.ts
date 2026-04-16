/**
 * Pitch detection engine using Web Audio API + pitchy.
 * Captures mic input, runs McLeod pitch detection per frame.
 */

import { PitchDetector } from 'pitchy';

export interface PitchResult {
  frequency: number;   // Hz
  clarity: number;     // 0–1 confidence
  note: string;        // e.g. "A"
  octave: number;      // e.g. 4
  cents: number;       // -50 to +50 deviation from nearest note
  midiNote: number;    // MIDI number of nearest note
}

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export type PitchCallback = (result: PitchResult | null) => void;

export class TunerEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private detector: PitchDetector<Float32Array> | null = null;
  private buffer: Float32Array | null = null;
  private rafId: number | null = null;
  private running = false;
  private onPitch: PitchCallback;
  private referencePitch: number; // A4 in Hz

  constructor(onPitch: PitchCallback, referencePitch = 440) {
    this.onPitch = onPitch;
    this.referencePitch = referencePitch;
  }

  setReferencePitch(hz: number) {
    this.referencePitch = hz;
  }

  async start(): Promise<void> {
    if (this.running) return;

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioCtx = new AudioContext();
    this.source = this.audioCtx.createMediaStreamSource(this.stream);
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 4096;
    this.source.connect(this.analyser);

    this.detector = PitchDetector.forFloat32Array(this.analyser.fftSize);
    this.buffer = new Float32Array(this.analyser.fftSize);
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.source?.disconnect();
    this.stream?.getTracks().forEach(t => t.stop());
    this.audioCtx?.close();
    this.audioCtx = null;
    this.analyser = null;
    this.source = null;
    this.stream = null;
    this.detector = null;
    this.buffer = null;
  }

  private loop = () => {
    if (!this.running || !this.analyser || !this.detector || !this.audioCtx || !this.buffer) return;

    this.analyser.getFloatTimeDomainData(this.buffer);

    const [pitch, clarity] = this.detector.findPitch(this.buffer, this.audioCtx.sampleRate);

    if (clarity > 0.9 && pitch > 20 && pitch < 5000) {
      const result = this.frequencyToNote(pitch, clarity);
      this.onPitch(result);
    } else {
      this.onPitch(null);
    }

    this.rafId = requestAnimationFrame(this.loop);
  };

  private frequencyToNote(frequency: number, clarity: number): PitchResult {
    // Semitones from A4
    const semitones = 12 * Math.log2(frequency / this.referencePitch);
    const midiNote = Math.round(semitones) + 69;
    const cents = Math.round((semitones - Math.round(semitones)) * 100);
    const noteIndex = ((midiNote % 12) + 12) % 12;
    const octave = Math.floor(midiNote / 12) - 1;

    return {
      frequency,
      clarity,
      note: NOTE_NAMES[noteIndex],
      octave,
      cents,
      midiNote,
    };
  }
}

/** Generate a tone at a given frequency using Web Audio API */
export class ToneGenerator {
  private audioCtx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;

  private getContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  start(frequency: number, volume = 0.3) {
    this.stopOscillator();
    const ctx = this.getContext();
    this.osc = ctx.createOscillator();
    this.gain = ctx.createGain();
    this.osc.connect(this.gain);
    this.gain.connect(ctx.destination);
    this.osc.frequency.value = frequency;
    this.osc.type = 'sine';
    this.gain.gain.value = volume;
    this.osc.start();
  }

  setFrequency(frequency: number) {
    if (this.osc) {
      this.osc.frequency.value = frequency;
    }
  }

  private stopOscillator() {
    this.osc?.stop();
    this.osc?.disconnect();
    this.gain?.disconnect();
    this.osc = null;
    this.gain = null;
  }

  stop() {
    this.stopOscillator();
    this.audioCtx?.close();
    this.audioCtx = null;
  }

  get isPlaying(): boolean {
    return this.osc !== null;
  }
}
