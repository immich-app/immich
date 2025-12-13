import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "album_assets_audit" ("id" uuid NOT NULL DEFAULT immich_uuid_v7(), "albumId" uuid NOT NULL, "assetId" uuid NOT NULL, "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp());`.execute(db);
  await sql`ALTER TABLE "album_assets_audit" ADD CONSTRAINT "PK_32969b576ec8f78d84f37c2eb2d" PRIMARY KEY ("id");`.execute(db);
  await sql`CREATE INDEX "IDX_album_assets_audit_album_id" ON "album_assets_audit" ("albumId")`.execute(db);
  await sql`CREATE INDEX "IDX_album_assets_audit_asset_id" ON "album_assets_audit" ("assetId")`.execute(db);
  await sql`CREATE INDEX "IDX_album_assets_audit_deleted_at" ON "album_assets_audit" ("deletedAt")`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_assets_updated_at"
  BEFORE UPDATE ON "albums_assets_assets"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "album_assets_updated_at" ON "albums_assets_assets";`.execute(db);
  await sql`DROP INDEX "IDX_album_assets_audit_album_id";`.execute(db);
  await sql`DROP INDEX "IDX_album_assets_audit_asset_id";`.execute(db);
  await sql`DROP INDEX "IDX_album_assets_audit_deleted_at";`.execute(db);
  await sql`ALTER TABLE "album_assets_audit" DROP CONSTRAINT "PK_32969b576ec8f78d84f37c2eb2d";`.execute(db);
  await sql`DROP TABLE "album_assets_audit";`.execute(db);
}
