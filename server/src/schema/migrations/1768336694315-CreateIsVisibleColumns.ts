import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_ocr" ADD COLUMN "isVisible" boolean NOT NULL DEFAULT TRUE`.execute(db);
  await sql`ALTER TABLE "asset_face" ADD COLUMN "isVisible" boolean NOT NULL DEFAULT TRUE`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_ocr" DROP COLUMN "isVisible";`.execute(db);
  await sql`ALTER TABLE "asset_face" DROP COLUMN "isVisible";`.execute(db);
}
