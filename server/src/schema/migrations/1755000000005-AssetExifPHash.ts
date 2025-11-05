import { Kysely, sql } from 'kysely';

// Add perceptual hash column (pHash) to asset_exif for structural visual similarity.
// Chosen type: character varying (store 16-char hex for 64-bit hash) to keep portability.
export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE asset_exif ADD COLUMN IF NOT EXISTS "pHash" character varying;`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS asset_exif_pHash_idx ON asset_exif("pHash") WHERE "pHash" IS NOT NULL;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS asset_exif_pHash_idx;`.execute(db);
  await sql`ALTER TABLE asset_exif DROP COLUMN IF EXISTS "pHash";`.execute(db);
}
