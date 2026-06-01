alter table public.user_issues
  add column if not exists priority text;

alter table public.user_issues
  drop constraint if exists user_issues_priority_check,
  add constraint user_issues_priority_check
    check (
      priority is null
      or priority in ('high', 'medium', 'low')
    );
