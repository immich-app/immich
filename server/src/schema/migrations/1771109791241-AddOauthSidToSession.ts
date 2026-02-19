import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "session" ADD "oauthSid" character varying;`.execute(db);
  await sql`CREATE INDEX "session_oauthSid_idx" ON "session" ("oauthSid");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "session_oauthSid_idx";`.execute(db);
  await sql`ALTER TABLE "session" DROP COLUMN "oauthSid";`.execute(db);
}
