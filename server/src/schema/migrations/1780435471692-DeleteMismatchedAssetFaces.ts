import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Delete unauthorized cross-owner asset faces
  await sql`
    DELETE FROM asset_face
    USING person, asset
    WHERE asset_face."personId" = person.id
      AND asset_face."assetId" = asset.id
      AND person."ownerId" != asset."ownerId"
  `.execute(db);
}

export async function down(): Promise<void> {
  // Not implemented: the deleted rows were unauthorized cross-owner entries
}
