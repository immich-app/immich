import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "albums_assets_assets" ADD "updatedAt" timestamp with time zone NOT NULL DEFAULT now();`.execute(db);
  await sql`ALTER TABLE "albums_assets_assets" ADD "updateId" uuid NOT NULL DEFAULT immich_uuid_v7();`.execute(db);
  await sql`CREATE INDEX "IDX_album_assets_update_id" ON "albums_assets_assets" ("updateId")`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_assets_updated_at"
  BEFORE UPDATE ON "albums_assets_assets"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "IDX_album_assets_update_id";`.execute(db);
  await sql`ALTER TABLE "albums_assets_assets" DROP COLUMN "updatedAt";`.execute(db);
  await sql`ALTER TABLE "albums_assets_assets" DROP COLUMN "updateId";`.execute(db);
  await sql`DROP TRIGGER "album_assets_updated_at" ON "albums_assets_assets";`.execute(db);
}
