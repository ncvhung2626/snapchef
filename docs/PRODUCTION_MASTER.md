# SnapChef — Production Master Plan (triển khai thực tế)

> Đọc file này trước. Mọi phase bám vào codebase hiện tại (`src/services/*`, sprint SQL 1–9), **không rewrite**.

## Trạng thái hiện tại (đã có)

| Module | FE | DB | Ghi chú |
|--------|----|----|---------|
| Auth | `authService`, `AuthContext` | `profiles` + trigger | Thiếu Google, RBAC guard, Zustand |
| Posts | `postService`, feed hooks | `posts`, `post_likes` | Thiếu edit/delete/search pagination chuẩn |
| Comments | `commentService` | `comments` | Thiếu reply UI, update, mention |
| Groups | `groupService` | `groups`, `group_members` | Thiếu moderation đầy đủ |
| Notifications | `notificationService` | `notifications` + triggers | Thiếu priority, batch read |
| Chat | `chatService` | `conversations`, `messages` | Thiếu typing, read receipt |
| Recipes/Saved | `recipeService`, `CreateRecipeScreen` | `saved_recipes` sprint9 | Đổi tên → `saved_posts` production |
| Reels | `ReelsScreen` mock | **Chưa có** | Phase 19 |
| RLS | từng sprint | **Chưa thống nhất** | `supabase/production/04_rls.sql` |
| Architecture layers | services only | — | Thêm repositories + store + query |

---

## Thứ tự triển khai (bắt buộc)

```
Tuần 1–2:  DB production + RLS + Storage  → docs/phases/02, supabase/production/*
Tuần 3:    Auth production (Zod, store, repo, Google) → Phase 3, 10
Tuần 4:    Folder + TanStack Query skeleton → Phase 6, 8
Tuần 5–6:  Posts + Comments + Likes → Phase 12–14
Tuần 7:    Profile + Saved + Follow → Phase 11, 15
Tuần 8:    Groups production → Phase 16
Tuần 9:    Notifications + Chat hardening → Phase 17–18
Tuần 10+:  Reels + Algorithms + Admin → Phase 19–22
Tuần 12+:  Performance + Testing → Phase 23–24
```

Chi tiết từng phase: `docs/phases/NN-*.md`.

---

## Kiến trúc mục tiêu (Phase 1)

```
Screens / Components
        ↓ gọi
Hooks (usePosts, useAuth)  ← TanStack Query + Zustand selectors
        ↓
Stores (Zustand)          ← session UI state, draft offline
        ↓
Services                  ← business rules, orchestration
        ↓
Repositories              ← 1:1 Supabase table/API, no UI logic
        ↓
supabase client           ← src/lib/supabase.ts (giữ nguyên)
        ↓
PostgreSQL + RLS + Storage
```

**Dependency rule (anti-pattern nếu vi phạm):**

- Screen **không** import `@supabase/supabase-js` trực tiếp
- Repository **không** import React
- Service **không** import component

**Migration từ hiện tại:** `docs/MIGRATION_FROM_CURRENT.md`

---

## Danh sách bảng DB (production)

| Bảng | File SQL | Trạng thái |
|------|----------|------------|
| profiles | schema + production/01_alter | ✅ có, bổ sung audit |
| posts | sprint3 + production/01_alter | ✅ |
| post_likes | sprint3 | ✅ (= likes) |
| comments | sprint3 + production/02 | ✅ + reply |
| saved_posts | production/02 | 🔄 thay saved_recipes |
| follows | sprint2 | ✅ |
| groups | sprint5 | ✅ |
| group_members | sprint5 | ✅ |
| notifications | sprint6 | ✅ |
| conversations | sprint7 | ✅ |
| messages | sprint7 | ✅ |
| hashtags | production/02 | 🆕 |
| post_hashtags | production/02 | 🆕 |
| reels | production/02 | 🆕 |
| reel_likes | production/02 | 🆕 |
| reel_comments | production/02 | 🆕 |
| reports | production/02 | 🆕 |
| meal_plans | production/02 | 🆕 |
| recipe_categories | production/02 | 🆕 |
| user_preferences | production/02 | 🆕 |
| admin_logs | production/02 | 🆕 |

---

## Danh sách file TẠO MỚI (ưu tiên tuần 1–4)

### Supabase

- `supabase/production/README.md`
- `supabase/production/01_alter_profiles_posts.sql`
- `supabase/production/02_new_tables.sql`
- `supabase/production/03_indexes.sql`
- `supabase/production/04_rls.sql`
- `supabase/production/05_storage.sql`
- `supabase/production/06_triggers.sql`

### Docs

- `docs/PRODUCTION_MASTER.md` (file này)
- `docs/MIGRATION_FROM_CURRENT.md`
- `docs/phases/01-ARCHITECTURE.md` … `24-TESTING.md` (lộ trình từng phase)

### Frontend core

- `src/repositories/base.repository.ts`
- `src/repositories/auth.repository.ts`
- `src/repositories/post.repository.ts`
- `src/repositories/index.ts`
- `src/store/authStore.ts`
- `src/store/index.ts`
- `src/validation/schemas/auth.schema.ts`
- `src/validation/schemas/post.schema.ts`
- `src/validation/index.ts`
- `src/queries/queryClient.ts`
- `src/queries/keys.ts`
- `src/queries/usePostsQuery.ts`
- `src/hooks/auth/useAuthActions.ts`
- `src/providers/AppProviders.tsx`

---

## Danh sách file SỬA (không phá app)

| File | Khi nào | Việc làm |
|------|---------|----------|
| `App.tsx` | Tuần 4 | bọc `AppProviders` (Query + giữ AuthContext) |
| `src/context/AuthContext.tsx` | Tuần 3 | đồng bộ `authStore` |
| `src/services/authService.ts` | Tuần 3 | gọi `authRepository` |
| `src/services/postService.ts` | Tuần 5 | gọi `postRepository` |
| `src/screens/LoginScreen.tsx` | Tuần 3 | RHF + Zod |
| `src/screens/RegisterScreen.tsx` | Tuần 3 | RHF + Zod |
| `package.json` | Tuần 1 | deps production |

---

## RLS Policies (inventory)

Xem `supabase/production/04_rls.sql`:

- profiles: select all, update own, admin update any
- posts: select non-deleted, CRUD owner, moderator delete
- comments: select, insert own, update/delete own
- post_likes: insert/delete own
- saved_posts: own only
- follows: insert/delete own follower
- groups / group_members: member read, owner admin
- messages / conversations: member only
- notifications: receiver only
- reports: insert auth, read own + admin
- reels: public read, owner write

---

## Stores (Zustand) — inventory

| Store | File | Persist |
|-------|------|---------|
| authStore | `src/store/authStore.ts` | SecureStore via supabase session |
| userStore | `src/store/userStore.ts` | partial |
| postStore | `src/store/postStore.ts` | draft post AsyncStorage |
| groupStore | `src/store/groupStore.ts` | no |
| notificationStore | `src/store/notificationStore.ts` | badge count |
| chatStore | `src/store/chatStore.ts` | draft message |
| savedPostStore | `src/store/savedPostStore.ts` | optimistic ids |
| settingsStore | `src/store/settingsStore.ts` | theme AsyncStorage |

---

## TanStack Query — keys & hooks

`src/queries/keys.ts`:

- `posts.list`, `posts.detail`, `posts.search`
- `comments.byPost`
- `groups.list`, `groups.detail`
- `notifications.list`
- `chat.messages`

Hooks mẫu: `usePostsQuery`, `useInfinitePostsQuery` (tuần 5).

---

## Validation (Zod) — inventory

`src/validation/schemas/`:

- `auth.schema.ts` — login, register, forgotPassword
- `profile.schema.ts`
- `post.schema.ts`, `recipe.schema.ts`
- `comment.schema.ts`
- `group.schema.ts`
- `message.schema.ts`
- `report.schema.ts`
- `mealPlan.schema.ts`

---

## Thuật toán (Phase 20) — tóm tắt

| Thuật toán | Công thức / SQL | File đích |
|------------|-----------------|-----------|
| Feed ranking | `score = likes*2 + comments*3 + recency_decay` | `supabase/functions/feed_rank.sql` |
| Trending | posts 7 ngày ORDER BY engagement | `postRepository.getTrending` |
| User recommend | followers-of-followers | `recommendationService` |
| Hashtag | count post_hashtags 24h | `hashtagRepository` |

---

## Test cases (Phase 24) — tối thiểu

| ID | Module | Case |
|----|--------|------|
| T-A1 | Auth | register invalid email → Zod error |
| T-A2 | Auth | login wrong password → message |
| T-P1 | Posts | create post without content → fail |
| T-P2 | Posts | like idempotent (double tap) |
| T-R1 | RLS | user A cannot update user B post |

File: `docs/phases/24-TESTING.md`

---

## Bước tiếp theo NGAY (hôm nay)

1. Chạy SQL production theo `supabase/production/README.md`
2. Đọc `docs/phases/01-ARCHITECTURE.md`
3. Chạy `npx expo start -c` sau khi cài deps
4. Tuần 3: refactor Auth theo `docs/phases/10-AUTH-MODULE.md`
