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
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"function","name":"asset_edit_delete","sql":"CREATE OR REPLACE FUNCTION asset_edit_delete()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      UPDATE asset\\n      SET \\"isEdited\\" = false\\n      FROM deleted_edit\\n      WHERE asset.id = deleted_edit.\\"assetId\\" AND asset.\\"isEdited\\"\\n        AND NOT EXISTS (SELECT FROM asset_edit edit WHERE edit.\\"assetId\\" = asset.id);\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb WHERE "name" = 'function_asset_edit_delete';`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION public.asset_edit_delete()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      UPDATE asset
      SET "isEdited" = false
      FROM deleted_edit
      WHERE asset.id = deleted_edit."assetId" AND asset."isEdited" 
        AND NOT EXISTS (SELECT FROM asset_edit edit WHERE edit."assetId" = asset.id);
      RETURN NULL;
    END
  $function$
`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE OR REPLACE FUNCTION asset_edit_delete()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      UPDATE asset\\n      SET \\"isEdited\\" = false\\n      FROM deleted_edit\\n      WHERE asset.id = deleted_edit.\\"assetId\\" AND asset.\\"isEdited\\" \\n        AND NOT EXISTS (SELECT FROM asset_edit edit WHERE edit.\\"assetId\\" = asset.id);\\n      RETURN NULL;\\n    END\\n  $$;","name":"asset_edit_delete","type":"function"}'::jsonb WHERE "name" = 'function_asset_edit_delete';`.execute(db);
}
