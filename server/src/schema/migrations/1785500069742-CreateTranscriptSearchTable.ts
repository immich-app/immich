import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "transcript_search" ("assetId" uuid NOT NULL, "text" text NOT NULL);`.execute(db);
  await sql`ALTER TABLE "transcript_search" ADD CONSTRAINT "transcript_search_pkey" PRIMARY KEY ("assetId");`.execute(
    db,
  );
  await sql`ALTER TABLE "transcript_search" ADD CONSTRAINT "transcript_search_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(
    db,
  );
  await sql`CREATE INDEX "idx_transcript_search_text" ON "transcript_search" USING gin (f_unaccent("text") gin_trgm_ops);`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_idx_transcript_search_text', '{"type":"index","name":"idx_transcript_search_text","sql":"CREATE INDEX \\"idx_transcript_search_text\\" ON \\"transcript_search\\" USING gin (f_unaccent(\\"text\\") gin_trgm_ops);"}'::jsonb);`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "transcript_search";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_idx_transcript_search_text';`.execute(db);
}
