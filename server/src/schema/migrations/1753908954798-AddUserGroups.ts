import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION group_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO group_audit ("groupId")
      SELECT "id"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION group_user_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO group_audit ("groupId", "userId")
      SELECT "groupId", "userId"
      FROM OLD;

      IF pg_trigger_depth() = 1 THEN
        INSERT INTO group_user_audit ("groupId", "userId")
        SELECT "groupId", "userId"
        FROM OLD;
      END IF;

      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE TABLE "group_audit" (
  "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "groupId" uuid NOT NULL,
  "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "group_audit_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "group_audit_deletedAt_idx" ON "group_audit" ("deletedAt");`.execute(db);
  await sql`CREATE TABLE "group_user_audit" (
  "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "groupId" uuid NOT NULL,
  "userId" uuid NOT NULL,
  "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "group_user_audit_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "group_user_audit_groupId_idx" ON "group_user_audit" ("groupId");`.execute(db);
  await sql`CREATE INDEX "group_user_audit_userId_idx" ON "group_user_audit" ("userId");`.execute(db);
  await sql`CREATE INDEX "group_user_audit_deletedAt_idx" ON "group_user_audit" ("deletedAt");`.execute(db);
  await sql`CREATE TABLE "group_user" (
  "groupId" uuid NOT NULL,
  "userId" uuid NOT NULL,
  "createId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "group_user_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "album" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "group_user_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "group_user_pkey" PRIMARY KEY ("groupId", "userId")
);`.execute(db);
  await sql`CREATE INDEX "group_user_groupId_idx" ON "group_user" ("groupId");`.execute(db);
  await sql`CREATE INDEX "group_user_userId_idx" ON "group_user" ("userId");`.execute(db);
  await sql`CREATE INDEX "group_user_createId_idx" ON "group_user" ("createId");`.execute(db);
  await sql`CREATE INDEX "group_user_updateId_idx" ON "group_user" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "group_user_delete_audit"
  AFTER DELETE ON "group_user"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() <= 1)
  EXECUTE FUNCTION group_user_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "group_user_updatedAt"
  BEFORE UPDATE ON "group_user"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE TABLE "group" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "name" character varying NOT NULL,
  "description" character varying,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  CONSTRAINT "group_name_uq" UNIQUE ("name"),
  CONSTRAINT "group_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "group_updatedAt_id_idx" ON "group" ("updatedAt", "id");`.execute(db);
  await sql`CREATE INDEX "group_updateId_idx" ON "group" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "group_delete_audit"
  AFTER DELETE ON "group"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION group_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "group_updatedAt"
  BEFORE UPDATE ON "group"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_group_delete_audit', '{"type":"function","name":"group_delete_audit","sql":"CREATE OR REPLACE FUNCTION group_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO group_audit (\\"groupId\\")\\n      SELECT \\"id\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_group_user_delete_audit', '{"type":"function","name":"group_user_delete_audit","sql":"CREATE OR REPLACE FUNCTION group_user_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO group_audit (\\"groupId\\", \\"userId\\")\\n      SELECT \\"groupId\\", \\"userId\\"\\n      FROM OLD;\\n\\n      IF pg_trigger_depth() = 1 THEN\\n        INSERT INTO group_user_audit (\\"groupId\\", \\"userId\\")\\n        SELECT \\"groupId\\", \\"userId\\"\\n        FROM OLD;\\n      END IF;\\n\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_group_user_delete_audit', '{"type":"trigger","name":"group_user_delete_audit","sql":"CREATE OR REPLACE TRIGGER \\"group_user_delete_audit\\"\\n  AFTER DELETE ON \\"group_user\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() <= 1)\\n  EXECUTE FUNCTION group_user_delete_audit();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_group_user_updatedAt', '{"type":"trigger","name":"group_user_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"group_user_updatedAt\\"\\n  BEFORE UPDATE ON \\"group_user\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_group_delete_audit', '{"type":"trigger","name":"group_delete_audit","sql":"CREATE OR REPLACE TRIGGER \\"group_delete_audit\\"\\n  AFTER DELETE ON \\"group\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION group_delete_audit();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_group_updatedAt', '{"type":"trigger","name":"group_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"group_updatedAt\\"\\n  BEFORE UPDATE ON \\"group\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "group_audit";`.execute(db);
  await sql`DROP TABLE "group_user_audit";`.execute(db);
  await sql`DROP TABLE "group_user";`.execute(db);
  await sql`DROP TABLE "group";`.execute(db);
  await sql`DROP FUNCTION group_delete_audit;`.execute(db);
  await sql`DROP FUNCTION group_user_delete_audit;`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_group_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_group_user_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_group_user_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_group_user_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_group_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_group_updatedAt';`.execute(db);
}
