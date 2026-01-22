import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_file" DROP CONSTRAINT "asset_file_assetId_type_uq";`.execute(db);
  await sql`ALTER TABLE "asset_file" ADD "isEdited" boolean NOT NULL DEFAULT false;`.execute(db);
  await sql`ALTER TABLE "asset_file" ADD CONSTRAINT "asset_file_assetId_type_isEdited_uq" UNIQUE ("assetId", "type", "isEdited");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_file" DROP CONSTRAINT "asset_file_assetId_type_isEdited_uq";`.execute(db);
  await sql`ALTER TABLE "asset_file" ADD CONSTRAINT "asset_file_assetId_type_uq" UNIQUE ("assetId", "type");`.execute(db);
  await sql`ALTER TABLE "asset_file" DROP COLUMN "isEdited";`.execute(db);
}
