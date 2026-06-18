# Phase 11–19 — Feature modules (trạng thái & bước tiếp)

## 11 Profile — ✅ core / 🔲 production

| Feature | Trạng thái |
|---------|------------|
| View/Edit profile | ✅ |
| Upload avatar | ✅ `storageService` |
| Follow/Unfollow | ✅ sprint2 |
| Followers/Following list | 🔲 dedicated screens |
| Saved recipes | ✅ `saved_recipes` |
| Activity tab | 🔲 |

## 12 Posts — ✅ core / 🔲 production

| Feature | Trạng thái |
|---------|------------|
| Create post/recipe | ✅ |
| Get feed | ✅ `useFeed` |
| Search | ✅ SearchScreen |
| Edit/Delete | 🔲 `postRepository.softDeletePost` |
| Hashtag | 🔲 DB + parser |
| Infinite scroll TanStack | 🔲 `usePostsInfiniteQuery` |
| Media upload | ✅ |

## 13 Comments — ✅ / 🔲

Create ✅ | Update 🔲 | Delete 🔲 | Reply 🔲 DB ready | Realtime 🔲 | Mention 🔲

## 14 Likes — ✅

Like/unlike ✅ | Count ✅ | Realtime UI 🔲 | Notification trigger ✅ DB

## 15 Saved — ✅ partial

`saved_recipes` ✅ → migrate `saved_posts` + collections

## 16 Groups — ✅ core

Create/join/feed ✅ | Moderation roles 🔲 | Recommendation 🔲

## 17 Notifications — ✅

Triggers ✅ | Priority/read batch 🔲

## 18 Chat — ✅ core

DM ✅ | Typing/read receipt 🔲 | Media messages 🔲

## 19 Reels — 🔲

DB `reels` ✅ SQL | Screen mock | Upload/feed/like 🔲

Mỗi module: làm theo checklist trong `docs/MIGRATION_FROM_CURRENT.md`.
