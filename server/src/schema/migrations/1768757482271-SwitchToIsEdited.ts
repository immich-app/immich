import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION asset_edit_insert()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      UPDATE asset
      SET "isEdited" = true
      FROM inserted_edit
      WHERE asset.id = inserted_edit."assetId" AND NOT asset."isEdited";
      RETURN NULL;
    END
  $$;`.execute(db);
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
  await sql`ALTER TABLE "asset" ADD "isEdited" boolean NOT NULL DEFAULT false;`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_edit_delete"
  AFTER DELETE ON "asset_edit"
  REFERENCING OLD TABLE AS "deleted_edit"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION asset_edit_delete();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_edit_insert"
  AFTER INSERT ON "asset_edit"
  REFERENCING NEW TABLE AS "inserted_edit"
  FOR EACH STATEMENT
  EXECUTE FUNCTION asset_edit_insert();`.execute(db);
  await sql`ALTER TABLE "asset" DROP COLUMN "editCount";`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"function","name":"asset_edit_insert","sql":"CREATE OR REPLACE FUNCTION asset_edit_insert()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      UPDATE asset\\n      SET \\"isEdited\\" = true\\n      FROM inserted_edit\\n      WHERE asset.id = inserted_edit.\\"assetId\\" AND NOT asset.\\"isEdited\\";\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb WHERE "name" = 'function_asset_edit_insert';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"function","name":"asset_edit_delete","sql":"CREATE OR REPLACE FUNCTION asset_edit_delete()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      UPDATE asset\\n      SET \\"isEdited\\" = false\\n      FROM deleted_edit\\n      WHERE asset.id = deleted_edit.\\"assetId\\" AND asset.\\"isEdited\\" \\n        AND NOT EXISTS (SELECT FROM asset_edit edit WHERE edit.\\"assetId\\" = asset.id);\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb WHERE "name" = 'function_asset_edit_delete';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"trigger","name":"asset_edit_delete","sql":"CREATE OR REPLACE TRIGGER \\"asset_edit_delete\\"\\n  AFTER DELETE ON \\"asset_edit\\"\\n  REFERENCING OLD TABLE AS \\"deleted_edit\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION asset_edit_delete();"}'::jsonb WHERE "name" = 'trigger_asset_edit_delete';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"trigger","name":"asset_edit_insert","sql":"CREATE OR REPLACE TRIGGER \\"asset_edit_insert\\"\\n  AFTER INSERT ON \\"asset_edit\\"\\n  REFERENCING NEW TABLE AS \\"inserted_edit\\"\\n  FOR EACH STATEMENT\\n  EXECUTE FUNCTION asset_edit_insert();"}'::jsonb WHERE "name" = 'trigger_asset_edit_insert';`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION public.asset_edit_insert()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      UPDATE asset
      SET "editCount" = "editCount" + 1
      WHERE "id" = NEW."assetId";
      RETURN NULL;
    END
  $function$
`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION public.asset_edit_delete()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      UPDATE asset
      SET "editCount" = "editCount" - 1
      WHERE "id" = OLD."assetId";
      RETURN NULL;
    END
  $function$
`.execute(db);
  await sql`ALTER TABLE "asset" ADD "editCount" integer NOT NULL DEFAULT 0;`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_edit_delete"
  AFTER DELETE ON "asset_edit"
  REFERENCING OLD TABLE AS "old"
  FOR EACH ROW
  WHEN ((pg_trigger_depth() = 0))
  EXECUTE FUNCTION asset_edit_delete();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_edit_insert"
  AFTER INSERT ON "asset_edit"
  FOR EACH ROW
  EXECUTE FUNCTION asset_edit_insert();`.execute(db);
  await sql`ALTER TABLE "asset" DROP COLUMN "isEdited";`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE OR REPLACE FUNCTION asset_edit_insert()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      UPDATE asset\\n      SET \\"editCount\\" = \\"editCount\\" + 1\\n      WHERE \\"id\\" = NEW.\\"assetId\\";\\n      RETURN NULL;\\n    END\\n  $$;","name":"asset_edit_insert","type":"function"}'::jsonb WHERE "name" = 'function_asset_edit_insert';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE OR REPLACE FUNCTION asset_edit_delete()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      UPDATE asset\\n      SET \\"editCount\\" = \\"editCount\\" - 1\\n      WHERE \\"id\\" = OLD.\\"assetId\\";\\n      RETURN NULL;\\n    END\\n  $$;","name":"asset_edit_delete","type":"function"}'::jsonb WHERE "name" = 'function_asset_edit_delete';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE OR REPLACE TRIGGER \\"asset_edit_delete\\"\\n  AFTER DELETE ON \\"asset_edit\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH ROW\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION asset_edit_delete();","name":"asset_edit_delete","type":"trigger"}'::jsonb WHERE "name" = 'trigger_asset_edit_delete';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE OR REPLACE TRIGGER \\"asset_edit_insert\\"\\n  AFTER INSERT ON \\"asset_edit\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION asset_edit_insert();","name":"asset_edit_insert","type":"trigger"}'::jsonb WHERE "name" = 'trigger_asset_edit_insert';`.execute(db);
}
