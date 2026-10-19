import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "user" ALTER COLUMN "profileImagePath" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "profileImagePath" SET DEFAULT NULL;`.execute(db);
  await sql`UPDATE "user" SET "profileImagePath" = NULL WHERE "profileImagePath" = '';`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`UPDATE "user" SET "profileImagePath" = '' WHERE "profileImagePath" IS NULL;`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "profileImagePath" SET DEFAULT '';`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "profileImagePath" SET NOT NULL;`.execute(db);
}
