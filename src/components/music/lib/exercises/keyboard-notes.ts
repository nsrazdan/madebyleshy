import {
  NOTE_LAYOUT_SHARPS,
  NOTE_LAYOUT_FLATS,
  midiToNoteName,
  midiToNoteNameFlat,
  midiToNoteOctave,
  randInt,
} from '../music-theory';
import type { ExerciseConfig, ExerciseSettings } from './types';
import { DEFAULT_SETTINGS, KEYBOARD_SETTINGS } from './types';

export const keyboardNotes: ExerciseConfig = {
  id: 'keyboard-notes',
  title: 'Keyboard Notes',
  description: 'Identify the highlighted note on the keyboard',
  category: 'keyboard',
  difficulty: 'beginner',
  visualType: 'keyboard',
  settingsConfig: KEYBOARD_SETTINGS,

  generateQuestion(settings: ExerciseSettings = DEFAULT_SETTINGS) {
    const startMidi = (settings.startOctave + 1) * 12;
    const endMidi = startMidi + settings.octaveCount * 12;
    const midi = randInt(startMidi, endMidi + 1);

    const noteName = settings.useFlats ? midiToNoteNameFlat(midi) : midiToNoteName(midi);
    const noteOctave = midiToNoteOctave(midi);
    const layout = settings.useFlats ? NOTE_LAYOUT_FLATS : NOTE_LAYOUT_SHARPS;

    return {
      prompt: settings.showNoteLabels
        ? `What note is ${noteName}?`
        : 'What note is highlighted?',
      keyboardHighlight: [midi],
      audioNotes: [noteOctave],
      correctAnswer: noteName,
      choices: layout.flat(),
      answerLayout: layout,
    };
  },
};
