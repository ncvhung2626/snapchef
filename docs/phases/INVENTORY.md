# Inventory — toàn bộ artifact production

> Cập nhật khi hoàn thành từng tuần. ✅ = có trong repo.

## Hooks (mục tiêu)

| Hook | File | Trạng thái |
|------|------|------------|
| useAuthActions | `src/hooks/auth/useAuthActions.ts` | ✅ |
| useFeed | `src/hooks/useFeed.ts` | ✅ |
| usePostsInfiniteQuery | `src/queries/usePostsQuery.ts` | ✅ scaffold |
| useComments | `src/hooks/useComments.ts` | ✅ |
| useGroups | `src/hooks/useGroups.ts` | ✅ |
| useNotifications | `src/hooks/useNotifications.ts` | ✅ |
| useConversations | `src/hooks/useConversations.ts` | ✅ |
| useChatMessages | `src/hooks/useChatMessages.ts` | ✅ |
| useReelsFeed | `src/queries/useReelsQuery.ts` | 🔲 |
| useToggleLikeMutation | `src/queries/usePostMutations.ts` | ✅ |
| useDeletePostMutation | `src/queries/usePostMutations.ts` | ✅ |

## Stores

| Store | File | Trạng thái |
|-------|------|------------|
| authStore | `src/store/authStore.ts` | ✅ |
| userStore | `src/store/userStore.ts` | 🔲 |
| postStore | `src/store/postStore.ts` | ✅ draft |
| settingsStore | `src/store/settingsStore.ts` | ✅ |
| groupStore | `src/store/groupStore.ts` | 🔲 |
| notificationStore | `src/store/notificationStore.ts` | 🔲 |
| chatStore | `src/store/chatStore.ts` | 🔲 |
| savedPostStore | `src/store/savedPostStore.ts` | 🔲 |
| settingsStore | `src/store/settingsStore.ts` | 🔲 |

## Mutations (TanStack)

- `useCreatePostMutation`
- `useUpdatePostMutation`
- `useDeletePostMutation`
- `useCreateCommentMutation`
- `useToggleLikeMutation`
- `useFollowMutation`
- `useSendMessageMutation`

## Components (chính — đã có)

`PostCard`, `BottomTabBar`, `CategoryChips`, `PrimaryButton`, `AppMenuModal`, `CreateActionSheet`, `Header`, …

## Thuật toán

| ID | Tên | File đích |
|----|-----|-----------|
| A1 | Feed ranking | `docs/phases/20-ALGORITHMS.md` |
| A2 | Trending hashtags | SQL view |
| A3 | User recommendation | `recommendationService` |
| A4 | Notification priority | `notificationService` |

## Test cases (mẫu)

Xem `docs/phases/24-TESTING.md` — tối thiểu 40 case khi vào tuần 12.
