let toneModule: any = null;
let audioStarted = false;

// Sampler instances per timbre (created lazily, resolved when loaded)
const samplerPromises: Record<string, Promise<any>> = {};

// Track pending timeouts so we can cancel on new playback
let pendingTimeouts: number[] = [];

export type Timbre = 'guitar' | 'piano';

// Note-to-filename mappings for each instrument's samples.
// Tone.js Sampler pitch-shifts between these anchor points.
const PIANO_SAMPLES: Record<string, string> = {
  A0: 'A0v8.mp3', A1: 'A1v8.mp3', A2: 'A2v8.mp3', A3: 'A3v8.mp3',
  A4: 'A4v8.mp3', A5: 'A5v8.mp3', A6: 'A6v8.mp3', A7: 'A7v8.mp3',
  C1: 'C1v8.mp3', C2: 'C2v8.mp3', C3: 'C3v8.mp3', C4: 'C4v8.mp3',
  C5: 'C5v8.mp3', C6: 'C6v8.mp3', C7: 'C7v8.mp3', C8: 'C8v8.mp3',
  'D#1': 'Ds1v8.mp3', 'D#2': 'Ds2v8.mp3', 'D#3': 'Ds3v8.mp3',
  'D#4': 'Ds4v8.mp3', 'D#5': 'Ds5v8.mp3', 'D#6': 'Ds6v8.mp3', 'D#7': 'Ds7v8.mp3',
  'F#1': 'Fs1v8.mp3', 'F#2': 'Fs2v8.mp3', 'F#3': 'Fs3v8.mp3',
  'F#4': 'Fs4v8.mp3', 'F#5': 'Fs5v8.mp3', 'F#6': 'Fs6v8.mp3', 'F#7': 'Fs7v8.mp3',
};

const GUITAR_SAMPLES: Record<string, string> = {
  E2: 'E2.mp3', A2: 'A2.mp3',
  'D#3': 'Ds3.mp3', 'G#3': 'Gs3.mp3',
  C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3', A4: 'A4.mp3',
  C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3', A5: 'A5.mp3',
  C6: 'C6.mp3',
};

const SAMPLE_CONFIG: Record<Timbre, { urls: Record<string, string>; baseUrl: string }> = {
  piano: { urls: PIANO_SAMPLES, baseUrl: '/samples/piano/' },
  guitar: { urls: GUITAR_SAMPLES, baseUrl: '/samples/guitar/' },
};

async function ensureTone() {
  if (!toneModule) {
    toneModule = await import('tone');
  }
  if (!audioStarted) {
    await toneModule.start();
    audioStarted = true;
  }
}

function loadSampler(timbre: Timbre): Promise<any> {
  if (!samplerPromises[timbre]) {
    const cfg = SAMPLE_CONFIG[timbre];
    samplerPromises[timbre] = new Promise((resolve, reject) => {
      const sampler = new toneModule.Sampler({
        urls: cfg.urls,
        baseUrl: cfg.baseUrl,
        onload: () => resolve(sampler),
        onerror: (err: any) => reject(err),
      }).toDestination();
    });
  }
  return samplerPromises[timbre];
}

/** Cancel any in-progress sequential playback */
function cancelPending() {
  for (const id of pendingTimeouts) {
    clearTimeout(id);
  }
  pendingTimeouts = [];
}

/** Play a single note */
export async function playNote(note: string, duration = '4n', timbre: Timbre = 'piano'): Promise<void> {
  cancelPending();
  await ensureTone();
  const sampler = await loadSampler(timbre);
  sampler.triggerAttackRelease(note, duration);
}

/** Play two notes in sequence */
export async function playInterval(note1: string, note2: string, delayMs = 500, timbre: Timbre = 'piano'): Promise<void> {
  cancelPending();
  await ensureTone();
  const sampler = await loadSampler(timbre);
  sampler.triggerAttackRelease(note1, '4n');
  return new Promise(resolve => {
    const id = window.setTimeout(() => {
      sampler.triggerAttackRelease(note2, '4n');
      resolve();
    }, delayMs);
    pendingTimeouts.push(id);
  });
}

/** Play multiple notes simultaneously */
export async function playChord(notes: string[], duration = '2n', timbre: Timbre = 'piano'): Promise<void> {
  cancelPending();
  await ensureTone();
  const sampler = await loadSampler(timbre);
  sampler.triggerAttackRelease(notes, duration);
}

/** Play a sequence of notes with a delay between each */
export async function playScale(notes: string[], delayMs = 300, timbre: Timbre = 'piano'): Promise<void> {
  cancelPending();
  await ensureTone();
  const sampler = await loadSampler(timbre);
  return new Promise<void>(resolve => {
    for (let i = 0; i < notes.length; i++) {
      const id = window.setTimeout(() => {
        sampler.triggerAttackRelease(notes[i], '8n');
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
  for (const key of Object.keys(samplerPromises)) {
    samplerPromises[key].then(s => s?.dispose?.()).catch(() => {});
    delete samplerPromises[key];
  }
  audioStarted = false;
}
