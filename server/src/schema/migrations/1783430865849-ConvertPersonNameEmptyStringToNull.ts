import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "person" ALTER COLUMN "name" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "person" ALTER COLUMN "name" SET DEFAULT NULL;`.execute(db);
  await sql`UPDATE "person" SET "name" = NULL WHERE "name" = '';`.execute(db);
}

export async function down(): Promise<void> {
  await sql`UPDATE "person" SET "name" = '' WHERE "name" IS NULL;`.execute(db);
  await sql`ALTER TABLE "person" ALTER COLUMN "name" SET DEFAULT '';`.execute(db);
  await sql`ALTER TABLE "person" ALTER COLUMN "name" SET NOT NULL;`.execute(db);
}
