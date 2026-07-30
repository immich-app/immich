import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION person_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO person_audit ("personId", "trustedGroupId")
      SELECT "id", "trustedGroupId"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION person_user_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO person_user_audit ("personId", "ownerId")
      SELECT "personId", "ownerId"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`ALTER TABLE "user" ADD "trustedGroupId" uuid NOT NULL DEFAULT uuid_generate_v4();`.execute(db);

  await sql`CREATE TABLE "person_user" (
  "personId" uuid NOT NULL,
  "ownerId" uuid NOT NULL,
  "isHidden" boolean NOT NULL DEFAULT false,
  "isFavorite" boolean NOT NULL DEFAULT false,
  "thumbnailPath" character varying NOT NULL DEFAULT '',
  "thumbnailFaceAssetId" uuid,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  CONSTRAINT "person_user_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "person_user_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "person_user_thumbnailFaceAssetId_fkey" FOREIGN KEY ("thumbnailFaceAssetId") REFERENCES "asset_face" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "person_user_pkey" PRIMARY KEY ("personId", "ownerId")
);`.execute(db);
  await db
    .insertInto('person_user')
    .columns(['personId', 'ownerId', 'isHidden', 'isFavorite', 'thumbnailPath', 'thumbnailFaceAssetId', 'createdAt'])
    .expression((eb) =>
      eb
        .selectFrom('person')
        .select([
          'person.id',
          'person.ownerId',
          'person.isHidden',
          'person.isFavorite',
          'person.thumbnailPath',
          'person.faceAssetId',
          'person.createdAt',
        ]),
    )
    .execute();
  await sql`CREATE INDEX "person_user_personId_idx" ON "person_user" ("personId");`.execute(db);
  await sql`CREATE INDEX "person_user_ownerId_idx" ON "person_user" ("ownerId");`.execute(db);
  await sql`CREATE INDEX "person_user_thumbnailFaceAssetId_idx" ON "person_user" ("thumbnailFaceAssetId");`.execute(db);
  await sql`CREATE INDEX "person_user_updateId_idx" ON "person_user" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "person_user_delete_audit"
  AFTER DELETE ON "person_user"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() <= 1)
  EXECUTE FUNCTION person_user_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "person_user_updatedAt"
  BEFORE UPDATE ON "person_user"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);

  await sql`ALTER TABLE "person" DROP CONSTRAINT "person_ownerId_fkey";`.execute(db);
  await sql`ALTER TABLE "person" DROP CONSTRAINT "person_faceAssetId_fkey";`.execute(db);
  await sql`ALTER TABLE "person" RENAME COLUMN "faceAssetId" TO "trustedGroupId";`.execute(db);
  await db
    .updateTable('person')
    .from('user')
    .set((eb) => ({ trustedGroupId: eb.ref('user.trustedGroupId') }))
    .whereRef('person.ownerId', '=', 'user.id')
    .execute();

  await sql`ALTER TABLE "person" DROP COLUMN "ownerId";`.execute(db);
  await sql`ALTER TABLE "person" DROP COLUMN "isHidden";`.execute(db);
  await sql`ALTER TABLE "person" DROP COLUMN "isFavorite";`.execute(db);
  await sql`ALTER TABLE "person" DROP COLUMN "thumbnailPath";`.execute(db);
  await sql`CREATE INDEX "person_trustedGroupId_idx" ON "person" ("trustedGroupId");`.execute(db);
  await sql`DROP INDEX "person_faceAssetId_idx";`.execute(db);

  await sql`CREATE TABLE "person_user_audit" (
  "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "personId" uuid NOT NULL,
  "ownerId" uuid NOT NULL,
  "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "person_user_audit_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await db
    .insertInto('person_user_audit')
    .columns(['personId', 'ownerId', 'deletedAt'])
    .expression((eb) => eb.selectFrom('person_audit').select(['person_audit.personId', 'person_audit.ownerId', 'person_audit.deletedAt']))
    .execute();

  await sql`ALTER TABLE "person_audit" RENAME COLUMN "ownerId" TO "trustedGroupId";`.execute(db);
  await db
    .updateTable('person_audit')
    .from('user')
    .set((eb) => ({ trustedGroupId: eb.ref('user.trustedGroupId') }))
    .whereRef('person_audit.trustedGroupId', '=', 'user.id')
    .execute();

  await sql`CREATE INDEX "person_audit_trustedGroupId_idx" ON "person_audit" ("trustedGroupId");`.execute(db);
  await sql`DROP INDEX "person_audit_ownerId_idx";`.execute(db);
  await sql`CREATE INDEX "person_user_audit_personId_idx" ON "person_user_audit" ("personId");`.execute(db);
  await sql`CREATE INDEX "person_user_audit_ownerId_idx" ON "person_user_audit" ("ownerId");`.execute(db);
  await sql`CREATE INDEX "person_user_audit_deletedAt_idx" ON "person_user_audit" ("deletedAt");`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"function","name":"person_delete_audit","sql":"CREATE OR REPLACE FUNCTION person_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO person_audit (\\"personId\\", \\"trustedGroupId\\")\\n      SELECT \\"id\\", \\"trustedGroupId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb WHERE "name" = 'function_person_delete_audit';`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_person_user_delete_audit', '{"type":"function","name":"person_user_delete_audit","sql":"CREATE OR REPLACE FUNCTION person_user_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO person_user_audit (\\"personId\\", \\"ownerId\\")\\n      SELECT \\"personId\\", \\"ownerId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_person_user_delete_audit', '{"type":"trigger","name":"person_user_delete_audit","sql":"CREATE OR REPLACE TRIGGER \\"person_user_delete_audit\\"\\n  AFTER DELETE ON \\"person_user\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() <= 1)\\n  EXECUTE FUNCTION person_user_delete_audit();"}'::jsonb);`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_person_user_updatedAt', '{"type":"trigger","name":"person_user_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"person_user_updatedAt\\"\\n  BEFORE UPDATE ON \\"person_user\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(
    db,
  );
}

export async function down(_db: Kysely<any>): Promise<void> {
  // TODO we probably won't support this?
  //
  //   await sql`CREATE OR REPLACE FUNCTION public.person_delete_audit()
  //  RETURNS trigger
  //  LANGUAGE plpgsql
  // AS $function$
  //     BEGIN
  //       INSERT INTO person_audit ("personId", "ownerId")
  //       SELECT "id", "ownerId"
  //       FROM OLD;
  //       RETURN NULL;
  //     END
  //   $function$
  // `.execute(db);
  //   await sql`DROP TRIGGER "person_user_delete_audit" ON "person_user";`.execute(db);
  //   await sql`DROP FUNCTION person_user_delete_audit;`.execute(db);
  //   await sql`ALTER TABLE "person" RENAME COLUMN "trustedGroupId" TO "faceAssetId";`.execute(db);
  //   await sql`ALTER TABLE "person" ADD "ownerId" uuid NOT NULL;`.execute(db);
  //   await sql`ALTER TABLE "person" ADD "isHidden" boolean NOT NULL DEFAULT false;`.execute(db);
  //   await sql`ALTER TABLE "person" ADD "isFavorite" boolean NOT NULL DEFAULT false;`.execute(db);
  //   await sql`ALTER TABLE "person" ADD "thumbnailPath" character varying NOT NULL DEFAULT ''::character varying;`.execute(
  //     db,
  //   );
  //   await sql`CREATE INDEX "person_faceAssetId_idx" ON "person" ("faceAssetId");`.execute(db);
  //   await sql`CREATE INDEX "person_ownerId_idx" ON "person" ("ownerId");`.execute(db);
  //   await sql`DROP INDEX "person_trustedGroupId_idx";`.execute(db);
  //   await sql`ALTER TABLE "person" ADD CONSTRAINT "person_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(
  //     db,
  //   );
  //   await sql`ALTER TABLE "person" ADD CONSTRAINT "person_faceAssetId_fkey" FOREIGN KEY ("faceAssetId") REFERENCES "asset_face" ("id") ON UPDATE NO ACTION ON DELETE SET NULL;`.execute(
  //     db,
  //   );
  //   await sql`ALTER TABLE "person_audit" RENAME COLUMN "trustedGroupId" TO "ownerId";`.execute(db);
  //   await sql`CREATE INDEX "person_audit_ownerId_idx" ON "person_audit" ("ownerId");`.execute(db);
  //   await sql`DROP INDEX "person_audit_trustedGroupId_idx";`.execute(db);
  //   await sql`ALTER TABLE "user" DROP COLUMN "trustedGroupId";`.execute(db);
  //   await sql`DROP TABLE "person_user_audit";`.execute(db);
  //   await sql`DROP TABLE "person_user";`.execute(db);
  //   await sql`DROP TRIGGER "person_user_updatedAt" ON "person_user";`.execute(db);
  //   await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE OR REPLACE FUNCTION person_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO person_audit (\\"personId\\", \\"ownerId\\")\\n      SELECT \\"id\\", \\"ownerId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;","name":"person_delete_audit","type":"function"}'::jsonb WHERE "name" = 'function_person_delete_audit';`.execute(
  //     db,
  //   );
  //   await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_person_user_delete_audit';`.execute(db);
  //   await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_person_user_delete_audit';`.execute(db);
  //   await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_person_user_updatedAt';`.execute(db);
}
