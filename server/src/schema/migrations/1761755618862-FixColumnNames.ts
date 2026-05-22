import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    // rename columns
  await sql`ALTER TABLE "album_asset" RENAME COLUMN "albumsId" TO "albumId";`.execute(db);
  await sql`ALTER TABLE "album_asset" RENAME COLUMN "assetsId" TO "assetId";`.execute(db);
  await sql`ALTER TABLE "album_user" RENAME COLUMN "albumsId" TO "albumId";`.execute(db);
  await sql`ALTER TABLE "album_user" RENAME COLUMN "usersId" TO "userId";`.execute(db);
  await sql`ALTER TABLE "memory_asset" RENAME COLUMN "assetsId" TO "assetId";`.execute(db);
  await sql`ALTER TABLE "shared_link_asset" RENAME COLUMN "assetsId" TO "assetId";`.execute(db);
  await sql`ALTER TABLE "shared_link_asset" RENAME COLUMN "sharedLinksId" TO "sharedLinkId";`.execute(db);
  await sql`ALTER TABLE "tag_asset" RENAME COLUMN "assetsId" TO "assetId";`.execute(db);
  await sql`ALTER TABLE "tag_asset" RENAME COLUMN "tagsId" TO "tagId";`.execute(db);

  // rename constraints
  await sql`ALTER TABLE "album_asset" RENAME CONSTRAINT "album_asset_albumsId_fkey" TO "album_asset_albumId_fkey";`.execute(db);
  await sql`ALTER TABLE "album_asset" RENAME CONSTRAINT "album_asset_assetsId_fkey" TO "album_asset_assetId_fkey";`.execute(db);
  await sql`ALTER TABLE "album_user" RENAME CONSTRAINT "album_user_albumsId_fkey" TO "album_user_albumId_fkey";`.execute(db);
  await sql`ALTER TABLE "album_user" RENAME CONSTRAINT "album_user_usersId_fkey" TO "album_user_userId_fkey";`.execute(db);
  await sql`ALTER TABLE "memory_asset" RENAME CONSTRAINT "memory_asset_assetsId_fkey" TO "memory_asset_assetId_fkey";`.execute(db);
  await sql`ALTER TABLE "shared_link_asset" RENAME CONSTRAINT "shared_link_asset_assetsId_fkey" TO "shared_link_asset_assetId_fkey";`.execute(db);
  await sql`ALTER TABLE "shared_link_asset" RENAME CONSTRAINT "shared_link_asset_sharedLinksId_fkey" TO "shared_link_asset_sharedLinkId_fkey";`.execute(db);
  await sql`ALTER TABLE "tag_asset" RENAME CONSTRAINT "tag_asset_assetsId_fkey" TO "tag_asset_assetId_fkey";`.execute(db);
  await sql`ALTER TABLE "tag_asset" RENAME CONSTRAINT "tag_asset_tagsId_fkey" TO "tag_asset_tagId_fkey";`.execute(db);

  // rename indexes
  await sql`ALTER INDEX "album_asset_albumsId_idx" RENAME TO "album_asset_albumId_idx";`.execute(db);
  await sql`ALTER INDEX "album_asset_assetsId_idx" RENAME TO "album_asset_assetId_idx";`.execute(db);
  await sql`ALTER INDEX "album_user_usersId_idx" RENAME TO "album_user_userId_idx";`.execute(db);
  await sql`ALTER INDEX "album_user_albumsId_idx" RENAME TO "album_user_albumId_idx";`.execute(db);
  await sql`ALTER INDEX "memory_asset_assetsId_idx" RENAME TO "memory_asset_assetId_idx";`.execute(db);
  await sql`ALTER INDEX "shared_link_asset_sharedLinksId_idx" RENAME TO "shared_link_asset_sharedLinkId_idx";`.execute(db);
  await sql`ALTER INDEX "shared_link_asset_assetsId_idx" RENAME TO "shared_link_asset_assetId_idx";`.execute(db);
  await sql`ALTER INDEX "tag_asset_assetsId_idx" RENAME TO "tag_asset_assetId_idx";`.execute(db);
  await sql`ALTER INDEX "tag_asset_tagsId_idx" RENAME TO "tag_asset_tagId_idx";`.execute(db);
  await sql`ALTER INDEX "tag_asset_assetsId_tagsId_idx" RENAME TO "tag_asset_assetId_tagId_idx";`.execute(db);

  // update triggers and functions
  await sql`CREATE OR REPLACE FUNCTION album_user_after_insert()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      UPDATE album SET "updatedAt" = clock_timestamp(), "updateId" = immich_uuid_v7(clock_timestamp())
      WHERE "id" IN (SELECT DISTINCT "albumId" FROM inserted_rows);
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION album_asset_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO album_asset_audit ("albumId", "assetId")
      SELECT "albumId", "assetId" FROM OLD
      WHERE "albumId" IN (SELECT "id" FROM album WHERE "id" IN (SELECT "albumId" FROM OLD));
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION album_user_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO album_audit ("albumId", "userId")
      SELECT "albumId", "userId"
      FROM OLD;

      IF pg_trigger_depth() = 1 THEN
        INSERT INTO album_user_audit ("albumId", "userId")
        SELECT "albumId", "userId"
        FROM OLD;
      END IF;

      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION memory_asset_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO memory_asset_audit ("memoryId", "assetId")
      SELECT "memoriesId", "assetId" FROM OLD
      WHERE "memoriesId" IN (SELECT "id" FROM memory WHERE "id" IN (SELECT "memoriesId" FROM OLD));
      RETURN NULL;
    END
  $$;`.execute(db);

  // update overrides
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"function","name":"album_user_after_insert","sql":"CREATE OR REPLACE FUNCTION album_user_after_insert()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      UPDATE album SET \\"updatedAt\\" = clock_timestamp(), \\"updateId\\" = immich_uuid_v7(clock_timestamp())\\n      WHERE \\"id\\" IN (SELECT DISTINCT \\"albumId\\" FROM inserted_rows);\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb WHERE "name" = 'function_album_user_after_insert';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"function","name":"album_asset_delete_audit","sql":"CREATE OR REPLACE FUNCTION album_asset_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO album_asset_audit (\\"albumId\\", \\"assetId\\")\\n      SELECT \\"albumId\\", \\"assetId\\" FROM OLD\\n      WHERE \\"albumId\\" IN (SELECT \\"id\\" FROM album WHERE \\"id\\" IN (SELECT \\"albumId\\" FROM OLD));\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb WHERE "name" = 'function_album_asset_delete_audit';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"function","name":"album_user_delete_audit","sql":"CREATE OR REPLACE FUNCTION album_user_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO album_audit (\\"albumId\\", \\"userId\\")\\n      SELECT \\"albumId\\", \\"userId\\"\\n      FROM OLD;\\n\\n      IF pg_trigger_depth() = 1 THEN\\n        INSERT INTO album_user_audit (\\"albumId\\", \\"userId\\")\\n        SELECT \\"albumId\\", \\"userId\\"\\n        FROM OLD;\\n      END IF;\\n\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb WHERE "name" = 'function_album_user_delete_audit';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"function","name":"memory_asset_delete_audit","sql":"CREATE OR REPLACE FUNCTION memory_asset_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO memory_asset_audit (\\"memoryId\\", \\"assetId\\")\\n      SELECT \\"memoriesId\\", \\"assetId\\" FROM OLD\\n      WHERE \\"memoriesId\\" IN (SELECT \\"id\\" FROM memory WHERE \\"id\\" IN (SELECT \\"memoriesId\\" FROM OLD));\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb WHERE "name" = 'function_memory_asset_delete_audit';`.execute(db);
}

export function down() {
  // not implemented
}
