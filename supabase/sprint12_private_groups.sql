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
