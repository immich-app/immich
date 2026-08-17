import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // OCR visibility updates did not bump updateId before the asset_ocr_updatedAt trigger was added,
  // so clients never received those changes. There is no way to know which rows were missed, so
  // reset the checkpoint to backfill all OCR rows on the next sync.
  await sql`DELETE FROM session_sync_checkpoint WHERE type = 'AssetOcrV1'`.execute(db);
}

export async function down(): Promise<void> {
  // Not implemented
}
