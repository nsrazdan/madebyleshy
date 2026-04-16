import { supabase } from './supabase-client';
import type { AttemptRow, SessionRow } from './database.types';
import type { ExerciseSettings } from './exercises/types';

export type { AttemptRow, SessionRow };

// ── sessions ───────────────────────────────────────

export async function startSession(
  exerciseId: string,
  settings: ExerciseSettings,
): Promise<string | null> {
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('exercise_sessions')
    .insert({
      user_id: user.id,
      exercise_id: exerciseId,
      settings: settings as unknown as Record<string, unknown>,
    })
    .select('id')
    .single();

  return data?.id ?? null;
}

export async function endSession(sessionId: string): Promise<void> {
  if (!supabase || !sessionId) return;
  await supabase
    .from('exercise_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', sessionId);
}

// ── attempts ───────────────────────────────────────

export interface AttemptRecord {
  exercise_id: string;
  session_id?: string;
  question_prompt: string;
  correct_answer: string;
  user_answer: string;
  is_correct: boolean;
  response_time_ms?: number;
}

export async function saveAttempt(attempt: AttemptRecord): Promise<void> {
  if (!supabase) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Insert the attempt
  await supabase.from('attempts').insert({
    user_id: user.id,
    ...attempt,
  });

  // Update session counters if we have a session
  if (attempt.session_id) {
    const update: Record<string, unknown> = {
      total_questions: undefined, // will use rpc below
    };
    // Use raw SQL increment via rpc isn't available,
    // so fetch-then-update the session counters
    const { data: session } = await supabase
      .from('exercise_sessions')
      .select('total_questions, correct_answers')
      .eq('id', attempt.session_id)
      .single();

    if (session) {
      await supabase
        .from('exercise_sessions')
        .update({
          total_questions: session.total_questions + 1,
          correct_answers: session.correct_answers + (attempt.is_correct ? 1 : 0),
        })
        .eq('id', attempt.session_id);
    }
  }
}

// ── queries ────────────────────────────────────────

export async function getAttempts(exerciseId?: string): Promise<AttemptRow[]> {
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('attempts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (exerciseId) {
    query = query.eq('exercise_id', exerciseId);
  }

  const { data } = await query;
  return (data ?? []) as AttemptRow[];
}

export async function getSessions(exerciseId?: string): Promise<SessionRow[]> {
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('exercise_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false });

  if (exerciseId) {
    query = query.eq('exercise_id', exerciseId);
  }

  const { data } = await query;
  return (data ?? []) as SessionRow[];
}

export async function getExerciseStats(): Promise<{
  exercise_id: string;
  total: number;
  correct: number;
  accuracy: number;
  lastAttempt: string;
}[]> {
  const attempts = await getAttempts();
  const byExercise = new Map<string, { total: number; correct: number; lastAttempt: string }>();

  for (const a of attempts) {
    const stats = byExercise.get(a.exercise_id) ?? { total: 0, correct: 0, lastAttempt: '' };
    stats.total++;
    if (a.is_correct) stats.correct++;
    if (a.created_at > stats.lastAttempt) stats.lastAttempt = a.created_at;
    byExercise.set(a.exercise_id, stats);
  }

  return Array.from(byExercise.entries()).map(([exercise_id, stats]) => ({
    exercise_id,
    ...stats,
    accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
  }));
}

// ── lesson progress ────────────────────────────────

export async function markLessonStarted(lessonSlug: string): Promise<void> {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('lesson_progress')
    .upsert(
      { user_id: user.id, lesson_slug: lessonSlug, status: 'started' },
      { onConflict: 'user_id,lesson_slug', ignoreDuplicates: true },
    );
}

export async function markLessonCompleted(lessonSlug: string): Promise<void> {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('lesson_progress')
    .upsert(
      {
        user_id: user.id,
        lesson_slug: lessonSlug,
        status: 'completed',
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_slug' },
    );
}

export async function getLessonProgress(): Promise<
  { lesson_slug: string; status: 'started' | 'completed'; completed_at: string | null }[]
> {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('lesson_progress')
    .select('lesson_slug, status, completed_at')
    .eq('user_id', user.id);

  return (data ?? []) as { lesson_slug: string; status: 'started' | 'completed'; completed_at: string | null }[];
}

// ── user preferences ───────────────────────────────

export async function loadPreferences(exerciseId: string): Promise<Partial<ExerciseSettings> | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_preferences')
    .select('preferences')
    .eq('user_id', user.id)
    .eq('exercise_id', exerciseId)
    .single();

  return (data?.preferences as Partial<ExerciseSettings>) ?? null;
}

export async function savePreferences(
  exerciseId: string,
  preferences: ExerciseSettings,
): Promise<void> {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: user.id,
        exercise_id: exerciseId,
        preferences: preferences as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,exercise_id' },
    );
}
