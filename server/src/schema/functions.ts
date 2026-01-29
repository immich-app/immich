import { registerFunction } from 'src/sql-tools';

export const immich_uuid_v7 = registerFunction({
  name: 'immich_uuid_v7',
  arguments: ['p_timestamp timestamp with time zone default clock_timestamp()'],
  returnType: 'uuid',
  language: 'SQL',
  behavior: 'volatile',
  body: `
    SELECT encode(
      set_bit(
        set_bit(
          overlay(uuid_send(gen_random_uuid())
                  placing substring(int8send(floor(extract(epoch from p_timestamp) * 1000)::bigint) from 3)
                  from 1 for 6
          ),
          52, 1
        ),
        53, 1
      ),
      'hex')::uuid;
`,
});

export const album_user_after_insert = registerFunction({
  name: 'album_user_after_insert',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      UPDATE album SET "updatedAt" = clock_timestamp(), "updateId" = immich_uuid_v7(clock_timestamp())
      WHERE "id" IN (SELECT DISTINCT "albumId" FROM inserted_rows);
      RETURN NULL;
    END`,
});

export const updated_at = registerFunction({
  name: 'updated_at',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    DECLARE
        clock_timestamp TIMESTAMP := clock_timestamp();
    BEGIN
        new."updatedAt" = clock_timestamp;
        new."updateId" = immich_uuid_v7(clock_timestamp);
        return new;
    END;`,
});

export const f_concat_ws = registerFunction({
  name: 'f_concat_ws',
  arguments: ['text', 'text[]'],
  returnType: 'text',
  language: 'SQL',
  parallel: 'safe',
  behavior: 'immutable',
  body: `SELECT array_to_string($2, $1)`,
});

export const f_unaccent = registerFunction({
  name: 'f_unaccent',
  arguments: ['text'],
  returnType: 'text',
  language: 'SQL',
  parallel: 'safe',
  strict: true,
  behavior: 'immutable',
  return: `unaccent('unaccent', $1)`,
});

export const ll_to_earth_public = registerFunction({
  name: 'll_to_earth_public',
  arguments: ['latitude double precision', 'longitude double precision'],
  returnType: 'public.earth',
  language: 'SQL',
  parallel: 'safe',
  strict: true,
  behavior: 'immutable',
  body: `SELECT public.cube(public.cube(public.cube(public.earth()*cos(radians(latitude))*cos(radians(longitude))),public.earth()*cos(radians(latitude))*sin(radians(longitude))),public.earth()*sin(radians(latitude)))::public.earth`,
});

export const user_delete_audit = registerFunction({
  name: 'user_delete_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      INSERT INTO user_audit ("userId")
      SELECT "id"
      FROM OLD;
      RETURN NULL;
    END`,
});

export const partner_delete_audit = registerFunction({
  name: 'partner_delete_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      INSERT INTO partner_audit ("sharedById", "sharedWithId")
      SELECT "sharedById", "sharedWithId"
      FROM OLD;
      RETURN NULL;
    END`,
});

export const asset_delete_audit = registerFunction({
  name: 'asset_delete_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      INSERT INTO asset_audit ("assetId", "ownerId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END`,
});

export const album_delete_audit = registerFunction({
  name: 'album_delete_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      INSERT INTO album_audit ("albumId", "userId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END`,
});

export const album_asset_generate_aggregation_id = registerFunction({
  name: 'album_asset_generate_aggregation_id',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
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
    END`,
});

export const album_asset_sync_activity_apply = registerFunction({
  name: 'album_asset_sync_activity_apply',
  arguments: ['p_aggregation_id uuid', 'p_album_id uuid', 'p_user_id uuid'],
  returnType: 'void',
  language: 'PLPGSQL',
  body: `
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
    END`,
});

export const album_asset_sync_activity = registerFunction({
  name: 'album_asset_sync_activity',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
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
    END`,
});

export const album_asset_delete_audit = registerFunction({
  name: 'album_asset_delete_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      INSERT INTO album_asset_audit ("albumId", "assetId")
      SELECT "albumId", "assetId" FROM OLD
      WHERE "albumId" IN (SELECT "id" FROM album WHERE "id" IN (SELECT "albumId" FROM OLD));
      RETURN NULL;
    END`,
});

export const album_user_delete_audit = registerFunction({
  name: 'album_user_delete_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      INSERT INTO album_audit ("albumId", "userId")
      SELECT "albumId", "userId"
      FROM OLD;

      IF pg_trigger_depth() = 1 THEN
        INSERT INTO album_user_audit ("albumId", "userId")
        SELECT "albumId", "userId"
        FROM OLD;
      END IF;

      RETURN NULL;
    END`,
});

export const memory_delete_audit = registerFunction({
  name: 'memory_delete_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      INSERT INTO memory_audit ("memoryId", "userId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END`,
});

export const memory_asset_delete_audit = registerFunction({
  name: 'memory_asset_delete_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      INSERT INTO memory_asset_audit ("memoryId", "assetId")
      SELECT "memoriesId", "assetId" FROM OLD
      WHERE "memoriesId" IN (SELECT "id" FROM memory WHERE "id" IN (SELECT "memoriesId" FROM OLD));
      RETURN NULL;
    END`,
});

export const stack_delete_audit = registerFunction({
  name: 'stack_delete_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      INSERT INTO stack_audit ("stackId", "userId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END`,
});

export const person_delete_audit = registerFunction({
  name: 'person_delete_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      INSERT INTO person_audit ("personId", "ownerId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END`,
});

export const user_metadata_audit = registerFunction({
  name: 'user_metadata_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      INSERT INTO user_metadata_audit ("userId", "key")
      SELECT "userId", "key"
      FROM OLD;
      RETURN NULL;
    END`,
});

export const asset_metadata_audit = registerFunction({
  name: 'asset_metadata_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      INSERT INTO asset_metadata_audit ("assetId", "key")
      SELECT "assetId", "key"
      FROM OLD;
      RETURN NULL;
    END`,
});

export const asset_face_audit = registerFunction({
  name: 'asset_face_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      INSERT INTO asset_face_audit ("assetFaceId", "assetId")
      SELECT "id", "assetId"
      FROM OLD;
      RETURN NULL;
    END`,
});

export const asset_edit_insert = registerFunction({
  name: 'asset_edit_insert',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      UPDATE asset
      SET "isEdited" = true
      FROM inserted_edit
      WHERE asset.id = inserted_edit."assetId" AND NOT asset."isEdited";
      RETURN NULL;
    END
  `,
});

export const asset_edit_delete = registerFunction({
  name: 'asset_edit_delete',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      UPDATE asset
      SET "isEdited" = false
      FROM deleted_edit
      WHERE asset.id = deleted_edit."assetId" AND asset."isEdited" 
        AND NOT EXISTS (SELECT FROM asset_edit edit WHERE edit."assetId" = asset.id);
      RETURN NULL;
    END
  `,
});
