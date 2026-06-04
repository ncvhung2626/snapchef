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
