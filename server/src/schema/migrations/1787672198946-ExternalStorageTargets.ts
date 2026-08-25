import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "storage_target" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "name" character varying NOT NULL,
  "kind" character varying NOT NULL,
  "config" jsonb NOT NULL,
  "secret" jsonb NOT NULL,
  "isEnabled" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  CONSTRAINT "storage_target_name_uq" UNIQUE ("name"),
  CONSTRAINT "storage_target_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "storage_target_updateId_idx" ON "storage_target" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "storage_target_updatedAt"
  BEFORE UPDATE ON "storage_target"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE TABLE "storage_target_transfer" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "targetId" uuid NOT NULL,
  "ownerId" uuid NOT NULL,
  "direction" character varying NOT NULL,
  "status" character varying NOT NULL,
  "scope" jsonb NOT NULL,
  "totalCount" integer NOT NULL DEFAULT 0,
  "completedCount" integer NOT NULL DEFAULT 0,
  "failedCount" integer NOT NULL DEFAULT 0,
  "startedAt" timestamp with time zone,
  "finishedAt" timestamp with time zone,
  "error" character varying,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  CONSTRAINT "storage_target_transfer_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "storage_target" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "storage_target_transfer_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "storage_target_transfer_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "storage_target_transfer_targetId_idx" ON "storage_target_transfer" ("targetId");`.execute(db);
  await sql`CREATE INDEX "storage_target_transfer_ownerId_idx" ON "storage_target_transfer" ("ownerId");`.execute(db);
  await sql`CREATE INDEX "storage_target_transfer_updateId_idx" ON "storage_target_transfer" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "storage_target_transfer_updatedAt"
  BEFORE UPDATE ON "storage_target_transfer"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE TABLE "storage_target_object" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "targetId" uuid NOT NULL,
  "remoteKey" character varying NOT NULL,
  "assetId" uuid,
  "size" bigint NOT NULL,
  "checksum" bytea,
  "syncedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "storage_target_object_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "storage_target" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "storage_target_object_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "storage_target_object_targetId_remoteKey_uq" UNIQUE ("targetId", "remoteKey"),
  CONSTRAINT "storage_target_object_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "storage_target_object_assetId_idx" ON "storage_target_object" ("assetId");`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_storage_target_updatedAt', '{"type":"trigger","name":"storage_target_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"storage_target_updatedAt\\"\\n  BEFORE UPDATE ON \\"storage_target\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_storage_target_transfer_updatedAt', '{"type":"trigger","name":"storage_target_transfer_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"storage_target_transfer_updatedAt\\"\\n  BEFORE UPDATE ON \\"storage_target_transfer\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "storage_target_transfer_updatedAt" ON "storage_target_transfer";`.execute(db);
  await sql`DROP TRIGGER "storage_target_updatedAt" ON "storage_target";`.execute(db);
  await sql`DROP TABLE "storage_target_object";`.execute(db);
  await sql`DROP TABLE "storage_target_transfer";`.execute(db);
  await sql`DROP TABLE "storage_target";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_storage_target_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_storage_target_transfer_updatedAt';`.execute(db);
}
