import { useState, useEffect, useRef, useCallback } from 'react';
import { MetronomeEngine, defaultAccents } from './MetronomeEngine';
import type { MetronomeConfig, BeatCallback, AccentLevel, ClickSound } from './MetronomeEngine';

const CLICK_SOUNDS: { value: ClickSound; label: string }[] = [
  { value: 'click', label: 'click' },
  { value: 'beep', label: 'beep' },
  { value: 'wood', label: 'wood' },
  { value: 'tick', label: 'tick' },
];
import { useAuth } from '../AuthPanel';
import {
  loadSetlists,
  saveSetlist,
  deleteSetlist,
  createDefaultSetlist,
  createDefaultItem,
} from './metronome-data';
import type { Setlist, SetlistItem } from './metronome-data';

// ── Tempo markings ────────────────────────────────
const TEMPO_MARKINGS = [
  { name: 'Largo', bpm: 50 },
  { name: 'Adagio', bpm: 70 },
  { name: 'Andante', bpm: 92 },
  { name: 'Moderato', bpm: 112 },
  { name: 'Allegro', bpm: 138 },
  { name: 'Vivace', bpm: 166 },
  { name: 'Presto', bpm: 184 },
];

function getTempoMarking(bpm: number): string {
  for (let i = TEMPO_MARKINGS.length - 1; i >= 0; i--) {
    if (bpm >= TEMPO_MARKINGS[i].bpm) return TEMPO_MARKINGS[i].name;
  }
  return 'Grave';
}

const TIME_SIGS = [2, 3, 4, 5, 6, 7] as const;
const SUBDIVISIONS: { value: 1 | 2 | 3 | 4; label: string }[] = [
  { value: 1, label: '1/4' },
  { value: 2, label: '1/8' },
  { value: 3, label: 'triplet' },
  { value: 4, label: '1/16' },
];

// ── Accent levels: 0=muted, 1=normal, 2=medium, 3=loud
const ACCENT_CYCLE: AccentLevel[] = [1, 2, 3, 0]; // click cycles: normal→medium→loud→muted→normal

function nextAccent(current: AccentLevel): AccentLevel {
  const idx = ACCENT_CYCLE.indexOf(current);
  return ACCENT_CYCLE[(idx + 1) % ACCENT_CYCLE.length];
}

// ── Beat Indicator ────────────────────────────────

function BeatIndicator({
  accents,
  activeBeat,
  activeSub,
  subdivision,
  playing,
  globalMuted,
  onAccentChange,
}: {
  accents: AccentLevel[];
  activeBeat: number;
  activeSub: number;
  subdivision: number;
  playing: boolean;
  globalMuted: boolean;
  onAccentChange: (beat: number, level: AccentLevel) => void;
}) {
  return (
    <div className="metro-beats">
      <div className="metro-beat-row">
        {accents.map((accent, i) => {
          const isActive = playing && i === activeBeat && activeSub === 0;
          const isMuted = accent === 0;
          return (
            <div
              key={i}
              className={`metro-accent-col ${isActive ? 'metro-accent-col--active' : ''} ${globalMuted && isActive ? 'metro-accent-col--global-muted' : ''}`}
              onClick={() => onAccentChange(i, nextAccent(accent))}
              title={`Beat ${i + 1}: ${['muted', 'normal', 'medium', 'loud'][accent]}`}
            >
              {/* 3 bars, bottom to top: bar 0 = normal, bar 1 = medium, bar 2 = loud */}
              {[2, 1, 0].map(barIdx => {
                const filled = accent > barIdx;
                return (
                  <div
                    key={barIdx}
                    className={`metro-accent-bar ${filled ? 'metro-accent-bar--filled' : ''} ${isMuted ? 'metro-accent-bar--muted' : ''} ${isActive && filled ? 'metro-accent-bar--lit' : ''}`}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      {subdivision > 1 && (
        <div className="metro-sub-dots">
          {Array.from({ length: subdivision }, (_, i) => (
            <div
              key={i}
              className={`metro-sub-dot ${playing && i === activeSub ? 'metro-sub-dot--active' : ''}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tap Tempo ─────────────────────────────────────

function useTapTempo(onTap: (bpm: number) => void) {
  const tapsRef = useRef<number[]>([]);

  return useCallback(() => {
    const now = performance.now();
    const taps = tapsRef.current;
    taps.push(now);

    // Only keep taps within last 3 seconds
    while (taps.length > 1 && now - taps[0] > 3000) {
      taps.shift();
    }

    if (taps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1]);
      }
      const avg = intervals.reduce((a, b) => a + b) / intervals.length;
      const bpm = Math.round(60000 / avg);
      if (bpm >= 20 && bpm <= 300) {
        onTap(bpm);
      }
    }
  }, [onTap]);
}

// ── Setlist Panel ─────────────────────────────────

function SetlistPanel({
  setlists,
  activeSetlist,
  activeItemIndex,
  onSelectSetlist,
  onSelectItem,
  onCreateSetlist,
  onDeleteSetlist,
  onRenameSetlist,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onSave,
  user,
}: {
  setlists: Setlist[];
  activeSetlist: Setlist | null;
  activeItemIndex: number;
  onSelectSetlist: (idx: number) => void;
  onSelectItem: (idx: number) => void;
  onCreateSetlist: () => void;
  onDeleteSetlist: (idx: number) => void;
  onRenameSetlist: (name: string) => void;
  onAddItem: () => void;
  onRemoveItem: (idx: number) => void;
  onUpdateItem: (idx: number, item: SetlistItem) => void;
  onSave: () => void;
  user: any;
}) {
  const [editingName, setEditingName] = useState(false);
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);

  if (!activeSetlist) {
    return (
      <div className="metro-setlist-panel">
        <h3>setlists</h3>
        {!user && <p className="metro-hint">log in to save setlists</p>}
        <div className="metro-setlist-list">
          {setlists.map((sl, i) => (
            <button key={i} className="metro-setlist-btn" onClick={() => onSelectSetlist(i)}>
              {sl.name}
            </button>
          ))}
        </div>
        <button className="metro-btn metro-btn--small" onClick={onCreateSetlist}>
          + new setlist
        </button>
      </div>
    );
  }

  return (
    <div className="metro-setlist-panel">
      <div className="metro-setlist-header">
        {editingName ? (
          <input
            className="metro-input"
            value={activeSetlist.name}
            onChange={e => onRenameSetlist(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
            autoFocus
          />
        ) : (
          <h3 onClick={() => setEditingName(true)} style={{ cursor: 'pointer' }}>
            {activeSetlist.name} {'\u270E'}
          </h3>
        )}
        <button className="metro-btn metro-btn--small" onClick={() => onSelectSetlist(-1)}>
          back
        </button>
      </div>

      <div className="metro-setlist-items">
        {activeSetlist.items.map((item, i) => (
          <div
            key={i}
            className={`metro-setlist-item ${i === activeItemIndex ? 'metro-setlist-item--active' : ''}`}
          >
            <button className="metro-setlist-item-btn" onClick={() => onSelectItem(i)}>
              <span className="metro-setlist-item-name">{item.name}</span>
              <span className="metro-setlist-item-meta">
                {item.bpm} bpm {'\u00B7'} {item.beatsPerMeasure}/4
              </span>
            </button>
            <button
              className="metro-btn metro-btn--icon"
              onClick={() => setEditingItemIdx(editingItemIdx === i ? null : i)}
              title="Edit"
            >
              {'\u270E'}
            </button>
            {activeSetlist.items.length > 1 && (
              <button
                className="metro-btn metro-btn--icon"
                onClick={() => onRemoveItem(i)}
                title="Remove"
              >
                {'\u00D7'}
              </button>
            )}

            {editingItemIdx === i && (
              <div className="metro-setlist-item-edit">
                <label>
                  Name
                  <input
                    className="metro-input"
                    value={item.name}
                    onChange={e => onUpdateItem(i, { ...item, name: e.target.value })}
                  />
                </label>
                <label>
                  BPM
                  <input
                    className="metro-input"
                    type="number"
                    min={20}
                    max={300}
                    value={item.bpm}
                    onChange={e => onUpdateItem(i, { ...item, bpm: +e.target.value })}
                  />
                </label>
                <label>
                  Beats
                  <select
                    className="metro-select"
                    value={item.beatsPerMeasure}
                    onChange={e => onUpdateItem(i, { ...item, beatsPerMeasure: +e.target.value })}
                  >
                    {TIME_SIGS.map(n => (
                      <option key={n} value={n}>{n}/4</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="metro-setlist-actions">
        <button className="metro-btn metro-btn--small" onClick={onAddItem}>
          + add song
        </button>
        {user && (
          <button className="metro-btn metro-btn--small" onClick={onSave}>
            save
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Metronome Component ──────────────────────

export default function Metronome() {
  const { user } = useAuth();

  // Core state
  const [bpm, setBpm] = useState(120);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [subdivision, setSubdivision] = useState<1 | 2 | 3 | 4>(1);
  const [accents, setAccents] = useState<AccentLevel[]>(defaultAccents(4));
  const [volume, setVolume] = useState(0.75);
  const [clickSound, setClickSound] = useState<ClickSound>('click');
  const [playing, setPlaying] = useState(false);

  // BPM input (free-text, committed on blur/enter)
  const [bpmInput, setBpmInput] = useState(String(bpm));
  const bpmInputDirty = useRef(false);

  // Visual state
  const [activeBeat, setActiveBeat] = useState(0);
  const [activeSub, setActiveSub] = useState(0);

  // Tempo trainer
  const [tempoTrainerEnabled, setTempoTrainerEnabled] = useState(false);
  const [ttIncreaseBpm, setTtIncreaseBpm] = useState(5);
  const [ttEveryBars, setTtEveryBars] = useState(4);
  const [ttTargetBpm, setTtTargetBpm] = useState(160);

  // Internal tempo trainer
  const [internalTrainerEnabled, setInternalTrainerEnabled] = useState(false);
  const [itPlayBars, setItPlayBars] = useState(1);
  const [itMuteBars, setItMuteBars] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Setlists
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [activeSetlistIdx, setActiveSetlistIdx] = useState<number | null>(null);
  const [activeItemIdx, setActiveItemIdx] = useState(0);
  const [showSetlists, setShowSetlists] = useState(false);

  // Settings panel
  const [showSettings, setShowSettings] = useState(false);

  // Engine ref
  const engineRef = useRef<MetronomeEngine | null>(null);
  const barCountRef = useRef(0);

  // Load setlists on login
  useEffect(() => {
    if (!user) return;
    loadSetlists().then(sl => {
      if (sl.length > 0) setSetlists(sl);
    });
  }, [user]);

  // Beat callback — engine reports mute state directly
  const onBeat: BeatCallback = useCallback((beat: number, sub: number, _time: number, muted: boolean) => {
    setActiveBeat(beat);
    setActiveSub(sub);
    setIsMuted(muted);

    // Track bars for tempo trainer
    if (beat === 0 && sub === 0) {
      barCountRef.current++;
    }
  }, []);

  // Tempo trainer effect — runs on bar boundaries
  useEffect(() => {
    if (!playing || !tempoTrainerEnabled) return;

    const interval = setInterval(() => {
      const bars = barCountRef.current;
      if (bars > 0 && bars % ttEveryBars === 0) {
        setBpm(prev => {
          const next = Math.min(prev + ttIncreaseBpm, ttTargetBpm);
          setBpmInput(String(next));
          engineRef.current?.updateConfig({ bpm: next });
          return next;
        });
        // Reset bar count so we don't double-trigger
        barCountRef.current = 0;
      }
    }, 100);

    return () => clearInterval(interval);
  }, [playing, tempoTrainerEnabled, ttIncreaseBpm, ttEveryBars, ttTargetBpm]);

  // Sync internal trainer config to engine
  useEffect(() => {
    if (internalTrainerEnabled) {
      engineRef.current?.setInternalTrainer({ playBars: itPlayBars, muteBars: itMuteBars });
    } else {
      engineRef.current?.setInternalTrainer(null);
      setIsMuted(false);
    }
  }, [internalTrainerEnabled, itPlayBars, itMuteBars]);

  // Sync engine config when settings change during playback
  useEffect(() => {
    engineRef.current?.updateConfig({
      bpm,
      beatsPerMeasure,
      subdivision,
      accents,
      volume,
      clickSound,
    });
  }, [bpm, beatsPerMeasure, subdivision, accents, volume, clickSound]);

  // Start/Stop
  const togglePlay = useCallback(() => {
    if (playing) {
      engineRef.current?.stop();
      engineRef.current = null;
      setPlaying(false);
      setActiveBeat(0);
      setActiveSub(0);
      setIsMuted(false);
      barCountRef.current = 0;
    } else {
      const config: MetronomeConfig = {
        bpm,
        beatsPerMeasure,
        subdivision,
        accents,
        volume,
        clickSound,
      };
      const engine = new MetronomeEngine(config, onBeat);
      if (internalTrainerEnabled) {
        engine.setInternalTrainer({ playBars: itPlayBars, muteBars: itMuteBars });
      }
      engineRef.current = engine;
      barCountRef.current = 0;
      engine.start();
      setPlaying(true);
    }
  }, [playing, bpm, beatsPerMeasure, subdivision, accents, volume, clickSound, onBeat, internalTrainerEnabled, itPlayBars, itMuteBars]);

  // Centralized BPM setter — updates state, input display, and engine
  const commitBpm = useCallback((value: number) => {
    const clamped = Math.max(20, Math.min(200, value));
    setBpm(clamped);
    setBpmInput(String(clamped));
    bpmInputDirty.current = false;
    engineRef.current?.updateConfig({ bpm: clamped });
  }, []);

  const commitBpmInput = useCallback(() => {
    const parsed = parseInt(bpmInput, 10);
    if (!isNaN(parsed)) {
      commitBpm(parsed);
    } else {
      setBpmInput(String(bpm));
    }
    bpmInputDirty.current = false;
  }, [bpmInput, bpm, commitBpm]);

  // Tap tempo
  const tapTempo = useTapTempo(useCallback((tappedBpm: number) => {
    commitBpm(tappedBpm);
  }, [commitBpm]));

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setBpm(b => {
          const next = Math.min(200, b + 1);
          setBpmInput(String(next));
          engineRef.current?.updateConfig({ bpm: next });
          return next;
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setBpm(b => {
          const next = Math.max(20, b - 1);
          setBpmInput(String(next));
          engineRef.current?.updateConfig({ bpm: next });
          return next;
        });
      } else if (e.key === 't' || e.key === 'T') {
        tapTempo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlay, tapTempo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
    };
  }, []);

  // ── Setlist handlers ──────────────────────────────
  const activeSetlist = activeSetlistIdx !== null ? setlists[activeSetlistIdx] : null;

  const applySetlistItem = useCallback((item: SetlistItem) => {
    commitBpm(item.bpm);
    setBeatsPerMeasure(item.beatsPerMeasure);
    setSubdivision(item.subdivision);
    setAccents(item.accents ?? defaultAccents(item.beatsPerMeasure));
    if (item.tempoTrainer) {
      setTempoTrainerEnabled(item.tempoTrainer.enabled);
      setTtIncreaseBpm(item.tempoTrainer.increaseBpm);
      setTtEveryBars(item.tempoTrainer.everyBars);
      setTtTargetBpm(item.tempoTrainer.targetBpm);
    }
    if (item.internalTrainer) {
      setInternalTrainerEnabled(item.internalTrainer.enabled);
      setItPlayBars(item.internalTrainer.playBars);
      setItMuteBars(item.internalTrainer.muteBars);
    }
    engineRef.current?.updateConfig({
      beatsPerMeasure: item.beatsPerMeasure,
      subdivision: item.subdivision,
      accents: item.accents ?? defaultAccents(item.beatsPerMeasure),
    });
  }, [commitBpm]);

  const handleSelectSetlist = useCallback((idx: number) => {
    if (idx < 0) {
      setActiveSetlistIdx(null);
      setActiveItemIdx(0);
      return;
    }
    setActiveSetlistIdx(idx);
    setActiveItemIdx(0);
    if (setlists[idx]?.items.length > 0) {
      applySetlistItem(setlists[idx].items[0]);
    }
  }, [setlists, applySetlistItem]);

  const handleSelectItem = useCallback((idx: number) => {
    setActiveItemIdx(idx);
    if (activeSetlist?.items[idx]) {
      applySetlistItem(activeSetlist.items[idx]);
    }
  }, [activeSetlist, applySetlistItem]);

  const handleCreateSetlist = useCallback(() => {
    const sl = createDefaultSetlist();
    setSetlists(prev => [...prev, sl]);
    setActiveSetlistIdx(setlists.length);
    setActiveItemIdx(0);
    applySetlistItem(sl.items[0]);
  }, [setlists.length, applySetlistItem]);

  const handleDeleteSetlist = useCallback(async (idx: number) => {
    const sl = setlists[idx];
    if (sl.id) await deleteSetlist(sl.id);
    setSetlists(prev => prev.filter((_, i) => i !== idx));
    if (activeSetlistIdx === idx) {
      setActiveSetlistIdx(null);
    }
  }, [setlists, activeSetlistIdx]);

  const handleRenameSetlist = useCallback((name: string) => {
    if (activeSetlistIdx === null) return;
    setSetlists(prev => prev.map((sl, i) => i === activeSetlistIdx ? { ...sl, name } : sl));
  }, [activeSetlistIdx]);

  const handleAddItem = useCallback(() => {
    if (activeSetlistIdx === null) return;
    const item = createDefaultItem({ bpm });
    setSetlists(prev => prev.map((sl, i) =>
      i === activeSetlistIdx ? { ...sl, items: [...sl.items, item] } : sl
    ));
  }, [activeSetlistIdx, bpm]);

  const handleRemoveItem = useCallback((itemIdx: number) => {
    if (activeSetlistIdx === null) return;
    setSetlists(prev => prev.map((sl, i) =>
      i === activeSetlistIdx
        ? { ...sl, items: sl.items.filter((_, j) => j !== itemIdx) }
        : sl
    ));
    if (activeItemIdx >= itemIdx && activeItemIdx > 0) {
      setActiveItemIdx(prev => prev - 1);
    }
  }, [activeSetlistIdx, activeItemIdx]);

  const handleUpdateItem = useCallback((itemIdx: number, item: SetlistItem) => {
    if (activeSetlistIdx === null) return;
    setSetlists(prev => prev.map((sl, i) =>
      i === activeSetlistIdx
        ? { ...sl, items: sl.items.map((it, j) => j === itemIdx ? item : it) }
        : sl
    ));
  }, [activeSetlistIdx]);

  const handleSaveSetlist = useCallback(async () => {
    if (activeSetlistIdx === null) return;
    const sl = setlists[activeSetlistIdx];
    const id = await saveSetlist(sl);
    if (id) {
      setSetlists(prev => prev.map((s, i) =>
        i === activeSetlistIdx ? { ...s, id } : s
      ));
    }
  }, [activeSetlistIdx, setlists]);

  return (
    <div className="metro-container">
      {/* Tempo display */}
      <div className="metro-tempo-display">
        <span className="metro-marking">{getTempoMarking(bpm)}</span>
        <div className="metro-bpm-row">
          <button
            className="metro-btn metro-btn--round"
            onClick={() => commitBpm(bpm - 1)}
          >
            {'\u2212'}
          </button>
          <input
            className="metro-bpm-input"
            type="text"
            inputMode="numeric"
            value={bpmInput}
            onChange={e => {
              setBpmInput(e.target.value);
              bpmInputDirty.current = true;
            }}
            onBlur={commitBpmInput}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                commitBpmInput();
                (e.target as HTMLInputElement).blur();
              }
            }}
          />
          <button
            className="metro-btn metro-btn--round"
            onClick={() => commitBpm(bpm + 1)}
          >
            +
          </button>
        </div>
        <span className="metro-bpm-label">BPM</span>
      </div>

      {/* BPM slider */}
      <input
        className="metro-slider"
        type="range"
        min={20}
        max={200}
        value={bpm}
        onChange={e => commitBpm(+e.target.value)}
      />

      {/* Tempo preset buttons */}
      <div className="metro-presets">
        {TEMPO_MARKINGS.map(t => (
          <button
            key={t.name}
            className={`metro-btn metro-btn--preset ${bpm >= t.bpm && bpm < (TEMPO_MARKINGS[TEMPO_MARKINGS.indexOf(t) + 1]?.bpm ?? 999) ? 'metro-btn--preset-active' : ''}`}
            onClick={() => commitBpm(t.bpm)}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Beat indicator with per-beat accent columns */}
      <BeatIndicator
        accents={accents}
        activeBeat={activeBeat}
        activeSub={activeSub}
        subdivision={subdivision}
        playing={playing}
        globalMuted={isMuted}
        onAccentChange={(beat, level) => {
          const next = [...accents];
          next[beat] = level;
          setAccents(next);
          engineRef.current?.updateConfig({ accents: next });
        }}
      />

      {/* Muted indicator */}
      {internalTrainerEnabled && isMuted && playing && (
        <div className="metro-muted-label">muted</div>
      )}

      {/* Play / Tap */}
      <div className="metro-controls">
        <button className="metro-btn metro-btn--play" onClick={togglePlay}>
          {playing ? '\u25A0 stop' : '\u25B6 start'}
        </button>
        <button className="metro-btn" onClick={tapTempo}>
          tap tempo
        </button>
      </div>

      {/* Time signature & subdivision */}
      <div className="metro-row">
        <div className="metro-group">
          <label className="metro-label">time signature</label>
          <div className="metro-btn-group">
            {TIME_SIGS.map(n => (
              <button
                key={n}
                className={`metro-btn metro-btn--toggle ${beatsPerMeasure === n ? 'metro-btn--toggle-active' : ''}`}
                onClick={() => {
                  setBeatsPerMeasure(n);
                  const newAccents = defaultAccents(n);
                  setAccents(newAccents);
                  engineRef.current?.updateConfig({ beatsPerMeasure: n, accents: newAccents });
                }}
              >
                {n}/4
              </button>
            ))}
          </div>
        </div>

        <div className="metro-group">
          <label className="metro-label">subdivision</label>
          <div className="metro-btn-group">
            {SUBDIVISIONS.map(s => (
              <button
                key={s.value}
                className={`metro-btn metro-btn--toggle ${subdivision === s.value ? 'metro-btn--toggle-active' : ''}`}
                onClick={() => {
                  setSubdivision(s.value);
                  engineRef.current?.updateConfig({ subdivision: s.value });
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Volume & sound */}
      <div className="metro-row">
        <div className="metro-group metro-group--inline">
          <label className="metro-label">volume</label>
          <input
            className="metro-slider metro-slider--small"
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={e => setVolume(+e.target.value / 100)}
          />
        </div>
        <div className="metro-group metro-group--inline">
          <label className="metro-label">sound</label>
          <div className="metro-btn-group">
            {CLICK_SOUNDS.map(s => (
              <button
                key={s.value}
                className={`metro-btn metro-btn--toggle ${clickSound === s.value ? 'metro-btn--toggle-active' : ''}`}
                onClick={() => setClickSound(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <span className="metro-hint">click bars to set accent per beat</span>

      {/* Settings toggle */}
      <button
        className="metro-btn metro-btn--small metro-settings-toggle"
        onClick={() => setShowSettings(!showSettings)}
      >
        {showSettings ? 'hide trainers' : 'show trainers'}
      </button>

      {showSettings && (
        <div className="metro-trainers">
          {/* Tempo Trainer */}
          <div className="metro-trainer">
            <label className="metro-checkbox">
              <input
                type="checkbox"
                checked={tempoTrainerEnabled}
                onChange={e => setTempoTrainerEnabled(e.target.checked)}
              />
              <strong>tempo trainer</strong>
            </label>
            {tempoTrainerEnabled && (
              <div className="metro-trainer-fields">
                <label>
                  increase by
                  <input
                    className="metro-input metro-input--small"
                    type="number"
                    min={1}
                    max={50}
                    value={ttIncreaseBpm}
                    onChange={e => setTtIncreaseBpm(+e.target.value)}
                  />
                  bpm
                </label>
                <label>
                  every
                  <input
                    className="metro-input metro-input--small"
                    type="number"
                    min={1}
                    max={64}
                    value={ttEveryBars}
                    onChange={e => setTtEveryBars(+e.target.value)}
                  />
                  bars
                </label>
                <label>
                  target
                  <input
                    className="metro-input metro-input--small"
                    type="number"
                    min={bpm}
                    max={300}
                    value={ttTargetBpm}
                    onChange={e => setTtTargetBpm(+e.target.value)}
                  />
                  bpm
                </label>
              </div>
            )}
          </div>

          {/* Internal Tempo Trainer */}
          <div className="metro-trainer">
            <label className="metro-checkbox">
              <input
                type="checkbox"
                checked={internalTrainerEnabled}
                onChange={e => setInternalTrainerEnabled(e.target.checked)}
              />
              <strong>internal tempo trainer</strong>
            </label>
            {internalTrainerEnabled && (
              <div className="metro-trainer-fields">
                <label>
                  play
                  <input
                    className="metro-input metro-input--small"
                    type="number"
                    min={1}
                    max={64}
                    value={itPlayBars}
                    onChange={e => setItPlayBars(+e.target.value)}
                  />
                  bars
                </label>
                <label>
                  mute
                  <input
                    className="metro-input metro-input--small"
                    type="number"
                    min={1}
                    max={64}
                    value={itMuteBars}
                    onChange={e => setItMuteBars(+e.target.value)}
                  />
                  bars
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Setlist toggle */}
      <button
        className="metro-btn metro-btn--small metro-settings-toggle"
        onClick={() => setShowSetlists(!showSetlists)}
      >
        {showSetlists ? 'hide setlists' : 'show setlists'}
      </button>

      {showSetlists && (
        <SetlistPanel
          setlists={setlists}
          activeSetlist={activeSetlist}
          activeItemIndex={activeItemIdx}
          onSelectSetlist={handleSelectSetlist}
          onSelectItem={handleSelectItem}
          onCreateSetlist={handleCreateSetlist}
          onDeleteSetlist={handleDeleteSetlist}
          onRenameSetlist={handleRenameSetlist}
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
          onUpdateItem={handleUpdateItem}
          onSave={handleSaveSetlist}
          user={user}
        />
      )}

      {/* Keyboard hints */}
      <div className="metro-hints">
        <span>space: start/stop</span>
        <span>{'\u2191\u2193'}: adjust bpm</span>
        <span>t: tap tempo</span>
      </div>
    </div>
  );
}
