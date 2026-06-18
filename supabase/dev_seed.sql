-- =============================================================================
-- SnapChef — Development seed (schema-validated)
-- Schema audit: supabase/SCHEMA_AUDIT.md
--
-- Prerequisite: schema.sql → sprint2–13 → production/01–06 (full stack).
-- Run in Supabase SQL Editor (postgres / service role bypasses RLS).
--
-- Demo login: demo1@snapchef.app … demo15@snapchef.app
-- Password (all): Demo@12345
--
-- Idempotent: fixed UUIDs + ON CONFLICT DO NOTHING / DO UPDATE.
-- Only columns documented in SCHEMA_AUDIT.md are referenced.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

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

create or replace function public.seed_snapchef_dev_data()
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_instance_id uuid;
  v_now timestamptz := now();
  v_i int;
  v_user_id uuid;
  v_post_id uuid;
  v_group_id uuid;
  v_owner_id uuid;
  v_follower_id uuid;
  v_following_id uuid;
  v_sender_id uuid;
  v_receiver_id uuid;
  v_pwd text;
  v_names text[] := array[
    'Lan Nguyễn', 'Minh Trần', 'Hương Lê', 'Đức Phạm', 'Thảo Võ',
    'Quỳnh Đặng', 'Hải Huỳnh', 'Anh Bùi', 'Chi Ngô', 'Bảo Đinh',
    'SnapChef Admin', 'Mod Kiểm Duyệt', 'Photo Foodie', 'Travel Eats', 'Fish VAA'
  ];
  v_bios text[] := array[
    'Đầu bếp gia đình | Món Việt mỗi ngày',
    'Food blogger Sài Gòn | Street food',
    'Eat clean & meal prep',
    'Nghiện phở & cà phê sáng',
    'Công thức nhanh cho người bận',
    'Bánh ngọt homemade',
    'Ẩm thực Huế',
    'BBQ & grill master',
    'Trà sữa & dessert',
    'Vegan-friendly recipes',
    'Quản trị SnapChef',
    'Kiểm duyệt nội dung',
    'Nhiếp ảnh món ăn',
    'Du lịch ẩm thực ĐNÁ',
    'Học viên VAA'
  ];
  v_avatars text[] := array[
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200',
    'https://images.unsplash.com/photo-1599566150163-291fa0b0d631?w=200',
    'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200'
  ];
  v_roles text[] := array[
    'user','user','user','user','user',
    'user','user','user','user','user',
    'admin','moderator','user','user','user'
  ];
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
  select coalesce(
    (select id from auth.instances limit 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  ) into v_instance_id;

  v_pwd := extensions.crypt('Demo@12345', extensions.gen_salt('bf'));

  -- ---------------------------------------------------------------------------
  -- 1. auth.users + auth.identities + profiles
  -- profiles columns: id, fullname, email, avatar, bio, role, username,
  --                  created_at, updated_at
  -- ---------------------------------------------------------------------------
  for v_i in 1..15 loop
    v_user_id := public._demo_uuid('a0000000', v_i);

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      v_instance_id, v_user_id, 'authenticated', 'authenticated',
      'demo' || v_i || '@snapchef.app', v_pwd, v_now,
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('fullname', v_names[v_i]),
      v_now, v_now, '', '', '', ''
    )
    on conflict (id) do update set
      email = excluded.email,
      encrypted_password = excluded.encrypted_password,
      raw_user_meta_data = excluded.raw_user_meta_data,
      updated_at = v_now;

    insert into auth.identities (
      id, provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      v_user_id, v_user_id::text, v_user_id,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', 'demo' || v_i || '@snapchef.app',
        'email_verified', true,
        'phone_verified', false
      ),
      'email', v_now, v_now, v_now
    )
    on conflict (id) do nothing;

    insert into public.profiles (
      id, fullname, email, avatar, bio, role, username, created_at, updated_at
    ) values (
      v_user_id, v_names[v_i], 'demo' || v_i || '@snapchef.app',
      v_avatars[v_i], v_bios[v_i], v_roles[v_i], 'demo_user_' || v_i,
      v_now - (v_i || ' days')::interval, v_now
    )
    on conflict (id) do update set
      fullname = excluded.fullname,
      avatar = excluded.avatar,
      bio = excluded.bio,
      role = excluded.role,
      username = excluded.username,
      updated_at = v_now;
  end loop;

  -- ---------------------------------------------------------------------------
  -- 2. groups + group_members
  -- ---------------------------------------------------------------------------
  for v_i in 1..10 loop
    v_group_id := public._demo_uuid('d0000000', v_i);
    v_owner_id := public._demo_uuid('a0000000', 1 + ((v_i - 1) % 15));

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
      public._demo_uuid('a0000000', 1 + (v_i % 15)), 'member',
      v_now - (v_i || ' days')::interval
    )
    on conflict (group_id, user_id) do nothing;

    insert into public.group_members (id, group_id, user_id, role, joined_at)
    values (
      public._demo_uuid('db000000', v_i * 10 + 2), v_group_id,
      public._demo_uuid('a0000000', 1 + ((v_i + 5) % 15)),
      case when v_i % 3 = 0 then 'admin' else 'member' end,
      v_now - ((v_i + 1) || ' days')::interval
    )
    on conflict (group_id, user_id) do nothing;
  end loop;

  -- ---------------------------------------------------------------------------
  -- 3. feed posts (30)
  -- ---------------------------------------------------------------------------
  for v_i in 1..30 loop
    v_user_id := public._demo_uuid('a0000000', 1 + ((v_i - 1) % 15));
    v_group_id := case
      when v_i % 5 = 0 then public._demo_uuid('d0000000', 1 + ((v_i / 5) % 10))
      else null
    end;

    insert into public.posts (
      id, author_id, content, images, videos, visibility, group_id,
      title, category, ingredients, steps, cook_time_minutes,
      created_at, updated_at
    ) values (
      public._demo_uuid('b0000000', v_i), v_user_id, v_feed_contents[v_i],
      array[v_img]::text[], '{}'::text[],
      case when v_group_id is not null then 'group' else 'public' end,
      v_group_id, null, 'general', '[]'::jsonb, '[]'::jsonb, null,
      v_now - (v_i * 3 || ' hours')::interval, v_now
    )
    on conflict (id) do nothing;
  end loop;

  -- ---------------------------------------------------------------------------
  -- 4. recipe posts (20)
  -- ---------------------------------------------------------------------------
  for v_i in 1..20 loop
    v_user_id := public._demo_uuid('a0000000', 1 + ((v_i + 2) % 15));

    insert into public.posts (
      id, author_id, content, images, videos, visibility, group_id,
      title, category, ingredients, steps, cook_time_minutes,
      created_at, updated_at
    ) values (
      public._demo_uuid('c0000000', v_i), v_user_id,
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
      v_now - (v_i || ' days')::interval, v_now
    )
    on conflict (id) do nothing;
  end loop;

  -- ---------------------------------------------------------------------------
  -- 5. reels
  -- ---------------------------------------------------------------------------
  for v_i in 1..15 loop
    insert into public.reels (
      id, user_id, video_url, thumbnail_url, caption,
      duration_seconds, view_count, created_at, updated_at
    ) values (
      public._demo_uuid('e0000000', v_i),
      public._demo_uuid('a0000000', 1 + ((v_i - 1) % 15)),
      v_video, v_thumb, v_feed_contents[v_i],
      30 + v_i * 2, 500 + v_i * 120,
      v_now - (v_i * 5 || ' hours')::interval, v_now
    )
    on conflict (id) do nothing;
  end loop;

  -- ---------------------------------------------------------------------------
  -- 6. comments (50 top-level) — uses parent_comment_id (app column)
  -- ---------------------------------------------------------------------------
  for v_i in 1..50 loop
    if v_i <= 30 then
      v_post_id := public._demo_uuid('b0000000', 1 + ((v_i - 1) % 30));
    else
      v_post_id := public._demo_uuid('c0000000', 1 + ((v_i - 31) % 20));
    end if;

    insert into public.comments (
      id, post_id, user_id, content, parent_comment_id, created_at
    ) values (
      public._demo_uuid('f0000000', v_i), v_post_id,
      public._demo_uuid('a0000000', 1 + ((v_i + 3) % 15)),
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
  -- 7. comment replies (20) — parent_comment_id only
  -- ---------------------------------------------------------------------------
  for v_i in 1..20 loop
    insert into public.comments (
      id, post_id, user_id, content, parent_comment_id, created_at
    ) values (
      public._demo_uuid('f1000000', v_i),
      (select c.post_id from public.comments c
       where c.id = public._demo_uuid('f0000000', 1 + ((v_i - 1) % 50))),
      public._demo_uuid('a0000000', 1 + ((v_i + 5) % 15)),
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
  -- 8. post_likes (100)
  -- ---------------------------------------------------------------------------
  for v_i in 1..100 loop
    if (1 + ((v_i - 1) % 50)) <= 30 then
      v_post_id := public._demo_uuid('b0000000', 1 + ((v_i - 1) % 30));
    else
      v_post_id := public._demo_uuid('c0000000', 1 + (((v_i - 1) % 50) - 30));
    end if;

    insert into public.post_likes (id, post_id, user_id, created_at)
    values (
      public._demo_uuid('10000000', v_i), v_post_id,
      public._demo_uuid('a0000000', 1 + ((v_i + 7) % 15)),
      v_now - (v_i || ' hours')::interval
    )
    on conflict (post_id, user_id) do nothing;
  end loop;

  -- ---------------------------------------------------------------------------
  -- 9. reel_likes (30) — composite PK (reel_id, user_id), no id column
  -- ---------------------------------------------------------------------------
  for v_i in 1..30 loop
    insert into public.reel_likes (reel_id, user_id, created_at)
    values (
      public._demo_uuid('e0000000', 1 + ((v_i - 1) % 15)),
      public._demo_uuid('a0000000', 1 + ((v_i + 3) % 15)),
      v_now - (v_i || ' hours')::interval
    )
    on conflict (reel_id, user_id) do nothing;
  end loop;

  -- ---------------------------------------------------------------------------
  -- 10. reel_comments (25 top-level) — no updated_at column
  -- ---------------------------------------------------------------------------
  for v_i in 1..25 loop
    insert into public.reel_comments (
      id, reel_id, user_id, content, created_at
    ) values (
      public._demo_uuid('e1000000', v_i),
      public._demo_uuid('e0000000', 1 + ((v_i - 1) % 15)),
      public._demo_uuid('a0000000', 1 + ((v_i + 2) % 15)),
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
  -- 11. reel_comment replies (10) — uses parent_id on reel_comments
  -- ---------------------------------------------------------------------------
  for v_i in 1..10 loop
    insert into public.reel_comments (
      id, reel_id, user_id, content, parent_id, created_at
    ) values (
      public._demo_uuid('e1100000', v_i),
      public._demo_uuid('e0000000', 1 + ((v_i - 1) % 15)),
      public._demo_uuid('a0000000', 1 + ((v_i + 4) % 15)),
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
  -- 12. follows (30) — skip self-follow (check constraint)
  -- ---------------------------------------------------------------------------
  for v_i in 1..30 loop
    v_follower_id := public._demo_uuid('a0000000', 1 + ((v_i - 1) % 15));
    v_following_id := public._demo_uuid('a0000000', 1 + (v_i % 15));
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

  -- ---------------------------------------------------------------------------
  -- 13. friend_requests (20) — skip sender = receiver
  -- ---------------------------------------------------------------------------
  for v_i in 1..20 loop
    v_sender_id := public._demo_uuid('a0000000', v_i);
    v_receiver_id := public._demo_uuid('a0000000', 1 + (v_i % 15));
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

  -- ---------------------------------------------------------------------------
  -- 14. saved_posts + saved_recipes
  -- ---------------------------------------------------------------------------
  for v_i in 1..10 loop
    insert into public.saved_posts (id, user_id, post_id, collection_name, created_at)
    values (
      public._demo_uuid('40000000', v_i),
      public._demo_uuid('a0000000', v_i),
      public._demo_uuid('b0000000', v_i),
      'default',
      v_now - (v_i || ' days')::interval
    )
    on conflict (user_id, post_id) do nothing;

    insert into public.saved_recipes (id, user_id, post_id, created_at)
    values (
      public._demo_uuid('50000000', v_i),
      public._demo_uuid('a0000000', 1 + (v_i % 15)),
      public._demo_uuid('c0000000', v_i),
      v_now - (v_i || ' days')::interval
    )
    on conflict (user_id, post_id) do nothing;
  end loop;

  -- ---------------------------------------------------------------------------
  -- 15. notifications — no updated_at column
  -- ---------------------------------------------------------------------------
  for v_i in 1..20 loop
    insert into public.notifications (
      id, receiver_id, sender_id, type, title, description,
      post_id, group_id, comment_id, is_read, created_at
    ) values (
      public._demo_uuid('60000000', v_i),
      public._demo_uuid('a0000000', v_i),
      public._demo_uuid('a0000000', 1 + (v_i % 15)),
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
      case when v_i % 2 = 0 then public._demo_uuid('b0000000', 1 + (v_i % 30)) else null end,
      case when v_i % 3 = 0 then public._demo_uuid('d0000000', 1 + (v_i % 10)) else null end,
      case when v_i % 4 = 0 then public._demo_uuid('f0000000', 1 + (v_i % 50)) else null end,
      v_i % 3 = 0,
      v_now - (v_i || ' hours')::interval
    )
    on conflict (id) do nothing;
  end loop;

  -- ---------------------------------------------------------------------------
  -- 16. Reconcile denormalized counts (no optional-column filters)
  -- ---------------------------------------------------------------------------
  update public.profiles p
  set posts_count = sub.cnt
  from (
    select author_id, count(*)::int as cnt
    from public.posts
    where author_id in (
      select public._demo_uuid('a0000000', i) from generate_series(1, 15) i
    )
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

  raise notice 'SnapChef dev seed completed successfully.';
end;
$$;

select public.seed_snapchef_dev_data();
