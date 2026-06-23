
CREATE TYPE attachment_kind AS ENUM (
  'image',
  'video'
);
CREATE TABLE IF NOT EXISTS attachments (
  -- ID вложения
  id uuid primary key
    default gen_random_uuid(),

  user_id BIGSERIAL not null
    references users(id)
    on delete cascade,

  source_id uuid
    references sources(id)
    on delete cascade,

  is_deleted boolean not null default false,

  type attachment_kind not null,
  label text,
  -- MIME type
  mime_type text not null,
  -- Путь в storage (НЕ URL)
  src text not null,
  -- Размеры
  width integer,
  height integer,
  -- Длительность для видео
  duration_ms integer,
  -- Размер файла
  file_size bigint,
  -- Главное вложение карточки
  is_cover boolean not null default false,
  -- Blurhash для placeholder
  blurhash text,
  -- Дата загрузки
  created_at timestamptz not null
    default now(),
    -- Валидации
    constraint valid_dimensions check (
      width is null or width > 0
    ),

    constraint valid_height check (
      height is null or height > 0
    ),

    constraint valid_duration check (
      duration_ms is null or duration_ms >= 0
    ),

    constraint valid_file_size check (
      file_size is null or file_size > 0
    )
);

CREATE INDEX IF NOT EXISTS idx_attachments_user_id
  on attachments(user_id);
-- Быстро получить вложения карточки
CREATE INDEX IF NOT EXISTS idx_attachments_card_id
  ON attachments(card_id);

-- Только одна обложка на карточку
CREATE UNIQUE INDEX IF NOT EXISTS idx_attachment_single_cover
  ON attachments(card_id)
  WHERE is_cover = true;
