import { Kysely, sql } from 'kysely';
import { UserMetadataKey } from 'src/enum';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`INSERT INTO user_metadata SELECT id, ${UserMetadataKey.ONBOARDING}, '{"isOnboarded": true}' FROM users
    ON CONFLICT ("userId", key) DO UPDATE SET value = EXCLUDED.value
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DELETE FROM user_metadata WHERE key = ${UserMetadataKey.ONBOARDING}`.execute(db);
}
