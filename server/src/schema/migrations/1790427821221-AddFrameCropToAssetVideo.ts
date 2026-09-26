import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE "asset_video"
    ADD COLUMN "cropTop" integer,
    ADD COLUMN "cropBottom" integer,
    ADD COLUMN "cropLeft" integer,
    ADD COLUMN "cropRight" integer;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE "asset_video"
    DROP COLUMN "cropTop",
    DROP COLUMN "cropBottom",
    DROP COLUMN "cropLeft",
    DROP COLUMN "cropRight";
  `.execute(db);
}
