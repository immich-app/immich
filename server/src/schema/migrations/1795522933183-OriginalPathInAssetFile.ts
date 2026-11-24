import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    INSERT INTO "asset_file" ("assetId", "type", "path")
    SELECT "id", 'original', "originalPath"
    FROM "asset";
  `.execute(db);
  await sql`CREATE INDEX "asset_file_original_path_idx" ON "asset_file" ("path") WHERE ("type" = 'original');`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_asset_file_original_path_idx', '{"type":"index","name":"asset_file_original_path_idx","sql":"CREATE INDEX \\"asset_file_original_path_idx\\" ON \\"asset_file\\" (\\"path\\") WHERE (\\"type\\" = ''original'');"}'::jsonb);`.execute(db);
  await sql`DROP INDEX "asset_originalPath_libraryId_idx";`.execute(db);
  await sql`ALTER TABLE "asset" DROP COLUMN "originalPath";`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset" ADD "originalPath" character varying;`.execute(db);
  await sql`
    UPDATE "asset"
    SET "originalPath" = "asset_file"."path"
    FROM "asset_file"
    WHERE "asset"."id" = "asset_file"."assetId"
      AND "asset_file"."type" = 'original'
      AND "asset_file"."isEdited" = false;
  `.execute(db);
  await sql`ALTER TABLE "asset" ALTER COLUMN "originalPath" SET NOT NULL;`.execute(db);
  await sql`CREATE INDEX "asset_originalPath_libraryId_idx" ON "asset" ("originalPath", "libraryId");`.execute(db);
  await sql`DROP INDEX "asset_file_original_path_idx";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_asset_file_original_path_idx';`.execute(db);
  await sql`DELETE FROM "asset_file" WHERE "type" = 'original';`.execute(db);
}
