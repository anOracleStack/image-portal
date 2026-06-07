-- Security Advisor hardening v2 (remaining 6 → ~1–2 warnings).
-- Apply via SQL Editor or supabase db push (see docs/USER_SETUP.md).

-- ── 1. handle_new_user: trigger-only (not callable by clients) ───────────────

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public'
      and p.proname = 'handle_new_user'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    revoke execute on function public.handle_new_user() from public, anon, authenticated;
    grant execute on function public.handle_new_user() to service_role;
  end if;
end $$;

-- ── 2. match_fingerprints: service_role only ─────────────────────────────────

revoke execute on function public.match_fingerprints(vector, int, text, int)
  from public, anon, authenticated;

grant execute on function public.match_fingerprints(vector, int, text, int)
  to service_role;

-- ── 3. portal-images: private bucket (served via Next.js API routes) ─────────

update storage.buckets
set public = false
where id = 'portal-images';

drop policy if exists "Public Select portal-images" on storage.objects;

drop policy if exists "Owner Select portal-images" on storage.objects;
create policy "Owner Select portal-images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'portal-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
