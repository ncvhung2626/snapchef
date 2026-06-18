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
