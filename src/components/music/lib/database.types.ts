// ── profiles ───────────────────────────────────────

export interface ProfileRow {
  id: string;
  display_name: string | null;
  created_at: string;
}

// ── exercise sessions ──────────────────────────────

export interface SessionInsert {
  user_id: string;
  exercise_id: string;
  settings?: Record<string, unknown>;
}

export interface SessionRow extends SessionInsert {
  id: string;
  started_at: string;
  ended_at: string | null;
  total_questions: number;
  correct_answers: number;
}

// ── attempts ───────────────────────────────────────

export interface AttemptInsert {
  user_id: string;
  session_id?: string;
  exercise_id: string;
  question_prompt: string;
  correct_answer: string;
  user_answer: string;
  is_correct: boolean;
  response_time_ms?: number;
}

export interface AttemptRow extends AttemptInsert {
  id: string;
  created_at: string;
}

// ── lesson progress ────────────────────────────────

export interface LessonProgressInsert {
  user_id: string;
  lesson_slug: string;
  status?: 'started' | 'completed';
}

export interface LessonProgressRow extends LessonProgressInsert {
  id: string;
  status: 'started' | 'completed';
  started_at: string;
  completed_at: string | null;
}

// ── user preferences ───────────────────────────────

export interface UserPreferencesRow {
  id: string;
  user_id: string;
  exercise_id: string | null;
  preferences: Record<string, unknown>;
  updated_at: string;
}
