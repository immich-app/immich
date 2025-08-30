import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION asset_metadata_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO asset_metadata_audit ("assetId", "key")
      SELECT "assetId", "key"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE TABLE "asset_metadata_audit" (
  "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "assetId" uuid NOT NULL,
  "key" character varying NOT NULL,
  "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "asset_metadata_audit_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "asset_metadata_audit_assetId_idx" ON "asset_metadata_audit" ("assetId");`.execute(db);
  await sql`CREATE INDEX "asset_metadata_audit_key_idx" ON "asset_metadata_audit" ("key");`.execute(db);
  await sql`CREATE INDEX "asset_metadata_audit_deletedAt_idx" ON "asset_metadata_audit" ("deletedAt");`.execute(db);
  await sql`CREATE TABLE "asset_metadata" (
  "assetId" uuid NOT NULL,
  "key" character varying NOT NULL,
  "value" jsonb NOT NULL,
  "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "asset_metadata_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "asset_metadata_pkey" PRIMARY KEY ("assetId", "key")
);`.execute(db);
  await sql`CREATE INDEX "asset_metadata_updateId_idx" ON "asset_metadata" ("updateId");`.execute(db);
  await sql`CREATE INDEX "asset_metadata_updatedAt_idx" ON "asset_metadata" ("updatedAt");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_metadata_audit"
  AFTER DELETE ON "asset_metadata"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION asset_metadata_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_metadata_updated_at"
  BEFORE UPDATE ON "asset_metadata"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_asset_metadata_audit', '{"type":"function","name":"asset_metadata_audit","sql":"CREATE OR REPLACE FUNCTION asset_metadata_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO asset_metadata_audit (\\"assetId\\", \\"key\\")\\n      SELECT \\"assetId\\", \\"key\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_metadata_audit', '{"type":"trigger","name":"asset_metadata_audit","sql":"CREATE OR REPLACE TRIGGER \\"asset_metadata_audit\\"\\n  AFTER DELETE ON \\"asset_metadata\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION asset_metadata_audit();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_metadata_updated_at', '{"type":"trigger","name":"asset_metadata_updated_at","sql":"CREATE OR REPLACE TRIGGER \\"asset_metadata_updated_at\\"\\n  BEFORE UPDATE ON \\"asset_metadata\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "asset_metadata_audit";`.execute(db);
  await sql`DROP TABLE "asset_metadata";`.execute(db);
  await sql`DROP FUNCTION asset_metadata_audit;`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_asset_metadata_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_metadata_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_metadata_updated_at';`.execute(db);
}
