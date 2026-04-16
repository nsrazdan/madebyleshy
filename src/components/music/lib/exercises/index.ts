import { fretboardNotes } from './fretboard-notes';
import { fretboardIntervals } from './fretboard-intervals';
import { fretboardScales } from './fretboard-scales';
import { fretboardChords } from './fretboard-chords';
import { keyboardNotes } from './keyboard-notes';
import { keyboardReverse } from './keyboard-reverse';
import { keyboardIntervals } from './keyboard-intervals';
import { keyboardScales } from './keyboard-scales';
import { keyboardChords } from './keyboard-chords';
import { staffNotes } from './staff-notes';
import { staffKeySignatures } from './staff-key-signatures';
import { staffIntervals } from './staff-intervals';
import { staffScales } from './staff-scales';
import { staffChords } from './staff-chords';
import { earNotes } from './ear-notes';
import { earIntervals } from './ear-intervals';
import { earScales } from './ear-scales';
import { earChords } from './ear-chords';
import type { ExerciseConfig } from './types';

export const exercises: ExerciseConfig[] = [
  // Fretboard
  fretboardNotes,
  fretboardIntervals,
  fretboardScales,
  fretboardChords,
  // Keyboard
  keyboardNotes,
  keyboardReverse,
  keyboardIntervals,
  keyboardScales,
  keyboardChords,
  // Staff
  staffNotes,
  staffKeySignatures,
  staffIntervals,
  staffScales,
  staffChords,
  // Ear Training
  earNotes,
  earIntervals,
  earScales,
  earChords,
];

/** Group exercises by category for hub page display */
export function exercisesByCategory(): Record<string, ExerciseConfig[]> {
  const groups: Record<string, ExerciseConfig[]> = {};
  for (const ex of exercises) {
    (groups[ex.category] ??= []).push(ex);
  }
  return groups;
}

export function getExerciseById(id: string): ExerciseConfig | undefined {
  return exercises.find(ex => ex.id === id);
}

export type { ExerciseConfig, ExerciseQuestion } from './types';
