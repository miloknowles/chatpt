create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users on delete cascade,
  about_me text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles_owner_all"
on public.user_profiles;

create policy "user_profiles_owner_all"
on public.user_profiles
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop trigger if exists set_updated_at_user_profiles
on public.user_profiles;

create trigger set_updated_at_user_profiles
before update on public.user_profiles
for each row execute function public.set_updated_at();

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
      and tablename = 'user_profiles'
  ) then
    alter publication supabase_realtime add table public.user_profiles;
  end if;
end
$$;
