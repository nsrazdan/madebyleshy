import {
  INTERVALS,
  INTERVAL_LAYOUT,
  intervalBetween,
  getInterval,
  midiToNoteOctave,
  randInt,
} from '../music-theory';
import type { ExerciseConfig, ExerciseSettings } from './types';
import { DEFAULT_SETTINGS, EAR_SETTINGS } from './types';

export const earIntervals: ExerciseConfig = {
  id: 'ear-intervals',
  title: 'Interval Ear Training',
  description: 'Identify the interval you hear',
  category: 'ear training',
  difficulty: 'beginner',
  visualType: 'ear-training',
  settingsConfig: EAR_SETTINGS,

  generateQuestion(settings: ExerciseSettings = DEFAULT_SETTINGS) {
    const midi1 = randInt(48, 67); // C3 to G4
    const midi2 = randInt(midi1 + 1, Math.min(midi1 + 13, 79));

    const semitones = intervalBetween(midi1, midi2);
    const interval = getInterval(semitones);
    const choices = INTERVALS.map(i => i.name);

    return {
      prompt: 'What interval do you hear?',
      audioNotes: [midiToNoteOctave(midi1), midiToNoteOctave(midi2)],
      audioPlayMode: settings.playMode,
      autoPlay: true,
      correctAnswer: interval.name,
      choices,
      answerLayout: INTERVAL_LAYOUT,
    };
  },
};
