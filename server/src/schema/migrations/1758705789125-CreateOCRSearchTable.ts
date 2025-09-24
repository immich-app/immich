import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "ocr_search" ("assetId" uuid NOT NULL, "text" text NOT NULL);`.execute(db);
  await sql`ALTER TABLE "ocr_search" ADD CONSTRAINT "PK_a8299b7f08ef223f6d32f4482a7" PRIMARY KEY ("assetId");`.execute(db);
  await sql`ALTER TABLE "ocr_search" ADD CONSTRAINT "FK_a8299b7f08ef223f6d32f4482a7" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`CREATE INDEX "idx_ocr_search_text" ON "ocr_search" USING gin (f_unaccent("text") gin_trgm_ops);`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "ocr_search" DROP CONSTRAINT "PK_a8299b7f08ef223f6d32f4482a7";`.execute(db);
  await sql`ALTER TABLE "ocr_search" DROP CONSTRAINT "FK_a8299b7f08ef223f6d32f4482a7";`.execute(db);
  await sql`DROP TABLE "ocr_search";`.execute(db);
}
