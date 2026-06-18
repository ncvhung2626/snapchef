-- Group admin/owner can remove members (bảo vệ đồ án)
create policy "group_members_delete_by_admin"
  on public.group_members for delete
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role in ('owner', 'admin')
    )
  );

-- Group owner/admin can soft-delete posts in their group
create policy "posts_delete_group_admin"
  on public.posts for update
  using (
    group_id is not null
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = posts.group_id
        and gm.user_id = auth.uid()
        and gm.role in ('owner', 'admin')
    )
  )
  with check (true);
