import {
  SCALES,
  SCALE_LAYOUT,
  fretToNoteName,
  displayNote,
  generateFretboardScale,
  randInt,
  randElement,
} from '../music-theory';
import type { ExerciseConfig, ExerciseSettings } from './types';
import { DEFAULT_SETTINGS, FRETBOARD_SETTINGS } from './types';

export const fretboardScales: ExerciseConfig = {
  id: 'fretboard-scales',
  title: 'Fretboard Scales',
  description: 'Identify the scale pattern on the fretboard',
  category: 'fretboard',
  difficulty: 'intermediate',
  visualType: 'fretboard',
  settingsConfig: FRETBOARD_SETTINGS.filter(s =>
    ['showStringLabels', 'showFretLabels', 'showNoteLabels'].includes(s.key)
  ),

  generateQuestion(settings: ExerciseSettings = DEFAULT_SETTINGS) {
    const scale = randElement(SCALES);
    const rootString = randInt(1, 5); // Avoid extreme strings for better shapes
    const rootFret = randInt(1, 10);

    const positions = generateFretboardScale(rootString, rootFret, scale.intervals, 4);
    const rootNoteName = displayNote(fretToNoteName(rootString, rootFret), settings.useFlats);

    const fretboardNotes = positions.map(p => ({
      stringIndex: p.stringIndex,
      fret: p.fret,
      label: settings.showNoteLabels
        ? displayNote(fretToNoteName(p.stringIndex, p.fret), settings.useFlats)
        : undefined,
      className: p.isRoot ? 'fretboard-note--root' : 'fretboard-note--target',
    }));

    const choices = SCALES.map(s => s.name);

    return {
      prompt: settings.showNoteLabels
        ? `What scale is ${rootNoteName} playing?`
        : 'What scale is shown?',
      fretboardNotes,
      correctAnswer: scale.name,
      choices,
      answerLayout: SCALE_LAYOUT,
    };
  },
};
