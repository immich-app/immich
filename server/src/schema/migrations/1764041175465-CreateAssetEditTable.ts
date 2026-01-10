import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE "asset_edit" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "assetId" uuid NOT NULL,
      "action" varchar NOT NULL,
      "parameters" jsonb NOT NULL
    );
  `.execute(db);

  await sql`ALTER TABLE "asset_edit" ADD CONSTRAINT "asset_edit_pkey" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "asset_edit" ADD CONSTRAINT "asset_edit_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(
    db,
  );
  await sql`CREATE INDEX "asset_edit_assetId_idx" ON "asset_edit" ("assetId")`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE IF EXISTS "asset_edit";`.execute(db);
}
