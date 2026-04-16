import {
  SCALES,
  SCALE_LAYOUT,
  generateScaleMidi,
  midiToNoteOctave,
  randInt,
  randElement,
} from '../music-theory';
import type { ExerciseConfig, ExerciseSettings } from './types';
import { DEFAULT_SETTINGS, EAR_SETTINGS } from './types';

export const earScales: ExerciseConfig = {
  id: 'ear-scales',
  title: 'Scale Ear Training',
  description: 'Identify the scale you hear',
  category: 'ear training',
  difficulty: 'intermediate',
  visualType: 'ear-training',
  settingsConfig: EAR_SETTINGS,

  generateQuestion(settings: ExerciseSettings = DEFAULT_SETTINGS) {
    const scale = randElement(SCALES);
    const rootMidi = randInt(48, 61); // C3 to C4
    const scaleMidis = generateScaleMidi(rootMidi, scale.intervals);
    const audioNotes = scaleMidis.map(m => midiToNoteOctave(m));
    const choices = SCALES.map(s => s.name);

    return {
      prompt: 'What scale do you hear?',
      audioNotes,
      audioPlayMode: 'sequential' as const,
      autoPlay: true,
      correctAnswer: scale.name,
      choices,
      answerLayout: SCALE_LAYOUT,
    };
  },
};
