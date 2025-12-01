import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset" 
    ADD COLUMN IF NOT EXISTS "encrypted" boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS "encryptionAlgo" varchar NULL,
    ADD COLUMN IF NOT EXISTS "encryptionIv" bytea NULL,
    ADD COLUMN IF NOT EXISTS "encryptedDek" bytea NULL,
    ADD COLUMN IF NOT EXISTS "encryptionTag" bytea NULL,
    ADD COLUMN IF NOT EXISTS "encryptionVersion" integer NULL,
    ADD COLUMN IF NOT EXISTS "plaintextChecksum" bytea NULL;`.execute(db);

  await sql`UPDATE "asset" SET "encrypted" = COALESCE("encrypted", false);`.execute(db);

  await sql`ALTER TABLE "asset_file"
    ADD COLUMN IF NOT EXISTS "encrypted" boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS "encryptionAlgo" varchar NULL,
    ADD COLUMN IF NOT EXISTS "encryptionIv" bytea NULL,
    ADD COLUMN IF NOT EXISTS "encryptedDek" bytea NULL,
    ADD COLUMN IF NOT EXISTS "encryptionTag" bytea NULL,
    ADD COLUMN IF NOT EXISTS "encryptionVersion" integer NULL;`.execute(db);

  await sql`UPDATE "asset_file" SET "encrypted" = COALESCE("encrypted", false);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset" 
    DROP COLUMN IF EXISTS "plaintextChecksum",
    DROP COLUMN IF EXISTS "encryptionVersion",
    DROP COLUMN IF EXISTS "encryptionTag",
    DROP COLUMN IF EXISTS "encryptedDek",
    DROP COLUMN IF EXISTS "encryptionIv",
    DROP COLUMN IF EXISTS "encryptionAlgo",
    DROP COLUMN IF EXISTS "encrypted";`.execute(db);

  await sql`ALTER TABLE "asset_file"
    DROP COLUMN IF EXISTS "encryptionVersion",
    DROP COLUMN IF EXISTS "encryptionTag",
    DROP COLUMN IF EXISTS "encryptedDek",
    DROP COLUMN IF EXISTS "encryptionIv",
    DROP COLUMN IF EXISTS "encryptionAlgo",
    DROP COLUMN IF EXISTS "encrypted";`.execute(db);
}
