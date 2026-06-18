# Phase 10 — Module Authentication (bước thực tế)

## Đã có trong project

- Register, Login, Logout, Forgot password (`ForgotPasswordScreen`)
- Session: `authService.restoreSession()` + `onAuthStateChange`
- `AuthContext` + protected stack trong `RootNavigator`

## Cần bổ sung (tuần 3)

### 1. Google Login

**Supabase Dashboard:** Authentication → Providers → Google → bật, thêm redirect URL Expo.

**File sửa:** `src/services/authService.ts`

```ts
export async function signInWithGoogle() {
  const { data, error } = await getSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: Linking.createURL('/') },
  });
  if (error) throw error;
  return data;
}
```

**Screen:** nút Google trên `LoginScreen` → gọi `signInWithGoogle`.

### 2. Zod + React Hook Form

**File:** `src/validation/schemas/auth.schema.ts` (đã scaffold)

**Sửa:** `LoginScreen`, `RegisterScreen` — `useForm` + `zodResolver(loginSchema)`.

### 3. authStore + Repository

- `auth.repository.ts` — wrap `signIn`, `signUp`, `signOut`, `getSession`, `getProfile`
- `authStore.ts` — `user`, `isBootstrapping`, `setUser`, `clear`
- `AuthContext` — subscribe store + gọi repository (bridge, không xóa context ngay)

### 4. RBAC navigation guard

**File sửa:** `RootNavigator` hoặc `AuthGate`

```ts
if (user?.role === 'admin') show AdminStack;
```

**Security:** role từ `profiles.role` — RLS `is_admin_or_mod()` cho moderator routes.

### 5. Token / Refresh

Supabase JS tự refresh — **không** lưu refresh token vào AsyncStorage thủ công.

**Risk:** log token trong production — tắt `console.log` session.

## Test thủ công

1. Register → confirm email (hoặc tắt confirm)
2. Login sai password → message Zod/service
3. Logout → `user === null`, stack Welcome
4. Kill app → mở lại → session restore
