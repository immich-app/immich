import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_exif" ALTER COLUMN "description" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "person" ALTER COLUMN "thumbnailPath" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceType" SET DEFAULT NULL;`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceOS" SET DEFAULT NULL;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "person" ALTER COLUMN "thumbnailPath" SET NOT NULL;`.execute(db);
  await sql`ALTER TABLE "asset_exif" ALTER COLUMN "description" SET NOT NULL;`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceType" SET DEFAULT ''::character varying;`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceOS" SET DEFAULT ''::character varying;`.execute(db);
}
