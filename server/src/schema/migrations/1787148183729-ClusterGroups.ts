import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION person_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO person_audit ("personGroupId", "ownerId")
      SELECT "personGroupId", "ownerId"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "person_delete_audit"
  AFTER DELETE ON "person"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() <= 1)
  EXECUTE FUNCTION person_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION person_group_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO person_group_audit ("personGroupId", "clusterGroupId")
      SELECT "id", "clusterGroupId"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE TABLE "cluster_group" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "name" character varying,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  CONSTRAINT "cluster_group_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "cluster_group_updateId_idx" ON "cluster_group" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "cluster_group_updatedAt"
  BEFORE UPDATE ON "cluster_group"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);

  await sql`ALTER TABLE "user" ADD "clusterGroupId" uuid;`.execute(db);
  await sql`UPDATE "user" SET "clusterGroupId" = uuid_generate_v4();`.execute(db);
  await sql`INSERT INTO "cluster_group" ("id") SELECT "clusterGroupId" FROM "user";`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "clusterGroupId" SET NOT NULL;`.execute(db);
  await sql`CREATE INDEX "user_clusterGroupId_idx" ON "user" ("clusterGroupId");`.execute(db);
  await sql`ALTER TABLE "user" ADD CONSTRAINT "user_clusterGroupId_fkey" FOREIGN KEY ("clusterGroupId") REFERENCES "cluster_group" ("id") ON UPDATE CASCADE ON DELETE NO ACTION;`.execute(db);

  await sql`CREATE TABLE "cluster_group_request" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "clusterGroupId" uuid NOT NULL,
  "userId" uuid NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "cluster_group_request_clusterGroupId_fkey" FOREIGN KEY ("clusterGroupId") REFERENCES "cluster_group" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "cluster_group_request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "cluster_group_request_clusterGroupId_userId_uq" UNIQUE ("clusterGroupId", "userId"),
  CONSTRAINT "cluster_group_request_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "cluster_group_request_clusterGroupId_idx" ON "cluster_group_request" ("clusterGroupId");`.execute(
    db,
  );
  await sql`CREATE INDEX "cluster_group_request_userId_idx" ON "cluster_group_request" ("userId");`.execute(db);

  await sql`CREATE TABLE "person_group" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "clusterGroupId" uuid NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "createId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  CONSTRAINT "person_group_clusterGroupId_fkey" FOREIGN KEY ("clusterGroupId") REFERENCES "cluster_group" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "person_group_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "person_group_clusterGroupId_idx" ON "person_group" ("clusterGroupId");`.execute(db);
  await sql`CREATE INDEX "person_group_createId_idx" ON "person_group" ("createId");`.execute(db);
  await sql`CREATE INDEX "person_group_updateId_idx" ON "person_group" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "person_group_delete_audit"
  AFTER DELETE ON "person_group"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION person_group_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "person_group_updatedAt"
  BEFORE UPDATE ON "person_group"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE TABLE "person_group_audit" (
  "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "personGroupId" uuid NOT NULL,
  "clusterGroupId" uuid NOT NULL,
  "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "person_group_audit_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "person_group_audit_personGroupId_idx" ON "person_group_audit" ("personGroupId");`.execute(db);
  await sql`CREATE INDEX "person_group_audit_clusterGroupId_idx" ON "person_group_audit" ("clusterGroupId");`.execute(db);
  await sql`CREATE INDEX "person_group_audit_deletedAt_idx" ON "person_group_audit" ("deletedAt");`.execute(db);

  await sql`ALTER TABLE "person" ADD "personGroupId" uuid;`.execute(db);
  await sql`INSERT INTO "person_group" ("id", "clusterGroupId", "createdAt")
  SELECT "person"."id", "user"."clusterGroupId", "person"."createdAt"
  FROM "person"
  INNER JOIN "user" ON "user"."id" = "person"."ownerId";`.execute(db);
  await sql`UPDATE "person" SET "personGroupId" = "id";`.execute(db);
  await sql`ALTER TABLE "person" ALTER COLUMN "personGroupId" SET NOT NULL;`.execute(db);
  await sql`CREATE INDEX "person_personGroupId_idx" ON "person" ("personGroupId");`.execute(db);
  await sql`ALTER TABLE "person" ADD CONSTRAINT "person_personGroupId_fkey" FOREIGN KEY ("personGroupId") REFERENCES "person_group" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(
    db,
  );

  await sql`ALTER TABLE "person_audit" ADD "personGroupId" uuid;`.execute(db);
  await sql`UPDATE "person_audit" SET "personGroupId" = "personId";`.execute(db);
  await sql`ALTER TABLE "person_audit" ALTER COLUMN "personGroupId" SET NOT NULL;`.execute(db);
  await sql`ALTER TABLE "person_audit" DROP COLUMN "personId";`.execute(db);
  await sql`CREATE INDEX "person_audit_personGroupId_idx" ON "person_audit" ("personGroupId");`.execute(db);

  await sql`ALTER TABLE "asset_face" DROP CONSTRAINT "asset_face_personId_fkey";`.execute(db);
  await sql`ALTER TABLE "asset_face" RENAME COLUMN "personId" TO "personGroupId";`.execute(db);
  await sql`UPDATE "asset_face" SET "personGroupId" = "person"."personGroupId"
  FROM "person"
  WHERE "person"."id" = "asset_face"."personGroupId";`.execute(db);
  await sql`ALTER TABLE "asset_face" ADD CONSTRAINT "asset_face_personGroupId_fkey" FOREIGN KEY ("personGroupId") REFERENCES "person_group" ("id") ON UPDATE CASCADE ON DELETE SET NULL;`.execute(
    db,
  );
  await sql`CREATE INDEX "asset_face_personGroupId_assetId_idx" ON "asset_face" ("personGroupId", "assetId");`.execute(
    db,
  );
  await sql`CREATE INDEX "asset_face_personGroupId_assetId_notDeleted_isVisible_idx" ON "asset_face" ("personGroupId", "assetId") WHERE ("deletedAt" IS NULL AND "isVisible" IS TRUE);`.execute(
    db,
  );
  await sql`CREATE INDEX "asset_face_assetId_personGroupId_idx" ON "asset_face" ("assetId", "personGroupId");`.execute(
    db,
  );
  await sql`DROP INDEX "asset_face_assetId_personId_idx";`.execute(db);
  await sql`DROP INDEX "asset_face_personId_assetId_idx";`.execute(db);
  await sql`DROP INDEX "asset_face_personId_assetId_notDeleted_isVisible_idx";`.execute(db);

  // a person is identified by its owner and the group it belongs to
  await sql`ALTER TABLE "person" DROP CONSTRAINT "person_pkey";`.execute(db);
  await sql`ALTER TABLE "person" DROP COLUMN "id";`.execute(db);
  await sql`ALTER TABLE "person" ADD CONSTRAINT "person_pkey" PRIMARY KEY ("ownerId", "personGroupId");`.execute(db);
  await sql`DROP INDEX "person_ownerId_idx";`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"function","name":"person_delete_audit","sql":"CREATE OR REPLACE FUNCTION person_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO person_audit (\\"personGroupId\\", \\"ownerId\\")\\n      SELECT \\"personGroupId\\", \\"ownerId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb WHERE "name" = 'function_person_delete_audit';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"trigger","name":"person_delete_audit","sql":"CREATE OR REPLACE TRIGGER \\"person_delete_audit\\"\\n  AFTER DELETE ON \\"person\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() <= 1)\\n  EXECUTE FUNCTION person_delete_audit();"}'::jsonb WHERE "name" = 'trigger_person_delete_audit';`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_person_group_delete_audit', '{"type":"function","name":"person_group_delete_audit","sql":"CREATE OR REPLACE FUNCTION person_group_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO person_group_audit (\\"personGroupId\\", \\"clusterGroupId\\")\\n      SELECT \\"id\\", \\"clusterGroupId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_cluster_group_updatedAt', '{"type":"trigger","name":"cluster_group_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"cluster_group_updatedAt\\"\\n  BEFORE UPDATE ON \\"cluster_group\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_person_group_delete_audit', '{"type":"trigger","name":"person_group_delete_audit","sql":"CREATE OR REPLACE TRIGGER \\"person_group_delete_audit\\"\\n  AFTER DELETE ON \\"person_group\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION person_group_delete_audit();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_person_group_updatedAt', '{"type":"trigger","name":"person_group_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"person_group_updatedAt\\"\\n  BEFORE UPDATE ON \\"person_group\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_asset_face_personGroupId_assetId_notDeleted_isVisible_idx', '{"type":"index","name":"asset_face_personGroupId_assetId_notDeleted_isVisible_idx","sql":"CREATE INDEX \\"asset_face_personGroupId_assetId_notDeleted_isVisible_idx\\" ON \\"asset_face\\" (\\"personGroupId\\", \\"assetId\\") WHERE (\\"deletedAt\\" IS NULL AND \\"isVisible\\" IS TRUE);"}'::jsonb);`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_asset_face_personId_assetId_notDeleted_isVisible_idx';`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
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
  await sql`CREATE OR REPLACE TRIGGER "person_delete_audit"
  AFTER DELETE ON "person"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION person_delete_audit();`.execute(db);

  await sql`ALTER TABLE "person" DROP CONSTRAINT "person_pkey";`.execute(db);
  await sql`ALTER TABLE "person" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4();`.execute(db);
  await sql`UPDATE "person" SET "id" = "personGroupId";`.execute(db);
  await sql`ALTER TABLE "person" ADD CONSTRAINT "person_pkey" PRIMARY KEY ("id");`.execute(db);
  await sql`CREATE INDEX "person_ownerId_idx" ON "person" ("ownerId");`.execute(db);

  await sql`DROP INDEX "asset_face_assetId_personGroupId_idx";`.execute(db);
  await sql`DROP INDEX "asset_face_personGroupId_assetId_notDeleted_isVisible_idx";`.execute(db);
  await sql`DROP INDEX "asset_face_personGroupId_assetId_idx";`.execute(db);
  await sql`ALTER TABLE "asset_face" DROP CONSTRAINT "asset_face_personGroupId_fkey";`.execute(db);
  await sql`ALTER TABLE "asset_face" RENAME COLUMN "personGroupId" TO "personId";`.execute(db);
  await sql`UPDATE "asset_face" SET "personId" = "person"."id"
  FROM "person"
  WHERE "person"."personGroupId" = "asset_face"."personId";`.execute(db);
  await sql`ALTER TABLE "asset_face" ADD CONSTRAINT "asset_face_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person" ("id") ON UPDATE CASCADE ON DELETE SET NULL;`.execute(
    db,
  );
  await sql`CREATE INDEX "asset_face_assetId_personId_idx" ON "asset_face" ("assetId", "personId");`.execute(db);
  await sql`CREATE INDEX "asset_face_personId_assetId_idx" ON "asset_face" ("personId", "assetId");`.execute(db);
  await sql`CREATE INDEX "asset_face_personId_assetId_notDeleted_isVisible_idx" ON "asset_face" ("personId", "assetId") WHERE ("deletedAt" IS NULL AND "isVisible" IS TRUE);`.execute(
    db,
  );

  await sql`ALTER TABLE "person_audit" ADD "personId" uuid;`.execute(db);
  await sql`UPDATE "person_audit" SET "personId" = "personGroupId";`.execute(db);
  await sql`ALTER TABLE "person_audit" ALTER COLUMN "personId" SET NOT NULL;`.execute(db);
  await sql`CREATE INDEX "person_audit_personId_idx" ON "person_audit" ("personId");`.execute(db);
  await sql`DROP INDEX "person_audit_personGroupId_idx";`.execute(db);
  await sql`ALTER TABLE "person_audit" DROP COLUMN "personGroupId";`.execute(db);
  await sql`ALTER TABLE "person" DROP CONSTRAINT "person_personGroupId_fkey";`.execute(db);
  await sql`DROP INDEX "person_personGroupId_idx";`.execute(db);
  await sql`ALTER TABLE "person" DROP COLUMN "personGroupId";`.execute(db);
  await sql`ALTER TABLE "user" DROP CONSTRAINT "user_clusterGroupId_fkey";`.execute(db);
  await sql`DROP INDEX "user_clusterGroupId_idx";`.execute(db);
  await sql`ALTER TABLE "user" DROP COLUMN "clusterGroupId";`.execute(db);
  await sql`DROP TABLE "cluster_group_request";`.execute(db);
  await sql`DROP TABLE "person_group_audit";`.execute(db);
  await sql`DROP TABLE "person_group";`.execute(db);
  await sql`DROP TABLE "cluster_group";`.execute(db);
  await sql`DROP FUNCTION person_group_delete_audit;`.execute(db);

  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"function","name":"person_delete_audit","sql":"CREATE OR REPLACE FUNCTION person_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO person_audit (\\"personId\\", \\"ownerId\\")\\n      SELECT \\"id\\", \\"ownerId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb WHERE "name" = 'function_person_delete_audit';`.execute(
    db,
  );
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"trigger","name":"person_delete_audit","sql":"CREATE OR REPLACE TRIGGER \\"person_delete_audit\\"\\n  AFTER DELETE ON \\"person\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION person_delete_audit();"}'::jsonb WHERE "name" = 'trigger_person_delete_audit';`.execute(
    db,
  );
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_person_group_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_cluster_group_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_person_group_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_person_group_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_asset_face_personGroupId_assetId_notDeleted_isVisible_idx';`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_asset_face_personId_assetId_notDeleted_isVisible_idx', '{"type":"index","name":"asset_face_personId_assetId_notDeleted_isVisible_idx","sql":"CREATE INDEX \\"asset_face_personId_assetId_notDeleted_isVisible_idx\\" ON \\"asset_face\\" (\\"personId\\", \\"assetId\\") WHERE (\\"deletedAt\\" IS NULL AND \\"isVisible\\" IS TRUE);"}'::jsonb);`.execute(
    db,
  );
}
