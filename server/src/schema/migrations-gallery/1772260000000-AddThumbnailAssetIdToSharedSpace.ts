import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "shared_space" ADD "thumbnailAssetId" uuid`.execute(db);
  await sql`ALTER TABLE "shared_space" ADD CONSTRAINT "shared_space_thumbnailAssetId_fkey" FOREIGN KEY ("thumbnailAssetId") REFERENCES "asset" ("id") ON DELETE SET NULL`.execute(
    db,
  );
  await sql`CREATE INDEX "shared_space_thumbnailAssetId_idx" ON "shared_space" ("thumbnailAssetId")`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "shared_space" DROP COLUMN "thumbnailAssetId"`.execute(db);
}
