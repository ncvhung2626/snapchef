-- Storage buckets + policies

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('post-images', 'post-images', true),
  ('post-videos', 'post-videos', true),
  ('group-covers', 'group-covers', true),
  ('reels', 'reels', true),
  ('report-evidence', 'report-evidence', false)
on conflict (id) do nothing;

-- avatars: public read, user upload own folder {userId}/*
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_upload_own" on storage.objects;
create policy "avatars_upload_own" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- post-images / post-videos: authenticated upload, public read
drop policy if exists "post_media_public_read" on storage.objects;
create policy "post_media_public_read" on storage.objects for select
  using (bucket_id in ('post-images', 'post-videos', 'group-covers', 'reels'));

drop policy if exists "post_media_auth_upload" on storage.objects;
create policy "post_media_auth_upload" on storage.objects for insert
  with check (
    bucket_id in ('post-images', 'post-videos', 'group-covers', 'reels')
    and auth.uid() is not null
  );

-- report-evidence: private, reporter only
drop policy if exists "report_evidence_own" on storage.objects;
create policy "report_evidence_own" on storage.objects for all
  using (bucket_id = 'report-evidence' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'report-evidence' and auth.uid()::text = (storage.foldername(name))[1]);
