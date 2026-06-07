import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset" ADD COLUMN "aspectRatio" real GENERATED ALWAYS AS (width::real / NULLIF(height, 0)) STORED;`.execute(db);
  await sql`CREATE INDEX "asset_aspectRatio_idx" ON "asset" ("aspectRatio");`.execute(db);
  await sql`CREATE INDEX "asset_width_idx" ON "asset" ("width");`.execute(db);
  await sql`CREATE INDEX "asset_height_idx" ON "asset" ("height");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "asset_aspectRatio_idx";`.execute(db);
  await sql`DROP INDEX "asset_width_idx";`.execute(db);
  await sql`DROP INDEX "asset_height_idx";`.execute(db);
  await sql`ALTER TABLE "asset" DROP COLUMN "aspectRatio";`.execute(db);
}
