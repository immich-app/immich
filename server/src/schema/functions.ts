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
