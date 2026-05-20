-- Stage A retrieval RPC + scan counter. Run after 0001_init.sql.
-- HNSW cosine; returns ONLY active+public rows of the correct model/version
-- (Law 4). Fingerprints/embeddings are never exposed to clients — this
-- SECURITY DEFINER function is the only read path, called by the server.

create or replace function match_fingerprints(
  query_embedding vector,
  match_count int,
  want_model text,
  want_version int
)
returns table (
  portal_id uuid,
  portal_image_id uuid,
  title text,
  slug text,
  destination_domain text,
  similarity float
)
language sql stable security definer set search_path = public as $$
  select
    p.id,
    f.portal_image_id,
    p.title,
    p.slug,
    split_part(regexp_replace(p.destination_url,'^https?://',''),'/',1) as destination_domain,
    1 - (f.embedding <=> query_embedding) as similarity
  from portal_fingerprints f
  join portals p on p.id = f.portal_id
  where p.status = 'active'
    and p.visibility = 'public'
    and f.embedding_model = want_model
    and f.embedding_version = want_version
  order by f.embedding <=> query_embedding
  limit match_count;
$$;

create or replace function increment_scans(p_id uuid)
returns void language sql as $$
  update portals set total_scans = total_scans + 1 where id = p_id;
$$;
