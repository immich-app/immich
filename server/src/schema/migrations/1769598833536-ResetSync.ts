import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`UPDATE "session" SET "isPendingSyncReset" = false`.execute(db);
  await sql`TRUNCATE TABLE "session_sync_checkpoint"`.execute(db);
}

export async function down(): Promise<void> {}
