CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attachments_user_active_created_at
  ON attachments (user_id, created_at DESC)
  WHERE is_deleted = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attachments_user_deleted_created_at
  ON attachments (user_id, created_at DESC)
  WHERE is_deleted = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inbox_items_user_created_at
  ON inbox_items (user_id, created_at DESC);
