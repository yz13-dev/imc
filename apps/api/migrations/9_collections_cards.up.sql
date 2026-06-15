CREATE TABLE IF NOT EXISTS collection_cards (
  collection_id uuid not null
    references collections(id)
    on delete cascade,

  card_id uuid not null
    references cards(id)
    on delete cascade,

  sort_order integer not null
    default 0,

  created_at timestamptz not null
    default now(),

  primary key(collection_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_cards_collection
  ON collection_cards(collection_id);

CREATE INDEX IF NOT EXISTS idx_collection_cards_card
  ON collection_cards(card_id);
