import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "album" ALTER COLUMN "description" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "album" ALTER COLUMN "description" SET DEFAULT NULL;`.execute(db);
  await sql`UPDATE "album" SET "description" = NULL WHERE "description" = '';`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`UPDATE "album" SET "description" = '' WHERE "description" IS NULL;`.execute(db);
  await sql`ALTER TABLE "album" ALTER COLUMN "description" SET DEFAULT ''::text;`.execute(db);
  await sql`ALTER TABLE "album" ALTER COLUMN "description" SET NOT NULL;`.execute(db);
}
