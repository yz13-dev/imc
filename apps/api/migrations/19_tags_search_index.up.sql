CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tags_name_trgm
  ON tags USING GIN (name gin_trgm_ops);
