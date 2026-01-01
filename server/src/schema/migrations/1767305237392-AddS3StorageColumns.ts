import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create storage backend enum type
  await sql`
    DO $$ BEGIN
      CREATE TYPE storage_backend_enum AS ENUM ('local', 's3');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `.execute(db);

  // Add storage columns to asset table
  await sql`
    ALTER TABLE "asset"
    ADD COLUMN IF NOT EXISTS "storageBackend" storage_backend_enum NOT NULL DEFAULT 'local',
    ADD COLUMN IF NOT EXISTS "s3Bucket" character varying,
    ADD COLUMN IF NOT EXISTS "s3Key" character varying;
  `.execute(db);

  // Add storage columns to asset_file table for thumbnails/previews in S3
  await sql`
    ALTER TABLE "asset_file"
    ADD COLUMN IF NOT EXISTS "storageBackend" storage_backend_enum NOT NULL DEFAULT 'local',
    ADD COLUMN IF NOT EXISTS "s3Bucket" character varying,
    ADD COLUMN IF NOT EXISTS "s3Key" character varying;
  `.execute(db);

  // Add index for finding S3 assets
  await sql`
    CREATE INDEX IF NOT EXISTS "asset_storage_backend_idx" ON "asset" ("storageBackend")
    WHERE "storageBackend" = 's3';
  `.execute(db);

  // Add index for finding S3 asset files
  await sql`
    CREATE INDEX IF NOT EXISTS "asset_file_storage_backend_idx" ON "asset_file" ("storageBackend")
    WHERE "storageBackend" = 's3';
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Remove indexes
  await sql`DROP INDEX IF EXISTS "asset_storage_backend_idx";`.execute(db);
  await sql`DROP INDEX IF EXISTS "asset_file_storage_backend_idx";`.execute(db);

  // Remove columns from asset_file
  await sql`
    ALTER TABLE "asset_file"
    DROP COLUMN IF EXISTS "storageBackend",
    DROP COLUMN IF EXISTS "s3Bucket",
    DROP COLUMN IF EXISTS "s3Key";
  `.execute(db);

  // Remove columns from asset
  await sql`
    ALTER TABLE "asset"
    DROP COLUMN IF EXISTS "storageBackend",
    DROP COLUMN IF EXISTS "s3Bucket",
    DROP COLUMN IF EXISTS "s3Key";
  `.execute(db);

  // Note: We don't drop the enum type in down() to avoid issues if other tables use it
}
