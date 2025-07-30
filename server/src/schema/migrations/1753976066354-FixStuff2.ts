import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "group_delete_audit" ON "group";`.execute(db);
  await sql`ALTER TABLE "group_audit" ADD "userId" uuid NOT NULL;`.execute(db);
  await sql`DROP FUNCTION group_delete_audit;`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_group_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_group_delete_audit';`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION public.group_delete_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      INSERT INTO group_audit ("groupId")
      SELECT "id"
      FROM OLD;
      RETURN NULL;
    END
  $function$
`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "group_delete_audit"
  AFTER DELETE ON "group"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN ((pg_trigger_depth() = 0))
  EXECUTE FUNCTION group_delete_audit();`.execute(db);
  await sql`ALTER TABLE "group_audit" DROP COLUMN "userId";`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_group_delete_audit', '{"sql":"CREATE OR REPLACE FUNCTION group_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO group_audit (\\"groupId\\")\\n      SELECT \\"id\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;","name":"group_delete_audit","type":"function"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_group_delete_audit', '{"sql":"CREATE OR REPLACE TRIGGER \\"group_delete_audit\\"\\n  AFTER DELETE ON \\"group\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION group_delete_audit();","name":"group_delete_audit","type":"trigger"}'::jsonb);`.execute(db);
}
