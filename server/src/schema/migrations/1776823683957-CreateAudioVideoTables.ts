import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "asset_audio" (
  "assetId" uuid NOT NULL,
  "bitrate" integer NOT NULL,
  "index" smallint NOT NULL,
  "profile" smallint,
  "codecName" text NOT NULL,
  CONSTRAINT "asset_audio_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "asset_audio_pkey" PRIMARY KEY ("assetId")
);`.execute(db);
  await sql`CREATE TABLE "asset_video" (
  "assetId" uuid NOT NULL,
  "bitrate" integer NOT NULL,
  "frameCount" integer NOT NULL,
  "timeBase" integer NOT NULL,
  "index" smallint NOT NULL,
  "profile" smallint,
  "level" smallint,
  "colorPrimaries" smallint NOT NULL,
  "colorTransfer" smallint NOT NULL,
  "colorMatrix" smallint NOT NULL,
  "dvProfile" smallint,
  "dvLevel" smallint,
  "dvBlSignalCompatibilityId" smallint,
  "codecName" text NOT NULL,
  "formatName" text NOT NULL,
  "formatLongName" text NOT NULL,
  "pixelFormat" text NOT NULL,
  CONSTRAINT "asset_video_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "asset_video_pkey" PRIMARY KEY ("assetId")
);`.execute(db);
  await sql`CREATE TABLE "asset_keyframe" (
  "assetId" uuid NOT NULL,
  "pts" integer[] NOT NULL,
  "accDuration" integer[] NOT NULL,
  "ownDuration" integer[] NOT NULL,
  "totalDuration" integer NOT NULL,
  "packetCount" integer NOT NULL,
  "outputFrames" integer NOT NULL,
  CONSTRAINT "asset_keyframe_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "asset_keyframe_pkey" PRIMARY KEY ("assetId")
);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "asset_audio";`.execute(db);
  await sql`DROP TABLE "asset_video";`.execute(db);
  await sql`DROP TABLE "asset_keyframe";`.execute(db);
}
