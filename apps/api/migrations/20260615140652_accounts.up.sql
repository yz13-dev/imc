CREATE TABLE IF NOT EXISTS accounts (
  id BIGSERIAL,
  user_id BIGINT NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  access_token_expires_at TIMESTAMPTZ,
  scope VARCHAR(255) NOT NULL,
  id_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (id),
CONSTRAINT fk_accounts_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX idx_accounts_user_id_provider ON accounts (user_id);
CREATE UNIQUE INDEX idx_accounts_provider_provider_account_id ON accounts (provider, provider_account_id);
