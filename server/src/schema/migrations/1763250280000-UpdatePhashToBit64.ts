import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Drop the existing index since we're changing the column type
  await sql`DROP INDEX IF EXISTS "asset_hash_phash_idx"`.execute(db);

  // Alter the phash column from bit(256) to bit(64) - standard pHash size
  // Existing data will be cleared since hash size is different
  await sql`
    ALTER TABLE asset_hash
    ALTER COLUMN "phash" TYPE bit(64) USING NULL
  `.execute(db);

  // Recreate the index on the new bit(64) column
  await sql`
    CREATE INDEX "asset_hash_phash_idx" ON asset_hash ("phash")
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Revert back to bit(256)
  await sql`DROP INDEX IF EXISTS "asset_hash_phash_idx"`.execute(db);

  await sql`
    ALTER TABLE asset_hash
    ALTER COLUMN "phash" TYPE bit(256) USING NULL
  `.execute(db);

  await sql`
    CREATE INDEX "asset_hash_phash_idx" ON asset_hash ("phash")
  `.execute(db);
}
