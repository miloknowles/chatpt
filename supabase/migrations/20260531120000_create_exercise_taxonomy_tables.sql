create table public.user_exercise_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  sort_key text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  unique (user_id, name),
  check (length(btrim(name)) > 0)
);

create table public.user_exercise_body_regions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  sort_key text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  unique (user_id, name),
  check (length(btrim(name)) > 0)
);

create table public.user_exercise_type_assignments (
  user_id uuid references auth.users on delete cascade not null,
  exercise_id uuid not null,
  type_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, exercise_id, type_id),
  foreign key (user_id, exercise_id) references public.user_exercises(user_id, id) on delete cascade,
  foreign key (user_id, type_id) references public.user_exercise_types(user_id, id) on delete cascade
);

create table public.user_exercise_body_region_assignments (
  user_id uuid references auth.users on delete cascade not null,
  exercise_id uuid not null,
  body_region_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, exercise_id, body_region_id),
  foreign key (user_id, exercise_id) references public.user_exercises(user_id, id) on delete cascade,
  foreign key (user_id, body_region_id) references public.user_exercise_body_regions(user_id, id) on delete cascade
);

alter table public.user_exercise_types enable row level security;
alter table public.user_exercise_body_regions enable row level security;
alter table public.user_exercise_type_assignments enable row level security;
alter table public.user_exercise_body_region_assignments enable row level security;

create policy "user_exercise_types_owner_all"
on public.user_exercise_types
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "user_exercise_body_regions_owner_all"
on public.user_exercise_body_regions
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "user_exercise_type_assignments_owner_all"
on public.user_exercise_type_assignments
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "user_exercise_body_region_assignments_owner_all"
on public.user_exercise_body_region_assignments
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create trigger set_updated_at_user_exercise_types
before update on public.user_exercise_types
for each row execute function public.set_updated_at();

create trigger set_updated_at_user_exercise_body_regions
before update on public.user_exercise_body_regions
for each row execute function public.set_updated_at();

create trigger set_updated_at_user_exercise_type_assignments
before update on public.user_exercise_type_assignments
for each row execute function public.set_updated_at();

create trigger set_updated_at_user_exercise_body_region_assignments
before update on public.user_exercise_body_region_assignments
for each row execute function public.set_updated_at();

create index user_exercise_types_user_id_sort_key_name_idx
  on public.user_exercise_types(user_id, sort_key, name);

create index user_exercise_body_regions_user_id_sort_key_name_idx
  on public.user_exercise_body_regions(user_id, sort_key, name);

create index user_exercise_type_assignments_user_id_exercise_id_idx
  on public.user_exercise_type_assignments(user_id, exercise_id);

create index user_exercise_type_assignments_user_id_type_id_idx
  on public.user_exercise_type_assignments(user_id, type_id);

create index user_exercise_body_region_assignments_user_id_exercise_id_idx
  on public.user_exercise_body_region_assignments(user_id, exercise_id);

create index user_exercise_body_region_assignments_user_id_body_region_id_idx
  on public.user_exercise_body_region_assignments(user_id, body_region_id);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_exercises'
      and column_name = 'tags'
  ) then
    alter table public.user_exercises drop column tags;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'user_exercise_types'
    ) then
      alter publication supabase_realtime add table public.user_exercise_types;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'user_exercise_body_regions'
    ) then
      alter publication supabase_realtime add table public.user_exercise_body_regions;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'user_exercise_type_assignments'
    ) then
      alter publication supabase_realtime add table public.user_exercise_type_assignments;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'user_exercise_body_region_assignments'
    ) then
      alter publication supabase_realtime add table public.user_exercise_body_region_assignments;
    end if;
  end if;
end
$$;
