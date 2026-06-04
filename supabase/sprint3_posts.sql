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
