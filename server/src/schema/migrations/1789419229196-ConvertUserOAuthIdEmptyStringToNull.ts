import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "user" ALTER COLUMN "oauthId" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "oauthId" SET DEFAULT NULL;`.execute(db);
  await sql`UPDATE "user" SET "oauthId" = NULL WHERE "oauthId" = '';`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`UPDATE "user" SET "oauthId" = '' WHERE "oauthId" IS NULL;`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "oauthId" SET DEFAULT '';`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "oauthId" SET NOT NULL;`.execute(db);
}
