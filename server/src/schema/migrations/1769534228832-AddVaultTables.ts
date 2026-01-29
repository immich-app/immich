import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create admin_recovery_key table
  await sql`CREATE TABLE "admin_recovery_key" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "publicKey" text NOT NULL,
    "keyId" character varying NOT NULL,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "admin_recovery_key_keyId_uq" UNIQUE ("keyId"),
    CONSTRAINT "admin_recovery_key_pkey" PRIMARY KEY ("id")
  );`.execute(db);

  // Create user_vault table
  await sql`CREATE TABLE "user_vault" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "userId" uuid NOT NULL,
    "kdfSalt" character varying NOT NULL,
    "kdfParams" jsonb NOT NULL,
    "encryptedVaultKey" character varying NOT NULL,
    "adminEncryptedVaultKey" character varying,
    "vaultKeyHash" character varying NOT NULL,
    "version" integer NOT NULL DEFAULT 1,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "user_vault_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_vault_userId_uq" UNIQUE ("userId"),
    CONSTRAINT "user_vault_userId_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
  );`.execute(db);

  // Create asset_encryption table
  await sql`CREATE TABLE "asset_encryption" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "assetId" uuid NOT NULL,
    "wrappedDek" character varying NOT NULL,
    "fileIv" character varying NOT NULL,
    "authTag" character varying NOT NULL,
    "algorithm" character varying NOT NULL DEFAULT 'aes-256-gcm',
    "vaultVersion" integer NOT NULL DEFAULT 1,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "asset_encryption_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "asset_encryption_assetId_vaultVersion_uq" UNIQUE ("assetId", "vaultVersion"),
    CONSTRAINT "asset_encryption_assetId_fk" FOREIGN KEY ("assetId") REFERENCES "asset"("id") ON DELETE CASCADE
  );`.execute(db);

  // Add columns to existing tables
  await sql`ALTER TABLE "asset_job_status" ADD "encryptedAt" timestamp with time zone;`.execute(db);
  await sql`ALTER TABLE "session" ADD "encryptedVaultKeyCache" character varying;`.execute(db);
  await sql`ALTER TABLE "session" ADD "vaultKeyExpiresAt" timestamp with time zone;`.execute(db);

  // Create indexes
  await sql`CREATE INDEX "asset_encryption_assetId_idx" ON "asset_encryption" ("assetId");`.execute(db);
  await sql`CREATE INDEX "user_vault_userId_idx" ON "user_vault" ("userId");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop columns from existing tables
  await sql`ALTER TABLE "session" DROP COLUMN IF EXISTS "encryptedVaultKeyCache";`.execute(db);
  await sql`ALTER TABLE "session" DROP COLUMN IF EXISTS "vaultKeyExpiresAt";`.execute(db);
  await sql`ALTER TABLE "asset_job_status" DROP COLUMN IF EXISTS "encryptedAt";`.execute(db);

  // Drop tables
  await sql`DROP TABLE IF EXISTS "asset_encryption";`.execute(db);
  await sql`DROP TABLE IF EXISTS "user_vault";`.execute(db);
  await sql`DROP TABLE IF EXISTS "admin_recovery_key";`.execute(db);
}
