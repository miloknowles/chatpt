drop table if exists public.user_exercise_body_region_assignments;

alter table if exists public.user_exercise_body_regions
  rename to user_body_regions;

alter table public.user_body_regions
  rename constraint user_exercise_body_regions_user_id_fkey to user_body_regions_user_id_fkey;

alter index if exists user_exercise_body_regions_user_id_sort_key_name_idx
  rename to user_body_regions_user_id_sort_key_name_idx;

alter trigger set_updated_at_user_exercise_body_regions
on public.user_body_regions
rename to set_updated_at_user_body_regions;

alter policy "user_exercise_body_regions_owner_all"
on public.user_body_regions
rename to "user_body_regions_owner_all";

alter table public.user_qualities
  add column if not exists body_region_id uuid;

alter table public.user_qualities
  drop column if exists body_region;

alter table public.user_qualities
  add constraint user_qualities_user_id_body_region_id_fkey
  foreign key (user_id, body_region_id)
  references public.user_body_regions(user_id, id)
  on delete set null (body_region_id);

create table public.user_exercise_quality_assignments (
  user_id uuid references auth.users on delete cascade not null,
  exercise_id uuid not null,
  quality_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, exercise_id, quality_id),
  foreign key (user_id, exercise_id) references public.user_exercises(user_id, id) on delete cascade,
  foreign key (user_id, quality_id) references public.user_qualities(user_id, id) on delete cascade
);

alter table public.user_exercise_quality_assignments enable row level security;

create policy "user_exercise_quality_assignments_owner_all"
on public.user_exercise_quality_assignments
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create trigger set_updated_at_user_exercise_quality_assignments
before update on public.user_exercise_quality_assignments
for each row execute function public.set_updated_at();

create index user_exercise_quality_assignments_user_id_exercise_id_idx
  on public.user_exercise_quality_assignments(user_id, exercise_id);

create index user_exercise_quality_assignments_user_id_quality_id_idx
  on public.user_exercise_quality_assignments(user_id, quality_id);

create index user_qualities_user_id_body_region_id_idx
  on public.user_qualities(user_id, body_region_id);

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
        and tablename = 'user_body_regions'
    ) then
      alter publication supabase_realtime add table public.user_body_regions;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'user_exercise_quality_assignments'
    ) then
      alter publication supabase_realtime add table public.user_exercise_quality_assignments;
    end if;
  end if;
end
$$;
