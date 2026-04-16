import {
  INTERVALS,
  INTERVAL_LAYOUT,
  intervalBetween,
  getInterval,
  midiToNoteName,
  midiToNoteNameFlat,
  midiToNoteOctave,
  clefMidiRange,
  randInt,
} from '../music-theory';
import type { ExerciseConfig, ExerciseSettings } from './types';
import { DEFAULT_SETTINGS, STAFF_SETTINGS } from './types';

export const staffIntervals: ExerciseConfig = {
  id: 'staff-intervals',
  title: 'Staff Intervals',
  description: 'Identify the interval between two notes on the staff',
  category: 'staff',
  difficulty: 'beginner',
  visualType: 'staff',
  settingsConfig: STAFF_SETTINGS,

  generateQuestion(settings: ExerciseSettings = DEFAULT_SETTINGS) {
    const clef = settings.clef;
    const { min, max } = clefMidiRange(clef);

    const midi1 = randInt(min, Math.max(min + 1, max - 11));
    const midi2 = randInt(midi1 + 1, Math.min(midi1 + 13, max + 1));

    const semitones = intervalBetween(midi1, midi2);
    const interval = getInterval(semitones);

    const name1 = settings.useFlats ? midiToNoteNameFlat(midi1) : midiToNoteName(midi1);
    const name2 = settings.useFlats ? midiToNoteNameFlat(midi2) : midiToNoteName(midi2);

    const choices = INTERVALS.map(i => i.name);

    return {
      prompt: settings.showNoteLabels
        ? `What is the interval from ${name1} to ${name2}?`
        : 'What is the interval between the two notes?',
      staffNotes: [
        { midi: midi1, className: 'staff-note--root' },
        { midi: midi2, className: 'staff-note--target' },
      ],
      staffClef: clef,
      audioNotes: [midiToNoteOctave(midi1), midiToNoteOctave(midi2)],
      correctAnswer: interval.name,
      choices,
      answerLayout: INTERVAL_LAYOUT,
    };
  },
};
