import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "asset_originalPath_libraryId_idx";`.execute(db);
  await sql`ALTER TABLE "asset" ALTER COLUMN "originalPath" TYPE character varying COLLATE "C";`.execute(db);
  await sql`CREATE INDEX "asset_libraryId_originalPath_idx" ON "asset" ("libraryId", "originalPath") INCLUDE ("id", "isOffline", "isExternal", "status", "fileModifiedAt");`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "asset_libraryId_originalPath_idx";`.execute(db);
  await sql`ALTER TABLE "asset" ALTER COLUMN "originalPath" TYPE character varying COLLATE "default";`.execute(db);
  await sql`CREATE INDEX "asset_originalPath_libraryId_idx" ON "asset" ("originalPath", "libraryId");`.execute(db);
}
