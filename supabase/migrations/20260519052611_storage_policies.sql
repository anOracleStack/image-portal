-- Storage buckets for Image Portal (idempotent).
-- Note: RLS is already enabled on storage.objects in hosted Supabase — do not ALTER it here.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('portal-images', 'portal-images', true, 10485760, array['image/png','image/jpeg','image/webp','image/gif']),
  ('portal-exports', 'portal-exports', true, 52428800, array['image/png','image/jpeg','application/pdf']),
  ('portal-cache', 'portal-cache', false, 10485760, null)
on conflict (id) do nothing;

-- portal-images: public read (served via /api/images with service role as fallback)
drop policy if exists "Public Select portal-images" on storage.objects;
create policy "Public Select portal-images"
  on storage.objects for select
  using (bucket_id = 'portal-images');

drop policy if exists "Auth Insert portal-images" on storage.objects;
create policy "Auth Insert portal-images"
  on storage.objects for insert
  with check (bucket_id = 'portal-images' and auth.role() = 'authenticated');

drop policy if exists "Auth Update own portal-images" on storage.objects;
create policy "Auth Update own portal-images"
  on storage.objects for update
  using (bucket_id = 'portal-images' and owner = auth.uid());

drop policy if exists "Auth Delete own portal-images" on storage.objects;
create policy "Auth Delete own portal-images"
  on storage.objects for delete
  using (bucket_id = 'portal-images' and owner = auth.uid());

-- portal-exports: public read
drop policy if exists "Public Select portal-exports" on storage.objects;
create policy "Public Select portal-exports"
  on storage.objects for select
  using (bucket_id = 'portal-exports');

drop policy if exists "Auth Insert portal-exports" on storage.objects;
create policy "Auth Insert portal-exports"
  on storage.objects for insert
  with check (bucket_id = 'portal-exports' and auth.role() = 'authenticated');

drop policy if exists "Auth Delete own portal-exports" on storage.objects;
create policy "Auth Delete own portal-exports"
  on storage.objects for delete
  using (bucket_id = 'portal-exports' and owner = auth.uid());

-- portal-cache: service uploads via admin key; authenticated read for app
drop policy if exists "Auth Select portal-cache" on storage.objects;
create policy "Auth Select portal-cache"
  on storage.objects for select
  using (bucket_id = 'portal-cache' and auth.role() = 'authenticated');

drop policy if exists "Auth Insert portal-cache" on storage.objects;
create policy "Auth Insert portal-cache"
  on storage.objects for insert
  with check (bucket_id = 'portal-cache' and auth.role() = 'authenticated');

drop policy if exists "Auth Delete own portal-cache" on storage.objects;
create policy "Auth Delete own portal-cache"
  on storage.objects for delete
  using (bucket_id = 'portal-cache' and owner = auth.uid());
