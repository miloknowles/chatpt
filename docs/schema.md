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
- Timestamp behavior:
  - Tables with `updated_at` should use a shared `before update` trigger in migrations so `updated_at` is always current.
- Library metadata columns:
  - `library_*` tables should include `publish_status text not null check (publish_status in ('draft', 'active', 'deleted'))`.
  - `library_*` tables should include `version int not null default 1`.
  - No `slug` column for now.

```sql
-- Issues: what's wrong or being managed
create table user_issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  notes text,
  status text not null check (status in ('active', 'resolved')),
  first_noted_at timestamptz not null default now(),
  last_noted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  unique (user_id, name)
);

-- Issue relationships (many-to-many, with relationship type)
create table user_issue_relationships (
  user_id uuid references auth.users on delete cascade not null,
  issue_id uuid not null,
  related_issue_id uuid not null,
  relationship text not null check (relationship in ('upstream_of', 'downstream_of', 'related_to')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (issue_id <> related_issue_id),
  primary key (user_id, issue_id, related_issue_id),
  foreign key (user_id, issue_id) references user_issues(user_id, id) on delete cascade,
  foreign key (user_id, related_issue_id) references user_issues(user_id, id) on delete cascade
);

-- Qualities: what's being trained
create table user_qualities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  notes text,
  body_region text, -- unstructured text field for now
  status text not null check (status in ('building', 'maintaining', 'inactive')),
  training_frequency_target text, -- "daily", "3x_week", "2x_week", etc.
  training_goal text, -- when is this quality "enough"?
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  unique (user_id, name)
);

-- Issue ↔ Quality (many-to-many)
create table user_issue_quality_relationships (
  user_id uuid references auth.users on delete cascade not null,
  issue_id uuid not null,
  quality_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, issue_id, quality_id),
  foreign key (user_id, issue_id) references user_issues(user_id, id) on delete cascade,
  foreign key (user_id, quality_id) references user_qualities(user_id, id) on delete cascade
);

-- Exercises
create table user_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  notes text, -- can include cues or instructions
  image_url text, -- optional, used as a preview image for the exercise
  video_url text, -- optional, used to provide instructions or demos
  tags text[], -- optional, used to categorize the exercise
  performance jsonb, -- default/prescribed: { sets: [{reps: 10, weight: 50}, ...], duration_s: 60, notes: "..." }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  unique (user_id, name)
);

-- Sessions
create table user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  estimated_duration_mins integer, -- optional
  date date not null default current_date,
  type text not null, -- "mobility", "strength", "speed_work", "form_drills", "other"
  notes text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  check (completed_at is null or started_at is null or completed_at >= started_at)
);

-- Supersets (inside sessions)
create table user_supersets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  session_id uuid not null,
  name text,
  sort_key text not null, -- collisions are allowed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  unique (session_id, id),
  foreign key (user_id, session_id) references user_sessions(user_id, id) on delete cascade
);

-- Logged exercises (within either a superset or standalone in a session)
create table user_logged_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  session_id uuid not null,
  superset_id uuid, -- nullable; null = standalone
  exercise_id uuid not null,
  sort_key text not null, -- collisions are allowed
  completed_at timestamptz,
  performance jsonb, -- actual performed: { sets: [{reps: 10, weight: 50}, ...], duration_s: 60, notes: "..." }
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (user_id, session_id) references user_sessions(user_id, id) on delete cascade,
  foreign key (user_id, exercise_id) references user_exercises(user_id, id),
  foreign key (user_id, superset_id) references user_supersets(user_id, id) on delete cascade,
  foreign key (session_id, superset_id) references user_supersets(session_id, id) on delete cascade
);

-- Notes (timestamped observations)
create table user_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Chat conversations
create table user_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null default 'New conversation',
  status text not null default 'active' check (status in ('active', 'archived', 'deleted')),
  summary text,
  last_message_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  check (length(btrim(title)) > 0)
);

-- Chat messages
create table user_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  conversation_id uuid not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  status text not null default 'complete' check (status in ('queued', 'streaming', 'complete', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  foreign key (user_id, conversation_id) references user_conversations(user_id, id) on delete cascade,
  check (length(btrim(content)) > 0)
);
```
