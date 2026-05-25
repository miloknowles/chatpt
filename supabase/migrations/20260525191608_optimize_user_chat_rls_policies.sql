drop policy "user_conversations_owner_all" on user_conversations;
drop policy "user_messages_owner_all" on user_messages;

create policy "user_conversations_owner_all"
on user_conversations
for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "user_messages_owner_all"
on user_messages
for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
