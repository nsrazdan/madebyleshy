import {
  SCALES,
  SCALE_LAYOUT,
  generateScaleMidi,
  midiToNoteName,
  midiToNoteNameFlat,
  midiToNoteOctave,
  displayNote,
  randInt,
  randElement,
} from '../music-theory';
import type { ExerciseConfig, ExerciseSettings } from './types';
import { DEFAULT_SETTINGS, KEYBOARD_SETTINGS } from './types';

export const keyboardScales: ExerciseConfig = {
  id: 'keyboard-scales',
  title: 'Keyboard Scales',
  description: 'Identify the scale shown on the keyboard',
  category: 'keyboard',
  difficulty: 'intermediate',
  visualType: 'keyboard',
  settingsConfig: KEYBOARD_SETTINGS,

  generateQuestion(settings: ExerciseSettings = DEFAULT_SETTINGS) {
    const scale = randElement(SCALES);
    const rootMidi = (settings.startOctave + 1) * 12 + randInt(0, 12);
    const scaleMidis = generateScaleMidi(rootMidi, scale.intervals);

    const rootName = settings.useFlats ? midiToNoteNameFlat(rootMidi) : midiToNoteName(rootMidi);
    const audioNotes = scaleMidis.map(m => midiToNoteOctave(m));
    const choices = SCALES.map(s => s.name);

    return {
      prompt: settings.showNoteLabels
        ? `What scale is ${rootName} playing?`
        : 'What scale is highlighted?',
      keyboardHighlight: scaleMidis,
      audioNotes,
      audioPlayMode: 'sequential' as const,
      correctAnswer: scale.name,
      choices,
      answerLayout: SCALE_LAYOUT,
    };
  },
};
