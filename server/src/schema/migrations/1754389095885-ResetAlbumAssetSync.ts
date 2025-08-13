import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`DELETE FROM session_sync_checkpoint WHERE type IN ('AlbumAssetBackfillV1', 'AlbumAssetExifV1', 'AlbumAssetV1')`.execute(db);
}

export async function down(): Promise<void> {}
