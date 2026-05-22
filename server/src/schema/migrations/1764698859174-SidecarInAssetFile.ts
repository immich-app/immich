import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`INSERT INTO "asset_file" ("assetId", "path", "type")
            SELECT
            id, "sidecarPath", 'sidecar'
            FROM "asset"
            WHERE "sidecarPath" IS NOT NULL AND "sidecarPath" != '';`.execute(db);

  await sql`ALTER TABLE "asset" DROP COLUMN "sidecarPath";`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset" ADD "sidecarPath" character varying;`.execute(db);

  await sql`
      UPDATE "asset"
      SET "sidecarPath" = "asset_file"."path"
      FROM "asset_file"
      WHERE "asset"."id" = "asset_file"."assetId" AND "asset_file"."type" = 'sidecar';
    `.execute(db);

  await sql`DELETE FROM "asset_file" WHERE "type" = 'sidecar';`.execute(db);
}
