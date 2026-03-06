import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE INDEX "IDX_asset_exif_gist_earthcoord" ON "asset_exif" USING gist (ll_to_earth_public(latitude, longitude));`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_asset_exif_gist_earthcoord', '{"type":"index","name":"IDX_asset_exif_gist_earthcoord","sql":"CREATE INDEX \\"IDX_asset_exif_gist_earthcoord\\" ON \\"asset_exif\\" USING gist (ll_to_earth_public(latitude, longitude));"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "IDX_asset_exif_gist_earthcoord";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_asset_exif_gist_earthcoord';`.execute(db);
}
