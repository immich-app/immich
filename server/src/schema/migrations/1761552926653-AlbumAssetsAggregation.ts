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
  await sql`CREATE OR REPLACE FUNCTION album_asset_sync_activity_apply(p_aggregation_id uuid, p_album_id uuid, p_user_id uuid)
  RETURNS void
  LANGUAGE PLPGSQL
  AS $$
              MIN("albumsId")
      v_created_at TIMESTAMP WITH TIME ZONE;
  v_album_id uuid := p_album_id;
  v_user_id uuid := p_user_id;
    BEGIN
            IF v_album_id IS NULL THEN
              SELECT "albumsId" INTO v_album_id
              FROM album_asset
              WHERE "aggregationId" = p_aggregation_id
              ORDER BY "createdAt" ASC
              LIMIT 1;
            END IF;

      SELECT
        ARRAY(
          SELECT aa."assetsId"
          FROM album_asset aa
        v_album_id_from_table
          ORDER BY aa."createdAt" ASC
        )::uuid[],
        MIN("createdAt")
      INTO v_asset_ids, v_created_at
      WHERE "aggregationId" = p_aggregation_id;

      IF v_album_id IS NULL THEN
        SELECT "albumsId" INTO v_album_id
        FROM album_asset
        WHERE "aggregationId" = p_aggregation_id
        ORDER BY "createdAt" ASC
        LIMIT 1;
      END IF;

      IF v_asset_ids IS NULL OR array_length(v_asset_ids, 1) IS NULL THEN
        DELETE FROM activity WHERE "aggregationId" = p_aggregation_id;
        RETURN;
      END IF;

      IF v_user_id IS NULL THEN
        SELECT "userId" INTO v_user_id
        FROM activity
        WHERE "aggregationId" = p_aggregation_id
        LIMIT 1;
      END IF;

      IF v_user_id IS NULL THEN
        SELECT "createdBy" INTO v_user_id
        FROM album_asset
        WHERE "aggregationId" = p_aggregation_id
        ORDER BY "createdAt" ASC
        LIMIT 1;
      END IF;

      IF v_user_id IS NULL THEN
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
          SELECT DISTINCT "aggregationId", "albumsId", "createdBy"
          FROM inserted_rows
          WHERE "aggregationId" IS NOT NULL
        LOOP
          PERFORM album_asset_sync_activity_apply(
            v_row."aggregationId",
            v_row."albumsId",
            v_row."createdBy"
          );
        END LOOP;
      ELSIF TG_OP = 'DELETE' THEN
        FOR v_row IN
          SELECT DISTINCT "aggregationId", "albumsId", "createdBy"
          FROM deleted_rows
          WHERE "aggregationId" IS NOT NULL
        LOOP
          PERFORM album_asset_sync_activity_apply(
            v_row."aggregationId",
            v_row."albumsId",
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
  await sql`DROP TRIGGER IF EXISTS "album_asset_sync_activity" ON "album_asset";`.execute(db);
  await sql`DROP TRIGGER IF EXISTS "album_asset_sync_activity_delete" ON "album_asset";`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_asset_sync_activity"
  AFTER INSERT ON "album_asset"
  REFERENCING NEW TABLE AS "inserted_rows"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() <= 1)
  EXECUTE FUNCTION album_asset_sync_activity();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_asset_sync_activity_delete"
  AFTER DELETE ON "album_asset"
  REFERENCING OLD TABLE AS "deleted_rows"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() <= 1)
  EXECUTE FUNCTION album_asset_sync_activity();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_asset_generate_aggregation_id"
  BEFORE INSERT ON "album_asset"
  FOR EACH ROW
  EXECUTE FUNCTION album_asset_generate_aggregation_id();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_album_asset_generate_aggregation_id', '{"type":"function","name":"album_asset_generate_aggregation_id","sql":"CREATE OR REPLACE FUNCTION album_asset_generate_aggregation_id()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    DECLARE\\n      v_now TIMESTAMP WITH TIME ZONE := clock_timestamp();\\n      v_existing uuid;\\n    BEGIN\\n      IF NEW.\\"createdAt\\" IS NULL THEN\\n        NEW.\\"createdAt\\" = v_now;\\n      END IF;\\n\\n      SELECT \\"aggregationId\\"\\n        INTO v_existing\\n        FROM album_asset\\n        WHERE \\"albumsId\\" = NEW.\\"albumsId\\"\\n          AND \\"createdBy\\" = NEW.\\"createdBy\\"\\n          AND \\"createdAt\\" >= v_now - INTERVAL ''60 minutes''\\n        ORDER BY \\"createdAt\\" DESC\\n        LIMIT 1;\\n\\n      IF v_existing IS NOT NULL THEN\\n        NEW.\\"aggregationId\\" = v_existing;\\n      ELSE\\n        NEW.\\"aggregationId\\" = immich_uuid_v7(v_now);\\n      END IF;\\n\\n      RETURN NEW;\\n    END\\n  $$;"}'::jsonb);`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_album_asset_sync_activity_apply', '{"type":"function","name":"album_asset_sync_activity_apply","sql":"CREATE OR REPLACE FUNCTION album_asset_sync_activity_apply(p_aggregation_id uuid, p_album_id uuid, p_user_id uuid)\\n  RETURNS void\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    DECLARE\\n      v_asset_ids uuid[];\\n      v_created_at TIMESTAMP WITH TIME ZONE;\\n      v_album_id uuid := p_album_id;\\n      v_user_id uuid := p_user_id;\\n      v_album_id_from_table uuid;\\n    BEGIN\\n      IF p_aggregation_id IS NULL THEN\\n        RETURN;\\n      END IF;\\n\\n      SELECT\\n        ARRAY(\\n          SELECT aa.\\"assetsId\\"\\n          FROM album_asset aa\\n          WHERE aa.\\"aggregationId\\" = p_aggregation_id\\n          ORDER BY aa.\\"createdAt\\" ASC\\n        )::uuid[],\\n        MIN(\\"createdAt\\"),\\n        MIN(\\"albumsId\\")\\n      INTO v_asset_ids, v_created_at, v_album_id_from_table\\n      FROM album_asset\\n      WHERE \\"aggregationId\\" = p_aggregation_id;\\n\\n      IF v_album_id_from_table IS NOT NULL THEN\\n        v_album_id := v_album_id_from_table;\\n      END IF;\\n\\n      IF v_asset_ids IS NULL OR array_length(v_asset_ids, 1) IS NULL THEN\\n        DELETE FROM activity WHERE \\"aggregationId\\" = p_aggregation_id;\\n        RETURN;\\n      END IF;\\n\\n      IF v_user_id IS NULL THEN\\n        SELECT \\"userId\\" INTO v_user_id\\n        FROM activity\\n        WHERE \\"aggregationId\\" = p_aggregation_id\\n        LIMIT 1;\\n      END IF;\\n\\n      IF v_user_id IS NULL THEN\\n        SELECT \\"createdBy\\" INTO v_user_id\\n        FROM album_asset\\n        WHERE \\"aggregationId\\" = p_aggregation_id\\n        ORDER BY \\"createdAt\\" ASC\\n        LIMIT 1;\\n      END IF;\\n\\n      IF v_user_id IS NULL THEN\\n        RETURN;\\n      END IF;\\n\\n      UPDATE activity\\n      SET\\n        \\"assetIds\\" = v_asset_ids,\\n        \\"albumId\\" = v_album_id,\\n        \\"userId\\" = COALESCE(v_user_id, activity.\\"userId\\"),\\n        \\"createdAt\\" = v_created_at\\n      WHERE \\"aggregationId\\" = p_aggregation_id;\\n\\n      IF NOT FOUND THEN\\n        INSERT INTO activity (\\n          \\"id\\",\\n          \\"albumId\\",\\n          \\"userId\\",\\n          \\"assetId\\",\\n          \\"comment\\",\\n          \\"isLiked\\",\\n          \\"aggregationId\\",\\n          \\"assetIds\\",\\n          \\"createdAt\\"\\n        )\\n        VALUES (\\n          p_aggregation_id,\\n          v_album_id,\\n          v_user_id,\\n          NULL,\\n          NULL,\\n          FALSE,\\n          p_aggregation_id,\\n          v_asset_ids,\\n          v_created_at\\n        )\\n        ON CONFLICT (\\"aggregationId\\")\\n        DO UPDATE\\n          SET \\"assetIds\\" = EXCLUDED.\\"assetIds\\",\\n              \\"albumId\\" = EXCLUDED.\\"albumId\\",\\n              \\"userId\\" = COALESCE(EXCLUDED.\\"userId\\", activity.\\"userId\\"),\\n              \\"createdAt\\" = EXCLUDED.\\"createdAt\\";\\n      END IF;\\n    END\\n  $$;"}'::jsonb);`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_album_asset_sync_activity', '{"type":"function","name":"album_asset_sync_activity","sql":"CREATE OR REPLACE FUNCTION album_asset_sync_activity()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    DECLARE\\n      v_row RECORD;\\n    BEGIN\\n      IF TG_OP = ''INSERT'' THEN\\n        FOR v_row IN\\n          SELECT DISTINCT \\"aggregationId\\", \\"albumsId\\", \\"createdBy\\"\\n          FROM inserted_rows\\n          WHERE \\"aggregationId\\" IS NOT NULL\\n        LOOP\\n          PERFORM album_asset_sync_activity_apply(\\n            v_row.\\"aggregationId\\",\\n            v_row.\\"albumsId\\",\\n            v_row.\\"createdBy\\"\\n          );\\n        END LOOP;\\n      ELSIF TG_OP = ''DELETE'' THEN\\n        FOR v_row IN\\n          SELECT DISTINCT \\"aggregationId\\", \\"albumsId\\", \\"createdBy\\"\\n          FROM deleted_rows\\n          WHERE \\"aggregationId\\" IS NOT NULL\\n        LOOP\\n          PERFORM album_asset_sync_activity_apply(\\n            v_row.\\"aggregationId\\",\\n            v_row.\\"albumsId\\",\\n            v_row.\\"createdBy\\"\\n          );\\n        END LOOP;\\n      END IF;\\n\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_album_asset_sync_activity', '{"type":"trigger","name":"album_asset_sync_activity","sql":"CREATE OR REPLACE TRIGGER \\"album_asset_sync_activity\\"\\n  AFTER INSERT ON \\"album_asset\\"\\n  REFERENCING NEW TABLE AS \\"inserted_rows\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() <= 1)\\n  EXECUTE FUNCTION album_asset_sync_activity();"}'::jsonb);`.execute(
    db,
  );
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_album_asset_generate_aggregation_id', '{"type":"trigger","name":"album_asset_generate_aggregation_id","sql":"CREATE OR REPLACE TRIGGER \\"album_asset_generate_aggregation_id\\"\\n  BEFORE INSERT ON \\"album_asset\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION album_asset_generate_aggregation_id();"}'::jsonb);`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "album_asset_sync_activity" ON "album_asset";`.execute(db);
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
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_album_asset_sync_activity';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_album_asset_generate_aggregation_id';`.execute(
    db,
  );
}
