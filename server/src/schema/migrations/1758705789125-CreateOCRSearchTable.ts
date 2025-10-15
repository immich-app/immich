import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "ocr_search" ("assetId" uuid NOT NULL, "text" text NOT NULL);`.execute(db);
  await sql`ALTER TABLE "ocr_search" ADD CONSTRAINT "ocr_search_pkey" PRIMARY KEY ("assetId");`.execute(db);
  await sql`ALTER TABLE "ocr_search" ADD CONSTRAINT "ocr_search_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(
    db,
  );
  await sql`CREATE INDEX "idx_ocr_search_text" ON "ocr_search" USING gin (f_unaccent("text") gin_trgm_ops);`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_idx_ocr_search_text', '{"type":"index","name":"idx_ocr_search_text","sql":"CREATE INDEX \\"idx_ocr_search_text\\" ON \\"ocr_search\\" USING gin (f_unaccent(\\"text\\") gin_trgm_ops);"}'::jsonb);`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "ocr_search";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_idx_ocr_search_text';`.execute(db);
}
