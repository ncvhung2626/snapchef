# Phase 3–9 — Auth, RLS, Storage, Folder, State, Server State, Validation

## Phase 3 — Supabase Auth ✅ (một phần)

| Feature | File | Trạng thái |
|---------|------|------------|
| Register/Login/Logout | `authService`, screens | ✅ |
| Forgot password | `ForgotPasswordScreen` | ✅ |
| Reset password deep link | `snapchef://reset-password` | Cần handler screen |
| Google OAuth | `authService.signInWithGoogle` | ✅ (cần bật provider Supabase) |
| Session persistence | Supabase auto | ✅ |
| Protected screens | `RootNavigator` | ✅ |
| RBAC | `profiles.role` + RLS | ✅ DB, 🔲 UI admin |

**Security:** Không log `access_token`. Refresh do SDK — không custom storage token.

## Phase 4 — RLS

Chạy `supabase/production/04_rls.sql` sau sprint policies.

| Role | Quyền |
|------|-------|
| Owner | CRUD own rows |
| Moderator | `is_admin_or_mod()` — reports, delete content |
| Admin | + admin_logs |
| Anonymous | Chỉ select public posts/profiles |

## Phase 5 — Storage

Chạy `05_storage.sql`. Service hiện có: `src/services/storageService.ts`.

Upload path convention: `{bucket}/{userId}/{uuid}.jpg`

## Phase 6 — Folder structure

Đã scaffold: `repositories/`, `store/`, `queries/`, `validation/`, `providers/`.

Di chuyển dần screens — **không** đổi path một lần.

## Phase 7 — Zustand

`authStore` ✅. Các store còn lại — tạo khi refactor module tương ứng.

## Phase 8 — TanStack Query

`AppProviders` + `usePostsInfiniteQuery` ✅ mẫu.

Migrate `useFeed` → `usePostsInfiniteQuery` khi QA xong pagination.

## Phase 9 — Zod + RHF

Schemas: `src/validation/schemas/auth.schema.ts`, `post.schema.ts`.

Pilot: LoginScreen + RegisterScreen — `useForm` + `zodResolver` ✅.
