# Supabase Schema (Draft)

```sql
-- Issues
create table issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  status text not null check (status in ('active', 'resolved')),
  notes text,
  first_noted_at timestamptz not null default now(),
  last_noted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

-- Issue relationships (many-to-many, with relationship type)
create table issue_relationships (
  issue_id uuid references issues on delete cascade,
  related_issue_id uuid references issues on delete cascade,
  relationship text not null check (relationship in ('drives', 'related_to')),
  check (issue_id <> related_issue_id),
  primary key (issue_id, related_issue_id)
);

-- Qualities
create table qualities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  body_region text,
  status text not null check (status in ('building', 'maintaining', 'inactive')),
  training_frequency_target text, -- "daily", "3x_week", "2x_week", etc.
  training_goal text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Issue ↔ Quality (many-to-many)
create table issue_qualities (
  issue_id uuid references issues on delete cascade,
  quality_id uuid references qualities on delete cascade,
  primary key (issue_id, quality_id)
);

-- Exercises
create table exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  notes text,
  image_url text,
  video_url text,
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sessions
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  date date not null default current_date,
  type text not null, -- "mobility", "strength", "speed_work", "form_drills", "other"
  notes text,
  completed_at timestamptz,
  created_at timestamptz default now()
  updated_at timestamptz default now()
);

-- Supersets (inside sessions)
create table supersets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions on delete cascade,
  name text,
  display_order text not null
);

-- Logged exercises (within either a superset or standalone in a session)
create table logged_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions on delete cascade,
  superset_id uuid references supersets on delete cascade, -- nullable; null = standalone
  exercise_id uuid references exercises,
  display_order text not null,
  completed_at timestamptz,
  performance jsonb, -- flexible: { sets: [{reps: 10, weight: 50}, ...], duration_s: 60, notes: "..." }
  notes text
);

-- Notes (timestamped observations)
create table user_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  body text not null,
  created_at timestamptz default now()
  updated_at timestamptz default now()
);
