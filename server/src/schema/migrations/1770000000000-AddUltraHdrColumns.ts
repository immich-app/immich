import { Kysely, sql } from 'kysely';

/**
 * Migration to add Ultra HDR columns to asset_exif table
 *
 * Ultra HDR images from Android/Pixel devices contain gainmap metadata
 * that needs to be stored for proper HDR rendering.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // Add isUltraHdr boolean column
  await sql`ALTER TABLE "asset_exif" ADD COLUMN "isUltraHdr" boolean DEFAULT false`.execute(db);

  // Add hdrImageType to store the type of HDR image
  await sql`ALTER TABLE "asset_exif" ADD COLUMN "hdrImageType" character varying`.execute(db);

  // Add gainmapVersion to store the gainmap version
  await sql`ALTER TABLE "asset_exif" ADD COLUMN "gainmapVersion" character varying`.execute(db);

  // Create index on isUltraHdr for efficient filtering of HDR images
  await sql`CREATE INDEX IF NOT EXISTS "idx_asset_exif_isUltraHdr" ON "asset_exif" ("isUltraHdr") WHERE "isUltraHdr" = true`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop the index first
  await sql`DROP INDEX IF EXISTS "idx_asset_exif_isUltraHdr"`.execute(db);

  // Drop the columns in reverse order
  await sql`ALTER TABLE "asset_exif" DROP COLUMN "gainmapVersion"`.execute(db);
  await sql`ALTER TABLE "asset_exif" DROP COLUMN "hdrImageType"`.execute(db);
  await sql`ALTER TABLE "asset_exif" DROP COLUMN "isUltraHdr"`.execute(db);
}
