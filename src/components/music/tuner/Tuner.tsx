import { useState, useEffect, useRef, useCallback } from 'react';
import { TunerEngine, ToneGenerator, NOTE_NAMES, type PitchResult } from './TunerEngine';
import {
  getInstruments,
  getPresetsForInstrument,
  noteToFrequency,
  type TuningPreset,
} from './tuning-presets';

// Precomputed note positions on the wheel (static — never changes)
const NOTE_WHEEL_RADIUS = 80;
const NOTE_WHEEL_CX = 120;
const NOTE_WHEEL_CY = 120;

const NOTE_POSITIONS = NOTE_NAMES.map((name, i) => {
  const angle = ((i / 12) * 360 - 90) * (Math.PI / 180);
  return {
    name,
    x: NOTE_WHEEL_CX + NOTE_WHEEL_RADIUS * Math.cos(angle),
    y: NOTE_WHEEL_CY + NOTE_WHEEL_RADIUS * Math.sin(angle),
  };
});

const CENTS_TICKS = [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50];

function CentsGauge({ cents, active }: { cents: number; active: boolean }) {
  const clampedCents = Math.max(-50, Math.min(50, cents));
  const inTune = active && Math.abs(cents) <= 5;

  return (
    <div className="tuner-cents-gauge">
      <div className="tuner-cents-track">
        {CENTS_TICKS.map(tick => (
          <div
            key={tick}
            className={`tuner-cents-tick${tick === 0 ? ' tuner-cents-tick--center' : ''}`}
            style={{ left: `${((tick + 50) / 100) * 100}%` }}
          />
        ))}
        {/* Needle */}
        {active && (
          <div
            className={`tuner-cents-needle${inTune ? ' tuner-cents-needle--in-tune' : ''}`}
            style={{ left: `${((clampedCents + 50) / 100) * 100}%` }}
          />
        )}
      </div>
      <div className="tuner-cents-labels">
        <span>-50</span>
        <span>0</span>
        <span>+50</span>
      </div>
    </div>
  );
}

function NoteWheel({ currentNote, active }: { currentNote: string | null; active: boolean }) {
  return (
    <svg className="tuner-note-wheel" viewBox="0 0 240 240" width="240" height="240">
      <circle cx={NOTE_WHEEL_CX} cy={NOTE_WHEEL_CY} r={100} fill="none" stroke="var(--border)" strokeWidth="1" />
      {NOTE_POSITIONS.map(({ name, x, y }) => (
        <text
          key={name}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          className={`tuner-wheel-note${active && currentNote === name ? ' tuner-wheel-note--active' : ''}`}
        >
          {name}
        </text>
      ))}
    </svg>
  );
}

function TuningCheatSheet({
  preset,
  referencePitch,
}: {
  preset: TuningPreset;
  referencePitch: number;
}) {
  return (
    <div className="tuner-cheat-sheet">
      <div className="tuner-cheat-strings">
        {preset.strings.map((s, i) => {
          const freq = noteToFrequency(s.note, s.octave, referencePitch);
          return (
            <div key={i} className="tuner-cheat-string">
              <span className="tuner-cheat-string-num">{i + 1}</span>
              <span className="tuner-cheat-string-note">
                {s.note}{s.octave}
              </span>
              <span className="tuner-cheat-string-freq">
                {freq.toFixed(1)} Hz
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Tuner() {
  const [listening, setListening] = useState(false);
  const [pitch, setPitch] = useState<PitchResult | null>(null);
  const [referencePitch, setReferencePitch] = useState(440);
  const [refInput, setRefInput] = useState('440');
  const [instrument, setInstrument] = useState('Guitar');
  const [presetIndex, setPresetIndex] = useState(0);
  const [toneActive, setToneActive] = useState(false);
  const [toneNote, setToneNote] = useState<{ note: string; octave: number } | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const engineRef = useRef<TunerEngine | null>(null);
  const toneGenRef = useRef<ToneGenerator | null>(null);
  const nullCountRef = useRef(0);

  const instruments = getInstruments();
  const presets = getPresetsForInstrument(instrument);
  const currentPreset = presets[presetIndex] || presets[0];

  const onPitch = useCallback((result: PitchResult | null) => {
    if (result) {
      nullCountRef.current = 0;
      setPitch(result);
    } else {
      nullCountRef.current++;
      // Keep showing the last detected note for a short while
      if (nullCountRef.current > 15) {
        setPitch(null);
      }
    }
  }, []);

  const toggleListening = useCallback(async () => {
    if (listening) {
      engineRef.current?.stop();
      engineRef.current = null;
      setListening(false);
      setPitch(null);
    } else {
      const engine = new TunerEngine(onPitch, referencePitch);
      engineRef.current = engine;
      setMicError(null);
      try {
        await engine.start();
        setListening(true);
      } catch (err: any) {
        engineRef.current = null;
        if (err?.name === 'NotAllowedError') {
          setMicError('microphone permission denied — check your browser or device settings');
        } else if (err?.name === 'NotFoundError') {
          setMicError('no microphone found on this device');
        } else {
          setMicError('could not access microphone');
        }
      }
    }
  }, [listening, onPitch, referencePitch]);

  // Update reference pitch on engine when it changes
  useEffect(() => {
    engineRef.current?.setReferencePitch(referencePitch);
  }, [referencePitch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.stop();
      toneGenRef.current?.stop();
    };
  }, []);

  // Handle instrument change
  const handleInstrumentChange = (inst: string) => {
    setInstrument(inst);
    setPresetIndex(0);
  };

  // Commit reference pitch
  const commitRefPitch = () => {
    const val = parseInt(refInput, 10);
    if (!isNaN(val) && val >= 400 && val <= 480) {
      setReferencePitch(val);
    } else {
      setRefInput(String(referencePitch));
    }
  };

  // Tone generator
  const playTone = (note: string, octave: number) => {
    if (toneActive && toneNote?.note === note && toneNote?.octave === octave) {
      toneGenRef.current?.stop();
      toneGenRef.current = null;
      setToneActive(false);
      setToneNote(null);
      return;
    }
    const freq = noteToFrequency(note, octave, referencePitch);
    if (!toneGenRef.current) {
      toneGenRef.current = new ToneGenerator();
    }
    toneGenRef.current.start(freq, 0.2);
    setToneActive(true);
    setToneNote({ note, octave });
  };

  const stopTone = () => {
    toneGenRef.current?.stop();
    toneGenRef.current = null;
    setToneActive(false);
    setToneNote(null);
  };

  const active = listening && pitch !== null;
  const inTune = active && Math.abs(pitch!.cents) <= 5;

  return (
    <div className="tuner-container">
      {/* Note display */}
      <div className="tuner-display">
        <NoteWheel currentNote={pitch?.note ?? null} active={active} />
        <div className="tuner-note-info">
          <span className={`tuner-note-name${inTune ? ' tuner-note-name--in-tune' : ''}`}>
            {active ? pitch!.note : '\u2014'}
          </span>
          <span className="tuner-octave">
            {active ? pitch!.octave : ''}
          </span>
        </div>
        <div className="tuner-frequency">
          {active ? `${pitch!.frequency.toFixed(1)} Hz` : '\u00A0'}
        </div>
      </div>

      {/* Cents gauge */}
      <CentsGauge cents={pitch?.cents ?? 0} active={active} />

      {/* Start/Stop button */}
      <button className="metro-btn metro-btn--play" onClick={toggleListening}>
        {listening ? '\u25A0 stop' : '\u25B6 start'}
      </button>

      {micError && (
        <div className="tuner-mic-error">{micError}</div>
      )}

      {/* Reference pitch */}
      <div className="tuner-ref-row">
        <span className="tuner-ref-label">A4 =</span>
        <input
          className="metro-input metro-input--small"
          type="text"
          inputMode="numeric"
          value={refInput}
          onChange={e => setRefInput(e.target.value)}
          onBlur={commitRefPitch}
          onKeyDown={e => e.key === 'Enter' && commitRefPitch()}
          style={{ width: '5ch' }}
        />
        <span className="tuner-ref-label">Hz</span>
      </div>

      {/* Tone generator */}
      {toneActive && (
        <div className="tuner-tone-indicator">
          playing {toneNote?.note}{toneNote?.octave} &mdash;{' '}
          <button className="tuner-link-btn" onClick={stopTone}>stop</button>
        </div>
      )}

      {/* Tuning cheat sheet */}
      <div className="tuner-cheat-section">
        <h2>tuning reference</h2>

        <div className="tuner-preset-row">
          <select
            className="metro-select"
            value={instrument}
            onChange={e => handleInstrumentChange(e.target.value)}
          >
            {instruments.map(inst => (
              <option key={inst} value={inst}>{inst.toLowerCase()}</option>
            ))}
          </select>
          <select
            className="metro-select"
            value={presetIndex}
            onChange={e => setPresetIndex(Number(e.target.value))}
          >
            {presets.map((p, i) => (
              <option key={i} value={i}>{p.name.toLowerCase()}</option>
            ))}
          </select>
        </div>

        <TuningCheatSheet preset={currentPreset} referencePitch={referencePitch} />

        <p className="tuner-cheat-hint">click a note to play its tone</p>

        <div className="tuner-cheat-playable">
          {currentPreset.strings.map((s, i) => {
            const isPlaying = toneActive && toneNote?.note === s.note && toneNote?.octave === s.octave;
            return (
              <button
                key={i}
                className={`metro-btn metro-btn--small${isPlaying ? ' metro-btn--toggle-active' : ''}`}
                onClick={() => playTone(s.note, s.octave)}
              >
                {s.note}{s.octave}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
