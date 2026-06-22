


CREATE TABLE IF NOT EXISTS collections_attachments (
  id uuid primary key
    default gen_random_uuid(),
  attachment_id uuid
    references attachments(id)
    on delete cascade,
  collection_id uuid
    references collections(id)
    on delete cascade
);

CREATE INDEX idx_collections_attachments_attachment_id ON collections_attachments(attachment_id);
CREATE INDEX idx_collections_attachments_collection_id ON collections_attachments(collection_id);
