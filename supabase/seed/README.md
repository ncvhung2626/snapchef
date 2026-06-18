# SnapChef Dev Seed

Chạy `dev_seed.sql` trong Supabase SQL Editor sau khi:

1. Đã chạy schema sprint 1–13 + `production/01`–`06`
2. Có ít nhất **1 tài khoản** đăng ký qua app (để tạo `profiles`)

## Nội dung seed

| Loại | Số lượng |
|------|----------|
| Profiles (cập nhật) | 15 |
| Bài feed | 15 |
| Công thức | 15 |
| Reels | 15 |
| Nhóm | 10 |

## Dữ liệu local (mock)

TypeScript mock tương ứng: `src/data/mock/` — dùng cho dev offline và tham chiếu nội dung.

```bash
# Không cần lệnh riêng — import từ:
import { MOCK_POSTS, MOCK_REELS, MOCK_GROUPS, MOCK_USER_LIST } from './src/data/mock';
```

## Lưu ý

- Script idempotent: bỏ qua nếu đã có > 20 posts
- Reels cần bảng `reels` (production migration)
- Ảnh/video dùng Unsplash + Google sample videos (CDN công khai)
