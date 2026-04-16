export interface TuningPreset {
  name: string;
  instrument: string;
  strings: { note: string; octave: number }[];
}

export const TUNING_PRESETS: TuningPreset[] = [
  // Guitar
  {
    name: 'Standard',
    instrument: 'Guitar',
    strings: [
      { note: 'E', octave: 4 },
      { note: 'B', octave: 3 },
      { note: 'G', octave: 3 },
      { note: 'D', octave: 3 },
      { note: 'A', octave: 2 },
      { note: 'E', octave: 2 },
    ],
  },
  {
    name: 'Drop D',
    instrument: 'Guitar',
    strings: [
      { note: 'E', octave: 4 },
      { note: 'B', octave: 3 },
      { note: 'G', octave: 3 },
      { note: 'D', octave: 3 },
      { note: 'A', octave: 2 },
      { note: 'D', octave: 2 },
    ],
  },
  {
    name: 'DADGAD',
    instrument: 'Guitar',
    strings: [
      { note: 'D', octave: 4 },
      { note: 'A', octave: 3 },
      { note: 'G', octave: 3 },
      { note: 'D', octave: 3 },
      { note: 'A', octave: 2 },
      { note: 'D', octave: 2 },
    ],
  },
  {
    name: 'Open G',
    instrument: 'Guitar',
    strings: [
      { note: 'D', octave: 4 },
      { note: 'B', octave: 3 },
      { note: 'G', octave: 3 },
      { note: 'D', octave: 3 },
      { note: 'G', octave: 2 },
      { note: 'D', octave: 2 },
    ],
  },
  {
    name: 'Open D',
    instrument: 'Guitar',
    strings: [
      { note: 'D', octave: 4 },
      { note: 'A', octave: 3 },
      { note: 'F#', octave: 3 },
      { note: 'D', octave: 3 },
      { note: 'A', octave: 2 },
      { note: 'D', octave: 2 },
    ],
  },
  {
    name: 'Open E',
    instrument: 'Guitar',
    strings: [
      { note: 'E', octave: 4 },
      { note: 'B', octave: 3 },
      { note: 'G#', octave: 3 },
      { note: 'E', octave: 3 },
      { note: 'B', octave: 2 },
      { note: 'E', octave: 2 },
    ],
  },
  {
    name: 'Half Step Down',
    instrument: 'Guitar',
    strings: [
      { note: 'D#', octave: 4 },
      { note: 'A#', octave: 3 },
      { note: 'F#', octave: 3 },
      { note: 'C#', octave: 3 },
      { note: 'G#', octave: 2 },
      { note: 'D#', octave: 2 },
    ],
  },
  {
    name: 'Full Step Down',
    instrument: 'Guitar',
    strings: [
      { note: 'D', octave: 4 },
      { note: 'A', octave: 3 },
      { note: 'F', octave: 3 },
      { note: 'C', octave: 3 },
      { note: 'G', octave: 2 },
      { note: 'D', octave: 2 },
    ],
  },
  {
    name: 'Open C',
    instrument: 'Guitar',
    strings: [
      { note: 'E', octave: 4 },
      { note: 'C', octave: 4 },
      { note: 'G', octave: 3 },
      { note: 'C', octave: 3 },
      { note: 'G', octave: 2 },
      { note: 'C', octave: 2 },
    ],
  },
  // Bass
  {
    name: 'Standard',
    instrument: 'Bass',
    strings: [
      { note: 'G', octave: 2 },
      { note: 'D', octave: 2 },
      { note: 'A', octave: 1 },
      { note: 'E', octave: 1 },
    ],
  },
  {
    name: '5-String',
    instrument: 'Bass',
    strings: [
      { note: 'G', octave: 2 },
      { note: 'D', octave: 2 },
      { note: 'A', octave: 1 },
      { note: 'E', octave: 1 },
      { note: 'B', octave: 0 },
    ],
  },
  {
    name: 'Drop D',
    instrument: 'Bass',
    strings: [
      { note: 'G', octave: 2 },
      { note: 'D', octave: 2 },
      { note: 'A', octave: 1 },
      { note: 'D', octave: 1 },
    ],
  },
  // Ukulele
  {
    name: 'Standard',
    instrument: 'Ukulele',
    strings: [
      { note: 'A', octave: 4 },
      { note: 'E', octave: 4 },
      { note: 'C', octave: 4 },
      { note: 'G', octave: 4 },
    ],
  },
  // Violin
  {
    name: 'Standard',
    instrument: 'Violin',
    strings: [
      { note: 'E', octave: 5 },
      { note: 'A', octave: 4 },
      { note: 'D', octave: 4 },
      { note: 'G', octave: 3 },
    ],
  },
  // Mandolin
  {
    name: 'Standard',
    instrument: 'Mandolin',
    strings: [
      { note: 'E', octave: 5 },
      { note: 'A', octave: 4 },
      { note: 'D', octave: 4 },
      { note: 'G', octave: 3 },
    ],
  },
  // Banjo (5-string)
  {
    name: 'Standard (Open G)',
    instrument: 'Banjo',
    strings: [
      { note: 'D', octave: 4 },
      { note: 'B', octave: 3 },
      { note: 'G', octave: 3 },
      { note: 'D', octave: 3 },
      { note: 'G', octave: 4 },
    ],
  },
];

// Cached at module level — computed once
const INSTRUMENTS: string[] = [];
const PRESETS_BY_INSTRUMENT = new Map<string, TuningPreset[]>();

for (const p of TUNING_PRESETS) {
  if (!PRESETS_BY_INSTRUMENT.has(p.instrument)) {
    INSTRUMENTS.push(p.instrument);
    PRESETS_BY_INSTRUMENT.set(p.instrument, []);
  }
  PRESETS_BY_INSTRUMENT.get(p.instrument)!.push(p);
}

export function getInstruments(): string[] {
  return INSTRUMENTS;
}

export function getPresetsForInstrument(instrument: string): TuningPreset[] {
  return PRESETS_BY_INSTRUMENT.get(instrument) ?? [];
}

const NOTE_SEMITONE: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1,
  'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11,
};

export function noteToFrequency(note: string, octave: number, a4 = 440): number {
  const semitone = NOTE_SEMITONE[note];
  if (semitone === undefined) return 0;
  const midi = (octave + 1) * 12 + semitone;
  return a4 * Math.pow(2, (midi - 69) / 12);
}
