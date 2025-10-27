import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION album_asset_generate_aggregation_id()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    DECLARE
      v_now TIMESTAMP WITH TIME ZONE := clock_timestamp();
      v_existing uuid;
    BEGIN
      IF NEW."createdAt" IS NULL THEN
        NEW."createdAt" = v_now;
      END IF;

      SELECT "aggregationId"
        INTO v_existing
        FROM album_asset
        WHERE "albumsId" = NEW."albumsId"
          AND "createdBy" = NEW."createdBy"
          AND "createdAt" >= v_now - INTERVAL '60 minutes'
        ORDER BY "createdAt" DESC
        LIMIT 1;

      IF v_existing IS NOT NULL THEN
        NEW."aggregationId" = v_existing;
      ELSE
        NEW."aggregationId" = immich_uuid_v7(v_now);
      END IF;

      RETURN NEW;
    END
  $$;`.execute(db);
  await sql`ALTER TABLE "album_asset" ADD "createdBy" uuid;`.execute(db);
  await sql`ALTER TABLE "album_asset" ADD "aggregationId" uuid;`.execute(db);
  await sql`ALTER TABLE "album_asset" ADD CONSTRAINT "album_asset_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`CREATE INDEX "album_asset_createdBy_idx" ON "album_asset" ("createdBy");`.execute(db);
  await sql`CREATE INDEX "album_asset_aggregationId_idx" ON "album_asset" ("aggregationId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_asset_generate_aggregation_id"
  BEFORE INSERT ON "album_asset"
  FOR EACH ROW
  EXECUTE FUNCTION album_asset_generate_aggregation_id();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_album_asset_generate_aggregation_id', '{"type":"function","name":"album_asset_generate_aggregation_id","sql":"CREATE OR REPLACE FUNCTION album_asset_generate_aggregation_id()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    DECLARE\\n      v_now TIMESTAMP WITH TIME ZONE := clock_timestamp();\\n      v_existing uuid;\\n    BEGIN\\n      IF NEW.\\"createdAt\\" IS NULL THEN\\n        NEW.\\"createdAt\\" = v_now;\\n      END IF;\\n\\n      SELECT \\"aggregationId\\"\\n        INTO v_existing\\n        FROM album_asset\\n        WHERE \\"albumsId\\" = NEW.\\"albumsId\\"\\n          AND \\"createdBy\\" = NEW.\\"createdBy\\"\\n          AND \\"createdAt\\" >= v_now - INTERVAL ''60 minutes''\\n        ORDER BY \\"createdAt\\" DESC\\n        LIMIT 1;\\n\\n      IF v_existing IS NOT NULL THEN\\n        NEW.\\"aggregationId\\" = v_existing;\\n      ELSE\\n        NEW.\\"aggregationId\\" = immich_uuid_v7(v_now);\\n      END IF;\\n\\n      RETURN NEW;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_album_asset_generate_aggregation_id', '{"type":"trigger","name":"album_asset_generate_aggregation_id","sql":"CREATE OR REPLACE TRIGGER \\"album_asset_generate_aggregation_id\\"\\n  BEFORE INSERT ON \\"album_asset\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION album_asset_generate_aggregation_id();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "album_asset_generate_aggregation_id" ON "album_asset";`.execute(db);
  await sql`DROP INDEX "album_asset_createdBy_idx";`.execute(db);
  await sql`DROP INDEX "album_asset_aggregationId_idx";`.execute(db);
  await sql`ALTER TABLE "album_asset" DROP CONSTRAINT "album_asset_createdBy_fkey";`.execute(db);
  await sql`ALTER TABLE "album_asset" DROP COLUMN "createdBy";`.execute(db);
  await sql`ALTER TABLE "album_asset" DROP COLUMN "aggregationId";`.execute(db);
  await sql`DROP FUNCTION album_asset_generate_aggregation_id;`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_album_asset_generate_aggregation_id';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_album_asset_generate_aggregation_id';`.execute(db);
}
