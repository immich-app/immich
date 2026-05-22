import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "asset_ocr" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assetId" uuid NOT NULL, "x1" real NOT NULL, "y1" real NOT NULL, "x2" real NOT NULL, "y2" real NOT NULL, "x3" real NOT NULL, "y3" real NOT NULL, "x4" real NOT NULL, "y4" real NOT NULL, "boxScore" real NOT NULL, "textScore" real NOT NULL, "text" text NOT NULL);`.execute(
    db,
  );
  await sql`ALTER TABLE "asset_ocr" ADD CONSTRAINT "asset_ocr_pkey" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "asset_ocr" ADD CONSTRAINT "asset_ocr_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(
    db,
  );
  await sql`CREATE INDEX "asset_ocr_assetId_idx" ON "asset_ocr" ("assetId")`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "asset_ocr";`.execute(db);
}
