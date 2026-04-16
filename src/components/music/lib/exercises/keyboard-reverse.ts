import {
  NOTE_NAMES,
  NOTE_NAMES_FLAT,
  midiToNoteName,
  midiToNoteNameFlat,
  randInt,
} from '../music-theory';
import type { ExerciseConfig, ExerciseSettings } from './types';
import { DEFAULT_SETTINGS, KEYBOARD_SETTINGS } from './types';

export const keyboardReverse: ExerciseConfig = {
  id: 'keyboard-reverse',
  title: 'Keyboard Reverse ID',
  description: 'Find the named note by clicking the correct piano key',
  category: 'keyboard',
  difficulty: 'beginner',
  visualType: 'keyboard',
  settingsConfig: KEYBOARD_SETTINGS.filter(s => s.key !== 'showNoteLabels'),

  generateQuestion(settings: ExerciseSettings = DEFAULT_SETTINGS) {
    const startMidi = (settings.startOctave + 1) * 12;
    const endMidi = startMidi + settings.octaveCount * 12;
    const midi = randInt(startMidi, endMidi + 1);

    const noteName = settings.useFlats ? midiToNoteNameFlat(midi) : midiToNoteName(midi);

    return {
      prompt: `Click on ${noteName}`,
      keyboardHighlight: [], // No highlight — user must find it
      correctAnswer: noteName,
      choices: [],
      clickToAnswer: true,
      correctMidi: midi,
    };
  },
};
