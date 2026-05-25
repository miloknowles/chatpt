# Supabase Schema (Draft)

## Modeling decisions

- Naming split:
  - `library_*` tables are reusable system-provided templates/canonical definitions.
  - `user_*` tables are user-owned data.
- No bridge tables for now:
  - Users copy records from `library_*` into their own `user_*` space.
  - This keeps v1 simple and avoids linked-install/update complexity.
- Provenance:
  - User tables may include optional `source_library_*_id` columns later to track where a copy came from.
  - These are for attribution/reference only, not live linkage.
- Mutability:
  - `user_*` rows are mutable.
  - Users can edit notes, adjust sets/reps/performance, reorder items, and otherwise update records over time.
  - We are not enforcing immutable historical snapshots in v1.

```sql
-- Issues: what's wrong or being managed
create table user_issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  notes text,
  status text not null check (status in ('active', 'resolved')),
  first_noted_at timestamptz default now(),
  last_noted_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

-- Issue relationships (many-to-many, with relationship type)
create table user_issue_relationships (
  issue_id uuid references user_issues on delete cascade,
  related_issue_id uuid references user_issues on delete cascade,
  relationship text not null check (relationship in ('upstream_of', 'downstream_of', 'related_to')),
  check (issue_id <> related_issue_id),
  primary key (issue_id, related_issue_id)
);

-- Qualities: what's being trained
create table user_qualities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  notes text,
  body_region text, -- unstructured text field for now
  status text not null check (status in ('building', 'maintaining', 'inactive')),
  training_frequency_target text, -- "daily", "3x_week", "2x_week", etc.
  training_goal text, -- when is this quality "enough"?
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Issue ↔ Quality (many-to-many)
create table user_issue_quality_relationships (
  issue_id uuid references user_issues on delete cascade,
  quality_id uuid references user_qualities on delete cascade,
  primary key (issue_id, quality_id)
);

-- Exercises
create table user_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  notes text, -- can include cues or instructions
  image_url text, -- optional, used as a preview image for the exercise
  video_url text, -- optional, used to provide instructions or demos
  tags text[], -- optional, used to categorize the exercise
  performance jsonb, -- flexible: { sets: [{reps: 10, weight: 50}, ...], duration_s: 60, notes: "..." }
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sessions
create table user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  estimated_duration_mins integer, -- optional
  date date not null default current_date,
  type text not null, -- "mobility", "strength", "speed_work", "form_drills", "other"
  notes text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Supersets (inside sessions)
create table user_supersets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references user_sessions on delete cascade,
  name text,
  sort_key text not null
);

-- Logged exercises (within either a superset or standalone in a session)
create table user_logged_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references user_sessions on delete cascade,
  superset_id uuid references user_supersets on delete cascade, -- nullable; null = standalone
  exercise_id uuid references user_exercises,
  sort_key text not null,
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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```
