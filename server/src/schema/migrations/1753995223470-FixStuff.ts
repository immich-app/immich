import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION album_group_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO "album_audit" ("albumId", "userId")
      SELECT OLD."albumId", "group_user"."userId"
      FROM OLD INNER JOIN "group_user" ON "group_user"."groupId" = OLD."groupId";

      IF pg_trigger_depth() = 1 THEN
        INSERT INTO album_group_audit ("albumId", "groupId")
        SELECT "albumId", "groupId"
        FROM OLD;
      END IF;

      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE TABLE "album_group_audit" (
  "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "albumId" uuid NOT NULL,
  "groupId" uuid NOT NULL,
  "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "album_group_audit_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "album_group_audit_albumId_idx" ON "album_group_audit" ("albumId");`.execute(db);
  await sql`CREATE INDEX "album_group_audit_groupId_idx" ON "album_group_audit" ("groupId");`.execute(db);
  await sql`CREATE INDEX "album_group_audit_deletedAt_idx" ON "album_group_audit" ("deletedAt");`.execute(db);
  await sql`CREATE TABLE "album_group" (
  "albumId" uuid NOT NULL,
  "groupId" uuid NOT NULL,
  "role" character varying NOT NULL DEFAULT 'editor',
  "createId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "album_group_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "album" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "album_group_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "album_group_pkey" PRIMARY KEY ("albumId", "groupId")
);`.execute(db);
  await sql`CREATE INDEX "album_group_albumId_idx" ON "album_group" ("albumId");`.execute(db);
  await sql`CREATE INDEX "album_group_groupId_idx" ON "album_group" ("groupId");`.execute(db);
  await sql`CREATE INDEX "album_group_createId_idx" ON "album_group" ("createId");`.execute(db);
  await sql`CREATE INDEX "album_group_updateId_idx" ON "album_group" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_group_delete_audit"
  AFTER DELETE ON "album_group"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() <= 1)
  EXECUTE FUNCTION album_group_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_group_updatedAt"
  BEFORE UPDATE ON "album_group"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_album_group_delete_audit', '{"type":"function","name":"album_group_delete_audit","sql":"CREATE OR REPLACE FUNCTION album_group_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO \\"album_audit\\" (\\"albumId\\", \\"userId\\")\\n      SELECT OLD.\\"albumId\\", \\"group_user\\".\\"userId\\"\\n      FROM OLD INNER JOIN \\"group_user\\" ON \\"group_user\\".\\"groupId\\" = OLD.\\"groupId\\";\\n\\n      IF pg_trigger_depth() = 1 THEN\\n        INSERT INTO album_group_audit (\\"albumId\\", \\"groupId\\")\\n        SELECT \\"albumId\\", \\"groupId\\"\\n        FROM OLD;\\n      END IF;\\n\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_album_group_delete_audit', '{"type":"trigger","name":"album_group_delete_audit","sql":"CREATE OR REPLACE TRIGGER \\"album_group_delete_audit\\"\\n  AFTER DELETE ON \\"album_group\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() <= 1)\\n  EXECUTE FUNCTION album_group_delete_audit();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_album_group_updatedAt', '{"type":"trigger","name":"album_group_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"album_group_updatedAt\\"\\n  BEFORE UPDATE ON \\"album_group\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "album_group_audit";`.execute(db);
  await sql`DROP TABLE "album_group";`.execute(db);
  await sql`DROP FUNCTION album_group_delete_audit;`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_album_group_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_album_group_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_album_group_updatedAt';`.execute(db);
}
