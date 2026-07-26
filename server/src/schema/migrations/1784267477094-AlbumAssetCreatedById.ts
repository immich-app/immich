import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "album_asset" ADD "createdById" uuid;`.execute(db);
  await sql`CREATE INDEX "album_asset_createdById_idx" ON "album_asset" ("createdById");`.execute(db);
  await sql`ALTER TABLE "album_asset" ADD CONSTRAINT "album_asset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE SET NULL;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "album_asset" DROP CONSTRAINT "album_asset_createdById_fkey";`.execute(db);
  await sql`DROP INDEX "album_asset_createdById_idx";`.execute(db);
  await sql`ALTER TABLE "album_asset" DROP COLUMN "createdById";`.execute(db);
}
