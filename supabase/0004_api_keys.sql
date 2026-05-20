create table if not exists public.user_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'default',
  key_hash text not null,
  key_prefix text not null,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_api_keys_user_id on public.user_api_keys(user_id);

alter table public.user_api_keys enable row level security;

create policy "owner manages api keys" on public.user_api_keys
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
