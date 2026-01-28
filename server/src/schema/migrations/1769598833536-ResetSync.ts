import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`UPDATE "session" SET "isPendingSyncReset" = true`.execute(db);
}

export async function down(): Promise<void> {}
