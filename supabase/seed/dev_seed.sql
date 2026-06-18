-- SnapChef Development Seed Data
-- Chạy trong Supabase SQL Editor SAU KHI đã có ít nhất 1 user đăng ký qua app.
-- Script gán dữ liệu demo cho profiles hiện có và tạo posts/groups/reels mẫu.

-- 1. Cập nhật profiles (tối đa 15 user đầu tiên)
with numbered as (
  select id, row_number() over (order by created_at) as rn
  from public.profiles
  limit 15
),
demo as (
  select * from (values
    (1, 'Lan Nguyễn', 'Đầu bếp gia đình | Món Việt mỗi ngày', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'),
    (2, 'Minh Trần', 'Food blogger Sài Gòn', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'),
    (3, 'Hương Lê', 'Eat clean & meal prep', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200'),
    (4, 'Đức Phạm', 'Nghiện phở & cà phê sáng', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200'),
    (5, 'Thảo Võ', 'Công thức nhanh cho người bận', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200'),
    (6, 'Quỳnh Đặng', 'Bánh ngọt homemade', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'),
    (7, 'Hải Huỳnh', 'Ẩm thực Huế', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200'),
    (8, 'Anh Bùi', 'BBQ & grill master', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200'),
    (9, 'Chi Ngô', 'Trà sữa & dessert', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200'),
    (10, 'Bảo Đinh', 'Vegan-friendly', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200'),
    (11, 'SnapChef Admin', 'Quản trị cộng đồng', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200'),
    (12, 'Mod Kiểm Duyệt', 'Kiểm duyệt nội dung', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200'),
    (13, 'Photo Foodie', 'Nhiếp ảnh món ăn', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200'),
    (14, 'Travel Eats', 'Du lịch ẩm thực', 'https://images.unsplash.com/photo-1599566150163-291fa0b0d631?w=200'),
    (15, 'Fish VAA', 'Học viên VAA', 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200')
  ) as t(rn, fullname, bio, avatar)
)
update public.profiles p
set
  fullname = d.fullname,
  bio = d.bio,
  avatar = d.avatar,
  username = lower(replace(d.fullname, ' ', ''))
from numbered n
join demo d on d.rn = n.rn
where p.id = n.id;

-- 2. Seed posts mẫu (15 feed + 15 recipe) — bỏ qua nếu đã có > 20 posts demo
do $$
declare
  author_ids uuid[];
  aid uuid;
  i int;
  feed_contents text[] := array[
    'Phở bò Hà Nội nóng hổi — nước dùng ninh 6 tiếng #phobo',
    'Bún bò Huế chuẩn vị cố đô #bunbo #hue',
    'Bánh mì chảo Sài Gòn đường phố #banhmichao',
    'Gà nướng mật ong da giòn #chicken #honey',
    'Cơm tấm sườn bì chả cuối tuần #comtam',
    'Trà sữa trân châu homemade #trasua',
    'Bánh flan caramel mềm tan #flan #dessert',
    'Salad ức gà eat clean #eatclean',
    'Pasta carbonara kiểu Việt #pasta',
    'Lẩu thái cuối tuần #lauthai',
    'Bánh xèo miền Tây #banhxeo',
    'Cháo lòng sáng sớm #chaolong',
    'Gỏi cuốn tôm thịt #goicuon',
    'Bún chả Hà Nội #buncha',
    'Cà phê sữa đá sáng quốc dân #caphe'
  ];
  recipe_titles text[] := array[
    'Phở bò Hà Nội','Bún bò Huế','Bánh mì chảo','Gà nướng mật ong','Cơm tấm sườn',
    'Trà sữa homemade','Bánh flan','Gỏi cuốn','Bún chả','Salad ức gà',
    'Lẩu thái','Bánh xèo','Pasta carbonara','Cháo lòng','Cà phê sữa đá'
  ];
begin
  if (select count(*) from public.posts) > 20 then
    return;
  end if;

  select array_agg(id order by created_at) into author_ids
  from (select id, created_at from public.profiles limit 10) s;

  if author_ids is null or array_length(author_ids, 1) < 1 then
    raise notice 'Chưa có profile — đăng ký ít nhất 1 tài khoản trước khi seed.';
    return;
  end if;

  for i in 1..15 loop
    aid := author_ids[1 + ((i - 1) % array_length(author_ids, 1))];
    insert into public.posts (author_id, content, images, visibility, created_at)
    values (
      aid,
      feed_contents[i],
      array['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'],
      'public',
      now() - (i || ' hours')::interval
    );
  end loop;

  for i in 1..15 loop
    aid := author_ids[1 + ((i - 1) % array_length(author_ids, 1))];
    insert into public.posts (author_id, title, content, images, visibility, category, cook_time_minutes, ingredients, steps, created_at)
    values (
      aid,
      recipe_titles[i],
      'Công thức chi tiết ' || recipe_titles[i],
      array['https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800'],
      'public',
      'vietnamese',
      30 + i * 5,
      array['Nguyên liệu 1', 'Nguyên liệu 2'],
      array['Bước 1', 'Bước 2'],
      now() - (i || ' days')::interval
    );
  end loop;
end $$;

-- 3. Seed groups (10 nhóm)
insert into public.groups (name, description, cover_image, owner_id, privacy)
select g.name, g.description, g.cover, p.id, 'public'
from (values
  ('Phở & Bún — Món Việt', 'Chia sẻ công thức phở, bún từ Bắc vào Nam', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800'),
  ('Eat Clean Việt Nam', 'Meal prep, salad, low-carb', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'),
  ('Bánh Ngọt Homemade', 'Flan, bánh bông lan, cookie', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800'),
  ('BBQ & Grill Masters', 'Gà nướng, sườn BBQ', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800'),
  ('Trà Sữa & Dessert', 'Công thức trà sữa DIY', 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800'),
  ('Ẩm Thực Huế', 'Bún bò, cơm hến, nem lụi', 'https://images.unsplash.com/photo-1555126634-323283e090f2?w=800'),
  ('Street Food Sài Gòn', 'Bánh mì, hủ tiếu đường phố', 'https://images.unsplash.com/photo-1569058242567-93de6f492f5c?w=800'),
  ('Meal Prep Chủ Nhật', 'Chuẩn bị bữa ăn cả tuần', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800'),
  ('Vegan Việt', 'Món chay fusion', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800'),
  ('SnapChef Cộng Đồng', 'Nhóm chính thức SnapChef', 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800')
) as g(name, description, cover)
cross join lateral (select id from public.profiles order by created_at limit 1) p
where not exists (select 1 from public.groups where name = g.name);

-- 4. Seed reels (15) — cần bảng reels từ production/02
insert into public.reels (user_id, video_url, thumbnail_url, caption, view_count, created_at)
select
  p.id,
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://images.unsplash.com/photo-1591814468924-caf87d1282aa?w=600',
  c.caption,
  500 + c.i * 100,
  now() - (c.i || ' hours')::interval
from generate_series(1, 15) as c(i)
cross join lateral (
  select id from public.profiles order by created_at offset (c.i % 10) limit 1
) p
cross join lateral (select caption from (values
  (1, 'Phở bò Hà Nội #phobo #foodie'),
  (2, 'Bún bò Huế cay nồng #bunbo'),
  (3, 'Bánh mì chảo SG #banhmichao'),
  (4, 'Gà mật ong #chicken'),
  (5, 'Cơm tấm đầy đủ #comtam'),
  (6, 'Trà sữa homemade #trasua'),
  (7, 'Bánh flan #flan'),
  (8, 'Salad eat clean #healthy'),
  (9, 'Lẩu thái #hotpot'),
  (10, 'Bánh xèo #banhxeo'),
  (11, 'Gỏi cuốn #fresh'),
  (12, 'Bún chả #buncha'),
  (13, 'Pasta #italian'),
  (14, 'Cháo lòng #breakfast'),
  (15, 'Cà phê sữa đá #caphe')
) as t(i, caption) where t.i = c.i) cap(caption)
where exists (select 1 from information_schema.tables where table_name = 'reels')
  and (select count(*) from public.reels) < 5;
