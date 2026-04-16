import React from 'react';
import {
  WHITE_KEY_WIDTH,
  WHITE_KEY_HEIGHT,
  BLACK_KEY_WIDTH,
  BLACK_KEY_HEIGHT,
  BLACK_KEY_OFFSETS,
  WHITE_KEY_SEMITONES,
  BLACK_KEY_SEMITONES,
  midiToNoteName,
  midiToNoteNameFlat,
} from './lib/music-theory';

export interface KeyboardProps {
  startOctave?: number;
  octaveCount?: number;
  highlightedNotes?: number[];     // MIDI note numbers
  onKeyClick?: (midi: number) => void;
  showLabels?: boolean;
  useFlats?: boolean;
  /** Optional per-note class map (midi -> className) */
  noteClasses?: Record<number, string>;
}

export default function Keyboard({
  startOctave = 3,
  octaveCount = 3,
  highlightedNotes = [],
  onKeyClick,
  showLabels = false,
  useFlats = false,
  noteClasses = {},
}: KeyboardProps) {
  const startMidi = (startOctave + 1) * 12; // C of startOctave
  const totalWhiteKeys = octaveCount * 7 + 1; // Include final C

  const svgWidth = totalWhiteKeys * WHITE_KEY_WIDTH + 2;
  const svgHeight = WHITE_KEY_HEIGHT + (showLabels ? 20 : 4);

  const highlighted = new Set(highlightedNotes);

  // Build white keys and black keys
  const whiteKeys: React.JSX.Element[] = [];
  const blackKeys: React.JSX.Element[] = [];
  const labels: React.JSX.Element[] = [];

  let whiteIndex = 0;

  for (let octave = 0; octave <= octaveCount; octave++) {
    const octaveStartMidi = startMidi + octave * 12;
    const semitones = octave < octaveCount ? [0, 2, 4, 5, 7, 9, 11] : [0]; // Last octave: only C

    // White keys for this octave
    for (const semitone of semitones) {
      const midi = octaveStartMidi + semitone;
      const x = whiteIndex * WHITE_KEY_WIDTH + 1;
      const isHighlighted = highlighted.has(midi);
      const extraClass = noteClasses[midi] ?? '';

      whiteKeys.push(
        <rect
          key={`white-${midi}`}
          x={x}
          y={1}
          width={WHITE_KEY_WIDTH - 1}
          height={WHITE_KEY_HEIGHT - 1}
          className={`keyboard-white-key ${isHighlighted ? 'keyboard-key--highlighted' : ''} ${extraClass}`}
          onClick={() => onKeyClick?.(midi)}
          style={{ cursor: onKeyClick ? 'pointer' : 'default' }}
          aria-label={useFlats ? midiToNoteNameFlat(midi) : midiToNoteName(midi)}
        />
      );

      if (showLabels) {
        const name = useFlats ? midiToNoteNameFlat(midi) : midiToNoteName(midi);
        labels.push(
          <text
            key={`label-white-${midi}`}
            x={x + WHITE_KEY_WIDTH / 2}
            y={WHITE_KEY_HEIGHT - 8}
            className={`keyboard-label ${isHighlighted ? '' : 'keyboard-label--dim'}`}
          >
            {name}
          </text>
        );
      }

      whiteIndex++;
    }

    // Black keys for this octave (skip last octave)
    if (octave < octaveCount) {
      const octaveX = (octave * 7) * WHITE_KEY_WIDTH + 1;
      BLACK_KEY_SEMITONES.forEach((semitone, bIdx) => {
        const midi = octaveStartMidi + semitone;
        const x = octaveX + BLACK_KEY_OFFSETS[bIdx] * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2;
        const isHighlighted = highlighted.has(midi);
        const extraClass = noteClasses[midi] ?? '';

        blackKeys.push(
          <rect
            key={`black-${midi}`}
            x={x}
            y={1}
            width={BLACK_KEY_WIDTH}
            height={BLACK_KEY_HEIGHT}
            className={`keyboard-black-key ${isHighlighted ? 'keyboard-key--highlighted' : ''} ${extraClass}`}
            onClick={() => onKeyClick?.(midi)}
            style={{ cursor: onKeyClick ? 'pointer' : 'default' }}
            aria-label={useFlats ? midiToNoteNameFlat(midi) : midiToNoteName(midi)}
          />
        );

        if (showLabels) {
          const name = useFlats ? midiToNoteNameFlat(midi) : midiToNoteName(midi);
          labels.push(
            <text
              key={`label-black-${midi}`}
              x={x + BLACK_KEY_WIDTH / 2}
              y={BLACK_KEY_HEIGHT - 6}
              className={`keyboard-label keyboard-label--black ${isHighlighted ? '' : 'keyboard-label--dim'}`}
            >
              {name}
            </text>
          );
        }
      });
    }
  }

  return (
    <div className="keyboard-wrapper">
      <svg
        className="keyboard-svg"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width={svgWidth}
        height={svgHeight}
        aria-label="Piano keyboard"
        role="img"
      >
        {/* White keys first (behind black keys) */}
        {whiteKeys}
        {/* Black keys on top */}
        {blackKeys}
        {/* Labels on top of everything */}
        {labels}
      </svg>
    </div>
  );
}
