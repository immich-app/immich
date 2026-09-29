import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TYPE "asset_checksum_algorithm_enum" AS ENUM ('sha1','sha1-path');`.execute(db);
  await sql`ALTER TABLE "asset" ADD "checksumAlgorithm" asset_checksum_algorithm_enum;`.execute(db);

  await sql`
    UPDATE "asset"
    SET "checksumAlgorithm" = CASE
      WHEN "isExternal" = true THEN 'sha1-path'::asset_checksum_algorithm_enum
      ELSE 'sha1'::asset_checksum_algorithm_enum
    END
  `.execute(db);

  await sql`ALTER TABLE "asset" ALTER COLUMN "checksumAlgorithm" SET NOT NULL;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset" DROP COLUMN "checksumAlgorithm";`.execute(db);
  await sql`DROP TYPE "asset_checksum_algorithm_enum";`.execute(db);
}
