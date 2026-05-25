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

create index user_conversations_user_id_updated_at_idx
on user_conversations(user_id, updated_at desc);

create index user_conversations_user_id_last_message_at_idx
on user_conversations(user_id, last_message_at desc nulls last);

create index user_messages_user_id_conversation_id_created_at_idx
on user_messages(user_id, conversation_id, created_at, id);

create trigger set_updated_at_user_conversations
before update on user_conversations
for each row execute function public.set_updated_at();

create trigger set_updated_at_user_messages
before update on user_messages
for each row execute function public.set_updated_at();

alter table user_conversations enable row level security;
alter table user_messages enable row level security;

create policy "user_conversations_owner_all"
on user_conversations
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "user_messages_owner_all"
on user_messages
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
