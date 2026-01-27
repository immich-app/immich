import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "asset_storage_backend_idx";`.execute(db);
  await sql`DROP INDEX "UQ_asset_encryption_assetId_vaultVersion";`.execute(db);
  await sql`DROP INDEX "asset_file_storage_backend_idx";`.execute(db);
  await sql`CREATE TABLE "admin_recovery_key" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "publicKey" text NOT NULL,
  "keyId" character varying NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "admin_recovery_key_keyId_uq" UNIQUE ("keyId"),
  CONSTRAINT "admin_recovery_key_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`ALTER TABLE "asset_encryption" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();`.execute(db);
  await sql`ALTER TABLE "user_vault" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();`.execute(db);
  await sql`ALTER TABLE "asset_job_status" ADD "encryptedAt" timestamp with time zone;`.execute(db);
  await sql`ALTER TABLE "session" ADD "encryptedVaultKeyCache" character varying;`.execute(db);
  await sql`ALTER TABLE "session" ADD "vaultKeyExpiresAt" timestamp with time zone;`.execute(db);
  await sql`ALTER TABLE "user_vault" ADD "kdfSalt" character varying NOT NULL;`.execute(db);
  await sql`ALTER TABLE "user_vault" ADD "kdfParams" jsonb NOT NULL;`.execute(db);
  await sql`ALTER TABLE "user_vault" ADD "encryptedVaultKey" character varying NOT NULL;`.execute(db);
  await sql`ALTER TABLE "user_vault" ADD "adminEncryptedVaultKey" character varying;`.execute(db);
  await sql`ALTER TABLE "user_vault" ADD "vaultKeyHash" character varying NOT NULL;`.execute(db);
  await sql`ALTER TABLE "user_vault" ADD "version" integer NOT NULL DEFAULT 1;`.execute(db);
  await sql`ALTER TABLE "user_vault" ADD "createdAt" timestamp with time zone NOT NULL DEFAULT now();`.execute(db);
  await sql`ALTER TABLE "user_vault" ADD "updatedAt" timestamp with time zone NOT NULL DEFAULT now();`.execute(db);
  await sql`ALTER TABLE "asset_encryption" ADD CONSTRAINT "asset_encryption_assetId_vaultVersion_uq" UNIQUE ("assetId", "vaultVersion");`.execute(db);
  await sql`ALTER TABLE "user_vault" ADD CONSTRAINT "user_vault_userId_uq" UNIQUE ("userId");`.execute(db);
  await sql`CREATE INDEX "asset_encryption_assetId_idx" ON "asset_encryption" ("assetId");`.execute(db);
  await sql`CREATE INDEX "user_vault_userId_idx" ON "user_vault" ("userId");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "asset_encryption_assetId_idx";`.execute(db);
  await sql`DROP INDEX "user_vault_userId_idx";`.execute(db);
  await sql`ALTER TABLE "asset_encryption" DROP CONSTRAINT "asset_encryption_assetId_vaultVersion_uq";`.execute(db);
  await sql`ALTER TABLE "user_vault" DROP CONSTRAINT "user_vault_userId_uq";`.execute(db);
  await sql`ALTER TABLE "asset_encryption" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();`.execute(db);
  await sql`ALTER TABLE "user_vault" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();`.execute(db);
  await sql`CREATE INDEX "asset_storage_backend_idx" ON "asset" ("storageBackend") WHERE ("storageBackend" = 's3'::storage_backend_enum);`.execute(db);
  await sql`CREATE INDEX "asset_file_storage_backend_idx" ON "asset_file" ("storageBackend") WHERE ("storageBackend" = 's3'::storage_backend_enum);`.execute(db);
  await sql`CREATE UNIQUE INDEX "UQ_asset_encryption_assetId_vaultVersion" ON "asset_encryption" ("assetId", "vaultVersion");`.execute(db);
  await sql`ALTER TABLE "user_vault" DROP COLUMN "kdfSalt";`.execute(db);
  await sql`ALTER TABLE "user_vault" DROP COLUMN "kdfParams";`.execute(db);
  await sql`ALTER TABLE "user_vault" DROP COLUMN "encryptedVaultKey";`.execute(db);
  await sql`ALTER TABLE "user_vault" DROP COLUMN "adminEncryptedVaultKey";`.execute(db);
  await sql`ALTER TABLE "user_vault" DROP COLUMN "vaultKeyHash";`.execute(db);
  await sql`ALTER TABLE "user_vault" DROP COLUMN "version";`.execute(db);
  await sql`ALTER TABLE "user_vault" DROP COLUMN "createdAt";`.execute(db);
  await sql`ALTER TABLE "user_vault" DROP COLUMN "updatedAt";`.execute(db);
  await sql`ALTER TABLE "session" DROP COLUMN "encryptedVaultKeyCache";`.execute(db);
  await sql`ALTER TABLE "session" DROP COLUMN "vaultKeyExpiresAt";`.execute(db);
  await sql`ALTER TABLE "asset_job_status" DROP COLUMN "encryptedAt";`.execute(db);
  await sql`DROP TABLE "admin_recovery_key";`.execute(db);
}
