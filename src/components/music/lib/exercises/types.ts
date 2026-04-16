import type { FretboardNote } from '../../Fretboard';

// ── visual types ───────────────────────────────────

export type VisualType = 'fretboard' | 'keyboard' | 'staff' | 'ear-training';

// ── settings ───────────────────────────────────────

export interface ExerciseSettings {
  // Fretboard
  showStringLabels: boolean;
  showFretLabels: boolean;
  showNoteLabels: boolean;
  fretRange: number;
  stringRange: number;
  direction: 'ascending' | 'descending' | 'both';
  // Staff
  clef: 'treble' | 'bass';
  // Keyboard
  startOctave: number;
  octaveCount: number;
  // Ear training
  playMode: 'sequential' | 'simultaneous';
  // General
  useFlats: boolean;
}

export const DEFAULT_SETTINGS: ExerciseSettings = {
  showStringLabels: true,
  showFretLabels: true,
  showNoteLabels: false,
  fretRange: 3,
  stringRange: 6,
  direction: 'ascending',
  clef: 'treble',
  startOctave: 3,
  octaveCount: 3,
  playMode: 'sequential',
  useFlats: false,
};

// ── setting config (declarative per-exercise) ──────

export interface SettingConfig {
  key: keyof ExerciseSettings;
  label: string;
  type: 'boolean' | 'number' | 'select';
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
}

// Common setting presets that exercises can reference
export const FRETBOARD_SETTINGS: SettingConfig[] = [
  { key: 'showStringLabels', label: 'string labels', type: 'boolean' },
  { key: 'showFretLabels', label: 'fret labels', type: 'boolean' },
  { key: 'showNoteLabels', label: 'note labels', type: 'boolean' },
  { key: 'fretRange', label: 'fret range', type: 'number', min: 1, max: 12 },
  { key: 'stringRange', label: 'string range', type: 'number', min: 1, max: 6 },
  { key: 'direction', label: 'direction', type: 'select', options: [
    { value: 'ascending', label: 'ascending' },
    { value: 'descending', label: 'descending' },
    { value: 'both', label: 'both' },
  ]},
  { key: 'useFlats', label: 'use flats', type: 'boolean' },
];

export const STAFF_SETTINGS: SettingConfig[] = [
  { key: 'clef', label: 'clef', type: 'select', options: [
    { value: 'treble', label: 'treble' },
    { value: 'bass', label: 'bass' },
  ]},
  { key: 'showNoteLabels', label: 'note labels', type: 'boolean' },
  { key: 'useFlats', label: 'use flats', type: 'boolean' },
];

export const KEYBOARD_SETTINGS: SettingConfig[] = [
  { key: 'showNoteLabels', label: 'note labels', type: 'boolean' },
  { key: 'startOctave', label: 'start octave', type: 'number', min: 1, max: 6 },
  { key: 'octaveCount', label: 'octaves', type: 'number', min: 1, max: 4 },
  { key: 'useFlats', label: 'use flats', type: 'boolean' },
];

export const EAR_SETTINGS: SettingConfig[] = [
  { key: 'playMode', label: 'play mode', type: 'select', options: [
    { value: 'sequential', label: 'sequential' },
    { value: 'simultaneous', label: 'simultaneous' },
  ]},
  { key: 'useFlats', label: 'use flats', type: 'boolean' },
];

// ── question types ─────────────────────────────────

export interface StaffNoteData {
  midi: number;
  label?: string;
  className?: string;
}

export interface ExerciseQuestion {
  prompt: string;
  correctAnswer: string;
  choices: string[];
  /** Optional 2D layout for answer buttons (rows of choices) */
  answerLayout?: string[][];

  // Visual data — exercise provides whichever is relevant
  fretboardNotes?: FretboardNote[];
  keyboardHighlight?: number[];       // MIDI note numbers to highlight
  staffNotes?: StaffNoteData[];
  staffClef?: 'treble' | 'bass';
  staffKeySignature?: { count: number; type: 'sharp' | 'flat' };

  // Audio
  audioNotes?: string[];              // Note names with octave (e.g. 'C4')
  audioPlayMode?: 'sequential' | 'simultaneous';
  autoPlay?: boolean;                 // Auto-play on question load (ear training)

  // Click-to-answer mode (keyboard reverse, etc.)
  clickToAnswer?: boolean;
  correctMidi?: number;
}

// ── exercise config ────────────────────────────────

export interface ExerciseConfig {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  visualType: VisualType;
  settingsConfig: SettingConfig[];
  generateQuestion: (settings: ExerciseSettings) => ExerciseQuestion;
}
