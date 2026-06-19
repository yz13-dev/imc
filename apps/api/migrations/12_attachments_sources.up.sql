CREATE TABLE IF NOT EXISTS attachments_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attachment_id UUID NOT NULL,
  source_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attachment_id) REFERENCES attachments(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attachments_sources_attachment_id ON attachments_sources(attachment_id);
CREATE INDEX IF NOT EXISTS idx_attachments_sources_source_id ON attachments_sources(source_id);
