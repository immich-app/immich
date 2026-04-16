import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE "oauth_link_token" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "token" bytea NOT NULL,
      "oauthSub" varchar NOT NULL,
      "userEmail" varchar NOT NULL,
      "expiresAt" timestamp with time zone NOT NULL,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now()
    );
  `.execute(db);

  await sql`ALTER TABLE "oauth_link_token" ADD CONSTRAINT "oauth_link_token_pkey" PRIMARY KEY ("id");`.execute(db);
  await sql`CREATE INDEX "oauth_link_token_token_idx" ON "oauth_link_token" ("token")`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE IF EXISTS "oauth_link_token";`.execute(db);
}
