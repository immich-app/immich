import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "passkey" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "name" character varying,
  "credentialId" character varying NOT NULL,
  "publicKey" bytea NOT NULL,
  "counter" bigint NOT NULL DEFAULT 0,
  "transports" character varying[] NOT NULL,
  "backedUp" boolean NOT NULL DEFAULT false,
  "deviceType" character varying NOT NULL,
  "userId" uuid NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "usedAt" timestamp with time zone,
  "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  CONSTRAINT "passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "passkey_credentialId_uq" UNIQUE ("credentialId"),
  CONSTRAINT "passkey_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "passkey_userId_idx" ON "passkey" ("userId");`.execute(db);
  await sql`CREATE TABLE "auth_challenge" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "type" character varying NOT NULL,
  "challenge" character varying NOT NULL,
  "userId" uuid,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "expiresAt" timestamp with time zone NOT NULL,
  CONSTRAINT "auth_challenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "auth_challenge_challenge_uq" UNIQUE ("challenge"),
  CONSTRAINT "auth_challenge_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "auth_challenge_userId_idx" ON "auth_challenge" ("userId");`.execute(db);
  await sql`CREATE INDEX "passkey_updateId_idx" ON "passkey" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "passkey_updatedAt"
  BEFORE UPDATE ON "passkey"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_passkey_updatedAt', '{"type":"trigger","name":"passkey_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"passkey_updatedAt\\"\\n  BEFORE UPDATE ON \\"passkey\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "passkey_updatedAt" ON "passkey";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_passkey_updatedAt';`.execute(db);
  await sql`DROP TABLE "passkey";`.execute(db);
  await sql`DROP TABLE "auth_challenge";`.execute(db);
}
