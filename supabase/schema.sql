-- ZaLife Daily OS — Supabase schema
-- Run this in the Supabase SQL editor after creating a project.

create table if not exists public.user_snapshots (
  user_id text primary key,
  email text not null default '',
  display_name text not null default '',
  provider text not null default 'email',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists user_snapshots_updated_at_idx
  on public.user_snapshots (updated_at desc);

-- Bootcamp / internal use: allow the anon key to read and write all rows.
-- For production, replace with proper RLS policies and Supabase Auth.
alter table public.user_snapshots enable row level security;

create policy "bootcamp_anon_read"
  on public.user_snapshots for select
  using (true);

create policy "bootcamp_anon_write"
  on public.user_snapshots for insert
  with check (true);

create policy "bootcamp_anon_update"
  on public.user_snapshots for update
  using (true);

create policy "bootcamp_anon_delete"
  on public.user_snapshots for delete
  using (true);

-- ---------------------------------------------------------------------------
-- Public community chat (all users)
-- ---------------------------------------------------------------------------
create table if not exists public.public_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  display_name text not null default '',
  avatar_url text not null default '',
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists public_chat_messages_created_at_idx
  on public.public_chat_messages (created_at desc);

alter table public.public_chat_messages enable row level security;

create policy "bootcamp_chat_read"
  on public.public_chat_messages for select
  using (true);

create policy "bootcamp_chat_insert"
  on public.public_chat_messages for insert
  with check (true);

-- Realtime: enable in Supabase Dashboard → Database → Replication if needed,
-- or run: alter publication supabase_realtime add table public_chat_messages;
alter table public.public_chat_messages replica identity full;
