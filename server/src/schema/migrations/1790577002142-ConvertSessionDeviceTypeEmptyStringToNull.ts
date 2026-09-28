import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceType" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceType" SET DEFAULT NULL;`.execute(db);
  await sql`UPDATE "session" SET "deviceType" = NULL WHERE "deviceType" = '';`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`UPDATE "session" SET "deviceType" = '' WHERE "deviceType" IS NULL;`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceType" SET DEFAULT '';`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceType" SET NOT NULL;`.execute(db);
}
