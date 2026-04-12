import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_face" ADD "timestampMs" integer`.execute(db);
  await sql`ALTER TABLE "asset_face" ADD "frameIndex" integer`.execute(db);
  await sql`CREATE INDEX "asset_face_assetId_timestampMs_idx" ON "asset_face" ("assetId", "timestampMs")`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_asset_face_assetId_timestampMs_idx', '{"type":"index","name":"asset_face_assetId_timestampMs_idx","sql":"CREATE INDEX \\"asset_face_assetId_timestampMs_idx\\" ON \\"asset_face\\" (\\"assetId\\", \\"timestampMs\\");"}'::jsonb)`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_asset_face_assetId_timestampMs_idx'`.execute(db);
  await sql`DROP INDEX "asset_face_assetId_timestampMs_idx"`.execute(db);
  await sql`ALTER TABLE "asset_face" DROP COLUMN "frameIndex"`.execute(db);
  await sql`ALTER TABLE "asset_face" DROP COLUMN "timestampMs"`.execute(db);
}
