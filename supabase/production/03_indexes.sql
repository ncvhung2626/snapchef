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
