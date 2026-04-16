// ── note constants ──────────────────────────────────

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export type NoteName = typeof NOTE_NAMES[number];

export const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

export const ENHARMONIC: Record<string, string> = {
  'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb',
};

// ── interval constants ─────────────────────────────

export const INTERVALS = [
  { semitones: 0, short: 'P1', name: 'Perfect Unison' },
  { semitones: 1, short: 'm2', name: 'Minor 2nd' },
  { semitones: 2, short: 'M2', name: 'Major 2nd' },
  { semitones: 3, short: 'm3', name: 'Minor 3rd' },
  { semitones: 4, short: 'M3', name: 'Major 3rd' },
  { semitones: 5, short: 'P4', name: 'Perfect 4th' },
  { semitones: 6, short: 'TT', name: 'Tritone' },
  { semitones: 7, short: 'P5', name: 'Perfect 5th' },
  { semitones: 8, short: 'm6', name: 'Minor 6th' },
  { semitones: 9, short: 'M6', name: 'Major 6th' },
  { semitones: 10, short: 'm7', name: 'Minor 7th' },
  { semitones: 11, short: 'M7', name: 'Major 7th' },
  { semitones: 12, short: 'P8', name: 'Perfect Octave' },
] as const;

export const INTERVAL_LAYOUT = [
  ['Perfect Unison'],
  ['Minor 2nd', 'Major 2nd'],
  ['Minor 3rd', 'Major 3rd'],
  ['Perfect 4th'],
  ['Tritone'],
  ['Perfect 5th'],
  ['Minor 6th', 'Major 6th'],
  ['Minor 7th', 'Major 7th'],
  ['Perfect Octave'],
];

// ── scale constants ────────────────────────────────

export interface ScaleDef {
  id: string;
  name: string;
  intervals: number[];
}

export const SCALES: ScaleDef[] = [
  { id: 'major',            name: 'Major',            intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'natural-minor',    name: 'Natural Minor',    intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'harmonic-minor',   name: 'Harmonic Minor',   intervals: [0, 2, 3, 5, 7, 8, 11] },
  { id: 'melodic-minor',    name: 'Melodic Minor',    intervals: [0, 2, 3, 5, 7, 9, 11] },
  { id: 'dorian',           name: 'Dorian',           intervals: [0, 2, 3, 5, 7, 9, 10] },
  { id: 'phrygian',         name: 'Phrygian',         intervals: [0, 1, 3, 5, 7, 8, 10] },
  { id: 'lydian',           name: 'Lydian',           intervals: [0, 2, 4, 6, 7, 9, 11] },
  { id: 'mixolydian',       name: 'Mixolydian',       intervals: [0, 2, 4, 5, 7, 9, 10] },
  { id: 'locrian',          name: 'Locrian',          intervals: [0, 1, 3, 5, 6, 8, 10] },
  { id: 'major-pentatonic', name: 'Major Pentatonic', intervals: [0, 2, 4, 7, 9] },
  { id: 'minor-pentatonic', name: 'Minor Pentatonic', intervals: [0, 3, 5, 7, 10] },
  { id: 'blues',            name: 'Blues',            intervals: [0, 3, 5, 6, 7, 10] },
];

export const SCALE_LAYOUT = [
  ['Major', 'Natural Minor'],
  ['Harmonic Minor', 'Melodic Minor'],
  ['Dorian', 'Phrygian', 'Lydian'],
  ['Mixolydian', 'Locrian'],
  ['Major Pentatonic', 'Minor Pentatonic'],
  ['Blues'],
];

// ── chord constants ────────────────────────────────

export interface ChordDef {
  id: string;
  name: string;
  intervals: number[];
}

export const CHORDS: ChordDef[] = [
  { id: 'major',       name: 'Major',       intervals: [0, 4, 7] },
  { id: 'minor',       name: 'Minor',       intervals: [0, 3, 7] },
  { id: 'diminished',  name: 'Diminished',  intervals: [0, 3, 6] },
  { id: 'augmented',   name: 'Augmented',   intervals: [0, 4, 8] },
  { id: 'sus2',        name: 'Sus2',        intervals: [0, 2, 7] },
  { id: 'sus4',        name: 'Sus4',        intervals: [0, 5, 7] },
  { id: 'major-7',     name: 'Major 7th',   intervals: [0, 4, 7, 11] },
  { id: 'dominant-7',  name: 'Dominant 7th', intervals: [0, 4, 7, 10] },
  { id: 'minor-7',     name: 'Minor 7th',   intervals: [0, 3, 7, 10] },
  { id: 'dim-7',       name: 'Dim 7th',     intervals: [0, 3, 6, 9] },
  { id: 'half-dim-7',  name: 'Half-Dim 7th', intervals: [0, 3, 6, 10] },
];

export const CHORD_LAYOUT = [
  ['Major', 'Minor'],
  ['Diminished', 'Augmented'],
  ['Sus2', 'Sus4'],
  ['Major 7th', 'Dominant 7th'],
  ['Minor 7th', 'Dim 7th'],
  ['Half-Dim 7th'],
];

// ── key signature constants ────────────────────────

export interface KeySignatureDef {
  key: string;
  type: 'sharp' | 'flat' | 'none';
  count: number;
  notes: string[];      // Which notes are sharped/flatted
  relativeMinor: string;
}

export const KEY_SIGNATURES: KeySignatureDef[] = [
  { key: 'C',  type: 'none',  count: 0, notes: [],                                   relativeMinor: 'A' },
  { key: 'G',  type: 'sharp', count: 1, notes: ['F#'],                               relativeMinor: 'E' },
  { key: 'D',  type: 'sharp', count: 2, notes: ['F#', 'C#'],                         relativeMinor: 'B' },
  { key: 'A',  type: 'sharp', count: 3, notes: ['F#', 'C#', 'G#'],                   relativeMinor: 'F#' },
  { key: 'E',  type: 'sharp', count: 4, notes: ['F#', 'C#', 'G#', 'D#'],             relativeMinor: 'C#' },
  { key: 'B',  type: 'sharp', count: 5, notes: ['F#', 'C#', 'G#', 'D#', 'A#'],       relativeMinor: 'G#' },
  { key: 'F#', type: 'sharp', count: 6, notes: ['F#', 'C#', 'G#', 'D#', 'A#', 'E#'], relativeMinor: 'D#' },
  { key: 'F',  type: 'flat',  count: 1, notes: ['Bb'],                               relativeMinor: 'D' },
  { key: 'Bb', type: 'flat',  count: 2, notes: ['Bb', 'Eb'],                         relativeMinor: 'G' },
  { key: 'Eb', type: 'flat',  count: 3, notes: ['Bb', 'Eb', 'Ab'],                   relativeMinor: 'C' },
  { key: 'Ab', type: 'flat',  count: 4, notes: ['Bb', 'Eb', 'Ab', 'Db'],             relativeMinor: 'F' },
  { key: 'Db', type: 'flat',  count: 5, notes: ['Bb', 'Eb', 'Ab', 'Db', 'Gb'],       relativeMinor: 'Bb' },
  { key: 'Gb', type: 'flat',  count: 6, notes: ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'], relativeMinor: 'Eb' },
];

export const KEY_SIG_LAYOUT = [
  ['C', 'G', 'D', 'A'],
  ['E', 'B', 'F#'],
  ['F', 'Bb', 'Eb', 'Ab'],
  ['Db', 'Gb'],
];

// Staff positions for key signature accidentals (position from bottom staff line)
export const KEY_SIG_SHARP_POSITIONS = {
  treble: [8, 5, 9, 6, 3, 7, 4],
  bass:   [6, 3, 7, 4, 1, 5, 2],
};

export const KEY_SIG_FLAT_POSITIONS = {
  treble: [4, 7, 3, 6, 2, 5, 1],
  bass:   [2, 5, 1, 4, 0, 3, -1],
};

// ── note answer layout ─────────────────────────────

export const NOTE_LAYOUT_SHARPS = [
  ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  ['C#', 'D#', 'F#', 'G#', 'A#'],
];

export const NOTE_LAYOUT_FLATS = [
  ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  ['Db', 'Eb', 'Gb', 'Ab', 'Bb'],
];

// ── guitar tuning ──────────────────────────────────

export const STANDARD_TUNING = [40, 45, 50, 55, 59, 64]; // E2, A2, D3, G3, B3, E4
export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

// ── staff constants ────────────────────────────────

// Diatonic step index for each note name: C=0 D=1 E=2 F=3 G=4 A=5 B=6
const DIATONIC_INDEX: Record<string, number> = {
  C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6,
};

// Map chromatic semitone (0-11) to diatonic info using sharps
const SEMITONE_TO_DIATONIC_SHARP: { step: number; accidental: 'sharp' | null }[] = [
  { step: 0, accidental: null },    // C
  { step: 0, accidental: 'sharp' }, // C#
  { step: 1, accidental: null },    // D
  { step: 1, accidental: 'sharp' }, // D#
  { step: 2, accidental: null },    // E
  { step: 3, accidental: null },    // F
  { step: 3, accidental: 'sharp' }, // F#
  { step: 4, accidental: null },    // G
  { step: 4, accidental: 'sharp' }, // G#
  { step: 5, accidental: null },    // A
  { step: 5, accidental: 'sharp' }, // A#
  { step: 6, accidental: null },    // B
];

// Map chromatic semitone (0-11) to diatonic info using flats
const SEMITONE_TO_DIATONIC_FLAT: { step: number; accidental: 'flat' | null }[] = [
  { step: 0, accidental: null },   // C
  { step: 1, accidental: 'flat' }, // Db
  { step: 1, accidental: null },   // D
  { step: 2, accidental: 'flat' }, // Eb
  { step: 2, accidental: null },   // E
  { step: 3, accidental: null },   // F
  { step: 4, accidental: 'flat' }, // Gb
  { step: 4, accidental: null },   // G
  { step: 5, accidental: 'flat' }, // Ab
  { step: 5, accidental: null },   // A
  { step: 6, accidental: 'flat' }, // Bb
  { step: 6, accidental: null },   // B
];

// Reference diatonic values for bottom staff line
// Treble: bottom line = E4, absolute diatonic = 4*7+2 = 30
// Bass:   bottom line = G2, absolute diatonic = 2*7+4 = 18
const STAFF_REF = { treble: 30, bass: 18 };

// ── keyboard constants ─────────────────────────────

export const WHITE_KEY_WIDTH = 28;
export const WHITE_KEY_HEIGHT = 100;
export const BLACK_KEY_WIDTH = 16;
export const BLACK_KEY_HEIGHT = 62;

// Which semitones within an octave are white keys
export const WHITE_KEY_SEMITONES = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B
export const BLACK_KEY_SEMITONES = [1, 3, 6, 8, 10];        // C# D# F# G# A#

// Black key X offsets within one octave (fraction of white key width from octave start)
// Each black key sits at the boundary between its two adjacent white keys:
// White key order: C(0) D(1) E(2) F(3) G(4) A(5) B(6)
export const BLACK_KEY_OFFSETS = [
  1.0,   // C#: boundary between C and D
  2.0,   // D#: boundary between D and E
  4.0,   // F#: boundary between F and G
  5.0,   // G#: boundary between G and A
  6.0,   // A#: boundary between A and B
];

// ── core functions ─────────────────────────────────

/** Convert MIDI note number to note name (e.g. 60 -> 'C') */
export function midiToNoteName(midi: number): NoteName {
  return NOTE_NAMES[((midi % 12) + 12) % 12];
}

/** Convert MIDI note number to note name using flats */
export function midiToNoteNameFlat(midi: number): string {
  return NOTE_NAMES_FLAT[((midi % 12) + 12) % 12];
}

/** Convert MIDI note number to note name with octave (e.g. 60 -> 'C4') */
export function midiToNoteOctave(midi: number): string {
  const name = midiToNoteName(midi);
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

/** Get MIDI note number for a fret position on a string */
export function fretToMidi(stringIndex: number, fret: number): number {
  return STANDARD_TUNING[stringIndex] + fret;
}

/** Get note name for a fret position */
export function fretToNoteName(stringIndex: number, fret: number): NoteName {
  return midiToNoteName(fretToMidi(stringIndex, fret));
}

/** Get note with octave for a fret position */
export function fretToNoteOctave(stringIndex: number, fret: number): string {
  return midiToNoteOctave(fretToMidi(stringIndex, fret));
}

/** Calculate interval in semitones between two MIDI notes (always positive, within octave) */
export function intervalBetween(midi1: number, midi2: number): number {
  return ((midi2 - midi1) % 12 + 12) % 12;
}

/** Get interval info by semitone count */
export function getInterval(semitones: number) {
  const normalized = ((semitones % 12) + 12) % 12;
  return INTERVALS.find(i => i.semitones === normalized) ?? INTERVALS[0];
}

/** Get display name for a note, optionally using flats */
export function displayNote(note: string, useFlats = false): string {
  if (useFlats && ENHARMONIC[note]) return ENHARMONIC[note];
  return note;
}

/** Convert a note name + octave string to MIDI (e.g. 'C4' -> 60) */
export function noteOctaveToMidi(noteOctave: string): number {
  const match = noteOctave.match(/^([A-G]#?)(\d+)$/);
  if (!match) return 60;
  const name = match[1] as NoteName;
  const octave = parseInt(match[2]);
  const semitone = NOTE_NAMES.indexOf(name);
  return (octave + 1) * 12 + semitone;
}

// ── staff functions ────────────────────────────────

export interface StaffPosition {
  /** Position in half-staff-line-spacing units from bottom line (0 = bottom line) */
  position: number;
  accidental: 'sharp' | 'flat' | null;
}

/** Convert a MIDI note to its position on a staff */
export function midiToStaffPosition(midi: number, clef: 'treble' | 'bass', useFlats = false): StaffPosition {
  const octave = Math.floor(midi / 12) - 1;
  const semitone = ((midi % 12) + 12) % 12;

  const mapping = useFlats ? SEMITONE_TO_DIATONIC_FLAT : SEMITONE_TO_DIATONIC_SHARP;
  const { step, accidental } = mapping[semitone];
  const absoluteDiatonic = octave * 7 + step;
  const position = absoluteDiatonic - STAFF_REF[clef];

  return { position, accidental };
}

/** Get the number of ledger lines needed for a staff position */
export function ledgerLines(position: number): { below: number; above: number } {
  const below = position < 0 ? Math.ceil(-position / 2) : 0;
  const above = position > 8 ? Math.ceil((position - 8) / 2) : 0;
  return { below, above };
}

/** Get a reasonable MIDI range for a clef */
export function clefMidiRange(clef: 'treble' | 'bass'): { min: number; max: number } {
  if (clef === 'treble') return { min: 57, max: 81 }; // A3 to A5
  return { min: 36, max: 60 };                         // C2 to C4
}

// ── fretboard helpers ──────────────────────────────

/** Find the closest fretboard position for a MIDI note near a reference position */
export function findNearestFretPosition(
  midi: number,
  refString: number,
  refFret: number,
  maxFretSpan = 4,
): { stringIndex: number; fret: number } | null {
  const positions: { stringIndex: number; fret: number; cost: number }[] = [];

  for (let s = 0; s < 6; s++) {
    const fret = midi - STANDARD_TUNING[s];
    if (fret < 0 || fret > 24) continue;
    const fretDist = Math.abs(fret - refFret);
    if (fretDist > maxFretSpan) continue;
    const stringDist = Math.abs(s - refString);
    positions.push({ stringIndex: s, fret, cost: fretDist * 2 + stringDist });
  }

  if (positions.length === 0) return null;
  positions.sort((a, b) => a.cost - b.cost);
  return { stringIndex: positions[0].stringIndex, fret: positions[0].fret };
}

/** Generate fretboard positions for a scale rooted at a given position */
export function generateFretboardScale(
  rootString: number,
  rootFret: number,
  scaleIntervals: number[],
  maxFretSpan = 4,
): { stringIndex: number; fret: number; midi: number; isRoot: boolean }[] {
  const rootMidi = fretToMidi(rootString, rootFret);
  const results: { stringIndex: number; fret: number; midi: number; isRoot: boolean }[] = [];

  // Root note
  results.push({ stringIndex: rootString, fret: rootFret, midi: rootMidi, isRoot: true });

  // Scale degrees (ascending from root, within one octave)
  for (const interval of scaleIntervals) {
    if (interval === 0) continue;
    const targetMidi = rootMidi + interval;
    const pos = findNearestFretPosition(targetMidi, rootString, rootFret, maxFretSpan);
    if (pos) {
      results.push({ ...pos, midi: targetMidi, isRoot: false });
    }
  }

  return results;
}

/** Generate fretboard positions for a chord rooted at a given position */
export function generateFretboardChord(
  rootString: number,
  rootFret: number,
  chordIntervals: number[],
  maxFretSpan = 4,
): { stringIndex: number; fret: number; midi: number; isRoot: boolean }[] {
  const rootMidi = fretToMidi(rootString, rootFret);
  const results: { stringIndex: number; fret: number; midi: number; isRoot: boolean }[] = [];

  results.push({ stringIndex: rootString, fret: rootFret, midi: rootMidi, isRoot: true });

  for (const interval of chordIntervals) {
    if (interval === 0) continue;
    const targetMidi = rootMidi + interval;
    const pos = findNearestFretPosition(targetMidi, rootString, rootFret, maxFretSpan);
    if (pos) {
      // Avoid duplicate strings for chords (one note per string)
      if (!results.some(r => r.stringIndex === pos.stringIndex)) {
        results.push({ ...pos, midi: targetMidi, isRoot: false });
      }
    }
  }

  return results;
}

// ── keyboard helpers ───────────────────────────────

/** Check if a MIDI note is a white key */
export function isWhiteKey(midi: number): boolean {
  return WHITE_KEY_SEMITONES.includes(midi % 12);
}

/** Get all MIDI notes for a keyboard range */
export function getKeyboardMidiRange(startOctave: number, octaveCount: number): number[] {
  const start = (startOctave + 1) * 12; // C of startOctave
  const end = start + octaveCount * 12;
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/** Generate MIDI notes for a scale starting at a given root */
export function generateScaleMidi(rootMidi: number, scaleIntervals: number[]): number[] {
  return scaleIntervals.map(i => rootMidi + i);
}

/** Generate MIDI notes for a chord starting at a given root */
export function generateChordMidi(rootMidi: number, chordIntervals: number[]): number[] {
  return chordIntervals.map(i => rootMidi + i);
}

// ── random helpers ─────────────────────────────────

/** Pick a random integer from min (inclusive) to max (exclusive) */
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

/** Pick a random element from an array */
export function randElement<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length)];
}

/** Shuffle an array (Fisher-Yates) */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randInt(0, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Pick a random MIDI note within a clef's comfortable range */
export function randomMidiForClef(clef: 'treble' | 'bass'): number {
  const { min, max } = clefMidiRange(clef);
  return randInt(min, max + 1);
}

/** Pick a random note name, optionally using flats */
export function randomNoteName(useFlats = false): { name: string; midi: number } {
  const semitone = randInt(0, 12);
  const name = useFlats ? NOTE_NAMES_FLAT[semitone] : NOTE_NAMES[semitone];
  return { name, midi: semitone };
}
