-- Chạy 1 lần trong SQL Editor để KIỂM TRA đã setup đủ chưa (không tạo bảng mới)

select 'profiles' as bang, count(*) as so_dong from public.profiles
union all select 'posts', count(*) from public.posts
union all select 'groups', count(*) from public.groups
union all select 'notifications', count(*) from public.notifications
union all select 'conversations', count(*) from public.conversations
union all select 'conversation_members', count(*) from public.conversation_members
union all select 'messages', count(*) from public.messages;

-- Nếu lỗi "relation ... does not exist" → chưa chạy file SQL tương ứng (xem SUPABASE_SETUP.md)

-- Kiểm tra hàm tạo chat 1:1 (Sprint 7)
select proname from pg_proc where proname = 'create_dm_conversation';
