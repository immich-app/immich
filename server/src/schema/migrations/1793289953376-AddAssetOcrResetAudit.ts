import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION asset_ocr_reset_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO asset_ocr_reset_audit DEFAULT VALUES;
      TRUNCATE asset_ocr_audit;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_ocr_reset_audit"
  AFTER TRUNCATE ON "asset_ocr"
  FOR EACH STATEMENT
  EXECUTE FUNCTION asset_ocr_reset_audit();`.execute(db);
  await sql`CREATE TABLE "asset_ocr_reset_audit" (
  "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "asset_ocr_reset_audit_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "asset_ocr_reset_audit_deletedAt_idx" ON "asset_ocr_reset_audit" ("deletedAt");`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_asset_ocr_reset_audit', '{"type":"function","name":"asset_ocr_reset_audit","sql":"CREATE OR REPLACE FUNCTION asset_ocr_reset_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO asset_ocr_reset_audit DEFAULT VALUES;\\n      TRUNCATE asset_ocr_audit;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_ocr_reset_audit', '{"type":"trigger","name":"asset_ocr_reset_audit","sql":"CREATE OR REPLACE TRIGGER \\"asset_ocr_reset_audit\\"\\n  AFTER TRUNCATE ON \\"asset_ocr\\"\\n  FOR EACH STATEMENT\\n  EXECUTE FUNCTION asset_ocr_reset_audit();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "asset_ocr_reset_audit" ON "asset_ocr";`.execute(db);
  await sql`DROP FUNCTION asset_ocr_reset_audit;`.execute(db);
  await sql`DROP TABLE "asset_ocr_reset_audit";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_asset_ocr_reset_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_ocr_reset_audit';`.execute(db);
}
