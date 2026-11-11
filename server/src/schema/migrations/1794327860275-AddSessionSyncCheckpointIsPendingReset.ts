import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION asset_ocr_set_is_pending_reset()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      UPDATE session_sync_checkpoint 
      SET "isPendingReset" = true 
      WHERE type in ('AssetOcrV1', 'AssetOcrDeleteV1');
      TRUNCATE asset_ocr_audit;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_ocr_set_is_pending_reset"
  AFTER TRUNCATE ON "asset_ocr"
  FOR EACH STATEMENT
  EXECUTE FUNCTION asset_ocr_set_is_pending_reset();`.execute(db);
  await sql`ALTER TABLE "session_sync_checkpoint" ADD "isPendingReset" boolean NOT NULL DEFAULT false;`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_asset_ocr_set_is_pending_reset', '{"type":"function","name":"asset_ocr_set_is_pending_reset","sql":"CREATE OR REPLACE FUNCTION asset_ocr_set_is_pending_reset()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      UPDATE session_sync_checkpoint \\n      SET \\"isPendingReset\\" = true \\n      WHERE type in (''AssetOcrV1'', ''AssetOcrDeleteV1'');\\n      TRUNCATE asset_ocr_audit;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_ocr_set_is_pending_reset', '{"type":"trigger","name":"asset_ocr_set_is_pending_reset","sql":"CREATE OR REPLACE TRIGGER \\"asset_ocr_set_is_pending_reset\\"\\n  AFTER TRUNCATE ON \\"asset_ocr\\"\\n  FOR EACH STATEMENT\\n  EXECUTE FUNCTION asset_ocr_set_is_pending_reset();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "asset_ocr_set_is_pending_reset" ON "asset_ocr";`.execute(db);
  await sql`DROP FUNCTION asset_ocr_set_is_pending_reset;`.execute(db);
  await sql`ALTER TABLE "session_sync_checkpoint" DROP COLUMN "isPendingReset";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_asset_ocr_set_is_pending_reset';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_ocr_set_is_pending_reset';`.execute(db);
}
