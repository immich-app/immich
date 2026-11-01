import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "tag" ADD COLUMN IF NOT EXISTS "isPrivate" boolean NOT NULL DEFAULT false;`.execute(db);
  await sql`ALTER TABLE "tag" ADD COLUMN IF NOT EXISTS "systemKey" character varying;`.execute(db);
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "tag_userId_systemKey_uq" ON "tag" ("userId", "systemKey") WHERE "systemKey" IS NOT NULL;`.execute(
    db,
  );
  await sql`CREATE INDEX IF NOT EXISTS "tag_isPrivate_idx" ON "tag" ("isPrivate");`.execute(db);

  await sql`
    INSERT INTO "tag" ("userId", "value", "isPrivate", "systemKey")
    SELECT "user"."id", candidate.value, true, 'locked'
    FROM "user"
    CROSS JOIN LATERAL (
      SELECT value
      FROM generate_series(0, (SELECT count(*) FROM "tag" WHERE "userId" = "user"."id")) AS choice(n)
      CROSS JOIN LATERAL (
        SELECT CASE WHEN n = 0 THEN 'locked' ELSE 'locked-system-' || "user"."id"::text || '-' || n END AS value
      ) AS name
      WHERE NOT EXISTS (
        SELECT 1 FROM "tag" existing WHERE existing."userId" = "user"."id" AND existing.value = name.value
      )
      ORDER BY n LIMIT 1
    ) AS candidate
    WHERE NOT EXISTS (SELECT 1 FROM "tag" WHERE "userId" = "user"."id" AND "systemKey" = 'locked')
    ON CONFLICT DO NOTHING;
  `.execute(db);

  await sql`
    INSERT INTO "tag_closure" ("id_ancestor", "id_descendant")
    SELECT "id", "id"
    FROM "tag"
    WHERE "systemKey" = 'locked'
    ON CONFLICT DO NOTHING;
  `.execute(db);

  await sql`
    INSERT INTO "tag_asset" ("tagId", "assetId")
    SELECT tag."id", asset."id"
    FROM "asset" asset
    INNER JOIN "tag" tag
      ON tag."userId" = asset."ownerId"
      AND tag."systemKey" = 'locked'
    WHERE asset."visibility"::text = 'locked'
    ON CONFLICT DO NOTHING;
  `.execute(db);

  await sql`
    UPDATE "asset"
    SET "visibility" = 'timeline'
    WHERE "visibility"::text = 'locked' AND EXISTS (
      SELECT 1
      FROM "tag_asset"
      INNER JOIN "tag" ON "tag"."id" = "tag_asset"."tagId"
      WHERE "tag_asset"."assetId" = "asset"."id"
        AND "tag"."systemKey" = 'locked'
    );
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  const custom = await sql`
    SELECT 1 FROM "tag" WHERE "isPrivate" AND "systemKey" IS DISTINCT FROM 'locked' LIMIT 1
  `.execute(db);
  if (custom.rows.length > 0) {
    throw new Error('Cannot roll back private tags while custom private tags exist');
  }

  await sql`
    UPDATE "asset"
    SET "visibility" = 'locked'
    WHERE EXISTS (
      SELECT 1
      FROM "tag_asset"
      INNER JOIN "tag_closure" ON "tag_closure".id_descendant = "tag_asset"."tagId"
      INNER JOIN "tag" ON "tag"."id" = "tag_closure".id_ancestor
      WHERE "tag_asset"."assetId" = "asset"."id"
        AND "tag"."systemKey" = 'locked'
        AND "tag"."isPrivate" = true
    );
  `.execute(db);

  await sql`DELETE FROM "tag" WHERE "systemKey" = 'locked';`.execute(db);
  await sql`DROP INDEX "tag_isPrivate_idx";`.execute(db);
  await sql`DROP INDEX "tag_userId_systemKey_uq";`.execute(db);
  await sql`ALTER TABLE "tag" DROP COLUMN "systemKey";`.execute(db);
  await sql`ALTER TABLE "tag" DROP COLUMN "isPrivate";`.execute(db);
}
