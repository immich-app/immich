import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_exif" ALTER COLUMN "description" SET DEFAULT NULL;`.execute(db);
  await sql`ALTER TABLE "person" ALTER COLUMN "thumbnailPath" SET DEFAULT NULL;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "person" ALTER COLUMN "thumbnailPath" SET DEFAULT ''::character varying;`.execute(db);
  await sql`ALTER TABLE "asset_exif" ALTER COLUMN "description" SET DEFAULT ''::text;`.execute(db);
}
