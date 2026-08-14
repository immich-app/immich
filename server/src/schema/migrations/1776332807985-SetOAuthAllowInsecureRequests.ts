import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE system_metadata
    SET value = jsonb_set(
      value,
      '{oauth,allowInsecureRequests}',
      'true'::jsonb
    )
    WHERE key = 'system-config'
    AND value->'oauth'->>'issuerUrl' LIKE 'http://%'
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE system_metadata
    SET value = value #- '{oauth,allowInsecureRequests}'
    WHERE key = 'system-config'
  `.execute(db);
}
