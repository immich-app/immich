import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_face" RENAME COLUMN "personId" TO "faceClusterId";`.execute(db);
  await sql`CREATE INDEX "asset_face_faceClusterId_assetId_notDeleted_isVisible_idx" ON "asset_face" ("faceClusterId", "assetId") WHERE ("deletedAt" IS NULL AND "isVisible" IS TRUE);`.execute(
    db,
  );
  await sql`CREATE INDEX "asset_face_assetId_faceClusterId_idx" ON "asset_face" ("assetId", "faceClusterId");`.execute(
    db,
  );
  await sql`DROP INDEX "asset_face_personId_assetId_notDeleted_isVisible_idx";`.execute(db);
  await sql`DROP INDEX "asset_face_assetId_personId_idx";`.execute(db);
  await sql`ALTER TABLE "person" RENAME TO "face_cluster"`.execute(db);

  await sql`CREATE TABLE "person" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
    "ownerId" uuid NOT NULL,
    "faceClusterId" uuid NOT NULL,
    "isHidden" boolean DEFAULT false,
    "isFavorite" boolean DEFAULT false,
    "thumbnailPath" character varying DEFAULT '',
    "updateId" uuid NOT NULL DEFAULT immich_uuid_v7()
  );`.execute(db);
  await db
    .insertInto('person')
    .columns(['faceClusterId', 'createdAt', 'ownerId', 'isHidden', 'isFavorite', 'thumbnailPath'])
    .expression((eb) => eb.selectFrom('face_cluster').select(['id', 'createdAt', 'ownerId', 'isHidden', 'isFavorite', 'thumbnailPath']))
    .execute();

  await sql`ALTER TABLE "face_cluster" DROP COLUMN "ownerId";`.execute(db);
  await sql`ALTER TABLE "face_cluster" DROP COLUMN "thumbnailPath";`.execute(db);
  await sql`ALTER TABLE "face_cluster" DROP COLUMN "isHidden";`.execute(db);
  await sql`ALTER TABLE "face_cluster" RENAME COLUMN "faceAssetId" TO "featureFaceAssetId";`.execute(db);
  await sql`ALTER TABLE "face_cluster" DROP COLUMN "isFavorite";`.execute(db);
  await sql`ALTER TABLE "face_cluster" DROP COLUMN "color";`.execute(db);
  await sql`ALTER TABLE "asset_face" ADD CONSTRAINT "asset_face_faceClusterId_fkey" FOREIGN KEY ("faceClusterId") REFERENCES "face_cluster" ("id") ON UPDATE CASCADE ON DELETE SET NULL;`.execute(
    db,
  );
  await sql`ALTER TABLE "asset_face" DROP CONSTRAINT "asset_face_personId_fkey";`.execute(db);
  await sql`CREATE INDEX "person_faceClusterId_idx" ON "person" ("faceClusterId");`.execute(db);
  await sql`DROP INDEX "person_faceAssetId_idx";`.execute(db);
  await sql`DROP INDEX "idx_person_name_trigram";`.execute(db);
  await sql`ALTER TABLE "person" ADD CONSTRAINT "person_faceClusterId_fkey" FOREIGN KEY ("faceClusterId") REFERENCES "face_cluster" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(
    db,
  );
  await sql`ALTER TABLE "face_cluster" DROP CONSTRAINT "person_faceAssetId_fkey";`.execute(db);
  await sql`ALTER TABLE "face_cluster" DROP CONSTRAINT "person_birthDate_chk";`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "face_cluster_updatedAt"
  BEFORE UPDATE ON "person"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`DROP TRIGGER "person_updatedAt" ON "face_cluster";`.execute(db);
  await sql`CREATE INDEX "idx_person_name_trigram" ON "face_cluster" USING gin (f_unaccent("name") gin_trgm_ops);`.execute(
    db,
  );
  await sql`CREATE INDEX "face_cluster_featureFaceAssetId_idx" ON "face_cluster" ("featureFaceAssetId");`.execute(db);
  await sql`CREATE INDEX "face_cluster_updateId_idx" ON "face_cluster" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "person_delete_audit"
  AFTER DELETE ON "face_cluster"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION person_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "face_cluster_updatedAt"
  BEFORE UPDATE ON "face_cluster"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`ALTER TABLE "face_cluster" ADD CONSTRAINT "face_cluster_featureFaceAssetId_fkey" FOREIGN KEY ("featureFaceAssetId") REFERENCES "asset_face" ("id") ON UPDATE NO ACTION ON DELETE SET NULL;`.execute(
    db,
  );
  await sql`CREATE TABLE "face_cluster_audit" (
  "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "faceClusterId" uuid NOT NULL,
  "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "face_cluster_audit_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "face_cluster_audit_faceClusterId_idx" ON "face_cluster_audit" ("faceClusterId");`.execute(db);
  await sql`CREATE INDEX "face_cluster_audit_deletedAt_idx" ON "face_cluster_audit" ("deletedAt");`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"index","name":"idx_person_name_trigram","sql":"CREATE INDEX \\"idx_person_name_trigram\\" ON \\"face_cluster\\" USING gin (f_unaccent(\\"name\\") gin_trgm_ops);"}'::jsonb WHERE "name" = 'index_idx_person_name_trigram';`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_face_cluster_updatedAt', '{"type":"trigger","name":"face_cluster_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"face_cluster_updatedAt\\"\\n  BEFORE UPDATE ON \\"person\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_asset_face_faceClusterId_assetId_notDeleted_isVisible_idx', '{"type":"index","name":"asset_face_faceClusterId_assetId_notDeleted_isVisible_idx","sql":"CREATE INDEX \\"asset_face_faceClusterId_assetId_notDeleted_isVisible_idx\\" ON \\"asset_face\\" (\\"faceClusterId\\", \\"assetId\\") WHERE (\\"deletedAt\\" IS NULL AND \\"isVisible\\" IS TRUE);"}'::jsonb);`.execute(
    db,
  );
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_person_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_asset_face_personId_assetId_notDeleted_isVisible_idx';`.execute(
    db,
  );
}

export async function down(_db: Kysely<any>): Promise<void> {
  // probably not supported?
  //
  // await sql`ALTER TABLE "person" ADD "birthDate" date;`.execute(db);
  // await sql`ALTER TABLE "person" ADD "faceAssetId" uuid;`.execute(db);
  // await sql`ALTER TABLE "person" ADD "name" character varying NOT NULL DEFAULT ''::character varying;`.execute(db);
  // await sql`ALTER TABLE "person" ADD "color" character varying;`.execute(db);
  // await sql`ALTER TABLE "person" DROP COLUMN "faceClusterId";`.execute(db);
  // await sql`CREATE INDEX "person_faceAssetId_idx" ON "person" ("faceAssetId");`.execute(db);
  // await sql`CREATE INDEX "idx_person_name_trigram" ON "person" USING gin (f_unaccent((name)::text));`.execute(db);
  // await sql`DROP INDEX "person_faceClusterId_idx";`.execute(db);
  // await sql`ALTER TABLE "person" ADD CONSTRAINT "person_faceAssetId_fkey" FOREIGN KEY ("faceAssetId") REFERENCES "asset_face" ("id") ON UPDATE NO ACTION ON DELETE SET NULL;`.execute(
  //   db,
  // );
  // await sql`ALTER TABLE "person" ADD CONSTRAINT "person_birthDate_chk" CHECK ((("birthDate" <= CURRENT_DATE)));`.execute(
  //   db,
  // );
  // await sql`ALTER TABLE "person" DROP CONSTRAINT "person_faceClusterId_fkey";`.execute(db);
  // await sql`CREATE OR REPLACE TRIGGER "person_updatedAt"
  // BEFORE UPDATE ON "person"
  // FOR EACH ROW
  // EXECUTE FUNCTION updated_at();`.execute(db);
  // await sql`DROP TRIGGER "face_cluster_updatedAt" ON "person";`.execute(db);
  // await sql`ALTER TABLE "asset_face" RENAME COLUMN "faceClusterId" TO "personId";`.execute(db);
  // await sql`CREATE INDEX "asset_face_personId_assetId_notDeleted_isVisible_idx" ON "asset_face" ("personId", "assetId") WHERE ((("deletedAt" IS NULL) AND ("isVisible" IS TRUE)));`.execute(
  //   db,
  // );
  // await sql`CREATE INDEX "asset_face_assetId_personId_idx" ON "asset_face" ("assetId", "personId");`.execute(db);
  // await sql`DROP INDEX "asset_face_faceClusterId_assetId_notDeleted_isVisible_idx";`.execute(db);
  // await sql`DROP INDEX "asset_face_assetId_faceClusterId_idx";`.execute(db);
  // await sql`ALTER TABLE "asset_face" ADD CONSTRAINT "asset_face_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person" ("id") ON UPDATE CASCADE ON DELETE SET NULL;`.execute(
  //   db,
  // );
  // await sql`ALTER TABLE "asset_face" DROP CONSTRAINT "asset_face_faceClusterId_fkey";`.execute(db);
  // await sql`ALTER TABLE "face_cluster" DROP CONSTRAINT "face_cluster_featureFaceAssetId_fkey";`.execute(db);
  // await sql`DROP TABLE "face_cluster";`.execute(db);
  // await sql`DROP TRIGGER "person_delete_audit" ON "face_cluster";`.execute(db);
  // await sql`DROP TRIGGER "face_cluster_updatedAt" ON "face_cluster";`.execute(db);
  // await sql`DROP TABLE "face_cluster_audit";`.execute(db);
  // await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE INDEX \\"idx_person_name_trigram\\" ON \\"person\\" USING gin (f_unaccent(\\"name\\") gin_trgm_ops);","name":"idx_person_name_trigram","type":"index"}'::jsonb WHERE "name" = 'index_idx_person_name_trigram';`.execute(
  //   db,
  // );
  // await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_person_updatedAt', '{"sql":"CREATE OR REPLACE TRIGGER \\"person_updatedAt\\"\\n  BEFORE UPDATE ON \\"person\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();","name":"person_updatedAt","type":"trigger"}'::jsonb);`.execute(
  //   db,
  // );
  // await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_asset_face_personId_assetId_notDeleted_isVisible_idx', '{"sql":"CREATE INDEX \\"asset_face_personId_assetId_notDeleted_isVisible_idx\\" ON \\"asset_face\\" (\\"personId\\", \\"assetId\\") WHERE (\\"deletedAt\\" IS NULL AND \\"isVisible\\" IS TRUE);","name":"asset_face_personId_assetId_notDeleted_isVisible_idx","type":"index"}'::jsonb);`.execute(
  //   db,
  // );
  // await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_face_cluster_updatedAt';`.execute(db);
  // await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_asset_face_faceClusterId_assetId_notDeleted_isVisible_idx';`.execute(
  //   db,
  // );
}
