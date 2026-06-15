CREATE TABLE IF NOT EXISTS tags (
  id uuid primary key
    default gen_random_uuid(),

  user_id uuid not null
    references users(id)
    on delete cascade,

  name text not null,

  created_at timestamptz not null
    default now(),

  unique(user_id, name)
);
create index idx_tags_user_id
  on tags(user_id);
