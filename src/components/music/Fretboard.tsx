import { STRING_NAMES } from './lib/music-theory';

export interface FretboardNote {
  stringIndex: number;
  fret: number;
  label?: string;
  className?: string;
}

interface FretboardProps {
  frets?: number;
  strings?: number;
  highlightedNotes?: FretboardNote[];
  onNoteClick?: (stringIndex: number, fret: number) => void;
  showFretNumbers?: boolean;
  showStringLabels?: boolean;
}

// Fret marker positions (dots on a standard guitar)
const SINGLE_DOTS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_DOTS = [12, 24];

export default function Fretboard({
  frets = 12,
  strings = 6,
  highlightedNotes = [],
  onNoteClick,
  showFretNumbers = true,
  showStringLabels = true,
}: FretboardProps) {
  // Layout dimensions
  const nutWidth = 4;
  const fretWidth = 60;
  const stringSpacing = 24;
  const paddingTop = 30;
  const paddingBottom = showFretNumbers ? 24 : 10;
  const paddingLeft = 30;
  const paddingRight = 10;

  const boardWidth = frets * fretWidth;
  const boardHeight = (strings - 1) * stringSpacing;
  const svgWidth = paddingLeft + nutWidth + boardWidth + paddingRight;
  const svgHeight = paddingTop + boardHeight + paddingBottom;

  // Build a lookup map for O(1) highlight checks instead of O(n) per position
  const highlightMap = new Map<string, FretboardNote>();
  for (const n of highlightedNotes) {
    highlightMap.set(`${n.stringIndex}-${n.fret}`, n);
  }

  return (
    <div className="fretboard-wrapper">
      <svg
        className="fretboard-svg"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width={svgWidth}
        height={svgHeight}
        aria-label="Guitar fretboard"
        role="img"
      >
        {/* Nut */}
        <line
          x1={paddingLeft + nutWidth / 2}
          y1={paddingTop}
          x2={paddingLeft + nutWidth / 2}
          y2={paddingTop + boardHeight}
          className="fretboard-nut"
        />

        {/* Frets */}
        {Array.from({ length: frets }, (_, i) => {
          const x = paddingLeft + nutWidth + (i + 1) * fretWidth;
          return (
            <line
              key={`fret-${i}`}
              x1={x}
              y1={paddingTop}
              x2={x}
              y2={paddingTop + boardHeight}
              className="fretboard-fret"
            />
          );
        })}

        {/* Dot markers */}
        {Array.from({ length: frets }, (_, i) => {
          const fretNum = i + 1;
          const cx = paddingLeft + nutWidth + i * fretWidth + fretWidth / 2;
          if (SINGLE_DOTS.includes(fretNum)) {
            return (
              <circle
                key={`dot-${fretNum}`}
                cx={cx}
                cy={paddingTop + boardHeight / 2}
                r={3}
                className="fretboard-dot"
              />
            );
          }
          if (DOUBLE_DOTS.includes(fretNum)) {
            return (
              <g key={`dot-${fretNum}`}>
                <circle cx={cx} cy={paddingTop + boardHeight / 2 - stringSpacing} r={3} className="fretboard-dot" />
                <circle cx={cx} cy={paddingTop + boardHeight / 2 + stringSpacing} r={3} className="fretboard-dot" />
              </g>
            );
          }
          return null;
        })}

        {/* Strings */}
        {Array.from({ length: strings }, (_, i) => {
          const y = paddingTop + i * stringSpacing;
          const isLow = i <= 2; // E, A, D are thicker
          return (
            <g key={`string-${i}`}>
              <line
                x1={paddingLeft + nutWidth}
                y1={y}
                x2={paddingLeft + nutWidth + boardWidth}
                y2={y}
                className={`fretboard-string ${isLow ? 'fretboard-string--low' : ''}`}
              />
              {/* String name label */}
              {showStringLabels && (
                <text
                  x={paddingLeft - 8}
                  y={y}
                  className="fretboard-fret-number"
                  dominantBaseline="central"
                  textAnchor="end"
                >
                  {STRING_NAMES[i]}
                </text>
              )}
            </g>
          );
        })}

        {/* Fret numbers */}
        {showFretNumbers && Array.from({ length: frets }, (_, i) => {
          const x = paddingLeft + nutWidth + i * fretWidth + fretWidth / 2;
          return (
            <text
              key={`fretnum-${i}`}
              x={x}
              y={paddingTop + boardHeight + 16}
              className="fretboard-fret-number"
            >
              {i + 1}
            </text>
          );
        })}

        {/* Clickable note positions */}
        {Array.from({ length: strings }, (_, si) =>
          Array.from({ length: frets + 1 }, (_, fret) => {
            const x = fret === 0
              ? paddingLeft + nutWidth / 2
              : paddingLeft + nutWidth + (fret - 1) * fretWidth + fretWidth / 2;
            const y = paddingTop + si * stringSpacing;
            const highlight = highlightMap.get(`${si}-${fret}`);
            const noteClass = highlight?.className ?? '';

            return (
              <g
                key={`note-${si}-${fret}`}
                onClick={() => onNoteClick?.(si, fret)}
                style={{ cursor: onNoteClick ? 'pointer' : 'default' }}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={9}
                  className={`fretboard-note ${noteClass}`}
                  aria-label={highlight?.label ?? `String ${STRING_NAMES[si]}, fret ${fret}`}
                />
                {highlight?.label && (
                  <text x={x} y={y} className="fretboard-note-label">
                    {highlight.label}
                  </text>
                )}
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
}
