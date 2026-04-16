import {
  CHORDS,
  CHORD_LAYOUT,
  generateChordMidi,
  midiToNoteOctave,
  randInt,
  randElement,
} from '../music-theory';
import type { ExerciseConfig, ExerciseSettings } from './types';
import { DEFAULT_SETTINGS, EAR_SETTINGS } from './types';

export const earChords: ExerciseConfig = {
  id: 'ear-chords',
  title: 'Chord Ear Training',
  description: 'Identify the chord you hear',
  category: 'ear training',
  difficulty: 'intermediate',
  visualType: 'ear-training',
  settingsConfig: EAR_SETTINGS,

  generateQuestion(settings: ExerciseSettings = DEFAULT_SETTINGS) {
    const chord = randElement(CHORDS);
    const rootMidi = randInt(48, 61); // C3 to C4
    const chordMidis = generateChordMidi(rootMidi, chord.intervals);
    const audioNotes = chordMidis.map(m => midiToNoteOctave(m));
    const choices = CHORDS.map(c => c.name);

    return {
      prompt: 'What type of chord do you hear?',
      audioNotes,
      audioPlayMode: 'simultaneous' as const,
      autoPlay: true,
      correctAnswer: chord.name,
      choices,
      answerLayout: CHORD_LAYOUT,
    };
  },
};
