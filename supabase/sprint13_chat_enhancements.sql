-- Sprint 13: Chat enhancements — read receipts, typing, group chat
-- Run after sprint7_chat.sql

-- Extend conversations for group chat
alter table public.conversations
  add column if not exists group_id uuid references public.groups (id) on delete cascade,
  add column if not exists title text;

create index if not exists conversations_group_id_idx on public.conversations (group_id);

-- Read receipts per member per conversation
create table if not exists public.conversation_reads (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

alter table public.conversation_reads enable row level security;

create policy "conversation_reads_select_member"
  on public.conversation_reads for select
  using (public.is_conversation_member(conversation_id, auth.uid()));

create policy "conversation_reads_upsert_own"
  on public.conversation_reads for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and public.is_conversation_member(conversation_id, auth.uid())
  );

-- Message delivery status
alter table public.messages
  add column if not exists status text not null default 'sent'
    check (status in ('pending', 'sent', 'delivered', 'failed'));

-- Create group conversation RPC
create or replace function public.create_group_conversation(p_group_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_convo_id uuid;
  v_title text;
begin
  if v_me is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_group_member(p_group_id, v_me) then
    raise exception 'Not a group member';
  end if;

  select id into v_convo_id from public.conversations where group_id = p_group_id limit 1;
  if v_convo_id is not null then
    return v_convo_id;
  end if;

  select name into v_title from public.groups where id = p_group_id;

  insert into public.conversations (group_id, title, dm_key)
  values (p_group_id, v_title, 'group:' || p_group_id::text)
  returning id into v_convo_id;

  insert into public.conversation_members (conversation_id, user_id)
  select v_convo_id, gm.user_id
  from public.group_members gm
  where gm.group_id = p_group_id;

  return v_convo_id;
end;
$$;

grant execute on function public.create_group_conversation(uuid) to authenticated;

-- Mark conversation as read
create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_conversation_member(p_conversation_id, auth.uid()) then
    raise exception 'Not a member';
  end if;

  insert into public.conversation_reads (conversation_id, user_id, last_read_at)
  values (p_conversation_id, auth.uid(), now())
  on conflict (conversation_id, user_id)
  do update set last_read_at = excluded.last_read_at;
end;
$$;

grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- Sync new group members into existing group conversation
create or replace function public.sync_group_member_to_chat()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_convo_id uuid;
begin
  select id into v_convo_id from public.conversations where group_id = new.group_id limit 1;
  if v_convo_id is not null then
    insert into public.conversation_members (conversation_id, user_id)
    values (v_convo_id, new.user_id)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_group_member_chat_sync on public.group_members;
create trigger on_group_member_chat_sync
  after insert on public.group_members
  for each row execute function public.sync_group_member_to_chat();

-- Realtime for notifications and conversations
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.conversations;
exception when duplicate_object then null;
end $$;
