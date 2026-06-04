-- Sprint 4: Bổ sung policy bình luận (nếu đã chạy sprint3 thì chỉ cần phần dưới)

-- Cho phép user sửa nội dung comment của mình
drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own"
  on public.comments for update
  using (auth.uid() = user_id);

-- Index phụ cho truy vấn theo thời gian
create index if not exists comments_created_at_idx on public.comments (created_at);
