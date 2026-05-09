import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE "shared_space_face_match_backfill_target" (
      "spaceId" uuid NOT NULL,
      "assetId" uuid NOT NULL,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
      CONSTRAINT "shared_space_face_match_backfill_target_pkey" PRIMARY KEY ("spaceId", "assetId"),
      CONSTRAINT "shared_space_face_match_backfill_target_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "shared_space" ("id") ON DELETE CASCADE,
      CONSTRAINT "shared_space_face_match_backfill_target_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON DELETE CASCADE
    )
  `.execute(db);

  await sql`
    CREATE INDEX "shared_space_face_match_backfill_target_assetId_idx"
    ON "shared_space_face_match_backfill_target" ("assetId")
  `.execute(db);
  await sql`
    CREATE INDEX "shared_space_face_match_backfill_target_updateId_idx"
    ON "shared_space_face_match_backfill_target" ("updateId")
  `.execute(db);

  await sql`
    CREATE OR REPLACE TRIGGER "shared_space_face_match_backfill_target_updatedAt"
    BEFORE UPDATE ON "shared_space_face_match_backfill_target"
    FOR EACH ROW
    EXECUTE FUNCTION updated_at()
  `.execute(db);

  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_shared_space_face_match_backfill_target_updatedAt', '{"type":"trigger","name":"shared_space_face_match_backfill_target_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"shared_space_face_match_backfill_target_updatedAt\\"\\n  BEFORE UPDATE ON \\"shared_space_face_match_backfill_target\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb)`.execute(
    db,
  );
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    DELETE FROM "migration_overrides"
    WHERE "name" = 'trigger_shared_space_face_match_backfill_target_updatedAt'
  `.execute(db);

  await sql`
    DROP TRIGGER IF EXISTS "shared_space_face_match_backfill_target_updatedAt"
    ON "shared_space_face_match_backfill_target"
  `.execute(db);

  await sql`DROP INDEX IF EXISTS "shared_space_face_match_backfill_target_updateId_idx"`.execute(db);

  await sql`DROP TABLE IF EXISTS "shared_space_face_match_backfill_target"`.execute(db);
}
