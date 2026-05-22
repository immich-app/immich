import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION asset_edit_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO asset_edit_audit ("editId", "assetId")
      SELECT "id", "assetId"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE TABLE "asset_edit_audit" (
  "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "editId" uuid NOT NULL,
  "assetId" uuid NOT NULL,
  "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "asset_edit_audit_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "asset_edit_audit_assetId_idx" ON "asset_edit_audit" ("assetId");`.execute(db);
  await sql`CREATE INDEX "asset_edit_audit_deletedAt_idx" ON "asset_edit_audit" ("deletedAt");`.execute(db);
  await sql`ALTER TABLE "asset_edit" ADD "updatedAt" timestamp with time zone NOT NULL DEFAULT now();`.execute(db);
  await sql`ALTER TABLE "asset_edit" ADD "updateId" uuid NOT NULL DEFAULT immich_uuid_v7();`.execute(db);
  await sql`CREATE INDEX "asset_edit_updateId_idx" ON "asset_edit" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_edit_audit"
  AFTER DELETE ON "asset_edit"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION asset_edit_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_edit_updatedAt"
  BEFORE UPDATE ON "asset_edit"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_asset_edit_audit', '{"type":"function","name":"asset_edit_audit","sql":"CREATE OR REPLACE FUNCTION asset_edit_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO asset_edit_audit (\\"editId\\", \\"assetId\\")\\n      SELECT \\"id\\", \\"assetId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_edit_audit', '{"type":"trigger","name":"asset_edit_audit","sql":"CREATE OR REPLACE TRIGGER \\"asset_edit_audit\\"\\n  AFTER DELETE ON \\"asset_edit\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION asset_edit_audit();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_edit_updatedAt', '{"type":"trigger","name":"asset_edit_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"asset_edit_updatedAt\\"\\n  BEFORE UPDATE ON \\"asset_edit\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "asset_edit_audit" ON "asset_edit";`.execute(db);
  await sql`DROP TRIGGER "asset_edit_updatedAt" ON "asset_edit";`.execute(db);
  await sql`DROP INDEX "asset_edit_updateId_idx";`.execute(db);
  await sql`ALTER TABLE "asset_edit" DROP COLUMN "updatedAt";`.execute(db);
  await sql`ALTER TABLE "asset_edit" DROP COLUMN "updateId";`.execute(db);
  await sql`DROP TABLE "asset_edit_audit";`.execute(db);
  await sql`DROP FUNCTION asset_edit_audit;`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_asset_edit_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_edit_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_edit_updatedAt';`.execute(db);
}
