import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE INDEX "asset_file_path_idx" ON "asset_file" USING hash ("path");`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_asset_file_path_idx', '{"type":"index","name":"asset_file_path_idx","sql":"CREATE INDEX \\"asset_file_path_idx\\" ON \\"asset_file\\" USING hash (\\"path\\");"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "asset_file_path_idx";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_asset_file_path_idx';`.execute(db);
}
