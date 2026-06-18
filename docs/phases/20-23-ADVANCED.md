# Phase 20–23 — Algorithms, Offline, Admin, Performance

## 20 Algorithms

**Feed score (v1):**

```sql
order by (
  (select count(*) from post_likes pl where pl.post_id = p.id) * 2
  + (select count(*) from comments c where c.post_id = p.id and c.deleted_at is null) * 3
) desc,
p.created_at desc
```

Đặt trong `postRepository.listPostsPage` hoặc materialized view sau.

## 21 Offline

- Draft post: `postStore` + AsyncStorage key `draft:post`
- TanStack `persistQueryClient` — optional tuần 11
- Invalidate: sau mutation gọi `queryClient.invalidateQueries`

## 22 Admin

- Role từ `profiles.role`
- Report queue: `reports` where status=pending
- `admin_logs` insert on moderate action

## 23 Performance

| Vấn đề | Xử lý |
|--------|--------|
| Feed scroll jank | `@shopify/flash-list` — cài tuần 10 |
| Re-render PostCard | `React.memo` + stable callbacks |
| Ảnh lớn | `expo-image-manipulator` compress trước upload |
| Realtime nhiều channel | subscribe chỉ screen active |
