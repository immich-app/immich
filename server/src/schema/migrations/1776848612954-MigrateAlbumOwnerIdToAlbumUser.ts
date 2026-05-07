import { Kysely, sql } from 'kysely';
import { AlbumUserRole } from 'src/enum';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION album_user_after_insert()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      UPDATE album SET "updatedAt" = clock_timestamp(), "updateId" = immich_uuid_v7(clock_timestamp())
      WHERE "id" IN (SELECT "albumId" FROM inserted_rows)
        AND NOT EXISTS (SELECT FROM inserted_rows WHERE role = 'owner');
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`DROP TRIGGER "album_delete_audit" ON "album";`.execute(db);
  await sql`DROP FUNCTION album_delete_audit;`.execute(db);
  await sql`CREATE TYPE "album_user_role_enum" AS ENUM ('owner','editor','viewer');`.execute(db);
  await sql`ALTER TABLE "album_user" ALTER COLUMN "role" DROP DEFAULT;`.execute(db);
  await sql`ALTER TABLE "album_user" ALTER COLUMN "role" TYPE album_user_role_enum USING "role"::album_user_role_enum;`.execute(db);
  await sql`ALTER TABLE "album_user" ALTER COLUMN "role" SET DEFAULT 'editor'::album_user_role_enum;`.execute(db);
  await db
    .insertInto('album_user')
    .expression((eb) =>
      eb
        .selectFrom('album')
        .select(['album.id as albumId', 'album.ownerId as userId', eb.val(AlbumUserRole.Owner).as('role')]),
    )
    .execute();
  await sql`ALTER TABLE "album" DROP CONSTRAINT "album_ownerId_fkey";`.execute(db);
  await sql`ALTER TABLE "album" DROP COLUMN "ownerId";`.execute(db);
  await sql`CREATE UNIQUE INDEX "album_user_unique_owner" ON "album_user" ("albumId") WHERE (role = 'owner');`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"function","name":"album_user_after_insert","sql":"CREATE OR REPLACE FUNCTION album_user_after_insert()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      UPDATE album SET \\"updatedAt\\" = clock_timestamp(), \\"updateId\\" = immich_uuid_v7(clock_timestamp())\\n      WHERE \\"id\\" IN (SELECT \\"albumId\\" FROM inserted_rows)\\n        AND NOT EXISTS (SELECT FROM inserted_rows WHERE role = ''owner'');\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb WHERE "name" = 'function_album_user_after_insert';`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_album_user_unique_owner', '{"type":"index","name":"album_user_unique_owner","sql":"CREATE UNIQUE INDEX \\"album_user_unique_owner\\" ON \\"album_user\\" (\\"albumId\\") WHERE (role = ''owner'');"}'::jsonb);`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_album_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_album_delete_audit';`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION public.album_user_after_insert()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      UPDATE album SET "updatedAt" = clock_timestamp(), "updateId" = immich_uuid_v7(clock_timestamp())
      WHERE "id" IN (SELECT DISTINCT "albumId" FROM inserted_rows);
      RETURN NULL;
    END
  $function$
`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION public.album_delete_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      INSERT INTO album_audit ("albumId", "userId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END
  $function$
`.execute(db);
  await sql`ALTER TABLE "album" ADD "ownerId" uuid NOT NULL;`.execute(db);
  await db
    .updateTable('album')
    .set((eb) =>
      ({
        id: eb.ref('album_user.albumId'),
        ownerId: eb.ref('album_user.userId')
      })
    )
    .from('album_user')
    .where('album_user.role', '=', AlbumUserRole.Owner)
    .execute();
  await sql`DROP INDEX "album_user_unique_owner";`.execute(db);
  await sql`ALTER TABLE "album_user" ALTER COLUMN "role" DROP DEFAULT;`.execute(db);
  await sql`ALTER TABLE "album_user" ALTER COLUMN "role" TYPE character varying USING "role"::text;`.execute(db);
  await sql`ALTER TABLE "album_user" ALTER COLUMN "role" SET DEFAULT 'editor';`.execute(db);
  await sql`DROP TYPE "album_user_role_enum";`.execute(db);
  await sql`CREATE INDEX "album_ownerId_idx" ON "album" ("ownerId");`.execute(db);
  await sql`ALTER TABLE "album" ADD CONSTRAINT "album_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_delete_audit"
  AFTER DELETE ON "album"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN ((pg_trigger_depth() = 0))
  EXECUTE FUNCTION album_delete_audit();`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE OR REPLACE FUNCTION album_user_after_insert()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      UPDATE album SET \\"updatedAt\\" = clock_timestamp(), \\"updateId\\" = immich_uuid_v7(clock_timestamp())\\n      WHERE \\"id\\" IN (SELECT DISTINCT \\"albumId\\" FROM inserted_rows);\\n      RETURN NULL;\\n    END\\n  $$;","name":"album_user_after_insert","type":"function"}'::jsonb WHERE "name" = 'function_album_user_after_insert';`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_album_delete_audit', '{"sql":"CREATE OR REPLACE FUNCTION album_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO album_audit (\\"albumId\\", \\"userId\\")\\n      SELECT \\"id\\", \\"ownerId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;","name":"album_delete_audit","type":"function"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_album_delete_audit', '{"sql":"CREATE OR REPLACE TRIGGER \\"album_delete_audit\\"\\n  AFTER DELETE ON \\"album\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION album_delete_audit();","name":"album_delete_audit","type":"trigger"}'::jsonb);`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_album_user_unique_owner';`.execute(db);
}
