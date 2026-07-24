import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceType" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceType" SET DEFAULT NULL;`.execute(db);
  await sql`UPDATE "session" SET "deviceType" = NULL WHERE "deviceType" = '';`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceOS" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceOS" SET DEFAULT NULL;`.execute(db);
  await sql`UPDATE "session" SET "deviceOS" = NULL WHERE "deviceOS" = '';`.execute(db);
}

export async function down(): Promise<void> {
  await sql`UPDATE "session" SET "deviceOS" = '' WHERE "deviceOS" IS NULL;`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceOS" SET DEFAULT '';`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceOS" SET NOT NULL;`.execute(db);
  await sql`UPDATE "session" SET "deviceType" = '' WHERE "deviceType" IS NULL;`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceType" SET DEFAULT '';`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceType" SET NOT NULL;`.execute(db);
}
