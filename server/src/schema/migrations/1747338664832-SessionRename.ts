import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "sessions" RENAME "expiredAt" TO "expiresAt";`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "sessions" RENAME "expiresAt" TO "expiredAt";`.execute(db);
}
