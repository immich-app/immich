import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION person_user_after_insert()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO person ("ownerId", "personGroupId", "name", "birthDate")
      SELECT i."sharedWithId", i."personGroupId", shared."name", shared."birthDate"
      FROM inserted_rows i
      INNER JOIN person shared
        ON shared."ownerId" = i."sharedById" AND shared."personGroupId" = i."personGroupId"
      ON CONFLICT ("ownerId", "personGroupId") DO NOTHING;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION person_delete_shares()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      DELETE FROM person_user
      USING deleted_rows
      WHERE person_user."personGroupId" = deleted_rows."personGroupId"
        AND person_user."sharedWithId" = deleted_rows."ownerId";
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE TYPE "person_user_role_enum" AS ENUM ('read','write','admin');`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "person_delete_shares"
  AFTER DELETE ON "person"
  REFERENCING OLD TABLE AS "deleted_rows"
  FOR EACH STATEMENT
  EXECUTE FUNCTION person_delete_shares();`.execute(db);
  await sql`CREATE TABLE "person_user" (
  "personGroupId" uuid NOT NULL,
  "sharedById" uuid NOT NULL,
  "sharedWithId" uuid NOT NULL,
  "role" person_user_role_enum NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  CONSTRAINT "person_user_sharedWithId_fkey" FOREIGN KEY ("sharedWithId") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "person_user_sharedById_personGroupId_fkey" FOREIGN KEY ("sharedById", "personGroupId") REFERENCES "person" ("ownerId", "personGroupId") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "person_user_pkey" PRIMARY KEY ("personGroupId", "sharedById", "sharedWithId")
);`.execute(db);
  await sql`CREATE INDEX "person_user_sharedById_personGroupId_idx" ON "person_user" ("sharedById", "personGroupId");`.execute(db);
  await sql`CREATE INDEX "person_user_sharedWithId_idx" ON "person_user" ("sharedWithId");`.execute(db);
  await sql`CREATE INDEX "person_user_updateId_idx" ON "person_user" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "person_user_after_insert"
  AFTER INSERT ON "person_user"
  REFERENCING NEW TABLE AS "inserted_rows"
  FOR EACH STATEMENT
  EXECUTE FUNCTION person_user_after_insert();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "person_user_updatedAt"
  BEFORE UPDATE ON "person_user"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_person_user_after_insert', '{"type":"function","name":"person_user_after_insert","sql":"CREATE OR REPLACE FUNCTION person_user_after_insert()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO person (\\"ownerId\\", \\"personGroupId\\", \\"name\\", \\"birthDate\\")\\n      SELECT i.\\"sharedWithId\\", i.\\"personGroupId\\", shared.\\"name\\", shared.\\"birthDate\\"\\n      FROM inserted_rows i\\n      INNER JOIN person shared\\n        ON shared.\\"ownerId\\" = i.\\"sharedById\\" AND shared.\\"personGroupId\\" = i.\\"personGroupId\\"\\n      ON CONFLICT (\\"ownerId\\", \\"personGroupId\\") DO NOTHING;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_person_delete_shares', '{"type":"function","name":"person_delete_shares","sql":"CREATE OR REPLACE FUNCTION person_delete_shares()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      DELETE FROM person_user\\n      USING deleted_rows\\n      WHERE person_user.\\"personGroupId\\" = deleted_rows.\\"personGroupId\\"\\n        AND person_user.\\"sharedWithId\\" = deleted_rows.\\"ownerId\\";\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_person_delete_shares', '{"type":"trigger","name":"person_delete_shares","sql":"CREATE OR REPLACE TRIGGER \\"person_delete_shares\\"\\n  AFTER DELETE ON \\"person\\"\\n  REFERENCING OLD TABLE AS \\"deleted_rows\\"\\n  FOR EACH STATEMENT\\n  EXECUTE FUNCTION person_delete_shares();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_person_user_after_insert', '{"type":"trigger","name":"person_user_after_insert","sql":"CREATE OR REPLACE TRIGGER \\"person_user_after_insert\\"\\n  AFTER INSERT ON \\"person_user\\"\\n  REFERENCING NEW TABLE AS \\"inserted_rows\\"\\n  FOR EACH STATEMENT\\n  EXECUTE FUNCTION person_user_after_insert();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_person_user_updatedAt', '{"type":"trigger","name":"person_user_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"person_user_updatedAt\\"\\n  BEFORE UPDATE ON \\"person_user\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "person_user_after_insert" ON "person_user";`.execute(db);
  await sql`DROP FUNCTION person_user_after_insert;`.execute(db);
  await sql`DROP TRIGGER "person_delete_shares" ON "person";`.execute(db);
  await sql`DROP FUNCTION person_delete_shares;`.execute(db);
  await sql`DROP TABLE "person_user";`.execute(db);
  await sql`DROP TYPE "person_user_role_enum";`.execute(db);
  await sql`DROP TRIGGER "person_user_updatedAt" ON "person_user";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_person_user_after_insert';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_person_delete_shares';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_person_delete_shares';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_person_user_after_insert';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_person_user_updatedAt';`.execute(db);
}
