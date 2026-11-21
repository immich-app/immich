import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_video" ADD "isFragmented" boolean NOT NULL DEFAULT false;`.execute(db);
  await sql`UPDATE "asset_video" SET "isFragmented" = true WHERE "formatLongName" = 'QuickTime / MOV' AND "frameCount" = 0;`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_video" DROP COLUMN "isFragmented";`.execute(db);
}
