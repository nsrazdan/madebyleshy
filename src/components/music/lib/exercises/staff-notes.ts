import {
  NOTE_LAYOUT_SHARPS,
  NOTE_LAYOUT_FLATS,
  midiToNoteName,
  midiToNoteNameFlat,
  midiToNoteOctave,
  randomMidiForClef,
} from '../music-theory';
import type { ExerciseConfig, ExerciseSettings } from './types';
import { DEFAULT_SETTINGS, STAFF_SETTINGS } from './types';

export const staffNotes: ExerciseConfig = {
  id: 'staff-notes',
  title: 'Staff Notes',
  description: 'Identify the note on the musical staff',
  category: 'staff',
  difficulty: 'beginner',
  visualType: 'staff',
  settingsConfig: STAFF_SETTINGS,

  generateQuestion(settings: ExerciseSettings = DEFAULT_SETTINGS) {
    const clef = settings.clef;
    const midi = randomMidiForClef(clef);
    const noteName = settings.useFlats ? midiToNoteNameFlat(midi) : midiToNoteName(midi);
    const noteOctave = midiToNoteOctave(midi);
    const layout = settings.useFlats ? NOTE_LAYOUT_FLATS : NOTE_LAYOUT_SHARPS;

    return {
      prompt: settings.showNoteLabels
        ? `What note is ${noteName}?`
        : 'What note is shown on the staff?',
      staffNotes: [{ midi }],
      staffClef: clef,
      audioNotes: [noteOctave],
      correctAnswer: noteName,
      choices: layout.flat(),
      answerLayout: layout,
    };
  },
};
