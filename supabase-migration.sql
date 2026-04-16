-- Run this in the Supabase SQL editor to set up the database.
-- Safe to re-run — all statements use IF NOT EXISTS / OR REPLACE.

-- ── profiles ───────────────────────────────────────
-- Extends auth.users with app-specific data.
-- Auto-created on signup via trigger.

create table if not exists public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  display_name  text,
  created_at    timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ── exercise_sessions ──────────────────────────────
-- Groups attempts into practice sessions.
-- A session starts when a user begins an exercise and ends
-- when they leave, reset, or close the page.

create table if not exists public.exercise_sessions (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  exercise_id     text not null,
  settings        jsonb,
  started_at      timestamptz default now() not null,
  ended_at        timestamptz,
  total_questions  int default 0 not null,
  correct_answers  int default 0 not null
);

create index if not exists sessions_user_id_idx
  on public.exercise_sessions(user_id);
create index if not exists sessions_user_exercise_idx
  on public.exercise_sessions(user_id, exercise_id);

alter table public.exercise_sessions enable row level security;

create policy "Users can read own sessions"
  on public.exercise_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.exercise_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.exercise_sessions for update
  using (auth.uid() = user_id);


-- ── attempts ───────────────────────────────────────
-- Individual question-level records.
-- user_id and exercise_id are denormalized from the session
-- for fast per-user and per-exercise queries without joins.

create table if not exists public.attempts (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references public.profiles(id) on delete cascade not null,
  session_id       uuid references public.exercise_sessions(id) on delete cascade,
  exercise_id      text not null,
  question_prompt  text not null,
  correct_answer   text not null,
  user_answer      text not null,
  is_correct       boolean not null,
  response_time_ms int,
  created_at       timestamptz default now() not null
);

create index if not exists attempts_user_id_idx
  on public.attempts(user_id);
create index if not exists attempts_user_exercise_idx
  on public.attempts(user_id, exercise_id);
create index if not exists attempts_session_id_idx
  on public.attempts(session_id);
create index if not exists attempts_created_at_idx
  on public.attempts(user_id, created_at desc);

alter table public.attempts enable row level security;

create policy "Users can read own attempts"
  on public.attempts for select
  using (auth.uid() = user_id);

create policy "Users can insert own attempts"
  on public.attempts for insert
  with check (auth.uid() = user_id);


-- ── lesson_progress ────────────────────────────────
-- Tracks which lessons a user has started or completed.

create table if not exists public.lesson_progress (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  lesson_slug   text not null,
  status        text default 'started' not null check (status in ('started', 'completed')),
  started_at    timestamptz default now() not null,
  completed_at  timestamptz,
  constraint lesson_progress_unique unique (user_id, lesson_slug)
);

create index if not exists lesson_progress_user_idx
  on public.lesson_progress(user_id);

alter table public.lesson_progress enable row level security;

create policy "Users can read own lesson progress"
  on public.lesson_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own lesson progress"
  on public.lesson_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own lesson progress"
  on public.lesson_progress for update
  using (auth.uid() = user_id);


-- ── user_preferences ───────────────────────────────
-- Persists exercise settings and global preferences.
-- exercise_id = NULL stores global preferences.
-- jsonb allows flexible schema as settings evolve.

create table if not exists public.user_preferences (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  exercise_id  text,
  preferences  jsonb not null default '{}',
  updated_at   timestamptz default now() not null,
  constraint user_preferences_unique unique (user_id, exercise_id)
);

create index if not exists user_preferences_user_idx
  on public.user_preferences(user_id);

alter table public.user_preferences enable row level security;

create policy "Users can read own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);
