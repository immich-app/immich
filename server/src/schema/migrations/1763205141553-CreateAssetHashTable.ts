import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE asset_hash (
      "assetId" uuid NOT NULL PRIMARY KEY REFERENCES asset(id) ON DELETE CASCADE,
      "phash" bigint,
      "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `.execute(db);

  // Create index for pHash similarity searches
  await sql`
    CREATE INDEX "asset_hash_phash_idx" ON asset_hash ("phash");
  `.execute(db);
}

export function down(db: Kysely<any>): Promise<void> {
  return db.schema.dropTable('asset_hash').ifExists().execute();
}
