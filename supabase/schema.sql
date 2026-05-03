create schema if not exists caasy;

grant usage on schema caasy to anon, authenticated;

create table if not exists caasy.coaching_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null,
  mode text not null check (mode in ('coach_call', 'coach_me')),
  transcript text not null,
  overall_score integer not null,
  pros jsonb not null default '[]'::jsonb,
  cons jsonb not null default '[]'::jsonb,
  linguistic_stats jsonb not null default '{}'::jsonb,
  action_plan jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists coaching_sessions_user_created_idx
  on caasy.coaching_sessions (user_id, created_at desc);

alter table caasy.coaching_sessions enable row level security;

drop policy if exists "Users can read their own coaching sessions" on caasy.coaching_sessions;
create policy "Users can read their own coaching sessions"
  on caasy.coaching_sessions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own coaching sessions" on caasy.coaching_sessions;
create policy "Users can create their own coaching sessions"
  on caasy.coaching_sessions
  for insert
  with check (auth.uid() = user_id);

grant select, insert on caasy.coaching_sessions to authenticated;

create table if not exists caasy.agent_memories (
  id bigint generated always as identity primary key,
  session_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists agent_memories_user_session_idx
  on caasy.agent_memories (user_id, session_id, created_at);

alter table caasy.agent_memories enable row level security;

drop policy if exists "Users can read their own agent memories" on caasy.agent_memories;
create policy "Users can read their own agent memories"
  on caasy.agent_memories
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own agent memories" on caasy.agent_memories;
create policy "Users can create their own agent memories"
  on caasy.agent_memories
  for insert
  with check (auth.uid() = user_id);

grant select, insert on caasy.agent_memories to authenticated;
grant usage, select on all sequences in schema caasy to authenticated;

alter role authenticator set pgrst.db_schemas = 'public,storage,graphql_public,caasy';
notify pgrst, 'reload config';
