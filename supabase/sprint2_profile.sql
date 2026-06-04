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
create or replace view public.profile_stats as
select
  p.id,
  p.posts_count,
  (select count(*)::int from public.follows f where f.following_id = p.id) as followers_count,
  (select count(*)::int from public.follows f where f.follower_id = p.id) as following_count
from public.profiles p;

grant select on public.profile_stats to anon, authenticated;
