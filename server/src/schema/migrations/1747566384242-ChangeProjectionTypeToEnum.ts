import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create the new enum type
  await sql`CREATE TYPE "projection_type_enum" AS ENUM ('SPHERICAL', 'EQUIRECTANGULAR', 'SPATIAL_APPLE_PHOTO', 'SPATIAL_APPLE_VIDEO');`.execute(db);

  // Add a new temporary column with the enum type
  await sql`ALTER TABLE "exif" ADD "projection_type_temp_enum" "projection_type_enum";`.execute(db);

  // Add a temporary column to store original unknown string values for potential recovery
  await sql`ALTER TABLE "exif" ADD "projection_type_original_string" character varying;`.execute(db);

  // Migrate data to the new enum column and store original unknown values
  await sql`
    UPDATE "exif"
    SET
      "projection_type_temp_enum" = CASE "projectionType"
        WHEN 'SPHERICAL' THEN 'SPHERICAL'::"projection_type_enum"
        WHEN 'EQUIRECTANGULAR' THEN 'EQUIRECTANGULAR'::"projection_type_enum"
        WHEN 'SPATIAL_APPLE_PHOTO' THEN 'SPATIAL_APPLE_PHOTO'::"projection_type_enum"
        WHEN 'SPATIAL_APPLE_VIDEO' THEN 'SPATIAL_APPLE_VIDEO'::"projection_type_enum"
        ELSE NULL
      END,
      "projection_type_original_string" = CASE
        WHEN "projectionType" IN ('SPHERICAL', 'EQUIRECTANGULAR', 'SPATIAL_APPLE_PHOTO', 'SPATIAL_APPLE_VIDEO') THEN NULL
        ELSE "projectionType"
      END;
  `.execute(db);

  // Check if any unknown values were encountered
  const result = await sql<{ count: number }>`SELECT COUNT(*) FROM "exif" WHERE "projection_type_original_string" IS NOT NULL;`.execute(db);
  const unknownValuesCount = result.rows[0].count;

  if (unknownValuesCount === 0) {
    // If no unknown values were found, drop the temporary string column
    await sql`ALTER TABLE "exif" DROP COLUMN "projection_type_original_string";`.execute(db);
  } else {
    // If unknown values were found, keep the temporary string column for potential manual recovery.
    // A separate process or script would be needed to identify these assets and issue a warning during the migration run.
    // The presence of the "projection_type_original_string" column after the migration indicates that unknown values were found.
    console.warn(`Unknown projectionType values found: ${unknownValuesCount}. Please check the "projection_type_original_string" column for details.`);
  }

  // Drop the old string column
  await sql`ALTER TABLE "exif" DROP COLUMN "projectionType";`.execute(db);

  // Rename the temporary enum column to the original column name
  await sql`ALTER TABLE "exif" RENAME COLUMN "projection_type_temp_enum" TO "projectionType";`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Add the old string column back
  await sql`ALTER TABLE "exif" ADD "projectionType" character varying;`.execute(db);

  // Migrate data back from the enum column and the original string column (if it exists)
  // Check if the temporary original string column exists before using it
  const columnExists = await sql<{ count: number }>`
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_name = 'exif' AND column_name = 'projection_type_original_string';
  `.execute(db);

  if (columnExists.rows[0].count > 0) {
    await sql`
      UPDATE "exif"
      SET "projectionType" = COALESCE("projection_type_original_string", "projectionType"::text);
    `.execute(db);

    // Drop the temporary original string column
    await sql`ALTER TABLE "exif" DROP COLUMN "projection_type_original_string";`.execute(db);
  } else {
    // If the temporary column doesn't exist, simply cast the enum values back to text
    await sql`
      UPDATE "exif"
      SET "projectionType" = "projectionType"::text;
    `.execute(db);
  }

  // Drop the enum type
  await sql`DROP TYPE "projection_type_enum";`.execute(db);
}
