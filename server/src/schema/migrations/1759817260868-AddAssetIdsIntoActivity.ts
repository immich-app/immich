import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "activity" DROP CONSTRAINT "activity_like_check";`.execute(db);
  await sql`ALTER TABLE "activity" ADD "assetIds" uuid[];`.execute(db);
  await sql`CREATE INDEX "activity_assetIds_idx" ON "activity" ("assetIds");`.execute(db);
  await sql`ALTER TABLE "activity" ADD CONSTRAINT "activity_check" CHECK ((comment IS NULL AND "isLiked" = true) OR (comment IS NOT NULL AND "isLiked" = false) OR (comment IS NULL AND "isLiked" = false AND "assetIds" IS NOT NULL));`.execute(
    db,
  );
  await sql`CREATE OR REPLACE FUNCTION activity_assetids_update_on_albumasset_delete()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN SELECT "albumsId", "assetsId" FROM old LOOP
        UPDATE activity
        SET "assetIds" = array_remove("assetIds", r."assetsId")
        WHERE "albumId" = r."albumsId" AND "assetIds" IS NOT NULL AND r."assetsId" = ANY("assetIds");
      END LOOP;
      RETURN NULL;
    END;
  $$;`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "activity_assetids_update_on_albumasset_delete"
  AFTER DELETE ON "album_asset"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() <= 1)
  EXECUTE FUNCTION activity_assetids_update_on_albumasset_delete();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_activity_assetids_update_on_albumasset_delete', '{"type":"function","name":"activity_assetids_update_on_albumasset_delete","sql":"CREATE OR REPLACE FUNCTION activity_assetids_update_on_albumasset_delete()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      UPDATE activity\\n      SET \\"assetIds\\" = array_remove(\\"assetIds\\", OLD.\\"assetsId\\")\\n      WHERE \\"albumId\\" = OLD.\\"albumsId\\" AND \\"assetIds\\" IS NOT NULL AND OLD.\\"assetsId\\" = ANY(\\"assetIds\\");\\n      RETURN NULL;\\n    END;\\n  $$;"}'::jsonb);`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_activity_assetids_update_on_albumasset_delete', '{"type":"trigger","name":"activity_assetids_update_on_albumasset_delete","sql":"CREATE OR REPLACE TRIGGER \\"activity_assetids_update_on_albumasset_delete\\"\\n  AFTER DELETE ON \\"album_asset\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() <= 1)\\n  EXECUTE FUNCTION activity_assetids_update_on_albumasset_delete();"}'::jsonb);`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "activity_assetids_update_on_albumasset_delete" ON "album_asset";`.execute(db);
  await sql`DROP FUNCTION activity_assetids_update_on_albumasset_delete;`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_activity_assetids_update_on_albumasset_delete';`.execute(
    db,
  );
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_activity_assetids_update_on_albumasset_delete';`.execute(
    db,
  );
  await sql`ALTER TABLE "activity" DROP CONSTRAINT "activity_check";`.execute(db);
  await sql`DROP INDEX "activity_assetIds_idx";`.execute(db);
  await sql`ALTER TABLE "activity" DROP COLUMN "assetIds";`.execute(db);
  await sql`ALTER TABLE "activity" ADD CONSTRAINT "activity_like_check" CHECK (((((comment IS NULL) AND ("isLiked" = true)) OR ((comment IS NOT NULL) AND ("isLiked" = false)))));`.execute(
    db,
  );
}
