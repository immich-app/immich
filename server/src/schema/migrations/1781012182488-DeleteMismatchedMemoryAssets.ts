import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    // Delete cross-owner memory assets
  await sql`
    DELETE FROM memory_asset
    USING memory, asset
    WHERE memory_asset."memoriesId" = memory.id
      AND memory_asset."assetId" = asset.id
      AND memory."ownerId" != asset."ownerId"
  `.execute(db);
}

export async function down(): Promise<void> {
  // Not implemented: the deleted rows were cross-owner entries
}
