ALTER TABLE attachments
  ADD COLUMN description text,
  ADD COLUMN ai_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN ai_processed_at timestamptz,
  ADD COLUMN ai_attempts integer NOT NULL DEFAULT 0,
  ADD CONSTRAINT valid_ai_status CHECK (ai_status IN ('pending', 'processing', 'done', 'failed'));

CREATE INDEX IF NOT EXISTS idx_attachments_ai_pending
  ON attachments (created_at)
  WHERE ai_status = 'pending' AND is_deleted = false;

ALTER TABLE attachments_tags
  ADD CONSTRAINT uq_attachments_tags UNIQUE (attachment_id, tag_id);
