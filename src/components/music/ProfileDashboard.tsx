import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAuth } from './AuthPanel';
import { getAttempts, getExerciseStats, getSessions, getLessonProgress } from './lib/attempts';
import type { AttemptRow, SessionRow } from './lib/attempts';
import { exercises } from './lib/exercises/index';

function exerciseLabel(id: string): string {
  return exercises.find(e => e.id === id)?.title.toLowerCase() ?? id;
}

interface DayPoint {
  date: string;
  accuracy: number;
  total: number;
  correct: number;
  avgResponseMs: number;
}

function buildDailyAccuracy(attempts: AttemptRow[]): DayPoint[] {
  const byDay = new Map<string, { correct: number; total: number; totalMs: number; countMs: number }>();
  for (const a of attempts) {
    const date = a.created_at.slice(0, 10);
    const day = byDay.get(date) ?? { correct: 0, total: 0, totalMs: 0, countMs: 0 };
    day.total++;
    if (a.is_correct) day.correct++;
    if (a.response_time_ms) {
      day.totalMs += a.response_time_ms;
      day.countMs++;
    }
    byDay.set(date, day);
  }
  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({
      date,
      accuracy: Math.round((d.correct / d.total) * 100),
      total: d.total,
      correct: d.correct,
      avgResponseMs: d.countMs > 0 ? Math.round(d.totalMs / d.countMs) : 0,
    }));
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function AccuracyTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload as DayPoint;
  return (
    <div className="chart-tooltip">
      <p>{d.date}</p>
      <p>{d.correct}/{d.total} ({d.accuracy}%)</p>
      {d.avgResponseMs > 0 && <p>avg {formatMs(d.avgResponseMs)}</p>}
    </div>
  );
}

export default function ProfileDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [allAttempts, setAllAttempts] = useState<AttemptRow[]>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getExerciseStats>>>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [lessonProgress, setLessonProgress] = useState<Awaited<ReturnType<typeof getLessonProgress>>>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([
      getAttempts(),
      getExerciseStats(),
      getSessions(),
      getLessonProgress(),
    ]).then(([attempts, stats, sessions, lessons]) => {
      setAllAttempts(attempts);
      setStats(stats);
      setSessions(sessions);
      setLessonProgress(lessons);
      if (stats.length > 0 && !selectedExercise) {
        setSelectedExercise(stats[0].exercise_id);
      }
      setLoading(false);
    });
  }, [user]);

  if (authLoading || loading) {
    return <div className="profile-container"><p className="profile-empty">loading...</p></div>;
  }

  if (!user) {
    return (
      <div className="profile-container">
        <p className="profile-empty">log in to see your progress.</p>
      </div>
    );
  }

  if (stats.length === 0 && lessonProgress.length === 0) {
    return (
      <div className="profile-container">
        <p className="profile-email">{user.email}</p>
        <p className="profile-empty">no activity yet. try an <a href="/music-practice/exercises/">exercise</a> or <a href="/music-practice/lessons/">lesson</a>.</p>
      </div>
    );
  }

  const filteredAttempts = selectedExercise
    ? allAttempts.filter(a => a.exercise_id === selectedExercise)
    : allAttempts;
  const chartData = buildDailyAccuracy(filteredAttempts);
  const selectedStats = stats.find(s => s.exercise_id === selectedExercise);
  const filteredSessions = selectedExercise
    ? sessions.filter(s => s.exercise_id === selectedExercise)
    : sessions;

  // Overall avg response time for selected exercise
  const responseTimes = filteredAttempts
    .map(a => a.response_time_ms)
    .filter((t): t is number => t != null && t > 0);
  const avgResponse = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;

  return (
    <div className="profile-container">
      <p className="profile-email">{user.email}</p>

      {/* Exercise selector tabs */}
      {stats.length > 0 && (
        <div className="profile-tabs">
          {stats.map(s => (
            <button
              key={s.exercise_id}
              className={`profile-tab ${selectedExercise === s.exercise_id ? 'profile-tab--active' : ''}`}
              onClick={() => setSelectedExercise(s.exercise_id)}
            >
              {exerciseLabel(s.exercise_id)}
            </button>
          ))}
        </div>
      )}

      {/* Summary stats */}
      {selectedStats && (
        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-value">{selectedStats.total}</span>
            <span className="profile-stat-label">attempts</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{selectedStats.correct}</span>
            <span className="profile-stat-label">correct</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{selectedStats.accuracy}%</span>
            <span className="profile-stat-label">accuracy</span>
          </div>
          {avgResponse > 0 && (
            <div className="profile-stat">
              <span className="profile-stat-value">{formatMs(avgResponse)}</span>
              <span className="profile-stat-label">avg response</span>
            </div>
          )}
          <div className="profile-stat">
            <span className="profile-stat-value">{filteredSessions.length}</span>
            <span className="profile-stat-label">sessions</span>
          </div>
        </div>
      )}

      {/* Accuracy chart */}
      {chartData.length > 0 && (
        <div className="profile-chart">
          <h3 className="profile-chart-title">accuracy over time</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--text-faint)', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'var(--text-faint)', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
                tickFormatter={v => `${v}%`}
                width={40}
              />
              <Tooltip content={<AccuracyTooltip />} />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="var(--text)"
                strokeWidth={1.5}
                dot={{ r: 3, fill: 'var(--text)' }}
                activeDot={{ r: 5, fill: 'var(--text)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Lesson progress */}
      {lessonProgress.length > 0 && (
        <div className="profile-recent">
          <h3 className="profile-chart-title">lessons</h3>
          <table className="attempts-table">
            <thead>
              <tr>
                <th>lesson</th>
                <th>status</th>
                <th>completed</th>
              </tr>
            </thead>
            <tbody>
              {lessonProgress.map(lp => (
                <tr key={lp.lesson_slug}>
                  <td><a href={`/music-practice/lessons/${lp.lesson_slug}`}>{lp.lesson_slug}</a></td>
                  <td>{lp.status}</td>
                  <td>{lp.completed_at ? new Date(lp.completed_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent attempts table */}
      {filteredAttempts.length > 0 && (
        <div className="profile-recent">
          <h3 className="profile-chart-title">recent attempts</h3>
          <table className="attempts-table">
            <thead>
              <tr>
                <th>date</th>
                <th>question</th>
                <th>answer</th>
                <th>correct</th>
                <th>time</th>
                <th>result</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttempts.slice(-50).reverse().map(a => (
                <tr key={a.id} className={a.is_correct ? 'attempt-correct' : 'attempt-incorrect'}>
                  <td>{new Date(a.created_at).toLocaleDateString()}</td>
                  <td>{a.question_prompt}</td>
                  <td>{a.user_answer}</td>
                  <td>{a.correct_answer}</td>
                  <td>{a.response_time_ms ? formatMs(a.response_time_ms) : '—'}</td>
                  <td>{a.is_correct ? 'right' : 'wrong'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
