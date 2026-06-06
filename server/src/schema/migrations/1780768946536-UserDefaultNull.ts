import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceType" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceOS" DROP NOT NULL;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceType" SET NOT NULL;`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceOS" SET NOT NULL;`.execute(db);
}
