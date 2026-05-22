import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset" ADD COLUMN "width" integer;`.execute(db);
  await sql`ALTER TABLE "asset" ADD COLUMN "height" integer;`.execute(db);

  // Populate width and height from exif data with orientation-aware swapping
  await sql`
    UPDATE "asset"
    SET 
      "width" = CASE
        WHEN "asset_exif"."orientation" IN ('5', '6', '7', '8', '-90', '90') THEN "asset_exif"."exifImageHeight"
        ELSE "asset_exif"."exifImageWidth"
      END,
      "height" = CASE
        WHEN "asset_exif"."orientation" IN ('5', '6', '7', '8', '-90', '90') THEN "asset_exif"."exifImageWidth"
        ELSE "asset_exif"."exifImageHeight"
      END
    FROM "asset_exif"
    WHERE "asset"."id" = "asset_exif"."assetId"
      AND ("asset_exif"."exifImageWidth" IS NOT NULL OR "asset_exif"."exifImageHeight" IS NOT NULL)
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset" DROP COLUMN "width";`.execute(db);
  await sql`ALTER TABLE "asset" DROP COLUMN "height";`.execute(db);
}
