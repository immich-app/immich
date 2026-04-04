import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Sync query for faces was incorrect on server <=2.6.2
  await sql`DELETE FROM session_sync_checkpoint WHERE type in ('AssetFaceV1', 'AssetFaceV2')`.execute(db);
}

export async function down(): Promise<void> {
  // Not implemented
}
