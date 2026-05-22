import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    INSERT INTO "asset_file" ("assetId", "type", "path")
    SELECT "id", 'encoded_video', "encodedVideoPath"
    FROM "asset"
    WHERE "encodedVideoPath" IS NOT NULL AND "encodedVideoPath" != '';
  `.execute(db);

  await sql`ALTER TABLE "asset" DROP COLUMN "encodedVideoPath";`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset" ADD "encodedVideoPath" character varying DEFAULT '';`.execute(db);

  await sql`
    UPDATE "asset"
    SET "encodedVideoPath" = af."path"
    FROM "asset_file" af
    WHERE "asset"."id" = af."assetId"
      AND af."type" = 'encoded_video'
      AND af."isEdited" = false;
  `.execute(db);
}
