import {
  NOTE_NAMES,
  NOTE_LAYOUT_SHARPS,
  NOTE_LAYOUT_FLATS,
  fretToMidi,
  fretToNoteName,
  fretToNoteOctave,
  displayNote,
  randInt,
} from '../music-theory';
import type { ExerciseConfig, ExerciseSettings } from './types';
import { DEFAULT_SETTINGS, FRETBOARD_SETTINGS } from './types';

export const fretboardNotes: ExerciseConfig = {
  id: 'fretboard-notes',
  title: 'Fretboard Notes',
  description: 'Identify the note at a highlighted fretboard position',
  category: 'fretboard',
  difficulty: 'beginner',
  visualType: 'fretboard',
  settingsConfig: FRETBOARD_SETTINGS.filter(s => s.key !== 'direction' && s.key !== 'stringRange'),

  generateQuestion(settings: ExerciseSettings = DEFAULT_SETTINGS) {
    const maxFret = Math.max(1, Math.min(12, settings.fretRange));
    const stringIdx = randInt(0, 6);
    const fret = randInt(0, maxFret + 1);

    const noteName = displayNote(fretToNoteName(stringIdx, fret), settings.useFlats);
    const noteOctave = fretToNoteOctave(stringIdx, fret);

    const layout = settings.useFlats ? NOTE_LAYOUT_FLATS : NOTE_LAYOUT_SHARPS;
    const choices = layout.flat();

    return {
      prompt: settings.showNoteLabels
        ? `What note is ${noteName}?`
        : 'What note is highlighted?',
      fretboardNotes: [
        {
          stringIndex: stringIdx,
          fret,
          label: settings.showNoteLabels ? noteName : undefined,
          className: 'fretboard-note--root',
        },
      ],
      audioNotes: [noteOctave],
      correctAnswer: noteName,
      choices,
      answerLayout: layout,
    };
  },
};
