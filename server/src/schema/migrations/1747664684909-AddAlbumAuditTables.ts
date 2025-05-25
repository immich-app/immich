import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION album_user_after_insert()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      UPDATE albums SET "updatedAt" = clock_timestamp(), "updateId" = immich_uuid_v7(clock_timestamp())
      WHERE "id" IN (SELECT DISTINCT "albumsId" FROM inserted_rows);
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION albums_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO albums_audit ("albumId", "userId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION album_users_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO albums_audit ("albumId", "userId")
      SELECT "albumsId", "usersId"
      FROM OLD;

      IF pg_trigger_depth() = 1 THEN
        INSERT INTO album_users_audit ("albumId", "userId")
        SELECT "albumsId", "usersId"
        FROM OLD;
      END IF;

      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE TABLE "albums_audit" ("id" uuid NOT NULL DEFAULT immich_uuid_v7(), "albumId" uuid NOT NULL, "userId" uuid NOT NULL, "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp());`.execute(db);
  await sql`CREATE TABLE "album_users_audit" ("id" uuid NOT NULL DEFAULT immich_uuid_v7(), "albumId" uuid NOT NULL, "userId" uuid NOT NULL, "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp());`.execute(db);
  await sql`ALTER TABLE "albums_audit" ADD CONSTRAINT "PK_c75efea8d4dce316ad29b851a8b" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "album_users_audit" ADD CONSTRAINT "PK_f479a2e575b7ebc9698362c1688" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "albums_shared_users_users" ADD "updateId" uuid NOT NULL DEFAULT immich_uuid_v7();`.execute(db);
  await sql`ALTER TABLE "albums_shared_users_users" ADD "updatedAt" timestamp with time zone NOT NULL DEFAULT now();`.execute(db);
  await sql`CREATE INDEX "IDX_album_users_update_id" ON "albums_shared_users_users" ("updateId")`.execute(db);
  await sql`CREATE INDEX "IDX_albums_audit_album_id" ON "albums_audit" ("albumId")`.execute(db);
  await sql`CREATE INDEX "IDX_albums_audit_user_id" ON "albums_audit" ("userId")`.execute(db);
  await sql`CREATE INDEX "IDX_albums_audit_deleted_at" ON "albums_audit" ("deletedAt")`.execute(db);
  await sql`CREATE INDEX "IDX_album_users_audit_album_id" ON "album_users_audit" ("albumId")`.execute(db);
  await sql`CREATE INDEX "IDX_album_users_audit_user_id" ON "album_users_audit" ("userId")`.execute(db);
  await sql`CREATE INDEX "IDX_album_users_audit_deleted_at" ON "album_users_audit" ("deletedAt")`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "albums_delete_audit"
  AFTER DELETE ON "albums"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION albums_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_users_delete_audit"
  AFTER DELETE ON "albums_shared_users_users"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() <= 1)
  EXECUTE FUNCTION album_users_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_user_after_insert"
  AFTER INSERT ON "albums_shared_users_users"
  REFERENCING NEW TABLE AS "inserted_rows"
  FOR EACH STATEMENT
  EXECUTE FUNCTION album_user_after_insert();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_users_updated_at"
  BEFORE UPDATE ON "albums_shared_users_users"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "albums_delete_audit" ON "albums";`.execute(db);
  await sql`DROP TRIGGER "album_users_delete_audit" ON "albums_shared_users_users";`.execute(db);
  await sql`DROP TRIGGER "album_user_after_insert" ON "albums_shared_users_users";`.execute(db);
  await sql`DROP INDEX "IDX_albums_audit_album_id";`.execute(db);
  await sql`DROP INDEX "IDX_albums_audit_user_id";`.execute(db);
  await sql`DROP INDEX "IDX_albums_audit_deleted_at";`.execute(db);
  await sql`DROP INDEX "IDX_album_users_audit_album_id";`.execute(db);
  await sql`DROP INDEX "IDX_album_users_audit_user_id";`.execute(db);
  await sql`DROP INDEX "IDX_album_users_audit_deleted_at";`.execute(db);
  await sql`ALTER TABLE "albums_audit" DROP CONSTRAINT "PK_c75efea8d4dce316ad29b851a8b";`.execute(db);
  await sql`ALTER TABLE "album_users_audit" DROP CONSTRAINT "PK_f479a2e575b7ebc9698362c1688";`.execute(db);
  await sql`DROP TABLE "albums_audit";`.execute(db);
  await sql`DROP TABLE "album_users_audit";`.execute(db);
  await sql`DROP FUNCTION album_user_after_insert;`.execute(db);
  await sql`DROP FUNCTION albums_delete_audit;`.execute(db);
  await sql`DROP FUNCTION album_users_delete_audit;`.execute(db);
}
