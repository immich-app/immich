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
  synchronize: false,
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
  synchronize: false,
});

export const f_concat_ws = registerFunction({
  name: 'f_concat_ws',
  arguments: ['text', 'text[]'],
  returnType: 'text',
  language: 'SQL',
  parallel: 'safe',
  behavior: 'immutable',
  body: `SELECT array_to_string($2, $1)`,
  synchronize: false,
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
  synchronize: false,
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
  synchronize: false,
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
  synchronize: false,
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
  synchronize: false,
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
  synchronize: false,
});
