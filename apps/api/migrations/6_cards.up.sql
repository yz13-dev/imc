CREATE TABLE IF NOT EXISTS cards (
  -- ID карточки
  id uuid primary key
    default gen_random_uuid(),

  -- Владелец карточки
  user_id BIGSERIAL not null
    references users(id)
    on delete cascade,

  -- Название
  title text not null,

  -- Описание / заметки
  description text,

  -- Источник
  source_id uuid
    references sources(id)
    on delete set null,

  -- Timestamps
  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now()
);
CREATE INDEX IF NOT EXISTS idx_cards_user_id
  on cards(user_id);

CREATE INDEX IF NOT EXISTS idx_cards_created_at
  on cards(user_id, created_at desc);
