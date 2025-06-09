import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "asset_ocr" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assetId" uuid NOT NULL, "x1" integer NOT NULL, "y1" integer NOT NULL, "x2" integer NOT NULL, "y2" integer NOT NULL, "x3" integer NOT NULL, "y3" integer NOT NULL, "x4" integer NOT NULL, "y4" integer NOT NULL, "text" text NOT NULL, "confidence" real NOT NULL);`.execute(
    db,
  );
  await sql`ALTER TABLE "asset_ocr" ADD CONSTRAINT "PK_5c37b36ceef9ac1f688b6c6bf22" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "asset_ocr" ADD CONSTRAINT "FK_dc592ec504976f5636e28bb84c6" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`CREATE INDEX "IDX_dc592ec504976f5636e28bb84c" ON "asset_ocr" ("assetId")`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "IDX_dc592ec504976f5636e28bb84c";`.execute(db);
  await sql`ALTER TABLE "asset_ocr" DROP CONSTRAINT "PK_5c37b36ceef9ac1f688b6c6bf22";`.execute(db);
  await sql`ALTER TABLE "asset_ocr" DROP CONSTRAINT "FK_dc592ec504976f5636e28bb84c6";`.execute(db);
  await sql`DROP TABLE "asset_ocr";`.execute(db);
}
