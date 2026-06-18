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
