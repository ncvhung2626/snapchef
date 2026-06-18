# SnapChef + Supabase

Dự án dùng **Supabase** thay cho MongoDB + Express cho **Authentication (Sprint 1)**.

## So sánh nhanh

| Trước (MongoDB) | Với Supabase |
|-----------------|--------------|
| Cài MongoDB local | Không cần — DB trên cloud |
| `npm run backend` | Không bắt buộc cho đăng nhập |
| JWT tự viết | Supabase Auth (JWT sẵn) |
| Collection `users` | Bảng `profiles` + `auth.users` |

Các sprint sau (Posts, Groups, Chat) có thể lưu trực tiếp trên **PostgreSQL Supabase** + RLS, hoặc giữ API Express nếu nhóm muốn.

---

## Bước 1 — Tạo project Supabase

1. Vào [https://supabase.com](https://supabase.com) → **New project**
2. Chọn region gần VN (Singapore) nếu có
3. Lưu **Database password**

## Bước 2 — Chạy SQL schema

1. Dashboard → **SQL Editor** → New query
2. Chạy lần lượt các file SQL (mỗi file một query → **Run**):

| Thứ tự | File |
|--------|------|
| 1 | `supabase/schema.sql` |
| 2 | `supabase/sprint2_profile.sql` |
| 3 | `supabase/sprint3_posts.sql` |
| 4 | `supabase/sprint4_comments.sql` (tùy chọn) |
| 5 | `supabase/sprint5_groups.sql` |
| 6 | `supabase/sprint6_notifications.sql` |
| 7 | `supabase/sprint7_chat.sql` |
| 9 | `supabase/sprint9_recipes.sql` |

Tạo bảng `profiles` + trigger tự tạo profile khi user đăng ký.

## Bước 3 — Cấu hình Auth (dev)

1. **Authentication** → **Providers** → **Email** → bật Email
2. (Khuyến nghị khi dev) Tắt **Confirm email** để đăng ký vào app ngay, không cần mở mail
3. **Authentication** → **URL Configuration**: có thể để mặc định với Expo

## Bước 4 — Lấy API keys

**Project Settings** → **API**:

- **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
- **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Tạo file `.env` ở thư mục gốc app (copy từ `.env.example`):

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Bước 5 — Chạy app

```powershell
cd "d:\Tài Liệu\VAA\HK6\LT Mobile\test 2"
npm start
```

- **Đăng ký** trong app → user xuất hiện trong Authentication → Users và bảng `profiles`
- Đóng/mở app → vẫn đăng nhập (session trong Secure Store)

---

## Kiến trúc trong code

```
App
 └── AuthProvider
      └── supabase.auth (login / register / logout)
      └── bảng profiles (fullname, bio, role...)
```

- Client: `src/lib/supabase.ts`
- Auth logic: `src/services/authService.ts`

---

## Backend Express (`backend/`)

Thư mục `backend/` **không cần** cho Sprint 1 nếu dùng Supabase. Có thể xóa sau hoặc dùng cho tính năng đặc biệt (upload, cron, AI).

---

## Sprint tiếp theo trên Supabase

| Sprint | Gợi ý Supabase |
|--------|----------------|
| 2 Profile | `UPDATE profiles`, Storage bucket `avatars` |
| 3 Posts | Bảng `posts`, RLS theo `author_id` |
| 5 Groups | `sprint5_groups.sql` — `groups`, `group_members` |
| 6 Notifications | `sprint6_notifications.sql` — triggers like/comment/follow |
| 7 Chat | `sprint7_chat.sql` — Realtime trên `messages` |
| 8 Deploy | `SPRINT8_DEPLOY.md` — EAS Build, biến môi trường EAS |

**Kiểm tra DB:** chạy `supabase/verify_setup.sql` sau khi chạy hết các sprint SQL.

---

## Lỗi thường gặp

| Lỗi | Cách xử lý |
|-----|------------|
| Thiếu URL/KEY trong .env | Tạo `.env`, restart `npm start` |
| `relation "profiles" does not exist` | Chạy lại `supabase/schema.sql` |
| Đăng ký xong không vào app | Tắt Confirm email hoặc xác nhận mail |
| Invalid login credentials | Kiểm tra email/password trên Dashboard → Users |
