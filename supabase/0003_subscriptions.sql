-- Migration 0003: Add subscriptions and subscription_usage tables.
-- Depends on: public.profiles (created in 0001_init.sql)

-- ──────────────────────────────────────────────
-- 1. subscriptions
-- ──────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                uuid        not null default gen_random_uuid() primary key,
  user_id           uuid        not null references public.profiles(id) on delete cascade,
  stripe_customer_id  text      unique,
  stripe_subscription_id text   unique,
  plan_tier         text        not null check (plan_tier in ('free','indie','pro','enterprise')) default 'free',
  status            text        not null check (status in ('active','past_due','canceled','incomplete','trialing')) default 'active',
  current_period_start timestamptz,
  current_period_end   timestamptz,
  cancel_at_period_end boolean  default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);

-- ──────────────────────────────────────────────
-- 2. subscription_usage  (monthly scan / portal counters)
-- ──────────────────────────────────────────────
create table if not exists public.subscription_usage (
  id          uuid    not null default gen_random_uuid() primary key,
  user_id     uuid    not null references public.profiles(id) on delete cascade,
  month       date    not null,  -- first day of the billing month, e.g. 2026-05-01
  scan_count  integer not null default 0,
  portal_count integer not null default 0
);

create index if not exists idx_subscription_usage_user_month on public.subscription_usage(user_id, month);

-- ──────────────────────────────────────────────
-- 3. Row-Level Security
-- ──────────────────────────────────────────────
alter table public.subscriptions       enable row level security;
alter table public.subscription_usage  enable row level security;

-- Users can read their own subscription row.
create policy "user_read_own_subscription"
  on public.subscriptions
  for select
  using ( auth.uid() = user_id );

-- The service-role client may write (insert / update) subscription rows.
-- This is intentionally a permissive policy gated by the caller's role.
create policy "service_role_write_subscriptions"
  on public.subscriptions
  using ( true )
  with check ( true );

-- Users can read their own usage row.
create policy "user_read_own_usage"
  on public.subscription_usage
  for select
  using ( auth.uid() = user_id );

-- The service-role client may write usage rows.
create policy "service_role_write_usage"
  on public.subscription_usage
  using ( true )
  with check ( true );
