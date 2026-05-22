import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`DELETE FROM session_sync_checkpoint
  WHERE type IN (
    'UserV1',
    'AssetV1',
    'PartnerAssetV1',
    'PartnerAssetBackfillV1',
    'AlbumAssetV1',
    'AlbumAssetBackfillV1'
  )`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DELETE FROM session_sync_checkpoint
  WHERE type IN (
    'UserV1',
    'AssetV1',
    'PartnerAssetV1',
    'PartnerAssetBackfillV1',
    'AlbumAssetV1',
    'AlbumAssetBackfillV1'
  )`.execute(db);
}
