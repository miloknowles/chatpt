create table if not exists public.user_quality_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  quality_id uuid not null,
  status text not null check (status in ('building', 'maintaining', 'inactive')),
  training_frequency_target text,
  notes text,
  sort_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  unique (user_id, quality_id),
  foreign key (user_id, quality_id) references public.user_qualities(user_id, id) on delete cascade
);

insert into public.user_quality_states (
  user_id,
  quality_id,
  status,
  training_frequency_target,
  notes,
  sort_key,
  created_at,
  updated_at
)
select
  user_id,
  id,
  status,
  training_frequency_target,
  notes,
  sort_key,
  created_at,
  updated_at
from public.user_qualities
on conflict (user_id, quality_id) do nothing;

alter table public.user_quality_states enable row level security;

drop policy if exists "user_quality_states_owner_all"
on public.user_quality_states;

create policy "user_quality_states_owner_all"
on public.user_quality_states
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop trigger if exists set_updated_at_user_quality_states
on public.user_quality_states;

create trigger set_updated_at_user_quality_states
before update on public.user_quality_states
for each row execute function public.set_updated_at();

create index if not exists user_quality_states_user_id_sort_key_created_at_idx
  on public.user_quality_states(user_id, sort_key, created_at);

create index if not exists user_quality_states_user_id_status_sort_key_idx
  on public.user_quality_states(user_id, status, sort_key);

create index if not exists user_quality_states_user_id_quality_id_idx
  on public.user_quality_states(user_id, quality_id);

alter table public.user_qualities
  drop column if exists status,
  drop column if exists training_frequency_target,
  drop column if exists training_goal;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_quality_states'
  ) then
    alter publication supabase_realtime add table public.user_quality_states;
  end if;
end
$$;
