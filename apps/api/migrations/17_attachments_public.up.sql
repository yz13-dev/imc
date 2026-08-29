ALTER TABLE attachments
  ADD COLUMN IF NOT EXISTS public boolean NOT NULL DEFAULT false;
