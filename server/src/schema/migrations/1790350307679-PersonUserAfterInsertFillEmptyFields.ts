import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION person_user_after_insert()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO person ("ownerId", "personGroupId", "name", "birthDate")
      SELECT DISTINCT ON (i."sharedWithId", i."personGroupId")
        i."sharedWithId", i."personGroupId", shared."name", shared."birthDate"
      FROM inserted_rows i
      INNER JOIN person shared
        ON shared."ownerId" = i."sharedById" AND shared."personGroupId" = i."personGroupId"
      ORDER BY i."sharedWithId", i."personGroupId", shared."name" = '', shared."birthDate" IS NULL
      ON CONFLICT ("ownerId", "personGroupId") DO UPDATE
      SET
        "name" = CASE WHEN person."name" = '' THEN EXCLUDED."name" ELSE person."name" END,
        "birthDate" = COALESCE(person."birthDate", EXCLUDED."birthDate")
      WHERE (person."name" = '' AND EXCLUDED."name" <> '')
        OR (person."birthDate" IS NULL AND EXCLUDED."birthDate" IS NOT NULL);
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"function","name":"person_user_after_insert","sql":"CREATE OR REPLACE FUNCTION person_user_after_insert()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO person (\\"ownerId\\", \\"personGroupId\\", \\"name\\", \\"birthDate\\")\\n      SELECT DISTINCT ON (i.\\"sharedWithId\\", i.\\"personGroupId\\")\\n        i.\\"sharedWithId\\", i.\\"personGroupId\\", shared.\\"name\\", shared.\\"birthDate\\"\\n      FROM inserted_rows i\\n      INNER JOIN person shared\\n        ON shared.\\"ownerId\\" = i.\\"sharedById\\" AND shared.\\"personGroupId\\" = i.\\"personGroupId\\"\\n      ORDER BY i.\\"sharedWithId\\", i.\\"personGroupId\\", shared.\\"name\\" = '''', shared.\\"birthDate\\" IS NULL\\n      ON CONFLICT (\\"ownerId\\", \\"personGroupId\\") DO UPDATE\\n      SET\\n        \\"name\\" = CASE WHEN person.\\"name\\" = '''' THEN EXCLUDED.\\"name\\" ELSE person.\\"name\\" END,\\n        \\"birthDate\\" = COALESCE(person.\\"birthDate\\", EXCLUDED.\\"birthDate\\")\\n      WHERE (person.\\"name\\" = '''' AND EXCLUDED.\\"name\\" <> '''')\\n        OR (person.\\"birthDate\\" IS NULL AND EXCLUDED.\\"birthDate\\" IS NOT NULL);\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb WHERE "name" = 'function_person_user_after_insert';`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION public.person_user_after_insert()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      INSERT INTO person ("ownerId", "personGroupId", "name", "birthDate")
      SELECT i."sharedWithId", i."personGroupId", shared."name", shared."birthDate"
      FROM inserted_rows i
      INNER JOIN person shared
        ON shared."ownerId" = i."sharedById" AND shared."personGroupId" = i."personGroupId"
      ON CONFLICT ("ownerId", "personGroupId") DO NOTHING;
      RETURN NULL;
    END
  $function$
`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE OR REPLACE FUNCTION person_user_after_insert()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO person (\\"ownerId\\", \\"personGroupId\\", \\"name\\", \\"birthDate\\")\\n      SELECT i.\\"sharedWithId\\", i.\\"personGroupId\\", shared.\\"name\\", shared.\\"birthDate\\"\\n      FROM inserted_rows i\\n      INNER JOIN person shared\\n        ON shared.\\"ownerId\\" = i.\\"sharedById\\" AND shared.\\"personGroupId\\" = i.\\"personGroupId\\"\\n      ON CONFLICT (\\"ownerId\\", \\"personGroupId\\") DO NOTHING;\\n      RETURN NULL;\\n    END\\n  $$;","name":"person_user_after_insert","type":"function"}'::jsonb WHERE "name" = 'function_person_user_after_insert';`.execute(db);
}
