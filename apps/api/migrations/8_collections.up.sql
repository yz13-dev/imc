CREATE TABLE IF NOT EXISTS collections (
  id uuid primary key
    default gen_random_uuid(),

  user_id BIGSERIAL not null
    references users(id)
    on delete cascade,

  name text not null,

  description text,

  public boolean not null
    default false,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now()
);

CREATE INDEX IF NOT EXISTS idx_collections_user_id
  on collections(user_id);
