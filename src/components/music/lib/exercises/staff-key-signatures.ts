import {
  KEY_SIGNATURES,
  KEY_SIG_LAYOUT,
  randElement,
} from '../music-theory';
import type { ExerciseConfig, ExerciseSettings } from './types';
import { DEFAULT_SETTINGS, STAFF_SETTINGS } from './types';

export const staffKeySignatures: ExerciseConfig = {
  id: 'staff-key-signatures',
  title: 'Key Signatures',
  description: 'Identify the key signature shown on the staff',
  category: 'staff',
  difficulty: 'beginner',
  visualType: 'staff',
  settingsConfig: STAFF_SETTINGS.filter(s => s.key === 'clef'),

  generateQuestion(settings: ExerciseSettings = DEFAULT_SETTINGS) {
    const keySig = randElement(KEY_SIGNATURES);

    const choices = KEY_SIGNATURES.map(k => k.key);
    const staffKeySig = keySig.count === 0
      ? undefined
      : { count: keySig.count, type: keySig.type as 'sharp' | 'flat' };

    return {
      prompt: 'What key signature is shown?',
      staffNotes: [],
      staffClef: settings.clef,
      staffKeySignature: staffKeySig,
      correctAnswer: keySig.key,
      choices,
      answerLayout: KEY_SIG_LAYOUT,
    };
  },
};
