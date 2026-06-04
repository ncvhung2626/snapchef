# Sprint 3 — Posts (Supabase)

## SQL

Chạy trên **Supabase SQL Editor** (theo thứ tự):

1. `supabase/schema.sql`
2. `supabase/sprint2_profile.sql` (nếu chưa)
3. **`supabase/sprint3_posts.sql`**

## Tính năng

- Feed **Dành cho bạn** / **Nhóm** từ bảng `posts`
- **Đăng bài** (+) — nội dung + ảnh (upload bucket `post-images`)
- **Thích** bài viết (`post_likes`)
- **Chi tiết bài** + đếm bình luận
- **Cá nhân** — số bài đã đăng (`posts_count`)

## Test

```powershell
npx expo start -c
```

1. Đăng nhập  
2. Tab **+** → viết bài → chọn ảnh → **Đăng bài**  
3. **Trang chủ** → kéo refresh → thấy bài mới  
4. Thích / mở chi tiết / bình luận (Sprint 4)

## Lỗi thường gặp

| Lỗi | Xử lý |
|-----|--------|
| `relation posts does not exist` | Chạy `sprint3_posts.sql` |
| Upload ảnh lỗi | Kiểm tra bucket `post-images` + policy Storage |
| Feed trống | Đăng bài mới hoặc pull refresh |
