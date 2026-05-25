-- Enable RLS on all user-owned tables
alter table user_issues enable row level security;
alter table user_issue_relationships enable row level security;
alter table user_qualities enable row level security;
alter table user_issue_quality_relationships enable row level security;
alter table user_exercises enable row level security;
alter table user_sessions enable row level security;
alter table user_supersets enable row level security;
alter table user_logged_exercises enable row level security;
alter table user_notes enable row level security;

-- Owner-only access policies
create policy "user_issues_owner_all"
on user_issues
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "user_issue_relationships_owner_all"
on user_issue_relationships
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "user_qualities_owner_all"
on user_qualities
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "user_issue_quality_relationships_owner_all"
on user_issue_quality_relationships
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "user_exercises_owner_all"
on user_exercises
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "user_sessions_owner_all"
on user_sessions
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "user_supersets_owner_all"
on user_supersets
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "user_logged_exercises_owner_all"
on user_logged_exercises
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "user_notes_owner_all"
on user_notes
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
