-- Security Advisor hardening (splinter warnings).
-- All app writes to these tables go through Next.js API routes using the service role key.

-- ── 1. Pin search_path on RPC functions ─────────────────────────────────────

create or replace function public.increment_scans(p_id uuid)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.portals
  set total_scans = total_scans + 1
  where id = p_id;
$$;

create or replace function public.increment_scan_usage(p_user_id uuid, p_month date)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.subscription_usage (user_id, month, scan_count)
  values (p_user_id, p_month, 1)
  on conflict on constraint subscription_usage_user_month_unique
  do update set scan_count = public.subscription_usage.scan_count + 1;
end;
$$;

create or replace function public.increment_portal_count(p_user_id uuid, p_month date)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.subscription_usage (user_id, month, portal_count)
  values (p_user_id, p_month, 1)
  on conflict on constraint subscription_usage_user_month_unique
  do update set portal_count = public.subscription_usage.portal_count + 1;
end;
$$;

revoke execute on function public.increment_scans(uuid) from public, anon, authenticated;
revoke execute on function public.increment_scan_usage(uuid, date) from public, anon, authenticated;
revoke execute on function public.increment_portal_count(uuid, date) from public, anon, authenticated;

grant execute on function public.increment_scans(uuid) to service_role;
grant execute on function public.increment_scan_usage(uuid, date) to service_role;
grant execute on function public.increment_portal_count(uuid, date) to service_role;

-- ── 2. Remove overly permissive RLS write policies ──────────────────────────
-- Service role bypasses RLS; authenticated users must not write billing rows directly.

drop policy if exists "service_role_write_subscriptions" on public.subscriptions;
drop policy if exists "service_role_write_usage" on public.subscription_usage;

-- Public insert policies (server inserts via service role only).
drop policy if exists "anyone inserts scan events" on public.scan_events;
drop policy if exists "anyone reports abuse" on public.abuse_reports;
drop policy if exists "anyone files takedown" on public.takedowns;

-- ── 3. portal-exports: private bucket (no public listing) ───────────────────
-- Export downloads use signed URLs from /api/portals/[id]/export.

update storage.buckets
set public = false
where id = 'portal-exports';

drop policy if exists "Public Select portal-exports" on storage.objects;

-- Owners may read their own export objects when using the authenticated client.
drop policy if exists "Owner Select portal-exports" on storage.objects;
create policy "Owner Select portal-exports"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'portal-exports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Auth Insert portal-exports" on storage.objects;
create policy "Owner Insert portal-exports"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'portal-exports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
