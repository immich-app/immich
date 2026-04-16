import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "oauth_link_token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" bytea NOT NULL, "oauthSub" character varying NOT NULL, "userEmail" character varying NOT NULL, "expiresAt" timestamp with time zone NOT NULL, "createdAt" timestamp with time zone NOT NULL DEFAULT now());`.execute(
    db,
  );
  await sql`ALTER TABLE "oauth_link_token" ADD CONSTRAINT "PK_oauth_link_token_id" PRIMARY KEY ("id");`.execute(db);
  await sql`CREATE INDEX "IDX_oauth_link_token_token" ON "oauth_link_token" ("token")`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "IDX_oauth_link_token_token";`.execute(db);
  await sql`ALTER TABLE "oauth_link_token" DROP CONSTRAINT "PK_oauth_link_token_id";`.execute(db);
  await sql`DROP TABLE "oauth_link_token";`.execute(db);
}
