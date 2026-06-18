CREATE TABLE IF NOT EXISTS attachments_tags (
  id UUID PRIMARY KEY,
  attachment_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attachment_id) REFERENCES attachments(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attachments_tags_attachment_id ON attachments_tags(attachment_id);
CREATE INDEX IF NOT EXISTS idx_attachments_tags_tag_id ON attachments_tags(tag_id);
