DELETE FROM collections_attachments AS duplicate
USING collections_attachments AS original
WHERE duplicate.collection_id = original.collection_id
  AND duplicate.attachment_id = original.attachment_id
  AND duplicate.id > original.id;

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_collections_attachments_collection_attachment
  ON collections_attachments (collection_id, attachment_id);
