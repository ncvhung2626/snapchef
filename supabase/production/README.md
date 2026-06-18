# Supabase Production Migrations

Chạy **theo thứ tự** trong SQL Editor (sau khi đã chạy `schema.sql` + sprint2–9).

| # | File | Mục đích |
|---|------|----------|
| 1 | `01_alter_profiles_posts.sql` | Audit fields, soft delete, username |
| 2 | `02_new_tables.sql` | hashtags, reels, reports, meal_plans, … |
| 3 | `03_indexes.sql` | Composite indexes hiệu năng |
| 4 | `04_rls.sql` | RLS thống nhất (idempotent policies) |
| 5 | `05_storage.sql` | Buckets + policies |
| 6 | `06_triggers.sql` | Notifications, hashtag extract |

**Lưu ý:** `saved_recipes` (sprint9) được giữ; thêm `saved_posts` cho spec production. App có thể migrate dần.

Sau production, chạy tiếp:

| File | Mục đích |
|------|----------|
| `../sprint10_friend_requests.sql` | Lời mời kết bạn |
| `../sprint11_group_admin_rls.sql` | Admin nhóm xóa bài/thành viên |
| `../sprint12_private_groups.sql` | RLS nhóm riêng tư + quyền thành viên |
| `../sprint13_chat_enhancements.sql` | Read receipts, group chat, typing |
