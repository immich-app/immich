import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "album" ADD COLUMN IF NOT EXISTS "orderBy" character varying NOT NULL DEFAULT 'date';`.execute(db);
  await sql`ALTER TABLE "album_asset" ADD COLUMN IF NOT EXISTS "position" text;`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_album_asset_album_position ON album_asset ("albumId", "position" COLLATE "C");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "album" DROP COLUMN IF EXISTS "orderBy";`.execute(db);
  await sql`ALTER TABLE "album_asset" DROP COLUMN IF EXISTS "position";`.execute(db);
}
