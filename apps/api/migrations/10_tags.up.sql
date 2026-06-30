CREATE TABLE IF NOT EXISTS tags (
  id uuid primary key
    default gen_random_uuid(),

  user_id text not null,

  name text not null,

  created_at timestamptz not null
    default now(),

  unique(user_id, name)
);
CREATE INDEX IF NOT EXISTS idx_tags_user_id
  on tags(user_id);
