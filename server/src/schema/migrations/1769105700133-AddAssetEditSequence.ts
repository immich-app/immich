import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`DELETE FROM "asset_edit";`.execute(db);
  await sql`ALTER TABLE "asset_edit" ADD "sequence" integer NOT NULL;`.execute(db);
  await sql`ALTER TABLE "asset_edit" ADD CONSTRAINT "asset_edit_assetId_sequence_uq" UNIQUE ("assetId", "sequence");`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_edit" DROP CONSTRAINT "asset_edit_assetId_sequence_uq";`.execute(db);
  await sql`ALTER TABLE "asset_edit" DROP COLUMN "sequence";`.execute(db);
}
