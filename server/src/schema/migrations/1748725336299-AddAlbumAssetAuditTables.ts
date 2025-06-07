import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "album_assets_assets_audit" ("id" uuid NOT NULL DEFAULT immich_uuid_v7(), "albumId" uuid NOT NULL, "assetId" uuid NOT NULL, "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp());`.execute(db);
  await sql`ALTER TABLE "albums_assets_assets" ADD "updateId" uuid NOT NULL DEFAULT immich_uuid_v7();`.execute(db);
  await sql`ALTER TABLE "album_assets_assets_audit" ADD CONSTRAINT "PK_76d91006def0b7a9e506e905d6c" PRIMARY KEY ("id");`.execute(db);
  await sql`CREATE INDEX "IDX_album_assets_assets_audit_album_id" ON "album_assets_assets_audit" ("albumId")`.execute(db);
  await sql`CREATE INDEX "IDX_album_assets_assets_audit_asset_id" ON "album_assets_assets_audit" ("assetId")`.execute(db);
  await sql`CREATE INDEX "IDX_album_assets_assets_audit_deleted_at" ON "album_assets_assets_audit" ("deletedAt")`.execute(db);
  await sql`CREATE INDEX "IDX_album_assets_assets_update_id" ON "albums_assets_assets" ("updateId")`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "IDX_album_assets_assets_update_id";`.execute(db);
  await sql`DROP INDEX "IDX_album_assets_assets_audit_album_id";`.execute(db);
  await sql`DROP INDEX "IDX_album_assets_assets_audit_asset_id";`.execute(db);
  await sql`DROP INDEX "IDX_album_assets_assets_audit_deleted_at";`.execute(db);
  await sql`ALTER TABLE "album_assets_assets_audit" DROP CONSTRAINT "PK_76d91006def0b7a9e506e905d6c";`.execute(db);
  await sql`ALTER TABLE "albums_assets_assets" DROP COLUMN "updateId";`.execute(db);
  await sql`DROP TABLE "album_assets_assets_audit";`.execute(db);
}
