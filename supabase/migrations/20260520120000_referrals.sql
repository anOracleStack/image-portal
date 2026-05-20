-- Referral codes on profiles
alter table public.profiles
  add column if not exists referral_code text unique,
  add column if not exists referred_by uuid references public.profiles(id) on delete set null;

create index if not exists profiles_referral_code_idx on public.profiles (referral_code);
