import {
  SCALES,
  SCALE_LAYOUT,
  generateScaleMidi,
  midiToNoteName,
  midiToNoteNameFlat,
  midiToNoteOctave,
  clefMidiRange,
  randInt,
  randElement,
} from '../music-theory';
import type { ExerciseConfig, ExerciseSettings } from './types';
import { DEFAULT_SETTINGS, STAFF_SETTINGS } from './types';

export const staffScales: ExerciseConfig = {
  id: 'staff-scales',
  title: 'Staff Scales',
  description: 'Identify the scale shown on the staff',
  category: 'staff',
  difficulty: 'intermediate',
  visualType: 'staff',
  settingsConfig: STAFF_SETTINGS,

  generateQuestion(settings: ExerciseSettings = DEFAULT_SETTINGS) {
    const clef = settings.clef;
    const scale = randElement(SCALES);
    const { min } = clefMidiRange(clef);

    // Pick root within lower portion of clef range so scale fits
    const rootMidi = randInt(min, min + 12);
    const scaleMidis = generateScaleMidi(rootMidi, scale.intervals);

    const rootName = settings.useFlats ? midiToNoteNameFlat(rootMidi) : midiToNoteName(rootMidi);
    const audioNotes = scaleMidis.map(m => midiToNoteOctave(m));
    const choices = SCALES.map(s => s.name);

    const staffNotes = scaleMidis.map((midi, i) => ({
      midi,
      className: i === 0 ? 'staff-note--root' : 'staff-note--target',
    }));

    return {
      prompt: settings.showNoteLabels
        ? `What scale is ${rootName} playing?`
        : 'What scale is shown?',
      staffNotes,
      staffClef: clef,
      audioNotes,
      audioPlayMode: 'sequential' as const,
      correctAnswer: scale.name,
      choices,
      answerLayout: SCALE_LAYOUT,
    };
  },
};
