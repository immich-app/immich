import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "person" ALTER COLUMN "thumbnailPath" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "person" ALTER COLUMN "thumbnailPath" SET DEFAULT NULL;`.execute(db);
  await sql`UPDATE "person" SET "thumbnailPath" = NULL WHERE "thumbnailPath" = '';`.execute(db);
}

export async function down(): Promise<void> {
  await sql`UPDATE "person" SET "thumbnailPath" = '' WHERE "thumbnailPath" IS NULL;`.execute(db);
  await sql`ALTER TABLE "person" ALTER COLUMN "thumbnailPath" SET DEFAULT '';`.execute(db);
  await sql`ALTER TABLE "person" ALTER COLUMN "thumbnailPath" SET NOT NULL;`.execute(db);
}
