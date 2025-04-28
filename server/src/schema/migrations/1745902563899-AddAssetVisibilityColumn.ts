import {Kysely, sql} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TYPE "asset_visibility_enum" AS ENUM ('archive','timeline','hidden');`.execute(db);
  await sql`ALTER TABLE "assets"
    ADD "visibility" asset_visibility_enum NOT NULL DEFAULT 'timeline';`.execute(db);

  await sql`
    UPDATE "assets"
    SET "visibility" = CASE
                         WHEN "isVisible" = TRUE THEN 'timeline'::asset_visibility_enum
                         WHEN "isVisible" = FALSE THEN 'hidden'::asset_visibility_enum
                         WHEN "isArchived" = TRUE THEN 'archive'::asset_visibility_enum
      END;
  `.execute(db);

  await sql`ALTER TABLE "assets" DROP COLUMN "isVisible";`.execute(db);
  await sql`ALTER TABLE "assets" DROP COLUMN "isArchived";`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "assets" DROP COLUMN "visibility";`.execute(db);
  await sql`DROP TYPE "asset_visibility_enum";`.execute(db);
}
