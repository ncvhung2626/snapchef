# SnapChef — Schema Audit

**Live Supabase instance (verified via `information_schema.columns`)** — authoritative for seed script.  
Migration files in repo may differ; see § Divergence notes at bottom.

**App code:** `commentService.ts` uses `parent_comment_id` on `comments` (not `parent_id`).

---

## profiles

| COLUMN | TYPE | NULL |
|--------|------|------|
| id | uuid | NO |
| fullname | text | NO |
| email | text | YES |
| avatar | text | YES |
| bio | text | YES |
| role | text | NO |
| created_at | timestamptz | NO |
| updated_at | timestamptz | NO |
| posts_count | integer | NO |
| username | text | YES |
| deleted_at | timestamptz | YES |
| last_seen_at | timestamptz | YES |
| is_banned | boolean | NO |

---

## posts

| COLUMN | TYPE | NULL |
|--------|------|------|
| id | uuid | NO |
| author_id | uuid | NO |
| content | text | NO |
| images | ARRAY | NO |
| videos | ARRAY | NO |
| visibility | text | NO |
| group_id | uuid | YES |
| created_at | timestamptz | NO |
| updated_at | timestamptz | NO |
| title | text | YES |
| category | text | NO |
| ingredients | jsonb | NO |
| steps | jsonb | NO |
| cook_time_minutes | integer | YES |
| deleted_at | timestamptz | YES |
| like_count | integer | NO |
| comment_count | integer | NO |
| share_count | integer | NO |

---

## comments

| COLUMN | TYPE | NULL |
|--------|------|------|
| id | uuid | NO |
| post_id | uuid | NO |
| user_id | uuid | NO |
| content | text | NO |
| parent_comment_id | uuid | YES |
| created_at | timestamptz | NO |
| parent_id | uuid | YES |
| deleted_at | timestamptz | YES |
| updated_at | timestamptz | YES |

---

## reels

| COLUMN | TYPE | NULL |
|--------|------|------|
| id | uuid | NO |
| user_id | uuid | NO |
| video_url | text | NO |
| thumbnail_url | text | YES |
| caption | text | YES |
| duration_seconds | integer | YES |
| view_count | integer | NO |
| deleted_at | timestamptz | YES |
| created_at | timestamptz | NO |

**Live DB: no `updated_at` on `reels`.**

---

## reel_likes

| COLUMN | TYPE | NULL |
|--------|------|------|
| reel_id | uuid | NO |
| user_id | uuid | NO |
| created_at | timestamptz | NO |

Composite PK `(reel_id, user_id)`. No `id` column.

---

## reel_comments

| COLUMN | TYPE | NULL |
|--------|------|------|
| id | uuid | NO |
| reel_id | uuid | NO |
| user_id | uuid | NO |
| content | text | NO |
| parent_id | uuid | YES |
| deleted_at | timestamptz | YES |
| created_at | timestamptz | NO |

---

## groups

| COLUMN | TYPE | NULL |
|--------|------|------|
| id | uuid | NO |
| name | text | NO |
| description | text | NO |
| cover_image | text | YES |
| avatar_url | text | YES |
| owner_id | uuid | NO |
| privacy | text | NO |
| members_count | integer | NO |
| posts_count | integer | NO |
| created_at | timestamptz | NO |
| updated_at | timestamptz | NO |

---

## group_members

| COLUMN | TYPE | NULL |
|--------|------|------|
| id | uuid | NO |
| group_id | uuid | NO |
| user_id | uuid | NO |
| role | text | NO |
| joined_at | timestamptz | NO |

UNIQUE `(group_id, user_id)`.

---

## notifications

| COLUMN | TYPE | NULL |
|--------|------|------|
| id | uuid | NO |
| receiver_id | uuid | NO |
| sender_id | uuid | YES |
| type | text | NO |
| title | text | NO |
| description | text | NO |
| post_id | uuid | YES |
| group_id | uuid | YES |
| comment_id | uuid | YES |
| is_read | boolean | NO |
| created_at | timestamptz | NO |

---

## friend_requests

| COLUMN | TYPE | NULL |
|--------|------|------|
| id | uuid | NO |
| sender_id | uuid | NO |
| receiver_id | uuid | NO |
| status | text | NO |
| created_at | timestamptz | NO |
| updated_at | timestamptz | NO |

UNIQUE `(sender_id, receiver_id)`.

---

## follows

| COLUMN | TYPE | NULL |
|--------|------|------|
| id | uuid | NO |
| follower_id | uuid | NO |
| following_id | uuid | NO |
| created_at | timestamptz | NO |

UNIQUE `(follower_id, following_id)`. CHECK `follower_id <> following_id`.

---

## post_likes (seed helper table)

| COLUMN | TYPE | NULL |
|--------|------|------|
| id | uuid | NO |
| post_id | uuid | NO |
| user_id | uuid | NO |
| created_at | timestamptz | NO |

UNIQUE `(post_id, user_id)`.

---

## saved_posts / saved_recipes

**Not present on live instance** (not returned by schema query). Seed skips these tables if missing.

---

## Divergence vs repo migrations

| Item | Repo SQL | Live DB |
|------|----------|---------|
| `posts.like_count`, `comment_count`, `share_count` | Not in migration files | **Present**, NOT NULL |
| `reels.updated_at` | production/02 | **Absent** |
| `saved_posts`, `saved_recipes` | production/02, sprint9 | **Not on instance** |
