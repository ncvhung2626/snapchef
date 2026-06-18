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
