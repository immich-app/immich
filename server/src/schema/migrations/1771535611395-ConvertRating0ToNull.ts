import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`UPDATE "asset_exif" SET "rating" = NULL WHERE "rating" = 0;`.execute(db);
}

export async function down(): Promise<void> {
  // not supported
}
