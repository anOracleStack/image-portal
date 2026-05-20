-- Add unique constraint for upsert
alter table public.subscription_usage
  drop constraint if exists subscription_usage_user_month_unique;
alter table public.subscription_usage
  add constraint subscription_usage_user_month_unique
  unique (user_id, month);

-- RPC to increment scan count for a user's billing month.
-- idempotent: creates the row if it doesn't exist.
create or replace function increment_scan_usage(p_user_id uuid, p_month date)
returns void
language plpgsql
as $$
begin
  insert into subscription_usage (user_id, month, scan_count)
  values (p_user_id, p_month, 1)
  on conflict on constraint subscription_usage_user_month_unique
  do update set scan_count = subscription_usage.scan_count + 1;
end;
$$;

-- RPC to increment portal count for a user's billing month.
create or replace function increment_portal_count(p_user_id uuid, p_month date)
returns void
language plpgsql
as $$
begin
  insert into subscription_usage (user_id, month, portal_count)
  values (p_user_id, p_month, 1)
  on conflict on constraint subscription_usage_user_month_unique
  do update set portal_count = subscription_usage.portal_count + 1;
end;
$$;
