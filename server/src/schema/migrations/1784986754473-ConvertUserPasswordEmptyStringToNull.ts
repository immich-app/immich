import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "user" ALTER COLUMN "password" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "password" SET DEFAULT NULL;`.execute(db);
  await sql`UPDATE "user" SET "password" = NULL WHERE "password" = '';`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`UPDATE "user" SET "password" = '' WHERE "password" IS NULL;`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "password" SET DEFAULT '';`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "password" SET NOT NULL;`.execute(db);
}
