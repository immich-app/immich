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
        WHERE "albumId" = NEW."albumId"
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
  await sql`CREATE OR REPLACE FUNCTION album_asset_sync_activity_apply(p_aggregation_id uuid, p_album_id uuid, p_user_id uuid)
  RETURNS void
  LANGUAGE PLPGSQL
  AS $$
    DECLARE
    v_asset_ids uuid[];
    v_created_at TIMESTAMP WITH TIME ZONE;
    v_album_id uuid := p_album_id;
    v_user_id uuid := p_user_id;
    BEGIN
      IF p_aggregation_id IS NULL OR p_album_id IS NULL OR p_user_id IS NULL THEN
        RAISE NOTICE 'album_asset_sync_activity_apply called with NULL parameters: %, %, %', p_aggregation_id, p_album_id, p_user_id;
        RETURN;
      END IF;

      SELECT
        ARRAY(
          SELECT aa."assetId"
          FROM album_asset aa
          WHERE aa."aggregationId" = p_aggregation_id
          ORDER BY aa."createdAt" ASC
        )::uuid[],
        MIN("createdAt")
      INTO v_asset_ids, v_created_at
      FROM album_asset
      WHERE "aggregationId" = p_aggregation_id;

      IF v_asset_ids IS NULL OR array_length(v_asset_ids, 1) IS NULL THEN
        DELETE FROM activity WHERE "aggregationId" = p_aggregation_id;
        RETURN;
      END IF;

      UPDATE activity
      SET
        "assetIds" = v_asset_ids,
        "albumId" = v_album_id,
        "userId" = COALESCE(v_user_id, activity."userId"),
        "createdAt" = v_created_at
      WHERE "aggregationId" = p_aggregation_id;

      IF NOT FOUND THEN
        INSERT INTO activity (
          "id",
          "albumId",
          "userId",
          "assetId",
          "comment",
          "isLiked",
          "aggregationId",
          "assetIds",
          "createdAt"
        )
        VALUES (
          p_aggregation_id,
          v_album_id,
          v_user_id,
          NULL,
          NULL,
          FALSE,
          p_aggregation_id,
          v_asset_ids,
          v_created_at
        )
        ON CONFLICT ("aggregationId")
        DO UPDATE
          SET "assetIds" = EXCLUDED."assetIds",
              "albumId" = EXCLUDED."albumId",
              "userId" = COALESCE(EXCLUDED."userId", activity."userId"),
              "createdAt" = EXCLUDED."createdAt";
      END IF;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION album_asset_sync_activity()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    DECLARE
      v_row RECORD;
    BEGIN
      IF TG_OP = 'INSERT' THEN
        FOR v_row IN
          SELECT DISTINCT "aggregationId", "albumId", "createdBy"
          FROM inserted_rows
          WHERE "aggregationId" IS NOT NULL
        LOOP
          PERFORM album_asset_sync_activity_apply(
            v_row."aggregationId",
            v_row."albumId",
            v_row."createdBy"
          );
        END LOOP;
      ELSIF TG_OP = 'DELETE' THEN
        FOR v_row IN
          SELECT DISTINCT "aggregationId", "albumId", "createdBy"
          FROM deleted_rows
          WHERE "aggregationId" IS NOT NULL
        LOOP
          PERFORM album_asset_sync_activity_apply(
            v_row."aggregationId",
            v_row."albumId",
            v_row."createdBy"
          );
        END LOOP;
      END IF;

      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`ALTER TABLE "activity" DROP CONSTRAINT "activity_like_check";`.execute(db);
  await sql`ALTER TABLE "album_asset" ADD "createdBy" uuid;`.execute(db);
  await sql`ALTER TABLE "album_asset" ADD "aggregationId" uuid;`.execute(db);
  await sql`ALTER TABLE "activity" ADD "aggregationId" uuid;`.execute(db);
  await sql`ALTER TABLE "activity" ADD "assetIds" uuid[];`.execute(db);
  await sql`ALTER TABLE "album_asset" ADD CONSTRAINT "album_asset_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(
    db,
  );
  await sql`ALTER TABLE "activity" ADD CONSTRAINT "activity_aggregationId_uq" UNIQUE ("aggregationId");`.execute(db);
  await sql`ALTER TABLE "activity" ADD CONSTRAINT "activity_check" CHECK ((("aggregationId" IS NULL) AND ((comment IS NULL AND "isLiked" = true) OR (comment IS NOT NULL AND "isLiked" = false))) OR ("aggregationId" IS NOT NULL AND comment IS NULL AND "isLiked" = false));`.execute(
    db,
  );
  await sql`CREATE INDEX "album_asset_createdBy_idx" ON "album_asset" ("createdBy");`.execute(db);
  await sql`CREATE INDEX "album_asset_aggregationId_idx" ON "album_asset" ("aggregationId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_asset_sync_activity_delete"
  AFTER DELETE ON "album_asset"
  REFERENCING OLD TABLE AS "deleted_rows"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() <= 1)
  EXECUTE FUNCTION album_asset_sync_activity();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_asset_sync_activity_insert"
  AFTER INSERT ON "album_asset"
  REFERENCING NEW TABLE AS "inserted_rows"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() <= 1)
  EXECUTE FUNCTION album_asset_sync_activity();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_asset_generate_aggregation_id"
  BEFORE INSERT ON "album_asset"
  FOR EACH ROW
  EXECUTE FUNCTION album_asset_generate_aggregation_id();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_album_asset_generate_aggregation_id', '{"type":"function","name":"album_asset_generate_aggregation_id","sql":"CREATE OR REPLACE FUNCTION album_asset_generate_aggregation_id()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    DECLARE\\n      v_now TIMESTAMP WITH TIME ZONE := clock_timestamp();\\n      v_existing uuid;\\n    BEGIN\\n      IF NEW.\\"createdAt\\" IS NULL THEN\\n        NEW.\\"createdAt\\" = v_now;\\n      END IF;\\n\\n      SELECT \\"aggregationId\\"\\n        INTO v_existing\\n        FROM album_asset\\n        WHERE \\"albumId\\" = NEW.\\"albumId\\"\\n          AND \\"createdBy\\" = NEW.\\"createdBy\\"\\n          AND \\"createdAt\\" >= v_now - INTERVAL ''60 minutes''\\n        ORDER BY \\"createdAt\\" DESC\\n        LIMIT 1;\\n\\n      IF v_existing IS NOT NULL THEN\\n        NEW.\\"aggregationId\\" = v_existing;\\n      ELSE\\n        NEW.\\"aggregationId\\" = immich_uuid_v7(v_now);\\n      END IF;\\n\\n      RETURN NEW;\\n    END\\n  $$;"}'::jsonb);`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_album_asset_sync_activity_apply', '{"type":"function","name":"album_asset_sync_activity_apply","sql":"CREATE OR REPLACE FUNCTION album_asset_sync_activity_apply(p_aggregation_id uuid, p_album_id uuid, p_user_id uuid)\\n  RETURNS void\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    DECLARE\\n    v_asset_ids uuid[];\\n    v_created_at TIMESTAMP WITH TIME ZONE;\\n    v_album_id uuid := p_album_id;\\n    v_user_id uuid := p_user_id;\\n    BEGIN\\n      IF p_aggregation_id IS NULL OR p_album_id IS NULL OR p_user_id IS NULL THEN\\n        RAISE NOTICE ''album_asset_sync_activity_apply called with NULL parameters: %, %, %'', p_aggregation_id, p_album_id, p_user_id;\\n        RETURN;\\n      END IF;\\n\\n      SELECT\\n        ARRAY(\\n          SELECT aa.\\"assetId\\"\\n          FROM album_asset aa\\n          WHERE aa.\\"aggregationId\\" = p_aggregation_id\\n          ORDER BY aa.\\"createdAt\\" ASC\\n        )::uuid[],\\n        MIN(\\"createdAt\\")\\n      INTO v_asset_ids, v_created_at\\n      FROM album_asset\\n      WHERE \\"aggregationId\\" = p_aggregation_id;\\n\\n      IF v_asset_ids IS NULL OR array_length(v_asset_ids, 1) IS NULL THEN\\n        DELETE FROM activity WHERE \\"aggregationId\\" = p_aggregation_id;\\n        RETURN;\\n      END IF;\\n\\n      UPDATE activity\\n      SET\\n        \\"assetIds\\" = v_asset_ids,\\n        \\"albumId\\" = v_album_id,\\n        \\"userId\\" = COALESCE(v_user_id, activity.\\"userId\\"),\\n        \\"createdAt\\" = v_created_at\\n      WHERE \\"aggregationId\\" = p_aggregation_id;\\n\\n      IF NOT FOUND THEN\\n        INSERT INTO activity (\\n          \\"id\\",\\n          \\"albumId\\",\\n          \\"userId\\",\\n          \\"assetId\\",\\n          \\"comment\\",\\n          \\"isLiked\\",\\n          \\"aggregationId\\",\\n          \\"assetIds\\",\\n          \\"createdAt\\"\\n        )\\n        VALUES (\\n          p_aggregation_id,\\n          v_album_id,\\n          v_user_id,\\n          NULL,\\n          NULL,\\n          FALSE,\\n          p_aggregation_id,\\n          v_asset_ids,\\n          v_created_at\\n        )\\n        ON CONFLICT (\\"aggregationId\\")\\n        DO UPDATE\\n          SET \\"assetIds\\" = EXCLUDED.\\"assetIds\\",\\n              \\"albumId\\" = EXCLUDED.\\"albumId\\",\\n              \\"userId\\" = COALESCE(EXCLUDED.\\"userId\\", activity.\\"userId\\"),\\n              \\"createdAt\\" = EXCLUDED.\\"createdAt\\";\\n      END IF;\\n    END\\n  $$;"}'::jsonb);`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_album_asset_sync_activity', '{"type":"function","name":"album_asset_sync_activity","sql":"CREATE OR REPLACE FUNCTION album_asset_sync_activity()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    DECLARE\\n      v_row RECORD;\\n    BEGIN\\n      IF TG_OP = ''INSERT'' THEN\\n        FOR v_row IN\\n          SELECT DISTINCT \\"aggregationId\\", \\"albumId\\", \\"createdBy\\"\\n          FROM inserted_rows\\n          WHERE \\"aggregationId\\" IS NOT NULL\\n        LOOP\\n          PERFORM album_asset_sync_activity_apply(\\n            v_row.\\"aggregationId\\",\\n            v_row.\\"albumId\\",\\n            v_row.\\"createdBy\\"\\n          );\\n        END LOOP;\\n      ELSIF TG_OP = ''DELETE'' THEN\\n        FOR v_row IN\\n          SELECT DISTINCT \\"aggregationId\\", \\"albumId\\", \\"createdBy\\"\\n          FROM deleted_rows\\n          WHERE \\"aggregationId\\" IS NOT NULL\\n        LOOP\\n          PERFORM album_asset_sync_activity_apply(\\n            v_row.\\"aggregationId\\",\\n            v_row.\\"albumId\\",\\n            v_row.\\"createdBy\\"\\n          );\\n        END LOOP;\\n      END IF;\\n\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_album_asset_sync_activity_delete', '{"type":"trigger","name":"album_asset_sync_activity_delete","sql":"CREATE OR REPLACE TRIGGER \\"album_asset_sync_activity_delete\\"\\n  AFTER DELETE ON \\"album_asset\\"\\n  REFERENCING OLD TABLE AS \\"deleted_rows\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() <= 1)\\n  EXECUTE FUNCTION album_asset_sync_activity();"}'::jsonb);`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_album_asset_sync_activity_insert', '{"type":"trigger","name":"album_asset_sync_activity_insert","sql":"CREATE OR REPLACE TRIGGER \\"album_asset_sync_activity_insert\\"\\n  AFTER INSERT ON \\"album_asset\\"\\n  REFERENCING NEW TABLE AS \\"inserted_rows\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() <= 1)\\n  EXECUTE FUNCTION album_asset_sync_activity();"}'::jsonb);`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_album_asset_generate_aggregation_id', '{"type":"trigger","name":"album_asset_generate_aggregation_id","sql":"CREATE OR REPLACE TRIGGER \\"album_asset_generate_aggregation_id\\"\\n  BEFORE INSERT ON \\"album_asset\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION album_asset_generate_aggregation_id();"}'::jsonb);`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "album_asset_sync_activity_delete" ON "album_asset";`.execute(db);
  await sql`DROP TRIGGER "album_asset_sync_activity_insert" ON "album_asset";`.execute(db);
  await sql`DROP TRIGGER "album_asset_generate_aggregation_id" ON "album_asset";`.execute(db);
  await sql`DROP INDEX "album_asset_createdBy_idx";`.execute(db);
  await sql`DROP INDEX "album_asset_aggregationId_idx";`.execute(db);
  await sql`ALTER TABLE "activity" DROP CONSTRAINT "activity_aggregationId_uq";`.execute(db);
  await sql`ALTER TABLE "activity" DROP CONSTRAINT "activity_check";`.execute(db);
  await sql`ALTER TABLE "album_asset" DROP CONSTRAINT "album_asset_createdBy_fkey";`.execute(db);
  await sql`ALTER TABLE "activity" ADD CONSTRAINT "activity_like_check" CHECK (((((comment IS NULL) AND ("isLiked" = true)) OR ((comment IS NOT NULL) AND ("isLiked" = false)))));`.execute(
    db,
  );
  await sql`ALTER TABLE "activity" DROP COLUMN "aggregationId";`.execute(db);
  await sql`ALTER TABLE "activity" DROP COLUMN "assetIds";`.execute(db);
  await sql`ALTER TABLE "album_asset" DROP COLUMN "createdBy";`.execute(db);
  await sql`ALTER TABLE "album_asset" DROP COLUMN "aggregationId";`.execute(db);
  await sql`DROP FUNCTION album_asset_generate_aggregation_id;`.execute(db);
  await sql`DROP FUNCTION album_asset_sync_activity_apply;`.execute(db);
  await sql`DROP FUNCTION album_asset_sync_activity;`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_album_asset_generate_aggregation_id';`.execute(
    db,
  );
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_album_asset_sync_activity_apply';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_album_asset_sync_activity';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_album_asset_sync_activity_delete';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_album_asset_sync_activity_insert';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_album_asset_generate_aggregation_id';`.execute(
    db,
  );
}
