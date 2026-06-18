# Sprint 9 — UI Figma + Công thức (Supabase)

## SQL (bắt buộc)

Chạy `supabase/sprint9_recipes.sql` trên Supabase SQL Editor.

Thêm cột công thức trên `posts` + bảng `saved_recipes`.

## Tính năng mới (theo Figma)

| Khu vực | Mô tả |
|---------|--------|
| **Auth** | Validate chuẩn, quên mật khẩu, checkbox điều khoản, nút Google (placeholder) |
| **Tab Tìm kiếm** | Tìm bài/công thức, lọc danh mục |
| **Tạo (+)** | Chọn đăng bài nhanh hoặc công thức 3 bước |
| **Công thức** | Nguyên liệu, bước nấu, lưu bookmark |
| **Menu** | Nhóm, đã lưu, Reels, cài đặt |
| **Home** | Chip danh mục, theme M3 thống nhất |

## Test

1. Chạy SQL sprint9
2. `npx expo start -c`
3. Đăng ký → tạo công thức (+ → Công thức đầy đủ)
4. Tìm kiếm tên món → mở chi tiết → Lưu
5. Menu → Công thức đã lưu
