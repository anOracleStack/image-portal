-- Create storage buckets (idempotent)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('images', 'images', true, 10485760, array['image/png','image/jpeg','image/webp','image/gif']),
  ('exports', 'exports', true, 52428800, array['image/png','image/jpeg','application/pdf']),
  ('caches', 'caches', false, 10485760, null)
on conflict (id) do nothing;

-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- images bucket: public read
drop policy if exists "Public Select images" on storage.objects;
create policy "Public Select images"
  on storage.objects for select
  using (bucket_id = 'images');

-- images bucket: authenticated users can insert
drop policy if exists "Auth Insert images" on storage.objects;
create policy "Auth Insert images"
  on storage.objects for insert
  with check (bucket_id = 'images' and auth.role() = 'authenticated');

-- images bucket: users can update their own images
drop policy if exists "Auth Update own images" on storage.objects;
create policy "Auth Update own images"
  on storage.objects for update
  using (bucket_id = 'images' and owner = auth.uid());

-- images bucket: users can delete their own images
drop policy if exists "Auth Delete own images" on storage.objects;
create policy "Auth Delete own images"
  on storage.objects for delete
  using (bucket_id = 'images' and owner = auth.uid());

-- exports bucket: public read
drop policy if exists "Public Select exports" on storage.objects;
create policy "Public Select exports"
  on storage.objects for select
  using (bucket_id = 'exports');

-- exports bucket: authenticated insert
drop policy if exists "Auth Insert exports" on storage.objects;
create policy "Auth Insert exports"
  on storage.objects for insert
  with check (bucket_id = 'exports' and auth.role() = 'authenticated');

-- exports bucket: users can delete their own exports
drop policy if exists "Auth Delete own exports" on storage.objects;
create policy "Auth Delete own exports"
  on storage.objects for delete
  using (bucket_id = 'exports' and owner = auth.uid());

-- caches bucket: authenticated users can read
drop policy if exists "Auth Select caches" on storage.objects;
create policy "Auth Select caches"
  on storage.objects for select
  using (bucket_id = 'caches' and auth.role() = 'authenticated');

-- caches bucket: authenticated users can insert
drop policy if exists "Auth Insert caches" on storage.objects;
create policy "Auth Insert caches"
  on storage.objects for insert
  with check (bucket_id = 'caches' and auth.role() = 'authenticated');

-- caches bucket: owners can delete
drop policy if exists "Auth Delete own caches" on storage.objects;
create policy "Auth Delete own caches"
  on storage.objects for delete
  using (bucket_id = 'caches' and owner = auth.uid());
