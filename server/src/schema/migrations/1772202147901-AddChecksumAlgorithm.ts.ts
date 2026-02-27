import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TYPE "asset_checksum_algorithm_enum" AS ENUM ('sha1-file','sha1-path');`.execute(db);
  await sql`ALTER TABLE "asset" ADD "checksumAlgorithm" asset_checksum_algorithm_enum;`.execute(db);

  // Update in batches to handle millions of rows efficiently
  const batchSize = 10_000;
  let updatedRows: number;
  
  do {
    const result = await sql`
      UPDATE "asset"
      SET "checksumAlgorithm" = CASE 
        WHEN "isExternal" = true THEN 'sha1-path'::asset_checksum_algorithm_enum 
        ELSE 'sha1-file'::asset_checksum_algorithm_enum 
      END
      WHERE "id" IN (
        SELECT "id" 
        FROM "asset" 
        WHERE "checksumAlgorithm" IS NULL 
        LIMIT ${batchSize}
      )
    `.execute(db);
    
    updatedRows = Number(result.numAffectedRows ?? 0);
  } while (updatedRows > 0);

  await sql`ALTER TABLE "asset" ALTER COLUMN "checksumAlgorithm" SET NOT NULL;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset" DROP COLUMN "checksumAlgorithm";`.execute(db);
  await sql`DROP TYPE "asset_checksum_algorithm_enum";`.execute(db);
}