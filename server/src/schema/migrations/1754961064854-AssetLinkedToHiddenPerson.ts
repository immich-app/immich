import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION asset_linked_to_hidden_person(asset_id uuid)
  RETURNS boolean
  STABLE LANGUAGE PLPGSQL
  AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1
        FROM asset_face
        INNER JOIN person ON person.id = asset_face."personId"
        WHERE asset_face."assetId" = asset_id
          AND person."isHidden" = TRUE
      );
    END
  $$;`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_asset_linked_to_hidden_person', '{"type":"function","name":"asset_linked_to_hidden_person","sql":"CREATE OR REPLACE FUNCTION asset_linked_to_hidden_person(asset_id uuid)\\n  RETURNS boolean\\n  STABLE LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      RETURN EXISTS (\\n        SELECT 1\\n        FROM asset_face\\n        INNER JOIN person ON person.id = asset_face.\\"personId\\"\\n        WHERE asset_face.\\"assetId\\" = asset_id\\n          AND person.\\"isHidden\\" = TRUE\\n      );\\n    END\\n  $$;"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP FUNCTION asset_linked_to_hidden_person;`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_asset_linked_to_hidden_person';`.execute(db);
}
