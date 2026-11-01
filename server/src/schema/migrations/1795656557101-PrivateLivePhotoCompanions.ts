import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "tag_userId_systemKey_uq";`.execute(db);
  await sql`CREATE UNIQUE INDEX "tag_userId_systemKey_uq" ON "tag" ("userId", "systemKey") WHERE ("systemKey" IS NOT NULL);`.execute(db);
  await sql`ALTER TABLE "tag_asset" ADD "isLivePhotoCompanion" boolean NOT NULL DEFAULT false;`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_tag_userId_systemKey_uq', '{"type":"index","name":"tag_userId_systemKey_uq","sql":"CREATE UNIQUE INDEX \\"tag_userId_systemKey_uq\\" ON \\"tag\\" (\\"userId\\", \\"systemKey\\") WHERE (\\"systemKey\\" IS NOT NULL);"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "tag_asset" DROP COLUMN "isLivePhotoCompanion";`.execute(db);
  await sql`DROP INDEX "tag_userId_systemKey_uq";`.execute(db);
  await sql`CREATE UNIQUE INDEX "tag_userId_systemKey_uq" ON "tag" ("userId", "systemKey") WHERE (("systemKey" IS NOT NULL));`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_tag_userId_systemKey_uq';`.execute(db);
}
