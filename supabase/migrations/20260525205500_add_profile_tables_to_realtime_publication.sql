do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_issues'
  ) then
    alter publication supabase_realtime add table public.user_issues;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_qualities'
  ) then
    alter publication supabase_realtime add table public.user_qualities;
  end if;
end
$$;
