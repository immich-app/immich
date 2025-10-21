import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "asset_vod_metadata" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "assetId" uuid NOT NULL,
  "height" integer NOT NULL,
  "width" integer NOT NULL,
  "rotation" integer NOT NULL,
  "codecName" character varying,
  "frameCount" integer NOT NULL,
  "isHDR" boolean NOT NULL,
  "bitrate" integer NOT NULL,
  "pixelFormat" character varying NOT NULL,
  "codecTag" character varying,
  "profile" character varying,
  "fps" character varying NOT NULL,
  "level" integer,
  "audioCodecName" character varying,
  "audioBitrate" integer,
  "frames" real[] NOT NULL,
  "keyframes" integer[] NOT NULL,
  "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  CONSTRAINT "asset_vod_metadata_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "asset_vod_metadata_assetId_uq" UNIQUE ("assetId"),
  CONSTRAINT "asset_vod_metadata_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "asset_vod_metadata_assetId_idx" ON "asset_vod_metadata" ("assetId");`.execute(db);
  await sql`CREATE INDEX "asset_vod_metadata_updateId_idx" ON "asset_vod_metadata" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_file_updatedAt"
  BEFORE UPDATE ON "asset_vod_metadata"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"trigger","name":"asset_file_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"asset_file_updatedAt\\"\\n  BEFORE UPDATE ON \\"asset_vod_metadata\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb WHERE "name" = 'trigger_asset_file_updatedAt';`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "asset_vod_metadata";`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE OR REPLACE TRIGGER \\"asset_file_updatedAt\\"\\n  BEFORE UPDATE ON \\"asset_file\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();","name":"asset_file_updatedAt","type":"trigger"}'::jsonb WHERE "name" = 'trigger_asset_file_updatedAt';`.execute(db);
}
