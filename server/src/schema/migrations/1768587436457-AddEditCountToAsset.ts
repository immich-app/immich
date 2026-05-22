import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION asset_edit_insert()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      UPDATE asset
      SET "editCount" = "editCount" + 1
      WHERE "id" = NEW."assetId";
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION asset_edit_delete()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      UPDATE asset
      SET "editCount" = "editCount" - 1
      WHERE "id" = OLD."assetId";
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`ALTER TABLE "asset" ADD "editCount" integer NOT NULL DEFAULT 0;`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_edit_delete"
  AFTER DELETE ON "asset_edit"
  REFERENCING OLD TABLE AS "old"
  FOR EACH ROW
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION asset_edit_delete();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_edit_insert"
  AFTER INSERT ON "asset_edit"
  FOR EACH ROW
  EXECUTE FUNCTION asset_edit_insert();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_asset_edit_insert', '{"type":"function","name":"asset_edit_insert","sql":"CREATE OR REPLACE FUNCTION asset_edit_insert()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      UPDATE asset\\n      SET \\"editCount\\" = \\"editCount\\" + 1\\n      WHERE \\"id\\" = NEW.\\"assetId\\";\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_asset_edit_delete', '{"type":"function","name":"asset_edit_delete","sql":"CREATE OR REPLACE FUNCTION asset_edit_delete()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      UPDATE asset\\n      SET \\"editCount\\" = \\"editCount\\" - 1\\n      WHERE \\"id\\" = OLD.\\"assetId\\";\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_edit_delete', '{"type":"trigger","name":"asset_edit_delete","sql":"CREATE OR REPLACE TRIGGER \\"asset_edit_delete\\"\\n  AFTER DELETE ON \\"asset_edit\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH ROW\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION asset_edit_delete();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_edit_insert', '{"type":"trigger","name":"asset_edit_insert","sql":"CREATE OR REPLACE TRIGGER \\"asset_edit_insert\\"\\n  AFTER INSERT ON \\"asset_edit\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION asset_edit_insert();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "asset_edit_delete" ON "asset_edit";`.execute(db);
  await sql`DROP TRIGGER "asset_edit_insert" ON "asset_edit";`.execute(db);
  await sql`ALTER TABLE "asset" DROP COLUMN "editCount";`.execute(db);
  await sql`DROP FUNCTION asset_edit_insert;`.execute(db);
  await sql`DROP FUNCTION asset_edit_delete;`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_asset_edit_insert';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_asset_edit_delete';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_edit_delete';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_edit_insert';`.execute(db);
}
