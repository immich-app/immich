import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "sync_node" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "name" character varying NOT NULL,
  "url" character varying NOT NULL,
  "apiKey" character varying NOT NULL,
  "isEnabled" boolean NOT NULL DEFAULT true,
  "status" character varying NOT NULL DEFAULT 'unknown',
  "remoteVersion" character varying,
  "lastCheckedAt" timestamp with time zone,
  "error" character varying,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  CONSTRAINT "sync_node_name_uq" UNIQUE ("name"),
  CONSTRAINT "sync_node_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "sync_node_updateId_idx" ON "sync_node" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "sync_node_updatedAt"
  BEFORE UPDATE ON "sync_node"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE TABLE "sync_node_user" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "nodeId" uuid NOT NULL,
  "localUserId" uuid NOT NULL,
  "remoteUserId" uuid NOT NULL,
  "remoteUserEmail" character varying NOT NULL,
  "apiKey" character varying NOT NULL,
  "pushEnabled" boolean NOT NULL DEFAULT true,
  "pullEnabled" boolean NOT NULL DEFAULT true,
  "pushCursor" uuid,
  "pullCursor" timestamp with time zone,
  "lastSyncedAt" timestamp with time zone,
  "error" character varying,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  CONSTRAINT "sync_node_user_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "sync_node" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "sync_node_user_localUserId_fkey" FOREIGN KEY ("localUserId") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "sync_node_user_nodeId_localUserId_uq" UNIQUE ("nodeId", "localUserId"),
  CONSTRAINT "sync_node_user_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "sync_node_user_localUserId_idx" ON "sync_node_user" ("localUserId");`.execute(db);
  await sql`CREATE INDEX "sync_node_user_updateId_idx" ON "sync_node_user" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "sync_node_user_updatedAt"
  BEFORE UPDATE ON "sync_node_user"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE TABLE "sync_node_asset" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "nodeUserId" uuid NOT NULL,
  "localAssetId" uuid NOT NULL,
  "remoteAssetId" uuid NOT NULL,
  "checksum" bytea NOT NULL,
  "origin" character varying NOT NULL,
  "metadataUpdateId" uuid,
  "trashSyncedAt" timestamp with time zone,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "sync_node_asset_nodeUserId_fkey" FOREIGN KEY ("nodeUserId") REFERENCES "sync_node_user" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "sync_node_asset_localAssetId_fkey" FOREIGN KEY ("localAssetId") REFERENCES "asset" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "sync_node_asset_nodeUserId_remoteAssetId_uq" UNIQUE ("nodeUserId", "remoteAssetId"),
  CONSTRAINT "sync_node_asset_nodeUserId_localAssetId_uq" UNIQUE ("nodeUserId", "localAssetId"),
  CONSTRAINT "sync_node_asset_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "sync_node_asset_localAssetId_idx" ON "sync_node_asset" ("localAssetId");`.execute(db);
  await sql`CREATE TABLE "sync_node_album" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "nodeUserId" uuid NOT NULL,
  "localAlbumId" uuid NOT NULL,
  "remoteAlbumId" uuid NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "sync_node_album_nodeUserId_fkey" FOREIGN KEY ("nodeUserId") REFERENCES "sync_node_user" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "sync_node_album_localAlbumId_fkey" FOREIGN KEY ("localAlbumId") REFERENCES "album" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "sync_node_album_nodeUserId_remoteAlbumId_uq" UNIQUE ("nodeUserId", "remoteAlbumId"),
  CONSTRAINT "sync_node_album_nodeUserId_localAlbumId_uq" UNIQUE ("nodeUserId", "localAlbumId"),
  CONSTRAINT "sync_node_album_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "sync_node_album_localAlbumId_idx" ON "sync_node_album" ("localAlbumId");`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_sync_node_updatedAt', '{"type":"trigger","name":"sync_node_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"sync_node_updatedAt\\"\\n  BEFORE UPDATE ON \\"sync_node\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_sync_node_user_updatedAt', '{"type":"trigger","name":"sync_node_user_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"sync_node_user_updatedAt\\"\\n  BEFORE UPDATE ON \\"sync_node_user\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "sync_node_user_updatedAt" ON "sync_node_user";`.execute(db);
  await sql`DROP TRIGGER "sync_node_updatedAt" ON "sync_node";`.execute(db);
  await sql`DROP TABLE "sync_node_asset";`.execute(db);
  await sql`DROP TABLE "sync_node_album";`.execute(db);
  await sql`DROP TABLE "sync_node_user";`.execute(db);
  await sql`DROP TABLE "sync_node";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_sync_node_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_sync_node_user_updatedAt';`.execute(db);
}
