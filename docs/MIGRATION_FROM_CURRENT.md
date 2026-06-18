# Migration: Services → Production Layers

## Nguyên tắc

1. **Không xóa** `src/services/*` ngay — repository gọi Supabase, service gọi repository + business logic.
2. **AuthContext** giữ đến khi mọi screen dùng `useAuthStore` + hooks.
3. Mỗi module: 1 PR = DB SQL + repository + service refactor + 1 screen pilot.

## Mapping file hiện tại → layer mới

| Hiện tại | Layer mới | Ghi chú |
|----------|-----------|---------|
| `src/lib/supabase.ts` | Giữ | Chỉ repository/service import |
| `src/services/authService.ts` | `auth.repository` + `authService` | Service orchestration |
| `src/context/AuthContext.tsx` | `authStore` + `AppProviders` | Đồng bộ 2 chiều tuần 3 |
| `src/services/postService.ts` | `post.repository` | Tuần 5 |
| `src/hooks/useFeed.ts` | `useInfinitePostsQuery` | TanStack |
| `src/utils/validation.ts` | `validation/schemas/*.ts` (Zod) | Thay dần từng form |

## Thứ tự refactor từng module

```
Auth → Profile → Posts → Comments → Likes → Saved → Groups → Notifications → Chat → Reels
```

## Checklist trước khi merge PR production

- [ ] SQL chạy OK trên Supabase staging
- [ ] RLS test: 2 user, không đọc được data người khác (trừ public)
- [ ] Không import supabase trong screen
- [ ] Query keys invalidate đúng sau mutation
