import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION asset_edit_delete()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      UPDATE asset
      SET "isEdited" = false
      FROM deleted_edit
      WHERE asset.id = deleted_edit."assetId" AND asset."isEdited"
        AND NOT EXISTS (SELECT FROM asset_edit edit WHERE edit."assetId" = asset.id);
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION asset_ocr_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO asset_ocr_audit ("assetId")
      SELECT "assetId"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE TABLE "asset_ocr_audit" (
  "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "assetId" uuid NOT NULL,
  "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "asset_ocr_audit_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "asset_ocr_audit_assetId_idx" ON "asset_ocr_audit" ("assetId");`.execute(db);
  await sql`CREATE INDEX "asset_ocr_audit_deletedAt_idx" ON "asset_ocr_audit" ("deletedAt");`.execute(db);
  await sql`ALTER TABLE "asset_ocr" ADD "updateId" uuid NOT NULL DEFAULT immich_uuid_v7();`.execute(db);
  await sql`CREATE INDEX "asset_ocr_updateId_idx" ON "asset_ocr" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_ocr_delete_audit"
  AFTER DELETE ON "asset_ocr"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION asset_ocr_delete_audit();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_asset_ocr_delete_audit', '{"type":"function","name":"asset_ocr_delete_audit","sql":"CREATE OR REPLACE FUNCTION asset_ocr_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO asset_ocr_audit (\\"assetId\\")\\n      SELECT \\"assetId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_ocr_delete_audit', '{"type":"trigger","name":"asset_ocr_delete_audit","sql":"CREATE OR REPLACE TRIGGER \\"asset_ocr_delete_audit\\"\\n  AFTER DELETE ON \\"asset_ocr\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION asset_ocr_delete_audit();"}'::jsonb);`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"function","name":"asset_edit_delete","sql":"CREATE OR REPLACE FUNCTION asset_edit_delete()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      UPDATE asset\\n      SET \\"isEdited\\" = false\\n      FROM deleted_edit\\n      WHERE asset.id = deleted_edit.\\"assetId\\" AND asset.\\"isEdited\\"\\n        AND NOT EXISTS (SELECT FROM asset_edit edit WHERE edit.\\"assetId\\" = asset.id);\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb WHERE "name" = 'function_asset_edit_delete';`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "asset_ocr_delete_audit" ON "asset_ocr";`.execute(db);
  await sql`DROP INDEX "asset_ocr_updateId_idx";`.execute(db);
  await sql`ALTER TABLE "asset_ocr" DROP COLUMN "updateId";`.execute(db);
  await sql`DROP TABLE "asset_ocr_audit";`.execute(db);
  await sql`DROP FUNCTION asset_ocr_delete_audit;`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE OR REPLACE FUNCTION asset_edit_delete()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      UPDATE asset\\n      SET \\"isEdited\\" = false\\n      FROM deleted_edit\\n      WHERE asset.id = deleted_edit.\\"assetId\\" AND asset.\\"isEdited\\" \\n        AND NOT EXISTS (SELECT FROM asset_edit edit WHERE edit.\\"assetId\\" = asset.id);\\n      RETURN NULL;\\n    END\\n  $$;","name":"asset_edit_delete","type":"function"}'::jsonb WHERE "name" = 'function_asset_edit_delete';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_asset_ocr_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_ocr_delete_audit';`.execute(db);
}
