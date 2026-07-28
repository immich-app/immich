import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION face_cluster_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO face_cluster_audit ("faceClusterId", "userId")
      SELECT OLD."id", "person"."ownerId"
      FROM OLD
      INNER JOIN person ON "person"."faceClusterId" = OLD."id";
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"function","name":"face_cluster_delete_audit","sql":"CREATE OR REPLACE FUNCTION face_cluster_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO face_cluster_audit (\\"faceClusterId\\", \\"userId\\")\\n      SELECT OLD.\\"id\\", \\"person\\".\\"ownerId\\"\\n      FROM OLD\\n      INNER JOIN person ON \\"person\\".\\"faceClusterId\\" = OLD.\\"id\\";\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb WHERE "name" = 'function_face_cluster_delete_audit';`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION public.face_cluster_delete_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      INSERT INTO face_cluster_audit ("faceClusterId", "userId")
      SELECT "OLD"."id", "person"."ownerId"
      FROM OLD
      INNER JOIN person ON "person"."faceClusterId" = "OLD"."id";
      RETURN NULL;
    END
  $function$
`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE OR REPLACE FUNCTION face_cluster_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO face_cluster_audit (\\"faceClusterId\\", \\"userId\\")\\n      SELECT \\"OLD\\".\\"id\\", \\"person\\".\\"ownerId\\"\\n      FROM OLD\\n      INNER JOIN person ON \\"person\\".\\"faceClusterId\\" = \\"OLD\\".\\"id\\";\\n      RETURN NULL;\\n    END\\n  $$;","name":"face_cluster_delete_audit","type":"function"}'::jsonb WHERE "name" = 'function_face_cluster_delete_audit';`.execute(db);
}
