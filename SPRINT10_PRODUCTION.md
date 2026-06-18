# Sprint 10 — Production stack (tiếp tục)

## Đã bổ sung trong sprint này

### Dependencies
- `zustand`, `@tanstack/react-query`, `zod`, `react-hook-form`, `@hookform/resolvers`
- `expo-linking`, `expo-web-browser`, `expo-auth-session` (Google OAuth)

### Database (chạy trên Supabase)
Theo thứ tự `supabase/production/01` → `06` (xem `supabase/production/README.md`).

### Code
| Thành phần | Đường dẫn |
|------------|-----------|
| Master roadmap | `docs/PRODUCTION_MASTER.md` |
| Repositories | `src/repositories/*` |
| Zustand | `authStore`, `settingsStore`, `postStore` |
| TanStack | `AppProviders`, `usePostsQuery`, `usePostMutations` |
| Zod auth | `LoginScreen`, `RegisterScreen` |
| Google login | `authService.signInWithGoogle` + nút Login |
| Admin skeleton | `AdminModerationScreen` |

## Việc bạn làm ngay

1. **SQL production** — Dashboard → SQL Editor → chạy 01–06.
2. **Google OAuth** — Supabase → Auth → Google → bật; thêm Redirect URL từ `npx expo start` log (thường `exp://...` hoặc `test2://...`).
3. **Test app:** `npx expo start -c` → đăng nhập / đăng ký / Google.

## Tuần tiếp theo (theo PRODUCTION_MASTER)

- Tuần 5: `useFeed` → `usePostsInfiniteQuery` trên Home
- Tuần 5–6: Comment reply + mutations
- Tuần 7: Profile repository trong `profileService`
- Tuần 10+: Reels table + upload

## Gán role admin (SQL)

```sql
update public.profiles set role = 'admin' where email = 'your@email.com';
```

Sau đó mở Profile → **Kiểm duyệt nội dung**.
