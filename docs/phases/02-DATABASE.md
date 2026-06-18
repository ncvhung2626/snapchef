# Phase 2 — Database Design (production)

## Cách chạy

1. Đã có: `supabase/schema.sql`, `sprint2` … `sprint9`
2. Chạy tiếp: `supabase/production/01` → `06` (xem `supabase/production/README.md`)

## Soft delete

| Bảng | Cột | Query feed |
|------|-----|------------|
| profiles | `deleted_at` | ẩn profile banned/deleted |
| posts | `deleted_at` | `where deleted_at is null` |
| comments | `deleted_at` | không hiện, giữ FK |
| reels | `deleted_at` | tương tự posts |

**Không** hard delete post có comments — `update deleted_at = now()`.

## Audit fields

- `created_at`, `updated_at` — trigger `set_updated_at()`
- `admin_logs` — hành động moderator/admin

## Quan hệ chính

```
profiles ─┬─ posts ─┬─ post_likes
          │         ├─ comments
          │         └─ post_hashtags ─ hashtags
          ├─ follows (follower_id, following_id)
          ├─ saved_posts
          ├─ reels ─ reel_likes, reel_comments
          ├─ meal_plans, user_preferences
          └─ reports (polymorphic target_type + target_id)
```

## Hiệu năng

- Feed: index `posts_feed_idx` (created_at desc, partial deleted_at)
- Notifications inbox: `notifications_user_read_idx`
- Chat: `messages_conversation_idx`

## Bảng sprint9 vs production

- `saved_recipes` — app hiện tại; migrate sang `saved_posts` khi refactor `recipeService`.
- Cột recipe trên `posts` (title, ingredients, …) — giữ nguyên sprint9.
