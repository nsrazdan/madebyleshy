import React from 'react';
import {
  midiToStaffPosition,
  midiToNoteName,
  midiToNoteNameFlat,
  KEY_SIG_SHARP_POSITIONS,
  KEY_SIG_FLAT_POSITIONS,
} from './lib/music-theory';
import type { StaffNoteData } from './lib/exercises/types';

interface StaffProps {
  clef: 'treble' | 'bass';
  notes?: StaffNoteData[];
  keySignature?: { count: number; type: 'sharp' | 'flat' };
  showNoteLabels?: boolean;
  useFlats?: boolean;
}

const LINE_SPACING = 12;
const STAFF_HEIGHT = 4 * LINE_SPACING; // 5 lines
const PADDING_TOP = 36;
const PADDING_BOTTOM = 36;
const PADDING_LEFT = 16;
const CLEF_WIDTH = 36;
const KEY_SIG_SPACING = 12;
const NOTE_AREA_START = 20; // after clef + key sig
const NOTE_SPACING = 32;
const NOTE_RADIUS = 6;

function bottomLineY() {
  return PADDING_TOP + STAFF_HEIGHT;
}

function positionToY(position: number): number {
  return bottomLineY() - position * (LINE_SPACING / 2);
}

function TrebleClef({ x, y }: { x: number; y: number }) {
  // Simplified treble clef as SVG path
  return (
    <g transform={`translate(${x}, ${y})`}>
      <path
        d="M8 44 C8 32 18 20 18 10 C18 2 12 -2 8 2 C4 6 8 14 14 18 C20 22 24 30 24 38 C24 46 20 52 14 56 C8 60 2 54 4 44"
        fill="none"
        className="staff-clef"
        strokeWidth="1.5"
      />
      <line x1="12" y1="4" x2="12" y2="62" className="staff-clef" strokeWidth="1.5" />
    </g>
  );
}

function BassClef({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <path
        d="M4 24 C4 12 14 4 22 4 C14 4 8 10 8 18 C8 24 12 28 16 28 C20 28 24 24 24 20"
        fill="none"
        className="staff-clef"
        strokeWidth="1.5"
      />
      <circle cx="28" cy="12" r="2" className="staff-clef-dot" />
      <circle cx="28" cy="24" r="2" className="staff-clef-dot" />
    </g>
  );
}

function AccidentalSymbol({ x, y, type }: { x: number; y: number; type: 'sharp' | 'flat' }) {
  if (type === 'sharp') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <line x1="-3" y1="-6" x2="-3" y2="6" className="staff-accidental" strokeWidth="1" />
        <line x1="1" y1="-7" x2="1" y2="5" className="staff-accidental" strokeWidth="1" />
        <line x1="-5" y1="-2" x2="3" y2="-4" className="staff-accidental" strokeWidth="1.5" />
        <line x1="-5" y1="3" x2="3" y2="1" className="staff-accidental" strokeWidth="1.5" />
      </g>
    );
  }
  return (
    <g transform={`translate(${x}, ${y})`}>
      <line x1="-2" y1="-8" x2="-2" y2="4" className="staff-accidental" strokeWidth="1" />
      <path
        d="M-2 0 C2 0 4 -2 4 -4 C4 -6 2 -6 -2 -4"
        fill="none"
        className="staff-accidental"
        strokeWidth="1"
      />
    </g>
  );
}

export default function Staff({
  clef,
  notes = [],
  keySignature,
  showNoteLabels = false,
  useFlats = false,
}: StaffProps) {
  // Calculate key signature width
  const keySigCount = keySignature?.count ?? 0;
  const keySigWidth = keySigCount * KEY_SIG_SPACING;

  const noteAreaX = PADDING_LEFT + CLEF_WIDTH + keySigWidth + NOTE_AREA_START;
  const totalNotesWidth = Math.max(notes.length, 1) * NOTE_SPACING;
  const svgWidth = noteAreaX + totalNotesWidth + 30;
  const svgHeight = PADDING_TOP + STAFF_HEIGHT + PADDING_BOTTOM;

  const bly = bottomLineY();

  return (
    <div className="staff-wrapper">
      <svg
        className="staff-svg"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width={svgWidth}
        height={svgHeight}
        aria-label={`Musical staff (${clef} clef)`}
        role="img"
      >
        {/* Staff lines */}
        {Array.from({ length: 5 }, (_, i) => {
          const y = PADDING_TOP + i * LINE_SPACING;
          return (
            <line
              key={`line-${i}`}
              x1={PADDING_LEFT}
              y1={y}
              x2={svgWidth - 10}
              y2={y}
              className="staff-line"
            />
          );
        })}

        {/* Clef */}
        {clef === 'treble' ? (
          <TrebleClef x={PADDING_LEFT + 2} y={PADDING_TOP - 8} />
        ) : (
          <BassClef x={PADDING_LEFT + 2} y={PADDING_TOP + 2} />
        )}

        {/* Key signature accidentals */}
        {keySignature && keySignature.count > 0 && (() => {
          const positions = keySignature.type === 'sharp'
            ? KEY_SIG_SHARP_POSITIONS[clef]
            : KEY_SIG_FLAT_POSITIONS[clef];
          return Array.from({ length: keySignature.count }, (_, i) => {
            const x = PADDING_LEFT + CLEF_WIDTH + i * KEY_SIG_SPACING;
            const y = positionToY(positions[i]);
            return (
              <AccidentalSymbol
                key={`keysig-${i}`}
                x={x}
                y={y}
                type={keySignature.type}
              />
            );
          });
        })()}

        {/* Notes */}
        {notes.map((note, i) => {
          const { position, accidental } = midiToStaffPosition(note.midi, clef, useFlats);
          const x = noteAreaX + i * NOTE_SPACING;
          const y = positionToY(position);
          const noteClass = note.className ?? '';

          // Ledger lines — draw at every even position below 0 or above 8
          // that is needed to "support" the note (including notes on spaces
          // adjacent to a ledger, e.g. position -1 still needs the ledger at -2)
          const ledgers: React.JSX.Element[] = [];
          const lowestLedger = position < 0 ? position - (position % 2 === 0 ? 0 : 1) : 0;
          const highestLedger = position > 8 ? position + (position % 2 === 0 ? 0 : 1) : 8;

          for (let p = -2; p >= lowestLedger; p -= 2) {
            ledgers.push(
              <line
                key={`ledger-${p}`}
                x1={x - NOTE_RADIUS - 4}
                y1={positionToY(p)}
                x2={x + NOTE_RADIUS + 4}
                y2={positionToY(p)}
                className="staff-ledger"
              />
            );
          }
          for (let p = 10; p <= highestLedger; p += 2) {
            ledgers.push(
              <line
                key={`ledger-${p}`}
                x1={x - NOTE_RADIUS - 4}
                y1={positionToY(p)}
                x2={x + NOTE_RADIUS + 4}
                y2={positionToY(p)}
                className="staff-ledger"
              />
            );
          }

          const noteName = useFlats ? midiToNoteNameFlat(note.midi) : midiToNoteName(note.midi);
          const label = note.label ?? (showNoteLabels ? noteName : undefined);

          return (
            <g key={`note-${i}`}>
              {ledgers}
              {/* Accidental */}
              {accidental && (
                <AccidentalSymbol
                  x={x - NOTE_RADIUS - 8}
                  y={y}
                  type={accidental}
                />
              )}
              {/* Note head */}
              <ellipse
                cx={x}
                cy={y}
                rx={NOTE_RADIUS}
                ry={NOTE_RADIUS * 0.8}
                className={`staff-note ${noteClass}`}
              />
              {/* Label below note */}
              {label && (
                <text
                  x={x}
                  y={bly + 28}
                  className="staff-note-label"
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
