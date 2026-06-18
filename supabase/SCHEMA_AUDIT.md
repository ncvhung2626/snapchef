# SnapChef — Schema Audit (from project SQL only)

**Sources (run order):**  
`schema.sql` → `sprint2_profile.sql` → `sprint3_posts.sql` → `sprint4_comments.sql` → `sprint5_groups.sql` → `sprint6_notifications.sql` → `sprint9_recipes.sql` → `sprint10_friend_requests.sql` → `sprint11_group_admin_rls.sql` → `sprint12_private_groups.sql` → `production/01_alter_profiles_posts.sql` → `production/02_new_tables.sql`

**Not audited here:** `auth.users`, `auth.identities` (Supabase Auth; version-dependent). Seed uses minimal documented columns.

**App code note:** `commentService.ts` reads/writes `parent_comment_id` on `comments` (not `parent_id`). Both columns exist after `production/01`.

---

## profiles

| COLUMN | TYPE | NULL | DEFAULT / NOTES |
|--------|------|------|-----------------|
| id | uuid | NO | PK, FK → auth.users(id) |
| fullname | text | NO | |
| email | text | YES | |
| avatar | text | YES | '' |
| bio | text | YES | '' |
| role | text | NO | 'user', CHECK user/moderator/admin |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |
| posts_count | int | NO | 0 (sprint2) |
| username | text | YES | production/01 |
| deleted_at | timestamptz | YES | production/01 |
| last_seen_at | timestamptz | YES | production/01 |
| is_banned | boolean | NO | false (production/01) |

---

## posts

| COLUMN | TYPE | NULL | DEFAULT / NOTES |
|--------|------|------|-----------------|
| id | uuid | NO | PK |
| author_id | uuid | NO | FK → profiles(id) |
| content | text | NO | |
| images | text[] | NO | '{}' |
| videos | text[] | NO | '{}' |
| visibility | text | NO | 'public'; CHECK public/friends/group (sprint3) |
| group_id | uuid | YES | FK → groups(id) |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |
| title | text | YES | sprint9 |
| category | text | NO | 'general' (sprint9) |
| ingredients | jsonb | NO | '[]' (sprint9) |
| steps | jsonb | NO | '[]' (sprint9) |
| cook_time_minutes | int | YES | sprint9 |
| deleted_at | timestamptz | YES | production/01 |

---

## comments

| COLUMN | TYPE | NULL | DEFAULT / NOTES |
|--------|------|------|-----------------|
| id | uuid | NO | PK |
| post_id | uuid | NO | FK → posts(id) |
| user_id | uuid | NO | FK → profiles(id) |
| content | text | NO | |
| parent_comment_id | uuid | YES | FK → comments(id) (sprint3) |
| created_at | timestamptz | NO | now() |
| parent_id | uuid | YES | FK → comments(id) (production/01) |
| deleted_at | timestamptz | YES | production/01 |
| updated_at | timestamptz | YES | now() (production/01) |

---

## reels

| COLUMN | TYPE | NULL | DEFAULT / NOTES |
|--------|------|------|-----------------|
| id | uuid | NO | PK |
| user_id | uuid | NO | FK → profiles(id) |
| video_url | text | NO | |
| thumbnail_url | text | YES | |
| caption | text | YES | '' |
| duration_seconds | int | YES | |
| view_count | int | NO | 0 |
| deleted_at | timestamptz | YES | |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

---

## reel_likes

| COLUMN | TYPE | NULL | DEFAULT / NOTES |
|--------|------|------|-----------------|
| reel_id | uuid | NO | PK (composite) |
| user_id | uuid | NO | PK (composite) |
| created_at | timestamptz | NO | now() |

**No `id` column.**

---

## reel_comments

| COLUMN | TYPE | NULL | DEFAULT / NOTES |
|--------|------|------|-----------------|
| id | uuid | NO | PK |
| reel_id | uuid | NO | FK → reels(id) |
| user_id | uuid | NO | FK → profiles(id) |
| content | text | NO | |
| parent_id | uuid | YES | FK → reel_comments(id) |
| deleted_at | timestamptz | YES | |
| created_at | timestamptz | NO | now() |

**No `updated_at` column.**

---

## groups

| COLUMN | TYPE | NULL | DEFAULT / NOTES |
|--------|------|------|-----------------|
| id | uuid | NO | PK |
| name | text | NO | |
| description | text | NO | '' |
| cover_image | text | YES | |
| avatar_url | text | YES | |
| owner_id | uuid | NO | FK → profiles(id) |
| privacy | text | NO | 'public', CHECK public/private |
| members_count | int | NO | 0 |
| posts_count | int | NO | 0 |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

---

## group_members

| COLUMN | TYPE | NULL | DEFAULT / NOTES |
|--------|------|------|-----------------|
| id | uuid | NO | PK |
| group_id | uuid | NO | FK → groups(id) |
| user_id | uuid | NO | FK → profiles(id) |
| role | text | NO | 'member', CHECK owner/admin/member |
| joined_at | timestamptz | NO | now() |

**UNIQUE (group_id, user_id)**

---

## saved_posts

| COLUMN | TYPE | NULL | DEFAULT / NOTES |
|--------|------|------|-----------------|
| id | uuid | NO | PK |
| user_id | uuid | NO | FK → profiles(id) |
| post_id | uuid | NO | FK → posts(id) |
| collection_name | text | YES | 'default' |
| created_at | timestamptz | NO | now() |

**UNIQUE (user_id, post_id)**

---

## saved_recipes

| COLUMN | TYPE | NULL | DEFAULT / NOTES |
|--------|------|------|-----------------|
| id | uuid | NO | PK |
| user_id | uuid | NO | FK → profiles(id) |
| post_id | uuid | NO | FK → posts(id) |
| created_at | timestamptz | NO | now() |

**UNIQUE (user_id, post_id)**

---

## notifications

| COLUMN | TYPE | NULL | DEFAULT / NOTES |
|--------|------|------|-----------------|
| id | uuid | NO | PK |
| receiver_id | uuid | NO | FK → profiles(id) |
| sender_id | uuid | YES | FK → profiles(id) |
| type | text | NO | like/comment/follow/group/system/premium |
| title | text | NO | |
| description | text | NO | '' |
| post_id | uuid | YES | FK → posts(id) |
| group_id | uuid | YES | FK → groups(id) |
| comment_id | uuid | YES | FK → comments(id) |
| is_read | boolean | NO | false |
| created_at | timestamptz | NO | now() |

**No `updated_at` column.**

---

## friend_requests

| COLUMN | TYPE | NULL | DEFAULT / NOTES |
|--------|------|------|-----------------|
| id | uuid | NO | PK |
| sender_id | uuid | NO | FK → profiles(id) |
| receiver_id | uuid | NO | FK → profiles(id) |
| status | text | NO | pending/accepted/rejected/cancelled |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

**UNIQUE (sender_id, receiver_id)**

---

## follows

| COLUMN | TYPE | NULL | DEFAULT / NOTES |
|--------|------|------|-----------------|
| id | uuid | NO | PK |
| follower_id | uuid | NO | FK → profiles(id) |
| following_id | uuid | NO | FK → profiles(id) |
| created_at | timestamptz | NO | now() |

**UNIQUE (follower_id, following_id), CHECK follower_id <> following_id**

---

## Related table used by seed (not in audit list)

### post_likes (sprint3)

| COLUMN | TYPE |
|--------|------|
| id | uuid PK |
| post_id | uuid |
| user_id | uuid |
| created_at | timestamptz |

**UNIQUE (post_id, user_id)**
