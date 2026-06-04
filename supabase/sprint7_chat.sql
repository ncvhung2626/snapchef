-- Sprint 7: Chat (1:1) + Realtime — chạy sau sprint6_notifications.sql

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  dm_key text unique,
  last_message text not null default '',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists conversation_members_user_id_idx on public.conversation_members (user_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create or replace function public.is_conversation_member(p_conversation_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = p_conversation_id and user_id = p_user_id
  );
$$;

create policy "conversations_select_member"
  on public.conversations for select
  using (public.is_conversation_member(id, auth.uid()));

create policy "conversations_insert_auth"
  on public.conversations for insert
  to authenticated
  with check (true);

create policy "conversations_update_member"
  on public.conversations for update
  using (public.is_conversation_member(id, auth.uid()));

create policy "conversation_members_select_member"
  on public.conversation_members for select
  using (public.is_conversation_member(conversation_id, auth.uid()));

create policy "conversation_members_insert_self"
  on public.conversation_members for insert
  with check (auth.uid() = user_id);

-- Tạo hội thoại 1:1 (thêm cả 2 thành viên, tránh lỗi RLS)
create or replace function public.create_dm_conversation(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_key text;
  v_convo_id uuid;
begin
  if v_me is null or p_other_user_id is null or v_me = p_other_user_id then
    raise exception 'Invalid participants';
  end if;

  v_key := least(v_me::text, p_other_user_id::text) || ':' || greatest(v_me::text, p_other_user_id::text);

  select id into v_convo_id from public.conversations where dm_key = v_key limit 1;
  if v_convo_id is not null then
    return v_convo_id;
  end if;

  insert into public.conversations (dm_key) values (v_key) returning id into v_convo_id;

  insert into public.conversation_members (conversation_id, user_id)
  values (v_convo_id, v_me), (v_convo_id, p_other_user_id);

  return v_convo_id;
end;
$$;

grant execute on function public.create_dm_conversation(uuid) to authenticated;

create policy "messages_select_member"
  on public.messages for select
  using (public.is_conversation_member(conversation_id, auth.uid()));

create policy "messages_insert_member"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and public.is_conversation_member(conversation_id, auth.uid())
  );

create or replace function public.bump_conversation_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set
    last_message = left(new.content, 200),
    last_message_at = new.created_at,
    updated_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_message_sent on public.messages;
create trigger on_message_sent
  after insert on public.messages
  for each row execute function public.bump_conversation_last_message();

drop trigger if exists conversations_updated_at on public.conversations;
create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- Realtime: bật replication cho bảng messages (bỏ qua nếu đã thêm)
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;
