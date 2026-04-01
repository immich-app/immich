import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TYPE "sharing_permission_enum" AS ENUM ('all','asset.read','asset.update','asset.edit','asset.delete','asset.share','exif.read','person.read','person.update','person.merge','person.delete');`.execute(db);
  await sql`ALTER TABLE "user" ADD "trustedGroupId" uuid NOT NULL DEFAULT uuid_generate_v4();`.execute(db);
  await sql`ALTER TABLE "album_user" ADD "permissions" sharing_permission_enum[] NOT NULL DEFAULT '{asset.read,exif.read}';`.execute(db);
  await sql`ALTER TABLE "album_user" ADD "inTimeline" boolean NOT NULL DEFAULT false;`.execute(db);
  await sql`ALTER TABLE "partner" ADD "permissions" sharing_permission_enum[] NOT NULL DEFAULT '{all}';`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TYPE "sharing_permission_enum";`.execute(db);
  await sql`ALTER TABLE "partner" DROP COLUMN "permissions";`.execute(db);
  await sql`ALTER TABLE "user" DROP COLUMN "trustedGroupId";`.execute(db);
  await sql`ALTER TABLE "album_user" DROP COLUMN "permissions";`.execute(db);
  await sql`ALTER TABLE "album_user" DROP COLUMN "inTimeline";`.execute(db);
}
