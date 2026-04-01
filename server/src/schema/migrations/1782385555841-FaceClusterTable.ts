import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_face" RENAME COLUMN "personId" TO "faceClusterId";`.execute(db);
  await sql`CREATE INDEX "asset_face_faceClusterId_assetId_idx" ON "asset_face" ("faceClusterId", "assetId");`.execute(db);
  await sql`CREATE INDEX "asset_face_faceClusterId_assetId_notDeleted_isVisible_idx" ON "asset_face" ("faceClusterId", "assetId") WHERE ("deletedAt" IS NULL AND "isVisible" IS TRUE);`.execute(db);
  await sql`CREATE INDEX "asset_face_assetId_faceClusterId_idx" ON "asset_face" ("assetId", "faceClusterId");`.execute(db);
  await sql`DROP INDEX "asset_face_personId_assetId_notDeleted_isVisible_idx";`.execute(db);
  await sql`DROP INDEX "asset_face_assetId_personId_idx";`.execute(db);
  await sql`DROP INDEX "asset_face_personId_assetId_idx";`.execute(db);
  await sql`CREATE TABLE "face_cluster" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  CONSTRAINT "face_cluster_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`ALTER TABLE "asset_face" ADD CONSTRAINT "asset_face_faceClusterId_fkey" FOREIGN KEY ("faceClusterId") REFERENCES "face_cluster" ("id") ON UPDATE CASCADE ON DELETE SET NULL;`.execute(db);
  await sql`ALTER TABLE "asset_face" DROP CONSTRAINT "asset_face_personId_fkey";`.execute(db);
  await sql`ALTER TABLE "person" ADD "faceClusterId" uuid;`.execute(db);
  await sql`CREATE INDEX "person_faceClusterId_idx" ON "person" ("faceClusterId");`.execute(db);
  await sql`ALTER TABLE "person" ADD CONSTRAINT "person_faceClusterId_fkey" FOREIGN KEY ("faceClusterId") REFERENCES "face_cluster" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`CREATE INDEX "face_cluster_updateId_idx" ON "face_cluster" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "face_cluster_updatedAt"
  BEFORE UPDATE ON "face_cluster"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_face_cluster_updatedAt', '{"type":"trigger","name":"face_cluster_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"face_cluster_updatedAt\\"\\n  BEFORE UPDATE ON \\"face_cluster\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_asset_face_faceClusterId_assetId_notDeleted_isVisible_idx', '{"type":"index","name":"asset_face_faceClusterId_assetId_notDeleted_isVisible_idx","sql":"CREATE INDEX \\"asset_face_faceClusterId_assetId_notDeleted_isVisible_idx\\" ON \\"asset_face\\" (\\"faceClusterId\\", \\"assetId\\") WHERE (\\"deletedAt\\" IS NULL AND \\"isVisible\\" IS TRUE);"}'::jsonb);`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_asset_face_personId_assetId_notDeleted_isVisible_idx';`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "person" DROP COLUMN "faceClusterId";`.execute(db);
  await sql`DROP INDEX "person_faceClusterId_idx";`.execute(db);
  await sql`ALTER TABLE "person" DROP CONSTRAINT "person_faceClusterId_fkey";`.execute(db);
  await sql`ALTER TABLE "asset_face" RENAME COLUMN "faceClusterId" TO "personId";`.execute(db);
  await sql`CREATE INDEX "asset_face_personId_assetId_notDeleted_isVisible_idx" ON "asset_face" ("personId", "assetId") WHERE ((("deletedAt" IS NULL) AND ("isVisible" IS TRUE)));`.execute(db);
  await sql`CREATE INDEX "asset_face_assetId_personId_idx" ON "asset_face" ("assetId", "personId");`.execute(db);
  await sql`CREATE INDEX "asset_face_personId_assetId_idx" ON "asset_face" ("personId", "assetId");`.execute(db);
  await sql`DROP INDEX "asset_face_faceClusterId_assetId_idx";`.execute(db);
  await sql`DROP INDEX "asset_face_faceClusterId_assetId_notDeleted_isVisible_idx";`.execute(db);
  await sql`DROP INDEX "asset_face_assetId_faceClusterId_idx";`.execute(db);
  await sql`ALTER TABLE "asset_face" ADD CONSTRAINT "asset_face_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person" ("id") ON UPDATE CASCADE ON DELETE SET NULL;`.execute(db);
  await sql`ALTER TABLE "asset_face" DROP CONSTRAINT "asset_face_faceClusterId_fkey";`.execute(db);
  await sql`DROP TABLE "face_cluster";`.execute(db);
  await sql`DROP TRIGGER "face_cluster_updatedAt" ON "face_cluster";`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_asset_face_personId_assetId_notDeleted_isVisible_idx', '{"sql":"CREATE INDEX \\"asset_face_personId_assetId_notDeleted_isVisible_idx\\" ON \\"asset_face\\" (\\"personId\\", \\"assetId\\") WHERE (\\"deletedAt\\" IS NULL AND \\"isVisible\\" IS TRUE);","name":"asset_face_personId_assetId_notDeleted_isVisible_idx","type":"index"}'::jsonb);`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_face_cluster_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_asset_face_faceClusterId_assetId_notDeleted_isVisible_idx';`.execute(db);
}
