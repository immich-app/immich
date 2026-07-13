import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "person_updateId_idx";`.execute(db);
  await sql`ALTER TABLE "face_cluster" RENAME CONSTRAINT "person_pkey" TO "face_cluster_pkey";`.execute(db);
  await sql`ALTER TABLE "face_cluster" ADD CONSTRAINT "face_cluster_birthDate_chk" CHECK ("birthDate" <= CURRENT_DATE);`.execute(db);
  await sql`ALTER INDEX "asset_face_personId_assetId_idx" RENAME TO "asset_face_faceClusterId_assetId_idx";`.execute(db);
  await sql`ALTER TABLE "person" ALTER COLUMN "isHidden" SET NOT NULL;`.execute(db);
  await sql`ALTER TABLE "person" ALTER COLUMN "isFavorite" SET NOT NULL;`.execute(db);
  await sql`ALTER TABLE "person" ALTER COLUMN "thumbnailPath" SET NOT NULL;`.execute(db);
  await sql`CREATE INDEX "person_ownerId_idx" ON "person" ("ownerId");`.execute(db);
  await sql`CREATE INDEX "person_updateId_idx" ON "person" ("updateId");`.execute(db);
  await sql`ALTER TABLE "person" ADD CONSTRAINT "person_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "person" ADD CONSTRAINT "UQ_ownerId_faceClusterId" UNIQUE ("ownerId", "faceClusterId");`.execute(db);
  await sql`ALTER TABLE "person" ADD CONSTRAINT "person_pkey" PRIMARY KEY ("id");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "person_delete_audit"
  AFTER DELETE ON "person"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION person_delete_audit();`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "person" ALTER COLUMN "isHidden" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "person" ALTER COLUMN "isFavorite" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "person" ALTER COLUMN "thumbnailPath" DROP NOT NULL;`.execute(db);
  await sql`DROP INDEX "person_ownerId_idx";`.execute(db);
  await sql`DROP INDEX "person_updateId_idx";`.execute(db);
  await sql`ALTER TABLE "person" DROP CONSTRAINT "person_ownerId_fkey";`.execute(db);
  await sql`ALTER TABLE "person" DROP CONSTRAINT "UQ_ownerId_faceClusterId";`.execute(db);
  await sql`ALTER TABLE "person" DROP CONSTRAINT "person_pkey";`.execute(db);
  await sql`DROP TRIGGER "person_delete_audit" ON "person";`.execute(db);
  await sql`CREATE INDEX "person_updateId_idx" ON "face_cluster" ("updateId");`.execute(db);
  await sql`ALTER TABLE "face_cluster" RENAME CONSTRAINT "face_cluster_pkey" TO "person_pkey";`.execute(db);
  await sql`ALTER TABLE "face_cluster" DROP CONSTRAINT "face_cluster_birthDate_chk";`.execute(db);
  await sql`ALTER INDEX "asset_face_faceClusterId_assetId_idx" RENAME TO "asset_face_personId_assetId_idx";`.execute(db);
}
