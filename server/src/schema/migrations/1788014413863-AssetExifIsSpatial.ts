import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_exif" ADD "isSpatial" boolean NOT NULL DEFAULT false;`.execute(db);
  await sql`CREATE INDEX "asset_exif_assetId_isSpatial_idx" ON "asset_exif" ("assetId") WHERE "isSpatial" IS TRUE;`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_asset_exif_assetId_isSpatial_idx', '{"type":"index","name":"asset_exif_assetId_isSpatial_idx","sql":"CREATE INDEX \\"asset_exif_assetId_isSpatial_idx\\" ON \\"asset_exif\\" (\\"assetId\\") WHERE \\"isSpatial\\" IS TRUE;"}'::jsonb);`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "asset_exif_assetId_isSpatial_idx";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_asset_exif_assetId_isSpatial_idx';`.execute(db);
  await sql`ALTER TABLE "asset_exif" DROP COLUMN "isSpatial";`.execute(db);
}
