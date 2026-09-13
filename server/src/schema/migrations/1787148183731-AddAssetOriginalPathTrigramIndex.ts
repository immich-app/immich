import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE INDEX "asset_originalPath_trigram_idx" ON "asset" USING gin (f_unaccent("originalPath") gin_trgm_ops);`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_asset_originalPath_trigram_idx', '{"type":"index","name":"asset_originalPath_trigram_idx","sql":"CREATE INDEX \\"asset_originalPath_trigram_idx\\" ON \\"asset\\" USING gin (f_unaccent(\\"originalPath\\") gin_trgm_ops);"}'::jsonb);`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "asset_originalPath_trigram_idx";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_asset_originalPath_trigram_idx';`.execute(db);
}
