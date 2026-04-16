import {
  INTERVALS,
  INTERVAL_LAYOUT,
  fretToMidi,
  fretToNoteName,
  fretToNoteOctave,
  intervalBetween,
  getInterval,
  displayNote,
  randInt,
} from '../music-theory';
import type { ExerciseConfig, ExerciseSettings } from './types';
import { DEFAULT_SETTINGS, FRETBOARD_SETTINGS } from './types';

export const fretboardIntervals: ExerciseConfig = {
  id: 'fretboard-intervals',
  title: 'Fretboard Intervals',
  description: 'Identify the interval between two notes on the fretboard',
  category: 'fretboard',
  difficulty: 'beginner',
  visualType: 'fretboard',
  settingsConfig: FRETBOARD_SETTINGS,

  generateQuestion(settings: ExerciseSettings = DEFAULT_SETTINGS) {
    const s = settings;
    const maxFret = 12;
    const maxString = 5;

    const string1 = randInt(0, maxString + 1);
    const fret1 = randInt(0, maxFret + 1);

    const minString = Math.max(0, string1 - s.stringRange);
    const maxStringTarget = Math.min(maxString, string1 + s.stringRange);
    const minFret = Math.max(0, fret1 - s.fretRange);
    const maxFretTarget = Math.min(maxFret, fret1 + s.fretRange);

    let string2: number;
    let fret2: number;
    let attempts = 0;

    do {
      string2 = randInt(minString, maxStringTarget + 1);
      fret2 = randInt(minFret, maxFretTarget + 1);
      attempts++;

      if (attempts > 100) {
        string2 = string1;
        fret2 = Math.min(fret1 + 1, maxFret);
        break;
      }

      const midi1 = fretToMidi(string1, fret1);
      const midi2 = fretToMidi(string2, fret2);

      if (s.direction === 'ascending' && midi2 <= midi1) continue;
      if (s.direction === 'descending' && midi2 >= midi1) continue;
      if (string2 === string1 && fret2 === fret1) continue;

      break;
    } while (true);

    const midi1 = fretToMidi(string1, fret1);
    const midi2 = fretToMidi(string2, fret2);
    const semitones = intervalBetween(midi1, midi2);
    const interval = getInterval(semitones);

    const note1Name = displayNote(fretToNoteName(string1, fret1), s.useFlats);
    const note2Name = displayNote(fretToNoteName(string2, fret2), s.useFlats);
    const note1Octave = fretToNoteOctave(string1, fret1);
    const note2Octave = fretToNoteOctave(string2, fret2);

    const choices = INTERVALS.map(i => i.name);

    return {
      prompt: s.showNoteLabels
        ? `What is the interval from ${note1Name} to ${note2Name}?`
        : 'What is the following interval?',
      fretboardNotes: [
        { stringIndex: string1, fret: fret1, label: note1Name, className: 'fretboard-note--root' },
        { stringIndex: string2, fret: fret2, label: note2Name, className: 'fretboard-note--target' },
      ],
      audioNotes: [note1Octave, note2Octave],
      correctAnswer: interval.name,
      choices,
      answerLayout: INTERVAL_LAYOUT,
    };
  },
};
