import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION face_cluster_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO face_cluster_audit ("faceClusterId")
      SELECT "id"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "face_cluster_delete_audit"
  AFTER DELETE ON "face_cluster"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION face_cluster_delete_audit();`.execute(db);
  await sql`DROP TRIGGER "person_delete_audit" ON "face_cluster";`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_face_cluster_delete_audit', '{"type":"function","name":"face_cluster_delete_audit","sql":"CREATE OR REPLACE FUNCTION face_cluster_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO face_cluster_audit (\\"faceClusterId\\")\\n      SELECT \\"id\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_face_cluster_delete_audit', '{"type":"trigger","name":"face_cluster_delete_audit","sql":"CREATE OR REPLACE TRIGGER \\"face_cluster_delete_audit\\"\\n  AFTER DELETE ON \\"face_cluster\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION face_cluster_delete_audit();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "face_cluster_delete_audit" ON "face_cluster";`.execute(db);
  await sql`DROP FUNCTION face_cluster_delete_audit;`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "person_delete_audit"
  AFTER DELETE ON "face_cluster"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN ((pg_trigger_depth() = 0))
  EXECUTE FUNCTION person_delete_audit();`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_face_cluster_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_face_cluster_delete_audit';`.execute(db);
}
