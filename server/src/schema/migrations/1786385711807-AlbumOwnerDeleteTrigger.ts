import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`DELETE FROM "album" WHERE NOT EXISTS (SELECT * FROM "album_user" WHERE "album_user"."albumId" = "album"."id" AND "album_user"."role" = 'owner');`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION album_user_delete()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      DELETE FROM "album"
      WHERE "album"."id" = OLD."albumId"
      AND NOT EXISTS (SELECT "albumId" FROM "album_user" WHERE "album_user"."albumId" = "album"."id" AND "album_user"."role" = 'owner');

      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_user_delete"
  AFTER DELETE ON "album_user"
  REFERENCING OLD TABLE AS "old"
  FOR EACH ROW
  EXECUTE FUNCTION album_user_delete();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_album_user_delete', '{"type":"function","name":"album_user_delete","sql":"CREATE OR REPLACE FUNCTION album_user_delete()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      DELETE FROM \\"album\\"\\n      WHERE \\"album\\".\\"id\\" = OLD.\\"albumId\\"\\n      AND NOT EXISTS (SELECT \\"albumId\\" FROM \\"album_user\\" WHERE \\"album_user\\".\\"albumId\\" = \\"album\\".\\"id\\" AND \\"album_user\\".\\"role\\" = ''owner'');\\n\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_album_user_delete', '{"type":"trigger","name":"album_user_delete","sql":"CREATE OR REPLACE TRIGGER \\"album_user_delete\\"\\n  AFTER DELETE ON \\"album_user\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION album_user_delete();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "album_user_delete" ON "album_user";`.execute(db);
  await sql`DROP FUNCTION album_user_delete;`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_album_user_delete';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_album_user_delete';`.execute(db);
}
