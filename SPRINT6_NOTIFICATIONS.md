# Sprint 6 — Notifications (Supabase)

## SQL (bắt buộc)

Chạy `supabase/sprint6_notifications.sql` (sau sprint5).

Tạo bảng `notifications` + trigger tự gửi thông báo khi:

- Ai đó **thích** bài của bạn
- Ai đó **bình luận** bài của bạn
- Ai đó **theo dõi** bạn
- Thành viên **tham gia nhóm** (gửi cho chủ nhóm)

## Tính năng app

- Tab **Thông báo** load từ Supabase
- **Đọc tất cả** / đánh dấu đã đọc khi mở
- Nhấn thông báo → mở bài / bình luận / nhóm
- Badge số chưa đọc trên tab Inbox

## Test

1. Chạy SQL sprint6
2. `npx expo start -c`
3. Dùng **2 tài khoản** (2 máy / emulator + điện thoại):
   - User A đăng bài
   - User B thích hoặc bình luận → User A mở **Thông báo**
4. User B follow User A (cần gọi API follow — có thể test qua SQL Editor):

```sql
insert into follows (follower_id, following_id)
values ('<uuid-user-b>', '<uuid-user-a>');
```

## Sprint tiếp theo

- **Sprint 7:** Chat — xem `SPRINT7_CHAT.md`
