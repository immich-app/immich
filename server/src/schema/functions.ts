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
      UPDATE albums SET "updatedAt" = clock_timestamp(), "updateId" = immich_uuid_v7(clock_timestamp())
      WHERE "id" IN (SELECT DISTINCT "albumsId" FROM inserted_rows);
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

export const users_delete_audit = registerFunction({
  name: 'users_delete_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      INSERT INTO users_audit ("userId")
      SELECT "id"
      FROM OLD;
      RETURN NULL;
    END`,
});

export const partners_delete_audit = registerFunction({
  name: 'partners_delete_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      INSERT INTO partners_audit ("sharedById", "sharedWithId")
      SELECT "sharedById", "sharedWithId"
      FROM OLD;
      RETURN NULL;
    END`,
});

export const assets_delete_audit = registerFunction({
  name: 'assets_delete_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      INSERT INTO assets_audit ("assetId", "ownerId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END`,
});

export const albums_delete_audit = registerFunction({
  name: 'albums_delete_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      INSERT INTO albums_audit ("albumId", "userId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END`,
});

export const album_assets_delete_audit = registerFunction({
  name: 'album_assets_delete_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      INSERT INTO album_assets_audit ("albumId", "assetId")
      SELECT "albumsId", "assetsId" FROM OLD
      WHERE "albumsId" IN (SELECT "id" FROM albums WHERE "id" IN (SELECT "albumsId" FROM OLD));
      RETURN NULL;
    END`,
});

export const album_users_delete_audit = registerFunction({
  name: 'album_users_delete_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      INSERT INTO albums_audit ("albumId", "userId")
      SELECT "albumsId", "usersId"
      FROM OLD;

      IF pg_trigger_depth() = 1 THEN
        INSERT INTO album_users_audit ("albumId", "userId")
        SELECT "albumsId", "usersId"
        FROM OLD;
      END IF;

      RETURN NULL;
    END`,
});

export const memories_delete_audit = registerFunction({
  name: 'memories_delete_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      INSERT INTO memories_audit ("memoryId", "userId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END`,
});

export const memory_assets_delete_audit = registerFunction({
  name: 'memory_assets_delete_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      INSERT INTO memory_assets_audit ("memoryId", "assetId")
      SELECT "memoriesId", "assetsId" FROM OLD
      WHERE "memoriesId" IN (SELECT "id" FROM memories WHERE "id" IN (SELECT "memoriesId" FROM OLD));
      RETURN NULL;
    END`,
});

export const stacks_delete_audit = registerFunction({
  name: 'stacks_delete_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      INSERT INTO stacks_audit ("stackId", "userId")
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
