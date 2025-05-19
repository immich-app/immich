import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "sessions" ADD "pinExpiresAt" timestamp with time zone;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "sessions" DROP COLUMN "pinExpiresAt";`.execute(db);
}
