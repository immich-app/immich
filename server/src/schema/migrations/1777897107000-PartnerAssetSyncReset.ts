import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // isFavorite was incorrectly included in partner asset sync on server <=2.X.X
  await sql`DELETE FROM session_sync_checkpoint WHERE type in ('PartnerAssetV1', 'PartnerAssetBackfillV1')`.execute(db);
}

export async function down(): Promise<void> {
  // Not implemented
}
