import {
  INTERVALS,
  INTERVAL_LAYOUT,
  intervalBetween,
  getInterval,
  midiToNoteName,
  midiToNoteNameFlat,
  midiToNoteOctave,
  displayNote,
  randInt,
} from '../music-theory';
import type { ExerciseConfig, ExerciseSettings } from './types';
import { DEFAULT_SETTINGS, KEYBOARD_SETTINGS } from './types';

export const keyboardIntervals: ExerciseConfig = {
  id: 'keyboard-intervals',
  title: 'Keyboard Intervals',
  description: 'Identify the interval between two highlighted piano keys',
  category: 'keyboard',
  difficulty: 'beginner',
  visualType: 'keyboard',
  settingsConfig: KEYBOARD_SETTINGS,

  generateQuestion(settings: ExerciseSettings = DEFAULT_SETTINGS) {
    const startMidi = (settings.startOctave + 1) * 12;
    const endMidi = startMidi + settings.octaveCount * 12;

    const midi1 = randInt(startMidi, Math.max(startMidi + 1, endMidi - 12));
    const midi2 = randInt(midi1 + 1, Math.min(midi1 + 13, endMidi + 1));

    const semitones = intervalBetween(midi1, midi2);
    const interval = getInterval(semitones);

    const name1 = settings.useFlats ? midiToNoteNameFlat(midi1) : midiToNoteName(midi1);
    const name2 = settings.useFlats ? midiToNoteNameFlat(midi2) : midiToNoteName(midi2);

    const choices = INTERVALS.map(i => i.name);

    return {
      prompt: settings.showNoteLabels
        ? `What is the interval from ${name1} to ${name2}?`
        : 'What is the interval between the highlighted keys?',
      keyboardHighlight: [midi1, midi2],
      audioNotes: [midiToNoteOctave(midi1), midiToNoteOctave(midi2)],
      correctAnswer: interval.name,
      choices,
      answerLayout: INTERVAL_LAYOUT,
    };
  },
};
