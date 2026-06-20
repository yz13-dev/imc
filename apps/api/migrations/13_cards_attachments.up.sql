

CREATE TABLE IF NOT EXISTS cards_attachments (
  id uuid primary key
    default gen_random_uuid(),
  card_id uuid
    references cards(id)
    on delete cascade,
  attachment_id uuid
    references attachments(id)
    on delete cascade
);

CREATE INDEX idx_cards_attachments_card_id ON cards_attachments(card_id);
CREATE INDEX idx_cards_attachments_attachment_id ON cards_attachments(attachment_id);
