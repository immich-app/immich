import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "album_user" ADD "order" character varying NOT NULL DEFAULT 'desc';`.execute(db);
  await sql`UPDATE "album_user" SET "order" = "album"."order" FROM "album" WHERE "album_user"."albumId" = "album"."id";`.execute(
    db,
  );
  await sql`ALTER TABLE "album" DROP COLUMN "order";`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "album" ADD "order" character varying NOT NULL DEFAULT 'desc';`.execute(db);
  await sql`
    UPDATE "album"
    SET "order" = "album_user"."order"
    FROM "album_user"
    WHERE "album_user"."albumId" = "album"."id"
      AND "album_user"."role" = 'owner';
  `.execute(db);
  await sql`ALTER TABLE "album_user" DROP COLUMN "order";`.execute(db);
}
