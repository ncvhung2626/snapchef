-- ==============================================================================
-- File: schema.sql
-- ==============================================================================

-- Chạy trong Supabase Dashboard → SQL Editor

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  fullname text not null,
  email text,
  avatar text default '',
  bio text default '',
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_all"
  on public.profiles for select
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, fullname, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'fullname', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- ==============================================================================
-- File: sprint2_profile.sql
-- ==============================================================================

-- Sprint 2: Profile — chạy sau schema.sql

alter table public.profiles
  add column if not exists posts_count int not null default 0;

-- Theo dõi người dùng
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table public.follows enable row level security;

create policy "follows_select_all"
  on public.follows for select using (true);

create policy "follows_insert_own"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "follows_delete_own"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- Đếm followers / following (view đơn giản)
create or replace view public.profile_stats with (security_invoker = true) as
select
  p.id,
  p.posts_count,
  (select count(*)::int from public.follows f where f.following_id = p.id) as followers_count,
  (select count(*)::int from public.follows f where f.follower_id = p.id) as following_count
from public.profiles p;

grant select on public.profile_stats to anon, authenticated;


-- ==============================================================================
-- File: sprint3_posts.sql
-- ==============================================================================

-- Sprint 3: Posts + Likes + Comments — chạy sau schema.sql (+ sprint2 nếu có)

alter table public.profiles
  add column if not exists posts_count int not null default 0;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  images text[] not null default '{}',
  videos text[] not null default '{}',
  visibility text not null default 'public' check (visibility in ('public', 'friends', 'group')),
  group_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_author_id_idx on public.posts (author_id);
create index if not exists posts_created_at_idx on public.posts (created_at desc);

create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  parent_comment_id uuid references public.comments (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists comments_post_id_idx on public.comments (post_id);

alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;

create policy "posts_select_all" on public.posts for select using (true);
create policy "posts_insert_own" on public.posts for insert with check (auth.uid() = author_id);
create policy "posts_update_own" on public.posts for update using (auth.uid() = author_id);
create policy "posts_delete_own" on public.posts for delete using (auth.uid() = author_id);

create policy "post_likes_select_all" on public.post_likes for select using (true);
create policy "post_likes_insert_own" on public.post_likes for insert with check (auth.uid() = user_id);
create policy "post_likes_delete_own" on public.post_likes for delete using (auth.uid() = user_id);

create policy "comments_select_all" on public.comments for select using (true);
create policy "comments_insert_own" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments_delete_own" on public.comments for delete using (auth.uid() = user_id);

create or replace function public.bump_posts_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set posts_count = posts_count + 1 where id = new.author_id;
  return new;
end;
$$;

drop trigger if exists on_post_created on public.posts;
create trigger on_post_created
  after insert on public.posts
  for each row execute function public.bump_posts_count();

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- Storage bucket ảnh bài viết (public read)
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

create policy "post_images_public_read"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "post_images_auth_upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'post-images');

create policy "post_images_auth_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'post-images');


-- ==============================================================================
-- File: sprint4_comments.sql
-- ==============================================================================

-- Sprint 4: Bổ sung policy bình luận (nếu đã chạy sprint3 thì chỉ cần phần dưới)

-- Cho phép user sửa nội dung comment của mình
drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own"
  on public.comments for update
  using (auth.uid() = user_id);

-- Index phụ cho truy vấn theo thời gian
create index if not exists comments_created_at_idx on public.comments (created_at);


-- ==============================================================================
-- File: sprint5_groups.sql
-- ==============================================================================

-- Sprint 5: Groups — chạy sau schema.sql → sprint2 → sprint3

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  cover_image text,
  avatar_url text,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  privacy text not null default 'public' check (privacy in ('public', 'private')),
  members_count int not null default 0,
  posts_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create index if not exists group_members_group_id_idx on public.group_members (group_id);
create index if not exists group_members_user_id_idx on public.group_members (user_id);

-- Liên kết bài viết với nhóm (nếu chưa có FK)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'posts_group_id_fkey'
  ) then
    alter table public.posts
      add constraint posts_group_id_fkey
      foreign key (group_id) references public.groups (id) on delete set null;
  end if;
end $$;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

create policy "groups_select_all" on public.groups for select using (true);
create policy "groups_insert_own" on public.groups for insert with check (auth.uid() = owner_id);
create policy "groups_update_owner" on public.groups for update using (auth.uid() = owner_id);
create policy "groups_delete_owner" on public.groups for delete using (auth.uid() = owner_id);

create policy "group_members_select_all" on public.group_members for select using (true);
create policy "group_members_insert_own" on public.group_members for insert with check (auth.uid() = user_id);
create policy "group_members_delete_own" on public.group_members for delete using (auth.uid() = user_id);

create or replace function public.bump_group_members_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.groups set members_count = members_count + 1 where id = new.group_id;
  elsif tg_op = 'DELETE' then
    update public.groups set members_count = greatest(members_count - 1, 0) where id = old.group_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists on_group_member_change on public.group_members;
create trigger on_group_member_change
  after insert or delete on public.group_members
  for each row execute function public.bump_group_members_count();

create or replace function public.bump_group_posts_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.group_id is not null then
    update public.groups set posts_count = posts_count + 1 where id = new.group_id;
  elsif tg_op = 'DELETE' and old.group_id is not null then
    update public.groups set posts_count = greatest(posts_count - 1, 0) where id = old.group_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists on_group_post_change on public.posts;
create trigger on_group_post_change
  after insert or delete on public.posts
  for each row execute function public.bump_group_posts_count();

drop trigger if exists groups_updated_at on public.groups;
create trigger groups_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('group-images', 'group-images', true)
on conflict (id) do nothing;

create policy "group_images_public_read"
  on storage.objects for select
  using (bucket_id = 'group-images');

create policy "group_images_auth_upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'group-images');


-- ==============================================================================
-- File: sprint6_notifications.sql
-- ==============================================================================

-- Sprint 6: Notifications — chạy sau sprint5_groups.sql

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  type text not null check (type in ('like', 'comment', 'follow', 'group', 'system', 'premium')),
  title text not null,
  description text not null default '',
  post_id uuid references public.posts (id) on delete cascade,
  group_id uuid references public.groups (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_receiver_id_idx on public.notifications (receiver_id);
create index if not exists notifications_created_at_idx on public.notifications (created_at desc);

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = receiver_id);

create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = receiver_id);

-- Chỉ trigger / hàm security definer được insert
create or replace function public.insert_notification(
  p_receiver_id uuid,
  p_sender_id uuid,
  p_type text,
  p_title text,
  p_description text default '',
  p_post_id uuid default null,
  p_group_id uuid default null,
  p_comment_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_receiver_id is null or p_receiver_id = p_sender_id then
    return;
  end if;
  insert into public.notifications (
    receiver_id, sender_id, type, title, description,
    post_id, group_id, comment_id
  ) values (
    p_receiver_id, p_sender_id, p_type, p_title, p_description,
    p_post_id, p_group_id, p_comment_id
  );
end;
$$;

create or replace function public.notify_post_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author_id uuid;
  v_name text;
begin
  select p.author_id, pr.fullname
  into v_author_id, v_name
  from public.posts p
  join public.profiles pr on pr.id = new.user_id
  where p.id = new.post_id;

  perform public.insert_notification(
    v_author_id,
    new.user_id,
    'like',
    coalesce(v_name, 'Ai đó') || ' đã thích bài viết của bạn',
    'Nhấn để xem bài viết',
    new.post_id
  );
  return new;
end;
$$;

drop trigger if exists on_post_liked_notify on public.post_likes;
create trigger on_post_liked_notify
  after insert on public.post_likes
  for each row execute function public.notify_post_like();

create or replace function public.notify_post_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author_id uuid;
  v_name text;
begin
  select p.author_id, pr.fullname
  into v_author_id, v_name
  from public.posts p
  join public.profiles pr on pr.id = new.user_id
  where p.id = new.post_id;

  perform public.insert_notification(
    v_author_id,
    new.user_id,
    'comment',
    coalesce(v_name, 'Ai đó') || ' đã bình luận bài viết của bạn',
    left(new.content, 120),
    new.post_id,
    null,
    new.id
  );
  return new;
end;
$$;

drop trigger if exists on_comment_notify on public.comments;
create trigger on_comment_notify
  after insert on public.comments
  for each row execute function public.notify_post_comment();

create or replace function public.notify_new_follower()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  select fullname into v_name from public.profiles where id = new.follower_id;

  perform public.insert_notification(
    new.following_id,
    new.follower_id,
    'follow',
    coalesce(v_name, 'Ai đó') || ' đã theo dõi bạn',
    'Xem hồ sơ của họ'
  );
  return new;
end;
$$;

drop trigger if exists on_follow_notify on public.follows;
create trigger on_follow_notify
  after insert on public.follows
  for each row execute function public.notify_new_follower();

create or replace function public.notify_group_join()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_group_name text;
  v_name text;
begin
  if new.role = 'owner' then
    return new;
  end if;

  select g.owner_id, g.name, pr.fullname
  into v_owner_id, v_group_name, v_name
  from public.groups g
  join public.profiles pr on pr.id = new.user_id
  where g.id = new.group_id;

  perform public.insert_notification(
    v_owner_id,
    new.user_id,
    'group',
    coalesce(v_name, 'Thành viên mới') || ' đã tham gia nhóm ' || coalesce(v_group_name, ''),
    'Nhấn để xem nhóm',
    null,
    new.group_id
  );
  return new;
end;
$$;

drop trigger if exists on_group_member_notify on public.group_members;
create trigger on_group_member_notify
  after insert on public.group_members
  for each row execute function public.notify_group_join();


-- ==============================================================================
-- File: sprint7_chat.sql
-- ==============================================================================

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


-- ==============================================================================
-- File: sprint9_recipes.sql
-- ==============================================================================

-- Sprint 9: Công thức (Figma) — chạy sau sprint7

alter table public.posts
  add column if not exists title text,
  add column if not exists category text not null default 'general',
  add column if not exists ingredients jsonb not null default '[]'::jsonb,
  add column if not exists steps jsonb not null default '[]'::jsonb,
  add column if not exists cook_time_minutes int;

create index if not exists posts_category_idx on public.posts (category);
create index if not exists posts_title_search_idx on public.posts using gin (to_tsvector('simple', coalesce(title, '') || ' ' || content));

create table if not exists public.saved_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

alter table public.saved_recipes enable row level security;

create policy "saved_recipes_select_own"
  on public.saved_recipes for select using (auth.uid() = user_id);

create policy "saved_recipes_insert_own"
  on public.saved_recipes for insert with check (auth.uid() = user_id);

create policy "saved_recipes_delete_own"
  on public.saved_recipes for delete using (auth.uid() = user_id);


-- ==============================================================================
-- File: sprint10_friend_requests.sql
-- ==============================================================================

-- Friend requests (bảo vệ đồ án)
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sender_id, receiver_id)
);

alter table public.friend_requests enable row level security;

create policy "Users can view own friend requests"
  on public.friend_requests for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send friend requests"
  on public.friend_requests for insert
  with check (auth.uid() = sender_id);

create policy "Users can update own friend requests"
  on public.friend_requests for update
  using (auth.uid() = sender_id or auth.uid() = receiver_id);


-- ==============================================================================
-- File: sprint11_group_admin_rls.sql
-- ==============================================================================

-- Group admin/owner can remove members (bảo vệ đồ án)
create policy "group_members_delete_by_admin"
  on public.group_members for delete
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role in ('owner', 'admin')
    )
  );

-- Group owner/admin can soft-delete posts in their group
create policy "posts_delete_group_admin"
  on public.posts for update
  using (
    group_id is not null
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = posts.group_id
        and gm.user_id = auth.uid()
        and gm.role in ('owner', 'admin')
    )
  )
  with check (true);


-- ==============================================================================
-- File: sprint12_private_groups.sql
-- ==============================================================================

-- Sprint 12: Private groups security
-- Live schema (verified):
--   groups: id, owner_id, name, description, avatar_url, members_count, created_at
--   group_members: id, group_id, user_id, role, joined_at
--   posts: author_id, group_id, ... (sprint3)
-- Run after sprint5_groups.sql and sprint11_group_admin_rls.sql

-- Privacy flag is required for private-group rules but absent from base groups table
alter table public.groups
  add column if not exists privacy text not null default 'public';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'groups_privacy_check'
  ) then
    alter table public.groups
      add constraint groups_privacy_check
      check (privacy in ('public', 'private'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Helpers (security definer; only reference columns that exist)
-- ---------------------------------------------------------------------------

create or replace function public.is_group_member(
  p_group_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = p_user_id
  );
$$;

create or replace function public.is_group_admin(
  p_group_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = p_user_id
      and gm.role in ('owner', 'admin')
  );
$$;

create or replace function public.can_view_group(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.groups g
    where g.id = p_group_id
      and (
        g.privacy = 'public'
        or g.owner_id = auth.uid()
        or public.is_group_member(g.id)
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- groups RLS
-- ---------------------------------------------------------------------------

alter table public.groups enable row level security;

drop policy if exists "groups_select_all" on public.groups;
drop policy if exists "groups_select_visible" on public.groups;
create policy "groups_select_visible"
  on public.groups
  for select
  using (
    privacy = 'public'
    or owner_id = auth.uid()
    or public.is_group_member(id)
  );

drop policy if exists "groups_update_owner" on public.groups;
drop policy if exists "groups_update_admin" on public.groups;
create policy "groups_update_admin"
  on public.groups
  for update
  using (
    auth.uid() = owner_id
    or public.is_group_admin(id)
  );

-- ---------------------------------------------------------------------------
-- group_members RLS
-- ---------------------------------------------------------------------------

alter table public.group_members enable row level security;

drop policy if exists "group_members_select_all" on public.group_members;
drop policy if exists "group_members_select_visible" on public.group_members;
create policy "group_members_select_visible"
  on public.group_members
  for select
  using (public.can_view_group(group_id));

-- ---------------------------------------------------------------------------
-- posts RLS (posts.author_id — not user_id; no deleted_at assumed)
-- ---------------------------------------------------------------------------

alter table public.posts enable row level security;

drop policy if exists "posts_select_all" on public.posts;
drop policy if exists "posts_select_visible" on public.posts;
drop policy if exists "posts_select_group_private" on public.posts;
create policy "posts_select_visible"
  on public.posts
  for select
  using (
    group_id is null
    or exists (
      select 1
      from public.groups g
      where g.id = posts.group_id
        and (
          g.privacy = 'public'
          or g.owner_id = auth.uid()
          or public.is_group_member(g.id)
        )
    )
  );


-- ==============================================================================
-- File: sprint13_chat_enhancements.sql
-- ==============================================================================

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


-- ==============================================================================
-- File: production\00_production_all.sql
-- ==============================================================================

-- ==============================================================================
-- 01_alter_profiles_posts.sql
-- ==============================================================================
-- Production: mở rộng bảng đã có (idempotent)

-- profiles: audit + soft delete + username
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists deleted_at timestamptz;
alter table public.profiles add column if not exists last_seen_at timestamptz;
alter table public.profiles add column if not exists is_banned boolean not null default false;

create unique index if not exists profiles_username_unique
  on public.profiles (lower(username))
  where username is not null and deleted_at is null;

-- posts: soft delete + slug/search
alter table public.posts add column if not exists deleted_at timestamptz;
alter table public.posts add column if not exists visibility text not null default 'public'
  check (visibility in ('public', 'followers', 'group', 'private'));

-- comments: reply + soft delete
alter table public.comments add column if not exists parent_id uuid references public.comments (id) on delete set null;
alter table public.comments add column if not exists deleted_at timestamptz;
alter table public.comments add column if not exists updated_at timestamptz default now();

create index if not exists comments_post_parent_idx
  on public.comments (post_id, parent_id, created_at desc)
  where deleted_at is null;

-- ==============================================================================
-- 02_new_tables.sql
-- ==============================================================================
-- Production: bảng mới (chạy sau sprint 1–9)

-- saved_posts (spec); song song saved_recipes sprint9
create table if not exists public.saved_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  collection_name text default 'default',
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

-- hashtags
create table if not exists public.hashtags (
  id uuid primary key default gen_random_uuid(),
  tag text not null,
  created_at timestamptz not null default now(),
  unique (lower(tag))
);

create table if not exists public.post_hashtags (
  post_id uuid not null references public.posts (id) on delete cascade,
  hashtag_id uuid not null references public.hashtags (id) on delete cascade,
  primary key (post_id, hashtag_id)
);

-- reports
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'user', 'group', 'reel', 'message')),
  target_id uuid not null,
  reason text not null,
  evidence_url text,
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- reels
create table if not exists public.reels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  video_url text not null,
  thumbnail_url text,
  caption text default '',
  duration_seconds int,
  view_count int not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reel_likes (
  reel_id uuid not null references public.reels (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reel_id, user_id)
);

create table if not exists public.reel_comments (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references public.reels (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  parent_id uuid references public.reel_comments (id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

-- meal plans & categories
create table if not exists public.recipe_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null default 0
);

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  plan_date date not null,
  meals jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  theme text default 'system' check (theme in ('light', 'dark', 'system')),
  notify_likes boolean not null default true,
  notify_comments boolean not null default true,
  notify_follows boolean not null default true,
  notify_groups boolean not null default true,
  language text default 'vi',
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- enable RLS on new tables
alter table public.saved_posts enable row level security;
alter table public.hashtags enable row level security;
alter table public.post_hashtags enable row level security;
alter table public.reports enable row level security;
alter table public.reels enable row level security;
alter table public.reel_likes enable row level security;
alter table public.reel_comments enable row level security;
alter table public.recipe_categories enable row level security;
alter table public.meal_plans enable row level security;
alter table public.user_preferences enable row level security;
alter table public.admin_logs enable row level security;

-- ==============================================================================
-- 03_indexes.sql
-- ==============================================================================
-- Performance indexes

create index if not exists posts_feed_idx
  on public.posts (created_at desc)
  where deleted_at is null;

create index if not exists posts_user_idx
  on public.posts (user_id, created_at desc)
  where deleted_at is null;

create index if not exists post_likes_post_idx on public.post_likes (post_id);
create index if not exists follows_follower_idx on public.follows (follower_id);
create index if not exists follows_following_idx on public.follows (following_id);

create index if not exists notifications_user_read_idx
  on public.notifications (user_id, read, created_at desc);

create index if not exists messages_conversation_idx
  on public.messages (conversation_id, created_at desc);

create index if not exists reels_feed_idx
  on public.reels (created_at desc)
  where deleted_at is null;

create index if not exists reports_status_idx
  on public.reports (status, created_at desc);

create index if not exists saved_posts_user_idx
  on public.saved_posts (user_id, created_at desc);

-- ==============================================================================
-- 04_rls.sql
-- ==============================================================================
-- RLS policies (idempotent: drop if exists then create)

-- Helper: admin/moderator
create or replace function public.is_admin_or_mod()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'moderator') and p.deleted_at is null
  );
$$;

-- saved_posts
drop policy if exists "saved_posts_select_own" on public.saved_posts;
create policy "saved_posts_select_own" on public.saved_posts for select using (auth.uid() = user_id);
drop policy if exists "saved_posts_insert_own" on public.saved_posts;
create policy "saved_posts_insert_own" on public.saved_posts for insert with check (auth.uid() = user_id);
drop policy if exists "saved_posts_delete_own" on public.saved_posts;
create policy "saved_posts_delete_own" on public.saved_posts for delete using (auth.uid() = user_id);

-- hashtags: read all, insert authenticated
drop policy if exists "hashtags_select_all" on public.hashtags;
create policy "hashtags_select_all" on public.hashtags for select using (true);
drop policy if exists "hashtags_insert_auth" on public.hashtags;
create policy "hashtags_insert_auth" on public.hashtags for insert with check (auth.uid() is not null);

drop policy if exists "post_hashtags_select_all" on public.post_hashtags;
create policy "post_hashtags_select_all" on public.post_hashtags for select using (true);
drop policy if exists "post_hashtags_insert_owner" on public.post_hashtags;
create policy "post_hashtags_insert_owner" on public.post_hashtags for insert
  with check (exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid()));

-- reports
drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports for insert with check (auth.uid() = reporter_id);
drop policy if exists "reports_select_own_or_staff" on public.reports;
create policy "reports_select_own_or_staff" on public.reports for select
  using (auth.uid() = reporter_id or public.is_admin_or_mod());
drop policy if exists "reports_update_staff" on public.reports;
create policy "reports_update_staff" on public.reports for update using (public.is_admin_or_mod());

-- reels
drop policy if exists "reels_select_public" on public.reels;
create policy "reels_select_public" on public.reels for select using (deleted_at is null);
drop policy if exists "reels_insert_own" on public.reels;
create policy "reels_insert_own" on public.reels for insert with check (auth.uid() = user_id);
drop policy if exists "reels_update_own" on public.reels;
create policy "reels_update_own" on public.reels for update using (auth.uid() = user_id);
drop policy if exists "reels_delete_own_or_mod" on public.reels;
create policy "reels_delete_own_or_mod" on public.reels for delete
  using (auth.uid() = user_id or public.is_admin_or_mod());

drop policy if exists "reel_likes_select_all" on public.reel_likes;
create policy "reel_likes_select_all" on public.reel_likes for select using (true);
drop policy if exists "reel_likes_mutate_own" on public.reel_likes;
create policy "reel_likes_mutate_own" on public.reel_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reel_comments_select" on public.reel_comments;
create policy "reel_comments_select" on public.reel_comments for select using (deleted_at is null);
drop policy if exists "reel_comments_insert_own" on public.reel_comments;
create policy "reel_comments_insert_own" on public.reel_comments for insert with check (auth.uid() = user_id);

-- meal_plans, user_preferences
drop policy if exists "meal_plans_own" on public.meal_plans;
create policy "meal_plans_own" on public.meal_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_preferences_own" on public.user_preferences;
create policy "user_preferences_own" on public.user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "recipe_categories_select_all" on public.recipe_categories;
create policy "recipe_categories_select_all" on public.recipe_categories for select using (true);

drop policy if exists "admin_logs_select_staff" on public.admin_logs;
create policy "admin_logs_select_staff" on public.admin_logs for select using (public.is_admin_or_mod());
drop policy if exists "admin_logs_insert_staff" on public.admin_logs;
create policy "admin_logs_insert_staff" on public.admin_logs for insert with check (public.is_admin_or_mod());

-- posts: soft-delete aware (bổ sung nếu chưa có)
drop policy if exists "posts_select_visible" on public.posts;
create policy "posts_select_visible" on public.posts for select
  using (deleted_at is null or user_id = auth.uid() or public.is_admin_or_mod());

drop policy if exists "posts_delete_own_or_mod" on public.posts;
create policy "posts_delete_own_or_mod" on public.posts for delete
  using (auth.uid() = user_id or public.is_admin_or_mod());

-- ==============================================================================
-- 05_storage.sql
-- ==============================================================================
-- Storage buckets + policies

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('post-images', 'post-images', true),
  ('post-videos', 'post-videos', true),
  ('group-covers', 'group-covers', true),
  ('reels', 'reels', true),
  ('report-evidence', 'report-evidence', false)
on conflict (id) do nothing;

-- avatars: public read, user upload own folder {userId}/*
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_upload_own" on storage.objects;
create policy "avatars_upload_own" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- post-images / post-videos: authenticated upload, public read
drop policy if exists "post_media_public_read" on storage.objects;
create policy "post_media_public_read" on storage.objects for select
  using (bucket_id in ('post-images', 'post-videos', 'group-covers', 'reels'));

drop policy if exists "post_media_auth_upload" on storage.objects;
create policy "post_media_auth_upload" on storage.objects for insert
  with check (
    bucket_id in ('post-images', 'post-videos', 'group-covers', 'reels')
    and auth.uid() is not null
  );

-- report-evidence: private, reporter only
drop policy if exists "report_evidence_own" on storage.objects;
create policy "report_evidence_own" on storage.objects for all
  using (bucket_id = 'report-evidence' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'report-evidence' and auth.uid()::text = (storage.foldername(name))[1]);

-- ==============================================================================
-- 06_triggers.sql
-- ==============================================================================
-- Audit updated_at on new tables

drop trigger if exists reports_updated_at on public.reports;
create trigger reports_updated_at before update on public.reports
  for each row execute function public.set_updated_at();

drop trigger if exists reels_updated_at on public.reels;
create trigger reels_updated_at before update on public.reels
  for each row execute function public.set_updated_at();

drop trigger if exists meal_plans_updated_at on public.meal_plans;
create trigger meal_plans_updated_at before update on public.meal_plans
  for each row execute function public.set_updated_at();

drop trigger if exists user_preferences_updated_at on public.user_preferences;
create trigger user_preferences_updated_at before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- Seed recipe categories (optional)
insert into public.recipe_categories (slug, name, sort_order)
values
  ('breakfast', 'Bữa sáng', 1),
  ('lunch', 'Bữa trưa', 2),
  ('dinner', 'Bữa tối', 3),
  ('dessert', 'Tráng miệng', 4),
  ('healthy', 'Healthy', 5)
on conflict (slug) do nothing;


-- ==============================================================================
-- File: seed\dev_seed.sql
-- ==============================================================================

-- SnapChef Development Seed Data
-- Chạy trong Supabase SQL Editor SAU KHI đã có ít nhất 1 user đăng ký qua app.
-- Script gán dữ liệu demo cho profiles hiện có và tạo posts/groups/reels mẫu.

-- 1. Cập nhật profiles (tối đa 15 user đầu tiên)
with numbered as (
  select id, row_number() over (order by created_at) as rn
  from public.profiles
  limit 15
),
demo as (
  select * from (values
    (1, 'Lan Nguyễn', 'Đầu bếp gia đình | Món Việt mỗi ngày', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'),
    (2, 'Minh Trần', 'Food blogger Sài Gòn', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'),
    (3, 'Hương Lê', 'Eat clean & meal prep', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200'),
    (4, 'Đức Phạm', 'Nghiện phở & cà phê sáng', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200'),
    (5, 'Thảo Võ', 'Công thức nhanh cho người bận', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200'),
    (6, 'Quỳnh Đặng', 'Bánh ngọt homemade', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'),
    (7, 'Hải Huỳnh', 'Ẩm thực Huế', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200'),
    (8, 'Anh Bùi', 'BBQ & grill master', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200'),
    (9, 'Chi Ngô', 'Trà sữa & dessert', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200'),
    (10, 'Bảo Đinh', 'Vegan-friendly', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200'),
    (11, 'SnapChef Admin', 'Quản trị cộng đồng', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200'),
    (12, 'Mod Kiểm Duyệt', 'Kiểm duyệt nội dung', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200'),
    (13, 'Photo Foodie', 'Nhiếp ảnh món ăn', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200'),
    (14, 'Travel Eats', 'Du lịch ẩm thực', 'https://images.unsplash.com/photo-1599566150163-291fa0b0d631?w=200'),
    (15, 'Fish VAA', 'Học viên VAA', 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200')
  ) as t(rn, fullname, bio, avatar)
)
update public.profiles p
set
  fullname = d.fullname,
  bio = d.bio,
  avatar = d.avatar,
  username = lower(replace(d.fullname, ' ', ''))
from numbered n
join demo d on d.rn = n.rn
where p.id = n.id;

-- 2. Seed posts mẫu (15 feed + 15 recipe) — bỏ qua nếu đã có > 20 posts demo
do $$
declare
  author_ids uuid[];
  aid uuid;
  i int;
  feed_contents text[] := array[
    'Phở bò Hà Nội nóng hổi — nước dùng ninh 6 tiếng #phobo',
    'Bún bò Huế chuẩn vị cố đô #bunbo #hue',
    'Bánh mì chảo Sài Gòn đường phố #banhmichao',
    'Gà nướng mật ong da giòn #chicken #honey',
    'Cơm tấm sườn bì chả cuối tuần #comtam',
    'Trà sữa trân châu homemade #trasua',
    'Bánh flan caramel mềm tan #flan #dessert',
    'Salad ức gà eat clean #eatclean',
    'Pasta carbonara kiểu Việt #pasta',
    'Lẩu thái cuối tuần #lauthai',
    'Bánh xèo miền Tây #banhxeo',
    'Cháo lòng sáng sớm #chaolong',
    'Gỏi cuốn tôm thịt #goicuon',
    'Bún chả Hà Nội #buncha',
    'Cà phê sữa đá sáng quốc dân #caphe'
  ];
  recipe_titles text[] := array[
    'Phở bò Hà Nội','Bún bò Huế','Bánh mì chảo','Gà nướng mật ong','Cơm tấm sườn',
    'Trà sữa homemade','Bánh flan','Gỏi cuốn','Bún chả','Salad ức gà',
    'Lẩu thái','Bánh xèo','Pasta carbonara','Cháo lòng','Cà phê sữa đá'
  ];
begin
  if (select count(*) from public.posts) > 20 then
    return;
  end if;

  select array_agg(id order by created_at) into author_ids
  from (select id, created_at from public.profiles limit 10) s;

  if author_ids is null or array_length(author_ids, 1) < 1 then
    raise notice 'Chưa có profile — đăng ký ít nhất 1 tài khoản trước khi seed.';
    return;
  end if;

  for i in 1..15 loop
    aid := author_ids[1 + ((i - 1) % array_length(author_ids, 1))];
    insert into public.posts (author_id, content, images, visibility, created_at)
    values (
      aid,
      feed_contents[i],
      array['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'],
      'public',
      now() - (i || ' hours')::interval
    );
  end loop;

  for i in 1..15 loop
    aid := author_ids[1 + ((i - 1) % array_length(author_ids, 1))];
    insert into public.posts (author_id, title, content, images, visibility, category, cook_time_minutes, ingredients, steps, created_at)
    values (
      aid,
      recipe_titles[i],
      'Công thức chi tiết ' || recipe_titles[i],
      array['https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800'],
      'public',
      'vietnamese',
      30 + i * 5,
      array['Nguyên liệu 1', 'Nguyên liệu 2'],
      array['Bước 1', 'Bước 2'],
      now() - (i || ' days')::interval
    );
  end loop;
end $$;

-- 3. Seed groups (10 nhóm)
insert into public.groups (name, description, cover_image, owner_id, privacy)
select g.name, g.description, g.cover, p.id, 'public'
from (values
  ('Phở & Bún — Món Việt', 'Chia sẻ công thức phở, bún từ Bắc vào Nam', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800'),
  ('Eat Clean Việt Nam', 'Meal prep, salad, low-carb', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'),
  ('Bánh Ngọt Homemade', 'Flan, bánh bông lan, cookie', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800'),
  ('BBQ & Grill Masters', 'Gà nướng, sườn BBQ', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800'),
  ('Trà Sữa & Dessert', 'Công thức trà sữa DIY', 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800'),
  ('Ẩm Thực Huế', 'Bún bò, cơm hến, nem lụi', 'https://images.unsplash.com/photo-1555126634-323283e090f2?w=800'),
  ('Street Food Sài Gòn', 'Bánh mì, hủ tiếu đường phố', 'https://images.unsplash.com/photo-1569058242567-93de6f492f5c?w=800'),
  ('Meal Prep Chủ Nhật', 'Chuẩn bị bữa ăn cả tuần', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800'),
  ('Vegan Việt', 'Món chay fusion', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800'),
  ('SnapChef Cộng Đồng', 'Nhóm chính thức SnapChef', 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800')
) as g(name, description, cover)
cross join lateral (select id from public.profiles order by created_at limit 1) p
where not exists (select 1 from public.groups where name = g.name);

-- 4. Seed reels (15) — cần bảng reels từ production/02
insert into public.reels (user_id, video_url, thumbnail_url, caption, view_count, created_at)
select
  p.id,
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://images.unsplash.com/photo-1591814468924-caf87d1282aa?w=600',
  c.caption,
  500 + c.i * 100,
  now() - (c.i || ' hours')::interval
from generate_series(1, 15) as c(i)
cross join lateral (
  select id from public.profiles order by created_at offset (c.i % 10) limit 1
) p
cross join lateral (select caption from (values
  (1, 'Phở bò Hà Nội #phobo #foodie'),
  (2, 'Bún bò Huế cay nồng #bunbo'),
  (3, 'Bánh mì chảo SG #banhmichao'),
  (4, 'Gà mật ong #chicken'),
  (5, 'Cơm tấm đầy đủ #comtam'),
  (6, 'Trà sữa homemade #trasua'),
  (7, 'Bánh flan #flan'),
  (8, 'Salad eat clean #healthy'),
  (9, 'Lẩu thái #hotpot'),
  (10, 'Bánh xèo #banhxeo'),
  (11, 'Gỏi cuốn #fresh'),
  (12, 'Bún chả #buncha'),
  (13, 'Pasta #italian'),
  (14, 'Cháo lòng #breakfast'),
  (15, 'Cà phê sữa đá #caphe')
) as t(i, caption) where t.i = c.i) cap(caption)
where exists (select 1 from information_schema.tables where table_name = 'reels')
  and (select count(*) from public.reels) < 5;


