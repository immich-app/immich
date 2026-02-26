import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "api_key" ALTER COLUMN "key" TYPE bytea USING decode("key", 'base64');`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "token" TYPE bytea USING decode("token", 'base64');`.execute(db);
  await sql`CREATE INDEX "api_key_key_idx" ON "api_key" ("key");`.execute(db);
  await sql`CREATE INDEX "session_token_idx" ON "session" ("token");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "api_key_key_idx";`.execute(db);
  await sql`DROP INDEX "session_token_idx";`.execute(db);
  await sql`ALTER TABLE "api_key" ALTER COLUMN "key" TYPE character varying USING encode("key", 'base64');`.execute(db);
  await sql`ALTER TABLE "session" ALTER COLUMN "token" TYPE character varying USING encode("token", 'base64');`.execute(db);
}
