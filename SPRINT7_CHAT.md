# Sprint 7 — Chat Realtime (Supabase)

## Bạn đã chạy `sprint7_chat.sql` + bật Realtime — còn phải làm gì?

**Không cần tạo bảng thủ công nữa.** File SQL đã tạo sẵn:

| Bảng | Mục đích |
|------|----------|
| `conversations` | Hội thoại 1:1 (`dm_key` tránh trùng) |
| `conversation_members` | Ai tham gia hội thoại |
| `messages` | Nội dung tin nhắn |

**Realtime:** bạn đã bật cho `messages` → đủ cho Sprint 7.

### Kiểm tra nhanh trên Supabase (2 phút)

1. **Table Editor** — thấy 3 bảng trên (có thể đang trống, `0 rows` là bình thường).
2. **SQL Editor** — chạy `supabase/verify_setup.sql` → 7 dòng không lỗi; dòng `create_dm_conversation` có trong kết quả hàm.
3. **Database → Replication** (hoặc Publications) — `messages` đã bật ✓

### Kiểm tra trên app

```powershell
npx expo start -c
```

1. Đăng nhập → **Inbox** → tab **Tin nhắn** → **+ Mới**
2. Chọn user khác → gửi tin
3. (Tùy chọn) Mở app bằng tài khoản thứ 2 → cùng hội thoại → tin hiện realtime

---

## SQL (nếu chưa chạy)

Chạy `supabase/sprint7_chat.sql` (sau sprint6).

**Dashboard:** Database → Replication — bật bảng `messages` nếu chưa bật.

## Tính năng

- Tab **Tin nhắn** trong Inbox — danh sách hội thoại 1:1
- **Tin nhắn mới** — chọn người dùng, tạo/mở hội thoại
- **ChatScreen** — gửi/nhận tin, Supabase Realtime
- Tin nhắn cập nhật `last_message` trên conversation

## Test

1. Chạy SQL sprint7
2. `npx expo start -c`
3. Đăng nhập 2 tài khoản (2 thiết bị)
4. User A: Inbox → Tin nhắn → **+ Mới** → chọn User B
5. Gửi tin → User B mở cùng hội thoại → thấy tin realtime

## Sprint tiếp theo

- **Sprint 8:** Deploy — xem `SPRINT8_DEPLOY.md`
