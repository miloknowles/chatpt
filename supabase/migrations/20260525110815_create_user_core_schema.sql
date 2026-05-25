create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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
  body_region text,
  status text not null check (status in ('building', 'maintaining', 'inactive')),
  training_frequency_target text,
  training_goal text,
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
  notes text,
  image_url text,
  video_url text,
  tags text[],
  performance jsonb,
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
  estimated_duration_mins integer,
  date date not null default current_date,
  type text not null,
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
  sort_key text not null,
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
  superset_id uuid,
  exercise_id uuid not null,
  sort_key text not null,
  completed_at timestamptz,
  performance jsonb,
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

create trigger set_updated_at_user_issues
before update on user_issues
for each row execute function public.set_updated_at();

create trigger set_updated_at_user_issue_relationships
before update on user_issue_relationships
for each row execute function public.set_updated_at();

create trigger set_updated_at_user_qualities
before update on user_qualities
for each row execute function public.set_updated_at();

create trigger set_updated_at_user_issue_quality_relationships
before update on user_issue_quality_relationships
for each row execute function public.set_updated_at();

create trigger set_updated_at_user_exercises
before update on user_exercises
for each row execute function public.set_updated_at();

create trigger set_updated_at_user_sessions
before update on user_sessions
for each row execute function public.set_updated_at();

create trigger set_updated_at_user_supersets
before update on user_supersets
for each row execute function public.set_updated_at();

create trigger set_updated_at_user_logged_exercises
before update on user_logged_exercises
for each row execute function public.set_updated_at();

create trigger set_updated_at_user_notes
before update on user_notes
for each row execute function public.set_updated_at();
