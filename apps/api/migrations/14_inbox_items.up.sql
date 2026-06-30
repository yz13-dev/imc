CREATE TABLE IF NOT EXISTS inbox_items (
    user_id text NOT NULL,

    attachment_id uuid NOT NULL,

    created_at timestamptz NOT NULL DEFAULT now(),

    PRIMARY KEY (user_id, attachment_id),

    FOREIGN KEY (attachment_id) REFERENCES attachments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS inbox_items_user_id_idx ON inbox_items (user_id);
CREATE INDEX IF NOT EXISTS inbox_items_attachment_id_idx ON inbox_items (attachment_id);
