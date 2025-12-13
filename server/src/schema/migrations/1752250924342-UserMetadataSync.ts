import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION user_metadata_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO user_metadata_audit ("userId", "key")
      SELECT "userId", "key"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE TABLE "user_metadata_audit" (
  "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "userId" uuid NOT NULL,
  "key" character varying NOT NULL,
  "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "PK_15d5cc4d65ac966233b9921acac" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "IDX_user_metadata_audit_user_id" ON "user_metadata_audit" ("userId");`.execute(db);
  await sql`CREATE INDEX "IDX_user_metadata_audit_key" ON "user_metadata_audit" ("key");`.execute(db);
  await sql`CREATE INDEX "IDX_user_metadata_audit_deleted_at" ON "user_metadata_audit" ("deletedAt");`.execute(db);
  await sql`ALTER TABLE "user_metadata" ADD "updateId" uuid NOT NULL DEFAULT immich_uuid_v7();`.execute(db);
  await sql`ALTER TABLE "user_metadata" ADD "updatedAt" timestamp with time zone NOT NULL DEFAULT now();`.execute(db);
  await sql`CREATE INDEX "IDX_user_metadata_update_id" ON "user_metadata" ("updateId");`.execute(db);
  await sql`CREATE INDEX "IDX_user_metadata_updated_at" ON "user_metadata" ("updatedAt");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "user_metadata_audit"
  AFTER DELETE ON "user_metadata"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION user_metadata_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "user_metadata_updated_at"
  BEFORE UPDATE ON "user_metadata"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_user_metadata_audit', '{"type":"function","name":"user_metadata_audit","sql":"CREATE OR REPLACE FUNCTION user_metadata_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO user_metadata_audit (\\"userId\\", \\"key\\")\\n      SELECT \\"userId\\", \\"key\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_user_metadata_audit', '{"type":"trigger","name":"user_metadata_audit","sql":"CREATE OR REPLACE TRIGGER \\"user_metadata_audit\\"\\n  AFTER DELETE ON \\"user_metadata\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION user_metadata_audit();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_user_metadata_updated_at', '{"type":"trigger","name":"user_metadata_updated_at","sql":"CREATE OR REPLACE TRIGGER \\"user_metadata_updated_at\\"\\n  BEFORE UPDATE ON \\"user_metadata\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "user_metadata_audit" ON "user_metadata";`.execute(db);
  await sql`DROP TRIGGER "user_metadata_updated_at" ON "user_metadata";`.execute(db);
  await sql`DROP INDEX "IDX_user_metadata_update_id";`.execute(db);
  await sql`DROP INDEX "IDX_user_metadata_updated_at";`.execute(db);
  await sql`ALTER TABLE "user_metadata" DROP COLUMN "updateId";`.execute(db);
  await sql`ALTER TABLE "user_metadata" DROP COLUMN "updatedAt";`.execute(db);
  await sql`DROP TABLE "user_metadata_audit";`.execute(db);
  await sql`DROP FUNCTION user_metadata_audit;`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_user_metadata_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_user_metadata_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_user_metadata_updated_at';`.execute(db);
}
