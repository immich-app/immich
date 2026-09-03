import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION tag_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO tag_audit ("tagId", "userId")
      SELECT "id", "userId" FROM OLD
      WHERE "userId" IN (SELECT "id" FROM "user" WHERE "id" IN (SELECT "userId" FROM OLD));
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION tag_asset_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO tag_asset_audit ("tagId", "assetId")
      SELECT "tagId", "assetId" FROM OLD
      WHERE "tagId" IN (SELECT "id" FROM tag WHERE "id" IN (SELECT "tagId" FROM OLD));
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "tag_delete_audit"
  AFTER DELETE ON "tag"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  EXECUTE FUNCTION tag_delete_audit();`.execute(db);
  await sql`ALTER TABLE "tag_asset" ADD "createdAt" timestamp with time zone NOT NULL DEFAULT now();`.execute(db);
  await sql`ALTER TABLE "tag_asset" ADD "updatedAt" timestamp with time zone NOT NULL DEFAULT now();`.execute(db);
  await sql`ALTER TABLE "tag_asset" ADD "updateId" uuid NOT NULL DEFAULT immich_uuid_v7();`.execute(db);
  await sql`CREATE INDEX "tag_asset_updateId_idx" ON "tag_asset" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "tag_asset_delete_audit"
  AFTER DELETE ON "tag_asset"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  EXECUTE FUNCTION tag_asset_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "tag_asset_updatedAt"
  BEFORE UPDATE ON "tag_asset"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE TABLE "tag_asset_audit" (
  "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "tagId" uuid NOT NULL,
  "assetId" uuid NOT NULL,
  "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "tag_asset_audit_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tag" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "tag_asset_audit_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "tag_asset_audit_tagId_idx" ON "tag_asset_audit" ("tagId");`.execute(db);
  await sql`CREATE INDEX "tag_asset_audit_assetId_idx" ON "tag_asset_audit" ("assetId");`.execute(db);
  await sql`CREATE INDEX "tag_asset_audit_deletedAt_idx" ON "tag_asset_audit" ("deletedAt");`.execute(db);
  await sql`CREATE TABLE "tag_audit" (
  "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "tagId" uuid NOT NULL,
  "userId" uuid NOT NULL,
  "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "tag_audit_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "tag_audit_tagId_idx" ON "tag_audit" ("tagId");`.execute(db);
  await sql`CREATE INDEX "tag_audit_userId_idx" ON "tag_audit" ("userId");`.execute(db);
  await sql`CREATE INDEX "tag_audit_deletedAt_idx" ON "tag_audit" ("deletedAt");`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_tag_delete_audit', '{"type":"function","name":"tag_delete_audit","sql":"CREATE OR REPLACE FUNCTION tag_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO tag_audit (\\"tagId\\", \\"userId\\")\\n      SELECT \\"id\\", \\"userId\\" FROM OLD\\n      WHERE \\"userId\\" IN (SELECT \\"id\\" FROM \\"user\\" WHERE \\"id\\" IN (SELECT \\"userId\\" FROM OLD));\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_tag_asset_delete_audit', '{"type":"function","name":"tag_asset_delete_audit","sql":"CREATE OR REPLACE FUNCTION tag_asset_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO tag_asset_audit (\\"tagId\\", \\"assetId\\")\\n      SELECT \\"tagId\\", \\"assetId\\" FROM OLD\\n      WHERE \\"tagId\\" IN (SELECT \\"id\\" FROM tag WHERE \\"id\\" IN (SELECT \\"tagId\\" FROM OLD));\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_tag_delete_audit', '{"type":"trigger","name":"tag_delete_audit","sql":"CREATE OR REPLACE TRIGGER \\"tag_delete_audit\\"\\n  AFTER DELETE ON \\"tag\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  EXECUTE FUNCTION tag_delete_audit();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_tag_asset_delete_audit', '{"type":"trigger","name":"tag_asset_delete_audit","sql":"CREATE OR REPLACE TRIGGER \\"tag_asset_delete_audit\\"\\n  AFTER DELETE ON \\"tag_asset\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  EXECUTE FUNCTION tag_asset_delete_audit();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_tag_asset_updatedAt', '{"type":"trigger","name":"tag_asset_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"tag_asset_updatedAt\\"\\n  BEFORE UPDATE ON \\"tag_asset\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "tag_delete_audit" ON "tag";`.execute(db);
  await sql`DROP FUNCTION tag_delete_audit;`.execute(db);
  await sql`DROP TRIGGER "tag_asset_delete_audit" ON "tag_asset";`.execute(db);
  await sql`DROP FUNCTION tag_asset_delete_audit;`.execute(db);
  await sql`ALTER TABLE "tag_asset" DROP COLUMN "createdAt";`.execute(db);
  await sql`ALTER TABLE "tag_asset" DROP COLUMN "updatedAt";`.execute(db);
  await sql`ALTER TABLE "tag_asset" DROP COLUMN "updateId";`.execute(db);
  await sql`DROP INDEX "tag_asset_updateId_idx";`.execute(db);
  await sql`DROP TRIGGER "tag_asset_updatedAt" ON "tag_asset";`.execute(db);
  await sql`DROP TABLE "tag_asset_audit";`.execute(db);
  await sql`DROP TABLE "tag_audit";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_tag_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_tag_asset_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_tag_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_tag_asset_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_tag_asset_updatedAt';`.execute(db);
}
