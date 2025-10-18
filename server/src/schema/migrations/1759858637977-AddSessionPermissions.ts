import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "session" ADD "permissions" character varying[];`.execute(db);
  await sql`UPDATE "session" SET "permissions" = ARRAY['all'];`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "permissions" SET NOT NULL`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "session" DROP COLUMN "permissions";`.execute(db);
}
