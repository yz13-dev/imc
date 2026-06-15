CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255),
  email_verified_at TIMESTAMPTZ,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL,
  username VARCHAR(255),
  PRIMARY KEY (id)
);
CREATE UNIQUE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_username ON users (username);
