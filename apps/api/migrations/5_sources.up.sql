CREATE TABLE IF NOT EXISTS sources (
  id uuid primary key
    default gen_random_uuid(),

  slug text unique not null,

  name text not null,

  domain text,

  favicon_url text,

  created_at timestamptz not null
    default now(),
);

CREATE INDEX IF NOT EXISTS idx_sources_slug ON sources(slug);
CREATE INDEX IF NOT EXISTS idx_sources_domain ON sources(domain);
