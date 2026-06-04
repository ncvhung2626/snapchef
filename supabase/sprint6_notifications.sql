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
