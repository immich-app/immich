import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION person_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO person_audit ("personId", "ownerId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE TABLE "person_audit" (
  "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "personId" uuid NOT NULL,
  "ownerId" uuid NOT NULL,
  "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "PK_46c1ad23490b9312ffaa052aa59" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "IDX_person_audit_person_id" ON "person_audit" ("personId");`.execute(db);
  await sql`CREATE INDEX "IDX_person_audit_owner_id" ON "person_audit" ("ownerId");`.execute(db);
  await sql`CREATE INDEX "IDX_person_audit_deleted_at" ON "person_audit" ("deletedAt");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "person_delete_audit"
  AFTER DELETE ON "person"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION person_delete_audit();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_person_delete_audit', '{"type":"function","name":"person_delete_audit","sql":"CREATE OR REPLACE FUNCTION person_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO person_audit (\\"personId\\", \\"ownerId\\")\\n      SELECT \\"id\\", \\"ownerId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_person_delete_audit', '{"type":"trigger","name":"person_delete_audit","sql":"CREATE OR REPLACE TRIGGER \\"person_delete_audit\\"\\n  AFTER DELETE ON \\"person\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION person_delete_audit();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "person_delete_audit" ON "person";`.execute(db);
  await sql`DROP TABLE "person_audit";`.execute(db);
  await sql`DROP FUNCTION person_delete_audit;`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_person_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_person_delete_audit';`.execute(db);
}
