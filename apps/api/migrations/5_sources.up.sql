CREATE TABLE IF NOT EXISTS sources (
  id uuid primary key
    default gen_random_uuid(),

  slug text unique not null,

  name text not null,

  domain text,

  favicon_url text,

  created_at timestamptz not null
    default now()
);
