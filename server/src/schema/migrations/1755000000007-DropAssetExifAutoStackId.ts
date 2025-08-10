import { Kysely, sql } from 'kysely';

/**
 * Drop deprecated autoStackId column (EXIF-based burst grouping) from asset_exif.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // Remove index then column if they still exist
  await sql`DROP INDEX IF EXISTS asset_exif_autoStackId_idx;`.execute(db);
  await sql`ALTER TABLE asset_exif DROP COLUMN IF EXISTS "autoStackId";`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Recreate column (nullable) and index for rollback
  await sql`ALTER TABLE asset_exif ADD COLUMN IF NOT EXISTS "autoStackId" character varying;`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS asset_exif_autoStackId_idx ON asset_exif("autoStackId") WHERE "autoStackId" IS NOT NULL;`.execute(db);
}
