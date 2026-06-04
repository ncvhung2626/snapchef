# Sprint 4 — Comments + Likes (hoàn thiện)

> Bảng `comments` đã có từ Sprint 3. Sprint 4 nối app với Supabase.

## SQL (tùy chọn)

Chạy `supabase/sprint4_comments.sql` nếu muốn thêm policy update comment.

## Tính năng

- Màn **Bình luận** load bài viết thật + danh sách comment từ DB
- **Gửi bình luận** / reaction nhanh (emoji + text)
- **Thích** bài từ màn bình luận
- Đếm bình luận cập nhật sau khi gửi

## Test

1. `npx expo start -c`
2. Mở bài viết → **Bình luận**
3. Gửi comment → thấy trong list
4. Thích bài → số tim tăng

## Sprint tiếp theo

- **Sprint 5:** Groups — xem `SPRINT5_GROUPS.md`
- **Sprint 6:** Notifications
