import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_exif" ALTER COLUMN "description" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "asset_exif" ALTER COLUMN "description" SET DEFAULT NULL;`.execute(db);
  await sql`UPDATE "asset_exif" SET "description" = NULL WHERE "description" = '';`.execute(db);
}

export async function down(): Promise<void> {
  await sql`UPDATE "asset_exif" SET "description" = '' WHERE "description" IS NULL;`.execute(db);
  await sql`ALTER TABLE "asset_exif" ALTER COLUMN "description" SET DEFAULT '';`.execute(db);
  await sql`ALTER TABLE "asset_exif" ALTER COLUMN "description" SET NOT NULL;`.execute(db);
}
