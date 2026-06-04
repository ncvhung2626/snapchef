# Sprint 5 — Groups (Supabase)

## SQL (bắt buộc)

Chạy `supabase/sprint5_groups.sql` trong Supabase SQL Editor (sau sprint3).

Tạo bảng `groups`, `group_members`, FK `posts.group_id`, bucket `group-images`.

## Tính năng

- **Tạo nhóm** (tên, mô tả, công khai/riêng tư, ảnh bìa)
- **Tham gia / Rời nhóm**
- **Home:** danh sách nhóm đã tham gia + khám phá
- **GroupDetail:** thông tin nhóm + bài viết trong nhóm
- **Đăng bài trong nhóm** (từ GroupDetail)
- **Quản lý thành viên** (chủ nhóm/admin xóa thành viên)

## Test

1. Chạy SQL sprint5
2. `npx expo start -c`
3. Đăng nhập → **Tạo nhóm** → điền form → **Bắt đầu tạo**
4. Vào nhóm → **Tham gia** (nhóm khác) → đăng bài trong nhóm
5. Chủ nhóm → **Quản lý thành viên**

## Sprint tiếp theo

- **Sprint 6:** Notifications — xem `SPRINT6_NOTIFICATIONS.md`
