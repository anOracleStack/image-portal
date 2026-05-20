-- IMAGE PORTAL — CANONICAL SCHEMA
-- Authority: docs/IMAGE_PORTAL_MASTER_SPEC.md
-- Run in Supabase SQL editor / as the first migration.
-- NOTE: set EMBED_DIM to the pinned model's dimension (e.g. 768 DINOv2, 512 SSCD)
-- by replacing vector(768) below before running. Do not vary per row.

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  handle        text unique,
  display_name  text,
  avatar_url    text,
  website_url   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- portals
-- ----------------------------------------------------------------------------
create table public.portals (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references public.profiles(id) on delete cascade,
  title            text not null,
  slug             text not null unique,
  destination_url  text not null,
  status           text not null default 'active'
                     check (status in ('active','inactive','suspended')),
  scan_mode        text not null default 'image'
                     check (scan_mode in ('image','hybrid')),
  visibility       text not null default 'public'
                     check (visibility in ('public','private')),
  total_scans      integer not null default 0,
  last_scanned_at  timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- portal_images
-- ----------------------------------------------------------------------------
create table public.portal_images (
  id            uuid primary key default gen_random_uuid(),
  portal_id     uuid not null references public.portals(id) on delete cascade,
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  storage_path  text not null,
  public_url    text,
  mime_type     text,
  file_size     integer,
  width         integer,
  height        integer,
  sha256        text,
  phash         text,
  dhash         text,
  quality_score numeric,                 -- warns only; never gates upload
  is_primary    boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- portal_fingerprints
-- embedding_model + embedding_version enforce the consistency invariant.
-- ----------------------------------------------------------------------------
create table public.portal_fingerprints (
  id                uuid primary key default gen_random_uuid(),
  portal_id         uuid not null references public.portals(id) on delete cascade,
  portal_image_id   uuid not null references public.portal_images(id) on delete cascade,
  phash             text,
  dhash             text,
  embedding         vector(768),         -- <-- set to pinned model dim before running
  embedding_model   text not null,       -- e.g. 'sscd_disc_mixup' / 'dinov2_vitb14'
  embedding_version integer not null default 1,
  created_at        timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- scan_events  (ip_hash, never raw IP)
-- ----------------------------------------------------------------------------
create table public.scan_events (
  id                 uuid primary key default gen_random_uuid(),
  portal_id          uuid references public.portals(id) on delete set null,
  matched            boolean not null default false,
  confidence         numeric,
  embedding_distance numeric,
  inlier_count       integer,
  match_method       text,               -- 'embedding+orb' | 'phash' | 'qr'
  device_platform    text,               -- 'ios' | 'android' | 'web'
  source             text,               -- 'app' | 'pwa' | 'qr'
  source_type        text default 'unknown'
                       check (source_type in ('screen','print','unknown')),
  ip_hash            text,
  opened_url         boolean not null default false,
  created_at         timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- portal_exports
-- ----------------------------------------------------------------------------
create table public.portal_exports (
  id          uuid primary key default gen_random_uuid(),
  portal_id   uuid not null references public.portals(id) on delete cascade,
  export_type text not null
                check (export_type in ('image_only','image_qr','poster')),
  file_url    text,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- abuse_reports
-- ----------------------------------------------------------------------------
create table public.abuse_reports (
  id          uuid primary key default gen_random_uuid(),
  portal_id   uuid references public.portals(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason      text not null,
  details     text,
  status      text not null default 'open'
                check (status in ('open','reviewing','resolved','dismissed')),
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- takedowns  (ownership / DMCA / trademark dispute path)
-- ----------------------------------------------------------------------------
create table public.takedowns (
  id           uuid primary key default gen_random_uuid(),
  portal_id    uuid not null references public.portals(id) on delete cascade,
  claimant_id  uuid references public.profiles(id) on delete set null,
  claim_type   text not null check (claim_type in ('ownership','dmca','trademark')),
  evidence_url text,
  status       text not null default 'open'
                 check (status in ('open','reviewing','upheld','rejected')),
  created_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- indexes
-- ----------------------------------------------------------------------------
create index portals_owner_id_idx          on public.portals(owner_id);
create index portals_slug_idx              on public.portals(slug);
create index portal_images_portal_id_idx   on public.portal_images(portal_id);
create index portal_images_phash_idx       on public.portal_images(phash);
create index portal_images_sha256_idx      on public.portal_images(sha256);
create index pf_portal_id_idx              on public.portal_fingerprints(portal_id);
create index pf_version_idx                on public.portal_fingerprints(embedding_version);
create index scan_events_portal_id_idx     on public.scan_events(portal_id);
create index scan_events_created_at_idx    on public.scan_events(created_at desc);

-- HNSW ANN index for retrieve stage (cosine). Recall-oriented; verify stage decides.
create index pf_embedding_hnsw
  on public.portal_fingerprints
  using hnsw (embedding vector_cosine_ops);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.portals             enable row level security;
alter table public.portal_images       enable row level security;
alter table public.portal_fingerprints enable row level security;
alter table public.scan_events         enable row level security;
alter table public.portal_exports      enable row level security;
alter table public.abuse_reports       enable row level security;
alter table public.takedowns           enable row level security;

create policy "profiles readable"        on public.profiles for select using (true);
create policy "insert own profile"       on public.profiles for insert with check (auth.uid() = id);
create policy "update own profile"       on public.profiles for update using (auth.uid() = id);

create policy "public active readable"   on public.portals for select
  using (visibility = 'public' and status = 'active');
create policy "owner reads own portals"  on public.portals for select using (auth.uid() = owner_id);
create policy "owner inserts portals"    on public.portals for insert with check (auth.uid() = owner_id);
create policy "owner updates portals"    on public.portals for update using (auth.uid() = owner_id);
create policy "owner deletes portals"    on public.portals for delete using (auth.uid() = owner_id);

create policy "owner manages images"     on public.portal_images for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Fingerprints/embeddings are NEVER client-selectable.
-- Reached only by the server (service role) inside /api/scan. No select policy.
create policy "owner manages fingerprints" on public.portal_fingerprints for all
  using (exists (select 1 from public.portals p
                 where p.id = portal_fingerprints.portal_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.portals p
                 where p.id = portal_fingerprints.portal_id and p.owner_id = auth.uid()));

create policy "owner reads own scan events" on public.scan_events for select
  using (exists (select 1 from public.portals p
                 where p.id = scan_events.portal_id and p.owner_id = auth.uid()));
create policy "anyone inserts scan events"  on public.scan_events for insert with check (true);

create policy "owner manages exports"    on public.portal_exports for all
  using (exists (select 1 from public.portals p
                 where p.id = portal_exports.portal_id and p.owner_id = auth.uid()));

create policy "anyone reports abuse"     on public.abuse_reports for insert with check (true);
create policy "owner reads own reports"  on public.abuse_reports for select
  using (exists (select 1 from public.portals p
                 where p.id = abuse_reports.portal_id and p.owner_id = auth.uid()));

create policy "anyone files takedown"    on public.takedowns for insert with check (true);
create policy "owner reads own takedowns" on public.takedowns for select
  using (exists (select 1 from public.portals p
                 where p.id = takedowns.portal_id and p.owner_id = auth.uid()));

-- ----------------------------------------------------------------------------
-- storage buckets (create via dashboard or storage API):
--   portal-images   : auth upload to own uid folder; public read only when
--                      owning portal is public+active
--   portal-exports   : auth create; public read optional
--   avatars          : auth upload; public read
-- ----------------------------------------------------------------------------
