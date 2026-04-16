let toneModule: any = null;
let audioStarted = false;

// Synth instances per timbre (created lazily)
const synths: Record<string, any> = {};
const polySynths: Record<string, any> = {};

// Track pending timeouts so we can cancel on new playback
let pendingTimeouts: number[] = [];

// Pre-create a native AudioContext on first user gesture so the browser
// doesn't block Tone.js when the dynamic import finishes asynchronously.
let nativeCtx: AudioContext | null = null;

export type Timbre = 'guitar' | 'piano';

const TIMBRE_CONFIG: Record<Timbre, { oscillator: any; envelope: any }> = {
  guitar: {
    oscillator: { type: 'triangle8' },
    envelope: { attack: 0.005, decay: 0.4, sustain: 0.05, release: 1.2 },
  },
  piano: {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.8 },
  },
};

function ensureNativeContext() {
  if (!nativeCtx) {
    nativeCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (nativeCtx.state === 'suspended') {
    nativeCtx.resume();
  }
}

async function ensureLoaded() {
  if (!toneModule) {
    toneModule = await import('tone');
    if (nativeCtx) {
      toneModule.setContext(nativeCtx);
    }
  }
}

function getSynth(timbre: Timbre): any {
  if (!synths[timbre]) {
    const cfg = TIMBRE_CONFIG[timbre];
    synths[timbre] = new toneModule.Synth({
      oscillator: cfg.oscillator,
      envelope: cfg.envelope,
    }).toDestination();
  }
  return synths[timbre];
}

function getPolySynth(timbre: Timbre): any {
  if (!polySynths[timbre]) {
    const cfg = TIMBRE_CONFIG[timbre];
    polySynths[timbre] = new toneModule.PolySynth(toneModule.Synth, {
      oscillator: cfg.oscillator,
      envelope: cfg.envelope,
    }).toDestination();
  }
  return polySynths[timbre];
}

/** Cancel any in-progress sequential playback */
function cancelPending() {
  for (const id of pendingTimeouts) {
    clearTimeout(id);
  }
  pendingTimeouts = [];
}

/** Start the audio context (must be called from a user gesture) */
export async function startAudio(): Promise<void> {
  ensureNativeContext();
  await ensureLoaded();
  if (!audioStarted) {
    await toneModule.start();
    audioStarted = true;
  }
}

/** Play a single note */
export async function playNote(note: string, duration = '4n', timbre: Timbre = 'piano'): Promise<void> {
  cancelPending();
  await startAudio();
  getSynth(timbre).triggerAttackRelease(note, duration);
}

/** Play two notes in sequence */
export async function playInterval(note1: string, note2: string, delayMs = 500, timbre: Timbre = 'piano'): Promise<void> {
  cancelPending();
  await startAudio();
  const s = getSynth(timbre);
  s.triggerAttackRelease(note1, '4n');
  return new Promise(resolve => {
    const id = window.setTimeout(() => {
      s.triggerAttackRelease(note2, '4n');
      resolve();
    }, delayMs);
    pendingTimeouts.push(id);
  });
}

/** Play multiple notes simultaneously */
export async function playChord(notes: string[], duration = '2n', timbre: Timbre = 'piano'): Promise<void> {
  cancelPending();
  await startAudio();
  getPolySynth(timbre).triggerAttackRelease(notes, duration);
}

/** Play a sequence of notes with a delay between each */
export async function playScale(notes: string[], delayMs = 300, timbre: Timbre = 'piano'): Promise<void> {
  cancelPending();
  await startAudio();
  const s = getSynth(timbre);
  return new Promise<void>(resolve => {
    for (let i = 0; i < notes.length; i++) {
      const id = window.setTimeout(() => {
        s.triggerAttackRelease(notes[i], '8n');
        if (i === notes.length - 1) resolve();
      }, i * delayMs);
      pendingTimeouts.push(id);
    }
  });
}

/** Play notes either sequentially or simultaneously based on mode */
export async function playAudio(
  notes: string[],
  mode: 'sequential' | 'simultaneous' = 'sequential',
  timbre: Timbre = 'piano',
): Promise<void> {
  if (notes.length === 0) return;
  if (notes.length === 1) return playNote(notes[0], '4n', timbre);
  if (mode === 'simultaneous') return playChord(notes, '2n', timbre);
  if (notes.length === 2) return playInterval(notes[0], notes[1], 500, timbre);
  return playScale(notes, 300, timbre);
}

/** Clean up all audio resources */
export function disposeAudio(): void {
  cancelPending();
  for (const s of Object.values(synths)) s?.dispose?.();
  for (const s of Object.values(polySynths)) s?.dispose?.();
  Object.keys(synths).forEach(k => delete synths[k]);
  Object.keys(polySynths).forEach(k => delete polySynths[k]);
}
