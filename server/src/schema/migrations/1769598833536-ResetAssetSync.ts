import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`DELETE FROM session_sync_checkpoint WHERE type IN ('AssetV1', 'PartnerAssetV1', 'PartnerAssetBackfillV1', 'AlbumAssetCreateV1', 'AlbumAssetUpdateV1', 'AlbumAssetBackfillV1')`.execute(db);
}

export async function down(): Promise<void> {}
