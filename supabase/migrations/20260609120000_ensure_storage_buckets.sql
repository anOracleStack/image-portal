-- Ensure Image Portal storage buckets exist (idempotent).
-- Safe to run on production if buckets were never created via earlier migrations.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'portal-images',
    'portal-images',
    false,
    10485760,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/json']
  ),
  (
    'portal-cache',
    'portal-cache',
    false,
    10485760,
    null
  ),
  (
    'portal-exports',
    'portal-exports',
    false,
    52428800,
    array['image/png', 'image/jpeg', 'application/pdf']
  ),
  (
    'avatars',
    'avatars',
    true,
    2097152,
    array['image/png', 'image/jpeg', 'image/webp']
  )
on conflict (id) do update set
  name = excluded.name,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
