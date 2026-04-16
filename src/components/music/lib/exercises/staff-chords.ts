import {
  CHORDS,
  CHORD_LAYOUT,
  generateChordMidi,
  midiToNoteName,
  midiToNoteNameFlat,
  midiToNoteOctave,
  clefMidiRange,
  randInt,
  randElement,
} from '../music-theory';
import type { ExerciseConfig, ExerciseSettings } from './types';
import { DEFAULT_SETTINGS, STAFF_SETTINGS } from './types';

export const staffChords: ExerciseConfig = {
  id: 'staff-chords',
  title: 'Staff Chords',
  description: 'Identify the chord shown on the staff',
  category: 'staff',
  difficulty: 'intermediate',
  visualType: 'staff',
  settingsConfig: STAFF_SETTINGS,

  generateQuestion(settings: ExerciseSettings = DEFAULT_SETTINGS) {
    const clef = settings.clef;
    const chord = randElement(CHORDS);
    const { min, max } = clefMidiRange(clef);

    // Root in middle of range so chord fits
    const rootMidi = randInt(min + 3, max - 12);
    const chordMidis = generateChordMidi(rootMidi, chord.intervals);

    const rootName = settings.useFlats ? midiToNoteNameFlat(rootMidi) : midiToNoteName(rootMidi);
    const audioNotes = chordMidis.map(m => midiToNoteOctave(m));
    const choices = CHORDS.map(c => c.name);

    const staffNotes = chordMidis.map((midi, i) => ({
      midi,
      className: i === 0 ? 'staff-note--root' : 'staff-note--target',
    }));

    return {
      prompt: settings.showNoteLabels
        ? `What type of chord is ${rootName} playing?`
        : 'What type of chord is shown?',
      staffNotes,
      staffClef: clef,
      audioNotes,
      audioPlayMode: 'simultaneous' as const,
      correctAnswer: chord.name,
      choices,
      answerLayout: CHORD_LAYOUT,
    };
  },
};
