-- =============================================================================
-- SnapChef — Development seed (profile-backed, schema-validated)
--
-- Prerequisite:
--   • Full schema applied (see SCHEMA_AUDIT.md)
--   • At least 1 row in public.profiles (register users via the app first)
--
-- Rules:
--   • NO fake user/profile UUIDs — all user FKs come from public.profiles
--   • NO auth.users inserts
--   • Deterministic content IDs via _demo_uuid (posts, groups, reels, …)
--   • Idempotent: ON CONFLICT DO NOTHING / DO UPDATE
--
-- Run in Supabase SQL Editor (postgres / service role bypasses RLS).
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- Deterministic UUID for non-user entities (posts, groups, comments, …)
create or replace function public._demo_uuid(p_prefix text, p_index int)
returns uuid
language sql
immutable
as $$
  select (
    p_prefix
    || '-0000-4000-8000-'
    || lpad(upper(to_hex(p_index)), 12, '0')
  )::uuid;
$$;

-- Pick profile id by 1-based index (wraps around profile array)
create or replace function public._seed_pick_profile(p_ids uuid[], p_index int)
returns uuid
language sql
immutable
as $$
  select p_ids[1 + ((greatest(p_index, 1) - 1) % array_length(p_ids, 1))];
$$;

create or replace function public.seed_snapchef_dev_data()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_profile_ids uuid[];
  v_n int;
  v_now timestamptz := now();
  v_i int;
  v_author_id uuid;
  v_post_id uuid;
  v_group_id uuid;
  v_owner_id uuid;
  v_follower_id uuid;
  v_following_id uuid;
  v_sender_id uuid;
  v_receiver_id uuid;
  v_feed_contents text[] := array[
    'Phở bò Hà Nội nóng hổi — nước dùng ninh 6 tiếng #phobo',
    'Bún bò Huế chuẩn vị cố đô #bunbo #hue',
    'Bánh mì chảo Sài Gòn đường phố #banhmichao',
    'Gà nướng mật ong da giòn #chicken #honey',
    'Cơm tấm sườn bì chả đầy đủ #comtam',
    'Trà sữa trân châu homemade #trasua',
    'Bánh flan caramel mềm tan #flan',
    'Salad ức gà eat clean 15 phút #eatclean',
    'Pasta carbonara kiểu Việt #pasta',
    'Lẩu thái cuối tuần cùng nhà #lauthai',
    'Bánh xèo miền Tây vàng giòn #banhxeo',
    'Cháo lòng sáng sớm nóng hổi #chaolong',
    'Gỏi cuốn tôm thịt tươi mát #goicuon',
    'Bún chả Hà Nội than hoa #buncha',
    'Cà phê sữa đá + bánh mì ốp la #caphe',
    'Bún riêu cua đậm đà #bunrieu',
    'Mì Quảng tôm thịt #miquang',
    'Cánh gà chiên nước mắm #canhga',
    'Súp bí đỏ kem tươi #soup',
    'Bánh cuốn nóng Hà Nội #banhcuon',
    'Hủ tiếu Nam Vang #hutieu',
    'Nem nướng Nha Trang #nemnuong',
    'Chè ba màu mát lạnh #che',
    'Bánh tráng trộn Sài Gòn #banhtrangtron',
    'Sườn nướng mía #suonnuong',
    'Canh chua cá lóc #canhchua',
    'Xôi gà Hội An #xoiga',
    'Bánh bao nhân thịt #banhbao',
    'Mực một nắng chiên giòn #mucmotnang',
    'Khoai môn nướng mật ong #khoaimon'
  ];
  v_recipe_titles text[] := array[
    'Phở bò Hà Nội', 'Bún bò Huế', 'Bánh mì chảo', 'Gà nướng mật ong', 'Cơm tấm sườn',
    'Trà sữa homemade', 'Bánh flan caramel', 'Gỏi cuốn tôm thịt', 'Bún chả Hà Nội', 'Salad ức gà',
    'Lẩu thái', 'Bánh xèo miền Tây', 'Pasta carbonara', 'Cháo lòng', 'Cà phê sữa đá',
    'Bún riêu cua', 'Mì Quảng', 'Cánh gà nước mắm', 'Chè ba màu', 'Nem nướng'
  ];
  v_group_names text[] := array[
    'Phở & Bún — Món Việt', 'Eat Clean Việt Nam', 'Bánh Ngọt Homemade',
    'BBQ & Grill Masters', 'Trà Sữa & Dessert', 'Ẩm Thực Huế',
    'Street Food Sài Gòn', 'Meal Prep Chủ Nhật', 'Vegan Việt', 'SnapChef Cộng Đồng'
  ];
  v_group_descs text[] := array[
    'Chia sẻ công thức phở, bún từ Bắc vào Nam.',
    'Meal prep, salad, low-carb — ăn healthy vẫn ngon.',
    'Flan, bánh bông lan, cookie homemade.',
    'Gà nướng, sườn BBQ, marinade và kỹ thuật nướng.',
    'Công thức trà sữa, trân châu DIY.',
    'Bún bò, cơm hến, bánh bèo, nem lụi.',
    'Bánh mì, hủ tiếu, bánh cuốn đường phố SG.',
    'Chuẩn bị bữa ăn cả tuần trong 2 giờ.',
    'Món chay, vegan fusion Việt Nam.',
    'Nhóm chính thức SnapChef — tin tức & sự kiện.'
  ];
  v_img text := 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop';
  v_recipe_img text := 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop';
  v_cover text := 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop';
  v_video text := 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
  v_thumb text := 'https://images.unsplash.com/photo-1591814468924-caf87d1282aa?w=600';
begin
  -- ---------------------------------------------------------------------------
  -- Load real profile IDs (oldest first, max 15)
  -- ---------------------------------------------------------------------------
  select coalesce(array_agg(id order by created_at asc), '{}'::uuid[])
  into v_profile_ids
  from (
    select p.id, p.created_at
    from public.profiles p
    order by p.created_at asc
    limit 15
  ) s;

  v_n := coalesce(array_length(v_profile_ids, 1), 0);

  if v_n < 1 then
    raise exception
      'seed_snapchef_dev_data: no profiles found. Register at least one user in the app, then re-run.';
  end if;

  raise notice 'seed_snapchef_dev_data: using % profile(s) from public.profiles', v_n;

  -- ---------------------------------------------------------------------------
  -- 1. groups + group_members (owner_id / user_id = real profiles)
  -- ---------------------------------------------------------------------------
  for v_i in 1..10 loop
    v_group_id := public._demo_uuid('d0000000', v_i);
    v_owner_id := public._seed_pick_profile(v_profile_ids, v_i);

    insert into public.groups (
      id, name, description, cover_image, avatar_url, owner_id,
      privacy, members_count, posts_count, created_at, updated_at
    ) values (
      v_group_id, v_group_names[v_i], v_group_descs[v_i], v_cover, null, v_owner_id,
      case when v_i = 8 then 'private' else 'public' end,
      0, 0,
      v_now - (v_i || ' weeks')::interval, v_now
    )
    on conflict (id) do update set
      name = excluded.name,
      description = excluded.description,
      cover_image = excluded.cover_image,
      updated_at = v_now;

    insert into public.group_members (id, group_id, user_id, role, joined_at)
    values (
      public._demo_uuid('da000000', v_i), v_group_id, v_owner_id, 'owner',
      v_now - (v_i || ' weeks')::interval
    )
    on conflict (group_id, user_id) do nothing;

    insert into public.group_members (id, group_id, user_id, role, joined_at)
    values (
      public._demo_uuid('db000000', v_i * 10 + 1), v_group_id,
      public._seed_pick_profile(v_profile_ids, v_i + 1), 'member',
      v_now - (v_i || ' days')::interval
    )
    on conflict (group_id, user_id) do nothing;

    if v_n >= 2 then
      insert into public.group_members (id, group_id, user_id, role, joined_at)
      values (
        public._demo_uuid('db000000', v_i * 10 + 2), v_group_id,
        public._seed_pick_profile(v_profile_ids, v_i + 5),
        case when v_i % 3 = 0 then 'admin' else 'member' end,
        v_now - ((v_i + 1) || ' days')::interval
      )
      on conflict (group_id, user_id) do nothing;
    end if;
  end loop;

  -- ---------------------------------------------------------------------------
  -- 2. feed posts (30)
  -- ---------------------------------------------------------------------------
  for v_i in 1..30 loop
    v_author_id := public._seed_pick_profile(v_profile_ids, v_i);
    v_group_id := case
      when v_i % 5 = 0 then public._demo_uuid('d0000000', 1 + ((v_i / 5) % 10))
      else null
    end;

    insert into public.posts (
      id, author_id, content, images, videos, visibility, group_id,
      title, category, ingredients, steps, cook_time_minutes,
      like_count, comment_count, share_count,
      created_at, updated_at
    ) values (
      public._demo_uuid('feed0000', v_i), v_author_id, v_feed_contents[v_i],
      array[v_img]::text[], '{}'::text[],
      case when v_group_id is not null then 'group' else 'public' end,
      v_group_id, null, 'general', '[]'::jsonb, '[]'::jsonb, null,
      0, 0, 0,
      v_now - (v_i * 3 || ' hours')::interval, v_now
    )
    on conflict (id) do nothing;
  end loop;

  -- ---------------------------------------------------------------------------
  -- 3. recipe posts (20)
  -- ---------------------------------------------------------------------------
  for v_i in 1..20 loop
    v_author_id := public._seed_pick_profile(v_profile_ids, v_i + 2);

    insert into public.posts (
      id, author_id, content, images, videos, visibility, group_id,
      title, category, ingredients, steps, cook_time_minutes,
      like_count, comment_count, share_count,
      created_at, updated_at
    ) values (
      public._demo_uuid('recipe00', v_i), v_author_id,
      'Công thức chi tiết: ' || v_recipe_titles[v_i] || '. Chia sẻ từ cộng đồng SnapChef.',
      array[v_recipe_img]::text[], '{}'::text[], 'public', null,
      v_recipe_titles[v_i],
      case
        when v_i <= 5 then 'vietnamese'
        when v_i <= 8 then 'healthy'
        when v_i <= 12 then 'dessert'
        else 'drinks'
      end,
      jsonb_build_array('Nguyên liệu 1', 'Nguyên liệu 2', 'Gia vị'),
      jsonb_build_array('Sơ chế nguyên liệu', 'Nấu chín', 'Trình bày'),
      15 + v_i * 3,
      0, 0, 0,
      v_now - (v_i || ' days')::interval, v_now
    )
    on conflict (id) do nothing;
  end loop;

  -- ---------------------------------------------------------------------------
  -- 4. reels (15)
  -- ---------------------------------------------------------------------------
  for v_i in 1..15 loop
    insert into public.reels (
      id, user_id, video_url, thumbnail_url, caption,
      duration_seconds, view_count, created_at
    ) values (
      public._demo_uuid('e0000000', v_i),
      public._seed_pick_profile(v_profile_ids, v_i),
      v_video, v_thumb, v_feed_contents[v_i],
      30 + v_i * 2, 500 + v_i * 120,
      v_now - (v_i * 5 || ' hours')::interval
    )
    on conflict (id) do nothing;
  end loop;

  -- ---------------------------------------------------------------------------
  -- 5. comments — top-level (50)
  -- ---------------------------------------------------------------------------
  for v_i in 1..50 loop
    if v_i <= 30 then
      v_post_id := public._demo_uuid('feed0000', 1 + ((v_i - 1) % 30));
    else
      v_post_id := public._demo_uuid('recipe00', 1 + ((v_i - 31) % 20));
    end if;

    insert into public.comments (
      id, post_id, user_id, content, parent_comment_id, created_at
    ) values (
      public._demo_uuid('f0000000', v_i), v_post_id,
      public._seed_pick_profile(v_profile_ids, v_i + 3),
      case v_i % 5
        when 0 then 'Ngon quá! Sẽ thử cuối tuần này.'
        when 1 then 'Công thức rất chi tiết, cảm ơn bạn.'
        when 2 then 'Mình thay thịt bò bằng gà được không?'
        when 3 then 'Nước dùng trong veo, chuẩn vị!'
        else 'Đã lưu công thức này rồi nhé.'
      end,
      null,
      v_now - (v_i * 2 || ' hours')::interval
    )
    on conflict (id) do nothing;
  end loop;

  -- ---------------------------------------------------------------------------
  -- 6. comment replies (20)
  -- ---------------------------------------------------------------------------
  for v_i in 1..20 loop
    insert into public.comments (
      id, post_id, user_id, content, parent_comment_id, created_at
    ) values (
      public._demo_uuid('f1000000', v_i),
      (select c.post_id from public.comments c
       where c.id = public._demo_uuid('f0000000', 1 + ((v_i - 1) % 50))),
      public._seed_pick_profile(v_profile_ids, v_i + 5),
      case v_i % 4
        when 0 then 'Đúng rồi, mình cũng làm vậy!'
        when 1 then 'Cảm ơn bạn, mình sẽ thử.'
        when 2 then 'Hay quá, bookmark luôn.'
        else 'Ủng hộ nha!'
      end,
      public._demo_uuid('f0000000', 1 + ((v_i - 1) % 50)),
      v_now - (v_i || ' hours')::interval
    )
    on conflict (id) do nothing;
  end loop;

  -- ---------------------------------------------------------------------------
  -- 7. post_likes (100)
  -- ---------------------------------------------------------------------------
  for v_i in 1..100 loop
    if (1 + ((v_i - 1) % 50)) <= 30 then
      v_post_id := public._demo_uuid('feed0000', 1 + ((v_i - 1) % 30));
    else
      v_post_id := public._demo_uuid('recipe00', 1 + (((v_i - 1) % 50) - 30));
    end if;

    insert into public.post_likes (id, post_id, user_id, created_at)
    values (
      public._demo_uuid('10000000', v_i), v_post_id,
      public._seed_pick_profile(v_profile_ids, v_i + 7),
      v_now - (v_i || ' hours')::interval
    )
    on conflict (post_id, user_id) do nothing;
  end loop;

  -- ---------------------------------------------------------------------------
  -- 8. reel_likes (30)
  -- ---------------------------------------------------------------------------
  for v_i in 1..30 loop
    insert into public.reel_likes (reel_id, user_id, created_at)
    values (
      public._demo_uuid('e0000000', 1 + ((v_i - 1) % 15)),
      public._seed_pick_profile(v_profile_ids, v_i + 3),
      v_now - (v_i || ' hours')::interval
    )
    on conflict (reel_id, user_id) do nothing;
  end loop;

  -- ---------------------------------------------------------------------------
  -- 9. reel_comments (25)
  -- ---------------------------------------------------------------------------
  for v_i in 1..25 loop
    insert into public.reel_comments (
      id, reel_id, user_id, content, created_at
    ) values (
      public._demo_uuid('e1000000', v_i),
      public._demo_uuid('e0000000', 1 + ((v_i - 1) % 15)),
      public._seed_pick_profile(v_profile_ids, v_i + 2),
      case v_i % 5
        when 0 then 'Reel hay quá!'
        when 1 then 'Công thức trong reel rất hữu ích.'
        when 2 then 'Đã lưu để làm theo.'
        when 3 then 'Nhạc + món ăn = perfect.'
        else 'Follow bạn vì content nấu ăn.'
      end,
      v_now - (v_i * 3 || ' hours')::interval
    )
    on conflict (id) do nothing;
  end loop;

  -- ---------------------------------------------------------------------------
  -- 10. reel_comment replies (10)
  -- ---------------------------------------------------------------------------
  for v_i in 1..10 loop
    insert into public.reel_comments (
      id, reel_id, user_id, content, parent_id, created_at
    ) values (
      public._demo_uuid('e1100000', v_i),
      public._demo_uuid('e0000000', 1 + ((v_i - 1) % 15)),
      public._seed_pick_profile(v_profile_ids, v_i + 4),
      case v_i % 3
        when 0 then 'Chuẩn luôn!'
        when 1 then 'Mình cũng thích reel này.'
        else 'Save ngay!'
      end,
      public._demo_uuid('e1000000', 1 + ((v_i - 1) % 25)),
      v_now - (v_i * 2 || ' hours')::interval
    )
    on conflict (id) do nothing;
  end loop;

  -- ---------------------------------------------------------------------------
  -- 11. follows (30) — skip self-follow
  -- ---------------------------------------------------------------------------
  if v_n >= 2 then
    for v_i in 1..30 loop
      v_follower_id := public._seed_pick_profile(v_profile_ids, v_i);
      v_following_id := public._seed_pick_profile(v_profile_ids, v_i + 1);
      if v_follower_id <> v_following_id then
        insert into public.follows (id, follower_id, following_id, created_at)
        values (
          public._demo_uuid('20000000', v_i),
          v_follower_id, v_following_id,
          v_now - (v_i || ' days')::interval
        )
        on conflict (follower_id, following_id) do nothing;
      end if;
    end loop;
  end if;

  -- ---------------------------------------------------------------------------
  -- 12. friend_requests (20) — skip sender = receiver
  -- ---------------------------------------------------------------------------
  if v_n >= 2 then
    for v_i in 1..20 loop
      v_sender_id := public._seed_pick_profile(v_profile_ids, v_i);
      v_receiver_id := public._seed_pick_profile(v_profile_ids, v_i + 1);
      if v_sender_id <> v_receiver_id then
        insert into public.friend_requests (
          id, sender_id, receiver_id, status, created_at, updated_at
        ) values (
          public._demo_uuid('30000000', v_i),
          v_sender_id, v_receiver_id,
          case v_i % 4
            when 0 then 'accepted'
            when 2 then 'rejected'
            else 'pending'
          end,
          v_now - (v_i || ' days')::interval, v_now
        )
        on conflict (sender_id, receiver_id) do nothing;
      end if;
    end loop;
  end if;

  -- ---------------------------------------------------------------------------
  -- 13. saved_posts + saved_recipes (optional tables)
  -- ---------------------------------------------------------------------------
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'saved_posts'
  ) then
    for v_i in 1..least(10, 30) loop
      insert into public.saved_posts (id, user_id, post_id, collection_name, created_at)
      values (
        public._demo_uuid('40000000', v_i),
        public._seed_pick_profile(v_profile_ids, v_i),
        public._demo_uuid('feed0000', 1 + ((v_i - 1) % 30)),
        'default',
        v_now - (v_i || ' days')::interval
      )
      on conflict (user_id, post_id) do nothing;
    end loop;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'saved_recipes'
  ) then
    for v_i in 1..least(10, 20) loop
      insert into public.saved_recipes (id, user_id, post_id, created_at)
      values (
        public._demo_uuid('50000000', v_i),
        public._seed_pick_profile(v_profile_ids, v_i),
        public._demo_uuid('recipe00', v_i),
        v_now - (v_i || ' days')::interval
      )
      on conflict (user_id, post_id) do nothing;
    end loop;
  end if;

  -- ---------------------------------------------------------------------------
  -- 14. notifications (20)
  -- ---------------------------------------------------------------------------
  for v_i in 1..20 loop
    insert into public.notifications (
      id, receiver_id, sender_id, type, title, description,
      post_id, group_id, comment_id, is_read, created_at
    ) values (
      public._demo_uuid('60000000', v_i),
      public._seed_pick_profile(v_profile_ids, v_i),
      public._seed_pick_profile(v_profile_ids, v_i + 1),
      case v_i % 5
        when 0 then 'like'
        when 1 then 'comment'
        when 2 then 'follow'
        when 3 then 'group'
        else 'system'
      end,
      case v_i % 5
        when 0 then 'Ai đó đã thích bài viết của bạn'
        when 1 then 'Bình luận mới trên bài viết'
        when 2 then 'Người theo dõi mới'
        when 3 then 'Thành viên mới trong nhóm'
        else 'Chào mừng đến SnapChef!'
      end,
      'Nhấn để xem chi tiết',
      case when v_i % 2 = 0 then public._demo_uuid('feed0000', 1 + (v_i % 30)) else null end,
      case when v_i % 3 = 0 then public._demo_uuid('d0000000', 1 + (v_i % 10)) else null end,
      case when v_i % 4 = 0 then public._demo_uuid('f0000000', 1 + (v_i % 50)) else null end,
      v_i % 3 = 0,
      v_now - (v_i || ' hours')::interval
    )
    on conflict (id) do nothing;
  end loop;

  -- ---------------------------------------------------------------------------
  -- 15. Reconcile denormalized counts
  -- ---------------------------------------------------------------------------
  update public.profiles p
  set posts_count = sub.cnt
  from (
    select author_id, count(*)::int as cnt
    from public.posts
    group by author_id
  ) sub
  where p.id = sub.author_id;

  update public.groups g
  set
    members_count = coalesce(m.cnt, 0),
    posts_count = coalesce(po.cnt, 0)
  from public.groups g2
  left join (
    select group_id, count(*)::int as cnt
    from public.group_members
    group by group_id
  ) m on m.group_id = g2.id
  left join (
    select group_id, count(*)::int as cnt
    from public.posts
    where group_id is not null
    group by group_id
  ) po on po.group_id = g2.id
  where g.id = g2.id
    and g.id in (select public._demo_uuid('d0000000', i) from generate_series(1, 10) i);

  update public.posts p
  set like_count = coalesce(l.cnt, 0)
  from (
    select post_id, count(*)::int as cnt
    from public.post_likes
    group by post_id
  ) l
  where p.id = l.post_id;

  update public.posts p
  set comment_count = coalesce(c.cnt, 0)
  from (
    select post_id, count(*)::int as cnt
    from public.comments
    where deleted_at is null
    group by post_id
  ) c
  where p.id = c.post_id;

  raise notice 'SnapChef dev seed completed successfully (% profiles).', v_n;
end;
$$;

select public.seed_snapchef_dev_data();
