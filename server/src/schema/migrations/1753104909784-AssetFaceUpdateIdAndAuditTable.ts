import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION asset_face_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO asset_face_audit ("assetFaceId", "assetId")
      SELECT "id", "assetId"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE TABLE "asset_face_audit" (
  "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "assetFaceId" uuid NOT NULL,
  "assetId" uuid NOT NULL,
  "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "asset_face_audit_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "asset_face_audit_assetFaceId_idx" ON "asset_face_audit" ("assetFaceId");`.execute(db);
  await sql`CREATE INDEX "asset_face_audit_assetId_idx" ON "asset_face_audit" ("assetId");`.execute(db);
  await sql`CREATE INDEX "asset_face_audit_deletedAt_idx" ON "asset_face_audit" ("deletedAt");`.execute(db);
  await sql`ALTER TABLE "asset_face" ADD "updatedAt" timestamp with time zone NOT NULL DEFAULT now();`.execute(db);
  await sql`ALTER TABLE "asset_face" ADD "updateId" uuid NOT NULL DEFAULT immich_uuid_v7();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_face_audit"
  AFTER DELETE ON "asset_face"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION asset_face_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_face_updatedAt"
  BEFORE UPDATE ON "asset_face"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_asset_face_audit', '{"type":"function","name":"asset_face_audit","sql":"CREATE OR REPLACE FUNCTION asset_face_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO asset_face_audit (\\"assetFaceId\\", \\"assetId\\")\\n      SELECT \\"id\\", \\"assetId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_face_audit', '{"type":"trigger","name":"asset_face_audit","sql":"CREATE OR REPLACE TRIGGER \\"asset_face_audit\\"\\n  AFTER DELETE ON \\"asset_face\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION asset_face_audit();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_face_updatedAt', '{"type":"trigger","name":"asset_face_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"asset_face_updatedAt\\"\\n  BEFORE UPDATE ON \\"asset_face\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "asset_face_audit" ON "asset_face";`.execute(db);
  await sql`DROP TRIGGER "asset_face_updatedAt" ON "asset_face";`.execute(db);
  await sql`ALTER TABLE "asset_face" DROP COLUMN "updatedAt";`.execute(db);
  await sql`ALTER TABLE "asset_face" DROP COLUMN "updateId";`.execute(db);
  await sql`DROP TABLE "asset_face_audit";`.execute(db);
  await sql`DROP FUNCTION asset_face_audit;`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_asset_face_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_face_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_face_updatedAt';`.execute(db);
}
