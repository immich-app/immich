import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TYPE "asset_visibility_enum" AS ENUM ('archive','timeline','hidden');`.execute(db);
  await sql`ALTER TABLE "assets"
    ADD "visibility" asset_visibility_enum NOT NULL DEFAULT 'timeline';`.execute(db);

  await sql`
    UPDATE "assets"
    SET "visibility" = CASE
                        WHEN "isArchived" THEN 'archive'::asset_visibility_enum
                        WHEN "isVisible" THEN 'timeline'::asset_visibility_enum
                        ELSE 'hidden'::asset_visibility_enum
                      END;
  `.execute(db);

  await sql`ALTER TABLE "assets" DROP COLUMN "isVisible";`.execute(db);
  await sql`ALTER TABLE "assets" DROP COLUMN "isArchived";`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "assets" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT FALSE;`.execute(db);
  await sql`ALTER TABLE "assets" ADD COLUMN "isVisible" BOOLEAN NOT NULL DEFAULT TRUE;`.execute(db);

  await sql`
      UPDATE "assets"
      SET
        "isArchived" = ("visibility" = 'archive'::asset_visibility_enum),
        "isVisible" = CASE
                        WHEN "visibility" = 'timeline'::asset_visibility_enum THEN TRUE
                        WHEN "visibility" = 'archive'::asset_visibility_enum THEN TRUE
                        ELSE FALSE
                      END;
    `.execute(db);
  await sql`ALTER TABLE "assets" DROP COLUMN "visibility";`.execute(db);
  await sql`DROP TYPE "asset_visibility_enum";`.execute(db);
}
