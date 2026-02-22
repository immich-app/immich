import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE INDEX "asset_id_timeline_notDeleted_idx" ON "asset" ("id") WHERE visibility = 'timeline' AND "deletedAt" IS NULL;`.execute(db);
  await sql`CREATE INDEX "asset_face_personId_assetId_notDeleted_isVisible_idx" ON "asset_face" ("personId", "assetId") WHERE "deletedAt" IS NULL AND "isVisible" IS TRUE;`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_asset_id_timeline_notDeleted_idx', '{"type":"index","name":"asset_id_timeline_notDeleted_idx","sql":"CREATE INDEX \\"asset_id_timeline_notDeleted_idx\\" ON \\"asset\\" (\\"id\\") WHERE visibility = ''timeline'' AND \\"deletedAt\\" IS NULL;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_asset_face_personId_assetId_notDeleted_isVisible_idx', '{"type":"index","name":"asset_face_personId_assetId_notDeleted_isVisible_idx","sql":"CREATE INDEX \\"asset_face_personId_assetId_notDeleted_isVisible_idx\\" ON \\"asset_face\\" (\\"personId\\", \\"assetId\\") WHERE \\"deletedAt\\" IS NULL AND \\"isVisible\\" IS TRUE;"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "asset_id_timeline_notDeleted_idx";`.execute(db);
  await sql`DROP INDEX "asset_face_personId_assetId_notDeleted_isVisible_idx";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_asset_id_timeline_notDeleted_idx';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_asset_face_personId_assetId_notDeleted_isVisible_idx';`.execute(db);
}
