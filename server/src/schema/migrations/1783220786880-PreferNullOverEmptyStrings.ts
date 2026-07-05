import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`UPDATE "user" SET "password" = NULL WHERE "password" = ''`.execute(db);
  await sql`UPDATE "user" SET "profileImagePath" = NULL WHERE "profileImagePath" = ''`.execute(db);
  await sql`UPDATE "user" SET "oauthId" = NULL WHERE "oauthId" = ''`.execute(db);
  await sql`UPDATE "user" SET "name" = NULL WHERE "name" = ''`.execute(db);
  await sql`UPDATE "album" SET "description" = NULL WHERE "description" = ''`.execute(db);
  await sql`UPDATE "asset_exif" SET "description" = NULL WHERE "description" = ''`.execute(db);
  await sql`UPDATE "person" SET "name" = NULL WHERE "name" = ''`.execute(db);
  await sql`UPDATE "person" SET "thumbnailPath" = NULL WHERE "thumbnailPath" = ''`.execute(db);
  await sql`UPDATE "session" SET "deviceType" = NULL WHERE "deviceType" = ''`.execute(db);
  await sql`UPDATE "session" SET "deviceOS" = NULL WHERE "deviceOS" = ''`.execute(db);

  await sql`ALTER TABLE "user" ALTER COLUMN "password" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "profileImagePath" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "oauthId" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "name" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "album" ALTER COLUMN "description" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "asset_exif" ALTER COLUMN "description" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "person" ALTER COLUMN "name" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "person" ALTER COLUMN "thumbnailPath" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceType" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceOS" DROP NOT NULL;`.execute(db);

  await sql`ALTER TABLE "user" ALTER COLUMN "password" SET DEFAULT NULL;`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "profileImagePath" SET DEFAULT NULL;`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "oauthId" SET DEFAULT NULL;`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "name" SET DEFAULT NULL;`.execute(db);
  await sql`ALTER TABLE "album" ALTER COLUMN "description" SET DEFAULT NULL;`.execute(db);
  await sql`ALTER TABLE "asset_exif" ALTER COLUMN "description" SET DEFAULT NULL;`.execute(db);
  await sql`ALTER TABLE "person" ALTER COLUMN "name" SET DEFAULT NULL;`.execute(db);
  await sql`ALTER TABLE "person" ALTER COLUMN "thumbnailPath" SET DEFAULT NULL;`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceType" SET DEFAULT NULL;`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceOS" SET DEFAULT NULL;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "person" ALTER COLUMN "name" SET NOT NULL;`.execute(db);
  await sql`ALTER TABLE "person" ALTER COLUMN "thumbnailPath" SET NOT NULL;`.execute(db);
  await sql`ALTER TABLE "album" ALTER COLUMN "description" SET NOT NULL;`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "password" SET NOT NULL;`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "profileImagePath" SET NOT NULL;`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "oauthId" SET NOT NULL;`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "name" SET NOT NULL;`.execute(db);
  await sql`ALTER TABLE "asset_exif" ALTER COLUMN "description" SET NOT NULL;`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceType" SET NOT NULL;`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceOS" SET NOT NULL;`.execute(db);

  await sql`ALTER TABLE "person" ALTER COLUMN "name" SET DEFAULT ''::character varying;`.execute(db);
  await sql`ALTER TABLE "person" ALTER COLUMN "thumbnailPath" SET DEFAULT ''::character varying;`.execute(db);
  await sql`ALTER TABLE "album" ALTER COLUMN "description" SET DEFAULT ''::text;`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "password" SET DEFAULT ''::character varying;`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "profileImagePath" SET DEFAULT ''::character varying;`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "oauthId" SET DEFAULT ''::character varying;`.execute(db);
  await sql`ALTER TABLE "user" ALTER COLUMN "name" SET DEFAULT ''::character varying;`.execute(db);
  await sql`ALTER TABLE "asset_exif" ALTER COLUMN "description" SET DEFAULT ''::text;`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceType" SET DEFAULT ''::character varying;`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "deviceOS" SET DEFAULT ''::character varying;`.execute(db);
}
