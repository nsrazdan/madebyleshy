import {
  CHORDS,
  CHORD_LAYOUT,
  generateChordMidi,
  midiToNoteName,
  midiToNoteNameFlat,
  midiToNoteOctave,
  randInt,
  randElement,
} from '../music-theory';
import type { ExerciseConfig, ExerciseSettings } from './types';
import { DEFAULT_SETTINGS, KEYBOARD_SETTINGS } from './types';

export const keyboardChords: ExerciseConfig = {
  id: 'keyboard-chords',
  title: 'Keyboard Chords',
  description: 'Identify the chord shown on the keyboard',
  category: 'keyboard',
  difficulty: 'intermediate',
  visualType: 'keyboard',
  settingsConfig: KEYBOARD_SETTINGS,

  generateQuestion(settings: ExerciseSettings = DEFAULT_SETTINGS) {
    const chord = randElement(CHORDS);
    const rootMidi = (settings.startOctave + 1) * 12 + randInt(0, 12);
    const chordMidis = generateChordMidi(rootMidi, chord.intervals);

    const rootName = settings.useFlats ? midiToNoteNameFlat(rootMidi) : midiToNoteName(rootMidi);
    const audioNotes = chordMidis.map(m => midiToNoteOctave(m));
    const choices = CHORDS.map(c => c.name);

    return {
      prompt: settings.showNoteLabels
        ? `What type of chord is ${rootName} playing?`
        : 'What type of chord is highlighted?',
      keyboardHighlight: chordMidis,
      audioNotes,
      audioPlayMode: 'simultaneous' as const,
      correctAnswer: chord.name,
      choices,
      answerLayout: CHORD_LAYOUT,
    };
  },
};
