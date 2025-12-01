-- Storage encryption columns for originals and derived files
-- Up migration

BEGIN;

-- asset: originals encryption metadata
ALTER TABLE IF EXISTS "asset"
  ADD COLUMN IF NOT EXISTS "encrypted" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "encryptionAlgo" varchar NULL,
  ADD COLUMN IF NOT EXISTS "encryptionIv" bytea NULL,
  ADD COLUMN IF NOT EXISTS "encryptedDek" bytea NULL,
  ADD COLUMN IF NOT EXISTS "encryptionTag" bytea NULL,
  ADD COLUMN IF NOT EXISTS "encryptionVersion" integer NULL,
  ADD COLUMN IF NOT EXISTS "plaintextChecksum" bytea NULL;

-- Ensure default applied to existing rows
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asset') THEN
    UPDATE "asset" SET "encrypted" = COALESCE("encrypted", false) WHERE TRUE;
  END IF;
END $$;

-- asset_file: derived files encryption metadata
ALTER TABLE IF EXISTS "asset_file"
  ADD COLUMN IF NOT EXISTS "encrypted" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "encryptionAlgo" varchar NULL,
  ADD COLUMN IF NOT EXISTS "encryptionIv" bytea NULL,
  ADD COLUMN IF NOT EXISTS "encryptedDek" bytea NULL,
  ADD COLUMN IF NOT EXISTS "encryptionTag" bytea NULL,
  ADD COLUMN IF NOT EXISTS "encryptionVersion" integer NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asset_file') THEN
    UPDATE "asset_file" SET "encrypted" = COALESCE("encrypted", false) WHERE TRUE;
  END IF;
END $$;

COMMIT;

-- Down migration (rollback)
-- Note: dropping columns will remove encryption metadata
-- Execute manually if your tooling does not support down migrations
--
-- BEGIN;
-- ALTER TABLE "asset" 
--   DROP COLUMN IF EXISTS "plaintextChecksum",
--   DROP COLUMN IF EXISTS "encryptionVersion",
--   DROP COLUMN IF EXISTS "encryptionTag",
--   DROP COLUMN IF EXISTS "encryptedDek",
--   DROP COLUMN IF EXISTS "encryptionIv",
--   DROP COLUMN IF EXISTS "encryptionAlgo",
--   DROP COLUMN IF EXISTS "encrypted";
--
-- ALTER TABLE "asset_file"
--   DROP COLUMN IF EXISTS "encryptionVersion",
--   DROP COLUMN IF EXISTS "encryptionTag",
--   DROP COLUMN IF EXISTS "encryptedDek",
--   DROP COLUMN IF EXISTS "encryptionIv",
--   DROP COLUMN IF EXISTS "encryptionAlgo",
--   DROP COLUMN IF EXISTS "encrypted";
-- COMMIT;
