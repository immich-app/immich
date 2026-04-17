import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "asset_id_timeline_notDeleted_idx";`.execute(db);
  await sql`DROP INDEX "asset_face_personId_assetId_notDeleted_isVisible_idx";`.execute(db);
  await sql`CREATE INDEX "asset_id_timeline_notDeleted_idx" ON "asset" ("id") WHERE (visibility = 'timeline' AND "deletedAt" IS NULL);`.execute(db);
  await sql`CREATE INDEX "asset_face_personId_assetId_notDeleted_isVisible_idx" ON "asset_face" ("personId", "assetId") WHERE ("deletedAt" IS NULL AND "isVisible" IS TRUE);`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"index","name":"asset_id_timeline_notDeleted_idx","sql":"CREATE INDEX \\"asset_id_timeline_notDeleted_idx\\" ON \\"asset\\" (\\"id\\") WHERE (visibility = ''timeline'' AND \\"deletedAt\\" IS NULL);"}'::jsonb WHERE "name" = 'index_asset_id_timeline_notDeleted_idx';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"index","name":"asset_ownerId_libraryId_checksum_idx","sql":"CREATE UNIQUE INDEX \\"asset_ownerId_libraryId_checksum_idx\\" ON \\"asset\\" (\\"ownerId\\", \\"libraryId\\", \\"checksum\\") WHERE ((\\"libraryId\\" IS NOT NULL));"}'::jsonb WHERE "name" = 'index_asset_ownerId_libraryId_checksum_idx';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"index","name":"UQ_assets_owner_checksum","sql":"CREATE UNIQUE INDEX \\"UQ_assets_owner_checksum\\" ON \\"asset\\" (\\"ownerId\\", \\"checksum\\") WHERE ((\\"libraryId\\" IS NULL));"}'::jsonb WHERE "name" = 'index_UQ_assets_owner_checksum';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"index","name":"activity_like_idx","sql":"CREATE UNIQUE INDEX \\"activity_like_idx\\" ON \\"activity\\" (\\"assetId\\", \\"userId\\", \\"albumId\\") WHERE ((\\"isLiked\\" = true));"}'::jsonb WHERE "name" = 'index_activity_like_idx';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"index","name":"asset_face_personId_assetId_notDeleted_isVisible_idx","sql":"CREATE INDEX \\"asset_face_personId_assetId_notDeleted_isVisible_idx\\" ON \\"asset_face\\" (\\"personId\\", \\"assetId\\") WHERE (\\"deletedAt\\" IS NULL AND \\"isVisible\\" IS TRUE);"}'::jsonb WHERE "name" = 'index_asset_face_personId_assetId_notDeleted_isVisible_idx';`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "asset_face_personId_assetId_notDeleted_isVisible_idx";`.execute(db);
  await sql`DROP INDEX "asset_id_timeline_notDeleted_idx";`.execute(db);
  await sql`CREATE INDEX "asset_face_personId_assetId_notDeleted_isVisible_idx" ON "asset_face" ("assetId", "personId") WHERE ((("deletedAt" IS NULL) AND ("isVisible" IS TRUE)));`.execute(db);
  await sql`CREATE INDEX "asset_id_timeline_notDeleted_idx" ON "asset" ("id") WHERE (((visibility = 'timeline'::asset_visibility_enum) AND ("deletedAt" IS NULL)));`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE UNIQUE INDEX \\"asset_ownerId_libraryId_checksum_idx\\" ON \\"asset\\" (\\"ownerId\\", \\"libraryId\\", \\"checksum\\") WHERE (\\"libraryId\\" IS NOT NULL);","name":"asset_ownerId_libraryId_checksum_idx","type":"index"}'::jsonb WHERE "name" = 'index_asset_ownerId_libraryId_checksum_idx';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE UNIQUE INDEX \\"activity_like_idx\\" ON \\"activity\\" (\\"assetId\\", \\"userId\\", \\"albumId\\") WHERE (\\"isLiked\\" = true);","name":"activity_like_idx","type":"index"}'::jsonb WHERE "name" = 'index_activity_like_idx';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE UNIQUE INDEX \\"UQ_assets_owner_checksum\\" ON \\"asset\\" (\\"ownerId\\", \\"checksum\\") WHERE (\\"libraryId\\" IS NULL);","name":"UQ_assets_owner_checksum","type":"index"}'::jsonb WHERE "name" = 'index_UQ_assets_owner_checksum';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE INDEX \\"asset_id_timeline_notDeleted_idx\\" ON \\"asset\\" (\\"id\\") WHERE visibility = ''timeline'' AND \\"deletedAt\\" IS NULL;","name":"asset_id_timeline_notDeleted_idx","type":"index"}'::jsonb WHERE "name" = 'index_asset_id_timeline_notDeleted_idx';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE INDEX \\"asset_face_personId_assetId_notDeleted_isVisible_idx\\" ON \\"asset_face\\" (\\"personId\\", \\"assetId\\") WHERE \\"deletedAt\\" IS NULL AND \\"isVisible\\" IS TRUE;","name":"asset_face_personId_assetId_notDeleted_isVisible_idx","type":"index"}'::jsonb WHERE "name" = 'index_asset_face_personId_assetId_notDeleted_isVisible_idx';`.execute(db);
}
