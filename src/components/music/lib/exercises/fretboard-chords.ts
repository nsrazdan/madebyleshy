import {
  CHORDS,
  CHORD_LAYOUT,
  fretToNoteName,
  displayNote,
  generateFretboardChord,
  randInt,
  randElement,
} from '../music-theory';
import type { ExerciseConfig, ExerciseSettings } from './types';
import { DEFAULT_SETTINGS, FRETBOARD_SETTINGS } from './types';

export const fretboardChords: ExerciseConfig = {
  id: 'fretboard-chords',
  title: 'Fretboard Chords',
  description: 'Identify the chord shape on the fretboard',
  category: 'fretboard',
  difficulty: 'intermediate',
  visualType: 'fretboard',
  settingsConfig: FRETBOARD_SETTINGS.filter(s =>
    ['showStringLabels', 'showFretLabels', 'showNoteLabels'].includes(s.key)
  ),

  generateQuestion(settings: ExerciseSettings = DEFAULT_SETTINGS) {
    const chord = randElement(CHORDS);
    const rootString = randInt(2, 5); // Middle strings for better voicings
    const rootFret = randInt(1, 10);

    const positions = generateFretboardChord(rootString, rootFret, chord.intervals, 4);
    const rootNoteName = displayNote(fretToNoteName(rootString, rootFret), settings.useFlats);

    const fretboardNotes = positions.map(p => ({
      stringIndex: p.stringIndex,
      fret: p.fret,
      label: settings.showNoteLabels
        ? displayNote(fretToNoteName(p.stringIndex, p.fret), settings.useFlats)
        : undefined,
      className: p.isRoot ? 'fretboard-note--root' : 'fretboard-note--target',
    }));

    const choices = CHORDS.map(c => c.name);

    return {
      prompt: settings.showNoteLabels
        ? `What type of chord is ${rootNoteName} playing?`
        : 'What type of chord is shown?',
      fretboardNotes,
      correctAnswer: chord.name,
      choices,
      answerLayout: CHORD_LAYOUT,
    };
  },
};
