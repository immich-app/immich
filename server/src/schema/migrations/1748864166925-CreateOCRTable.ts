import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "asset_ocr" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assetId" uuid NOT NULL, "boundingBoxX1" integer NOT NULL DEFAULT 0, "boundingBoxY1" integer NOT NULL DEFAULT 0, "boundingBoxX2" integer NOT NULL DEFAULT 0, "boundingBoxY2" integer NOT NULL DEFAULT 0, "text" text NOT NULL);`.execute(db);
  await sql`ALTER TABLE "asset_ocr" ADD CONSTRAINT "PK_5c37b36ceef9ac1f688b6c6bf22" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "asset_ocr" ADD CONSTRAINT "FK_dc592ec504976f5636e28bb84c6" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_ocr" DROP CONSTRAINT "PK_5c37b36ceef9ac1f688b6c6bf22";`.execute(db);
  await sql`ALTER TABLE "asset_ocr" DROP CONSTRAINT "FK_dc592ec504976f5636e28bb84c6";`.execute(db);
  await sql`DROP TABLE "asset_ocr";`.execute(db);
}
