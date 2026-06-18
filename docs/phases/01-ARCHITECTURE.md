# Phase 1 — System Architecture

## Tại sao tách layer?

- **Test**: mock repository, không cần Expo.
- **Security**: RLS + validation ở service, không rải trong UI.
- **Performance**: TanStack cache ở hooks, Zustand chỉ UI/draft.

## Trách nhiệm từng layer

| Layer | Trách nhiệm | Không làm |
|-------|-------------|-----------|
| **Screens** | Layout, navigation, gọi hooks | SQL, parse JSON thô |
| **Components** | UI thuần, props | Fetch API |
| **Hooks** | `useQuery`/`useMutation`, kết hợp store | Business rules phức tạp |
| **Store (Zustand)** | UI state, draft, badge | Thay server cache dài hạn |
| **Service** | Rules: ai được sửa, format payload | Direct UI |
| **Repository** | CRUD Supabase 1 bảng/view | Validate form |
| **Supabase client** | Auth session, realtime channel | — |

## Luồng dữ liệu (ví dụ Like post)

```
PostCard.onLike
  → useToggleLikeMutation (hook)
    → postService.toggleLike (service: check own post? spam?)
      → postRepository.upsertLike (repository)
        → supabase.from('post_likes').insert(...)
  → onSuccess: invalidate ['posts','list']
  → notificationStore bump (optional)
```

## Anti-patterns (tránh)

- Screen gọi `supabase.from` — **cấm**
- Copy paste query ở 5 screen — dùng `queries/keys.ts`
- Lưu toàn bộ feed trong Zustand — dùng TanStack
- Repository gọi `Alert.alert` — chỉ service/hook throw error typed

## Cấu trúc thư mục mục tiêu

```
src/
  screens/
  components/
  navigation/
  hooks/           # domain hooks
  store/
  services/
  repositories/
  queries/         # TanStack keys + hooks
  validation/
  lib/supabase.ts
  types/
  theme/
```

**Import rule:** `screens → hooks → (store|services) → repositories → lib`
