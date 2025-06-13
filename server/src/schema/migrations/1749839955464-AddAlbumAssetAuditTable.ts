import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION album_asset_after_insert()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      UPDATE albums SET "updatedAt" = clock_timestamp(), "updateId" = immich_uuid_v7(clock_timestamp())
      WHERE "id" IN (SELECT DISTINCT "albumsId" FROM inserted_rows);
      UPDATE assets SET "updatedAt" = clock_timestamp(), "updateId" = immich_uuid_v7(clock_timestamp())
      WHERE "id" IN (SELECT DISTINCT "assetsId" FROM inserted_rows);
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION album_assets_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      IF pg_trigger_depth() = 1 THEN
        INSERT INTO album_assets_assets_audit ("albumId", "assetId")
        SELECT "albumsId", "assetsId"
        FROM OLD;
      END IF;

      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE TABLE "album_assets_assets_audit" ("id" uuid NOT NULL DEFAULT immich_uuid_v7(), "albumId" uuid NOT NULL, "assetId" uuid NOT NULL, "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp());`.execute(db);
  await sql`ALTER TABLE "albums_assets_assets" ADD "updateId" uuid NOT NULL DEFAULT immich_uuid_v7();`.execute(db);
  await sql`ALTER TABLE "albums_assets_assets" ADD "updatedAt" timestamp with time zone NOT NULL DEFAULT now();`.execute(db);
  await sql`ALTER TABLE "album_assets_assets_audit" ADD CONSTRAINT "PK_76d91006def0b7a9e506e905d6c" PRIMARY KEY ("id");`.execute(db);
  await sql`CREATE INDEX "IDX_album_assets_assets_audit_album_id" ON "album_assets_assets_audit" ("albumId")`.execute(db);
  await sql`CREATE INDEX "IDX_album_assets_assets_audit_asset_id" ON "album_assets_assets_audit" ("assetId")`.execute(db);
  await sql`CREATE INDEX "IDX_album_assets_assets_audit_deleted_at" ON "album_assets_assets_audit" ("deletedAt")`.execute(db);
  await sql`CREATE INDEX "IDX_album_assets_assets_update_id" ON "albums_assets_assets" ("updateId")`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_assets_delete_audit"
  AFTER DELETE ON "albums_assets_assets"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() <= 1)
  EXECUTE FUNCTION album_assets_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_asset_after_insert"
  AFTER INSERT ON "albums_assets_assets"
  REFERENCING NEW TABLE AS "inserted_rows"
  FOR EACH STATEMENT
  EXECUTE FUNCTION album_asset_after_insert();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_assets_updated_at"
  BEFORE UPDATE ON "albums_assets_assets"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "album_assets_delete_audit" ON "albums_assets_assets";`.execute(db);
  await sql`DROP TRIGGER "album_asset_after_insert" ON "albums_assets_assets";`.execute(db);
  await sql`DROP TRIGGER "album_assets_updated_at" ON "albums_assets_assets";`.execute(db);
  await sql`DROP INDEX "IDX_album_assets_assets_update_id";`.execute(db);
  await sql`DROP INDEX "IDX_album_assets_assets_audit_album_id";`.execute(db);
  await sql`DROP INDEX "IDX_album_assets_assets_audit_asset_id";`.execute(db);
  await sql`DROP INDEX "IDX_album_assets_assets_audit_deleted_at";`.execute(db);
  await sql`ALTER TABLE "album_assets_assets_audit" DROP CONSTRAINT "PK_76d91006def0b7a9e506e905d6c";`.execute(db);
  await sql`ALTER TABLE "albums_assets_assets" DROP COLUMN "updateId";`.execute(db);
  await sql`ALTER TABLE "albums_assets_assets" DROP COLUMN "updatedAt";`.execute(db);
  await sql`DROP TABLE "album_assets_assets_audit";`.execute(db);
  await sql`DROP FUNCTION album_asset_after_insert;`.execute(db);
  await sql`DROP FUNCTION album_assets_delete_audit;`.execute(db);
}
