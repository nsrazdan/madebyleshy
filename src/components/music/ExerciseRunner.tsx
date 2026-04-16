import { useState, useCallback, useEffect, useRef } from 'react';
import type { ExerciseConfig, ExerciseQuestion, ExerciseSettings, SettingConfig } from './lib/exercises/types';
import { DEFAULT_SETTINGS } from './lib/exercises/types';
import { getExerciseById } from './lib/exercises/index';
import Fretboard from './Fretboard';
import Keyboard from './Keyboard';
import Staff from './Staff';
import { playAudio, disposeAudio } from './audio/AudioEngine';
import type { Timbre } from './audio/AudioEngine';
import {
  saveAttempt,
  startSession,
  endSession,
  loadPreferences,
  savePreferences,
} from './lib/attempts';
import { useAuth } from './AuthPanel';
import { midiToNoteOctave } from './lib/music-theory';

interface ExerciseRunnerProps {
  exerciseId: string;
}

export default function ExerciseRunner({ exerciseId }: ExerciseRunnerProps) {
  const config = getExerciseById(exerciseId);
  if (!config) {
    return <div className="exercise-container"><p>Exercise not found.</p></div>;
  }
  return <ExerciseRunnerInner config={config} />;
}

// ── Settings Panel ─────────────────────────────────

function SettingsPanel({
  settings,
  settingsConfig,
  onUpdate,
}: {
  settings: ExerciseSettings;
  settingsConfig: SettingConfig[];
  onUpdate: <K extends keyof ExerciseSettings>(key: K, value: ExerciseSettings[K]) => void;
}) {
  return (
    <div className="settings-panel">
      {settingsConfig.map(cfg => {
        if (cfg.type === 'boolean') {
          return (
            <label key={cfg.key} className="settings-row">
              <span>{cfg.label}</span>
              <input
                type="checkbox"
                checked={settings[cfg.key] as boolean}
                onChange={e => onUpdate(cfg.key, e.target.checked as any)}
              />
            </label>
          );
        }
        if (cfg.type === 'number') {
          return (
            <label key={cfg.key} className="settings-row">
              <span>{cfg.label}</span>
              <input
                type="number"
                min={cfg.min}
                max={cfg.max}
                value={settings[cfg.key] as number}
                onChange={e => {
                  const v = parseInt(e.target.value) || cfg.min || 1;
                  const clamped = Math.max(cfg.min ?? 1, Math.min(cfg.max ?? 99, v));
                  onUpdate(cfg.key, clamped as any);
                }}
              />
            </label>
          );
        }
        if (cfg.type === 'select' && cfg.options) {
          return (
            <label key={cfg.key} className="settings-row">
              <span>{cfg.label}</span>
              <select
                value={settings[cfg.key] as string}
                onChange={e => onUpdate(cfg.key, e.target.value as any)}
              >
                {cfg.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
          );
        }
        return null;
      })}
    </div>
  );
}

// ── Answer Grid ────────────────────────────────────

function AnswerGrid({
  question,
  selectedAnswer,
  onAnswer,
}: {
  question: ExerciseQuestion;
  selectedAnswer: string | null;
  onAnswer: (choice: string) => void;
}) {
  const layout = question.answerLayout ?? [question.choices];

  return (
    <div className="answer-grid">
      {layout.map((row, ri) => (
        <div key={ri} className="answer-row">
          {row.map(choice => {
            let btnClass = 'answer-btn';
            if (selectedAnswer !== null) {
              if (choice === question.correctAnswer) {
                btnClass += ' answer-btn--correct';
              } else if (choice === selectedAnswer) {
                btnClass += ' answer-btn--incorrect';
              } else {
                btnClass += ' answer-btn--disabled';
              }
            }
            return (
              <button
                key={choice}
                className={btnClass}
                onClick={() => onAnswer(choice)}
                disabled={selectedAnswer !== null}
              >
                {choice}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Visual Display ─────────────────────────────────

function VisualDisplay({
  config,
  question,
  settings,
  onKeyClick,
  clickFeedback,
}: {
  config: ExerciseConfig;
  question: ExerciseQuestion;
  settings: ExerciseSettings;
  onKeyClick?: (midi: number) => void;
  clickFeedback?: Record<number, string>;
}) {
  const vt = config.visualType;

  if (vt === 'fretboard' && question.fretboardNotes) {
    const displayNotes = settings.showNoteLabels
      ? question.fretboardNotes
      : question.fretboardNotes.map(n => ({ ...n, label: undefined }));

    return (
      <Fretboard
        highlightedNotes={displayNotes}
        frets={12}
        showFretNumbers={settings.showFretLabels}
        showStringLabels={settings.showStringLabels}
      />
    );
  }

  if (vt === 'keyboard') {
    return (
      <Keyboard
        startOctave={settings.startOctave}
        octaveCount={settings.octaveCount}
        highlightedNotes={question.keyboardHighlight ?? []}
        onKeyClick={onKeyClick}
        showLabels={settings.showNoteLabels}
        useFlats={settings.useFlats}
        noteClasses={clickFeedback}
      />
    );
  }

  if (vt === 'staff') {
    return (
      <Staff
        clef={question.staffClef ?? settings.clef}
        notes={question.staffNotes ?? []}
        keySignature={question.staffKeySignature}
        showNoteLabels={settings.showNoteLabels}
        useFlats={settings.useFlats}
      />
    );
  }

  // ear-training: no visual, just audio controls
  return null;
}

// ── Main Runner ────────────────────────────────────

function ExerciseRunnerInner({ config }: { config: ExerciseConfig }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ExerciseSettings>(() => ({ ...DEFAULT_SETTINGS }));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [question, setQuestion] = useState<ExerciseQuestion>(() => config.generateQuestion(settings));
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [clickFeedback, setClickFeedback] = useState<Record<number, string>>({});

  const sessionIdRef = useRef<string | null>(null);
  const questionStartRef = useRef<number>(Date.now());
  const autoPlayedRef = useRef(false);

  const timbre: Timbre = config.visualType === 'fretboard' ? 'guitar' : 'piano';

  // Load saved preferences on login
  useEffect(() => {
    if (!user || prefsLoaded) return;
    loadPreferences(config.id).then(prefs => {
      if (prefs) {
        const merged = { ...DEFAULT_SETTINGS, ...prefs };
        setSettings(merged);
        setQuestion(config.generateQuestion(merged));
      }
      setPrefsLoaded(true);
    });
  }, [user, config, prefsLoaded]);

  // Start session when user is logged in
  useEffect(() => {
    if (!user) return;
    startSession(config.id, settings).then(id => {
      sessionIdRef.current = id;
    });
    return () => {
      if (sessionIdRef.current) {
        endSession(sessionIdRef.current);
        sessionIdRef.current = null;
      }
    };
  }, [user, config.id]);

  // Clean up audio resources on unmount
  useEffect(() => disposeAudio, []);

  // Auto-play audio for ear training exercises
  useEffect(() => {
    if (question.autoPlay && question.audioNotes && !autoPlayedRef.current) {
      autoPlayedRef.current = true;
      const mode = question.audioPlayMode ?? settings.playMode;
      playAudio(question.audioNotes, mode, timbre);
    }
  }, [question, settings.playMode]);

  const advanceQuestion = useCallback(() => {
    autoPlayedRef.current = false;
    setQuestion(config.generateQuestion(settings));
    setSelectedAnswer(null);
    setClickFeedback({});
    questionStartRef.current = Date.now();
  }, [config, settings]);

  const recordAnswer = useCallback((choice: string, correct: boolean) => {
    const responseTime = Date.now() - questionStartRef.current;
    setTotalCount(prev => prev + 1);
    if (correct) setCorrectCount(prev => prev + 1);

    saveAttempt({
      exercise_id: config.id,
      session_id: sessionIdRef.current ?? undefined,
      question_prompt: question.prompt,
      correct_answer: question.correctAnswer,
      user_answer: choice,
      is_correct: correct,
      response_time_ms: responseTime,
    });
  }, [config.id, question]);

  const handleAnswer = useCallback((choice: string) => {
    if (selectedAnswer !== null) return;
    const correct = choice === question.correctAnswer;
    setSelectedAnswer(choice);
    recordAnswer(choice, correct);
    setTimeout(advanceQuestion, 1000);
  }, [selectedAnswer, question, recordAnswer, advanceQuestion]);

  // Click-to-answer handler (for keyboard reverse, etc.)
  const handleKeyClick = useCallback((midi: number) => {
    if (selectedAnswer !== null) return;
    if (!question.clickToAnswer || question.correctMidi === undefined) return;

    const correct = midi === question.correctMidi;
    const noteName = midiToNoteOctave(midi);
    const correctName = midiToNoteOctave(question.correctMidi);

    setSelectedAnswer(noteName);
    setClickFeedback({
      [midi]: correct ? 'keyboard-key--correct' : 'keyboard-key--incorrect',
      ...(correct ? {} : { [question.correctMidi]: 'keyboard-key--correct' }),
    });
    recordAnswer(noteName, correct);
    setTimeout(advanceQuestion, 1200);
  }, [selectedAnswer, question, recordAnswer, advanceQuestion]);

  const handlePlayAudio = useCallback(async () => {
    if (question.audioNotes && question.audioNotes.length > 0) {
      const mode = question.audioPlayMode ?? settings.playMode;
      await playAudio(question.audioNotes, mode, timbre);
    }
  }, [question, settings.playMode]);

  const handleReset = useCallback(() => {
    if (sessionIdRef.current) endSession(sessionIdRef.current);
    if (user) {
      startSession(config.id, settings).then(id => {
        sessionIdRef.current = id;
      });
    }
    autoPlayedRef.current = false;
    setQuestion(config.generateQuestion(settings));
    setSelectedAnswer(null);
    setClickFeedback({});
    setCorrectCount(0);
    setTotalCount(0);
    questionStartRef.current = Date.now();
  }, [config, settings, user]);

  const updateSetting = useCallback(<K extends keyof ExerciseSettings>(key: K, value: ExerciseSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      autoPlayedRef.current = false;
      setQuestion(config.generateQuestion(next));
      setSelectedAnswer(null);
      setClickFeedback({});
      questionStartRef.current = Date.now();
      if (user) savePreferences(config.id, next);
      return next;
    });
  }, [config, user]);

  const hasAudio = question.audioNotes && question.audioNotes.length > 0;

  return (
    <div className="exercise-container">
      {/* Settings gear */}
      {config.settingsConfig.length > 0 && (
        <>
          <button
            className="settings-toggle"
            onClick={() => setSettingsOpen(prev => !prev)}
            title="Settings"
            aria-label="Toggle settings"
          >
            &#9881;
          </button>
          {settingsOpen && (
            <SettingsPanel
              settings={settings}
              settingsConfig={config.settingsConfig}
              onUpdate={updateSetting}
            />
          )}
        </>
      )}

      {/* Score tally */}
      <div className="exercise-score-tally">
        <span className="tally-correct">{correctCount}</span>
        {' / '}
        <span className="tally-total">{totalCount}</span>
        {totalCount > 0 && (
          <button className="tally-reset" onClick={handleReset} title="Reset score">
            reset
          </button>
        )}
      </div>

      {/* Prompt */}
      <div className="exercise-header">
        <h2>{question.prompt}</h2>
      </div>

      {/* Visual display */}
      <VisualDisplay
        config={config}
        question={question}
        settings={settings}
        onKeyClick={question.clickToAnswer ? handleKeyClick : undefined}
        clickFeedback={clickFeedback}
      />

      {/* Play audio button */}
      {hasAudio && (
        <div style={{ textAlign: 'center', margin: '1rem 0' }}>
          <button className="play-btn" onClick={handlePlayAudio}>
            &#9654; play {question.audioPlayMode === 'simultaneous' ? 'chord' : config.visualType === 'ear-training' ? 'again' : 'audio'}
          </button>
        </div>
      )}

      {/* Answer buttons (skip for click-to-answer exercises) */}
      {!question.clickToAnswer && (
        <AnswerGrid
          question={question}
          selectedAnswer={selectedAnswer}
          onAnswer={handleAnswer}
        />
      )}

      {/* Click-to-answer hint */}
      {question.clickToAnswer && selectedAnswer === null && (
        <p className="click-hint">click the correct key on the keyboard</p>
      )}
    </div>
  );
}
