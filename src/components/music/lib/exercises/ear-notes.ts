import {
  NOTE_LAYOUT_SHARPS,
  NOTE_LAYOUT_FLATS,
  midiToNoteName,
  midiToNoteNameFlat,
  midiToNoteOctave,
  randInt,
} from '../music-theory';
import type { ExerciseConfig, ExerciseSettings } from './types';
import { DEFAULT_SETTINGS, EAR_SETTINGS } from './types';

export const earNotes: ExerciseConfig = {
  id: 'ear-notes',
  title: 'Note Ear Training',
  description: 'Identify the note you hear',
  category: 'ear training',
  difficulty: 'beginner',
  visualType: 'ear-training',
  settingsConfig: EAR_SETTINGS,

  generateQuestion(settings: ExerciseSettings = DEFAULT_SETTINGS) {
    const midi = randInt(48, 73); // C3 to C5
    const noteName = settings.useFlats ? midiToNoteNameFlat(midi) : midiToNoteName(midi);
    const noteOctave = midiToNoteOctave(midi);
    const layout = settings.useFlats ? NOTE_LAYOUT_FLATS : NOTE_LAYOUT_SHARPS;

    return {
      prompt: 'What note do you hear?',
      audioNotes: [noteOctave],
      autoPlay: true,
      correctAnswer: noteName,
      choices: layout.flat(),
      answerLayout: layout,
    };
  },
};
