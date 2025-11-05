import { Kysely, sql } from 'kysely';

/**
 * Add autoStackSource provenance column to asset_exif.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE asset_exif ADD COLUMN IF NOT EXISTS "autoStackSource" character varying;`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS asset_exif_autoStackSource_idx ON asset_exif("autoStackSource") WHERE "autoStackSource" IS NOT NULL;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS asset_exif_autoStackSource_idx;`.execute(db);
  await sql`ALTER TABLE asset_exif DROP COLUMN IF EXISTS "autoStackSource";`.execute(db);
}
