import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE "asset_edit" (
      "assetId" uuid NOT NULL,
      "action" varchar NOT NULL,
      "parameters" jsonb NOT NULL,
      CONSTRAINT "asset_edit_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE IF EXISTS "asset_edit";`.execute(db);
}
