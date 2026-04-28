import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "video_stream_session" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "assetId" uuid NOT NULL,
  "expiresAt" timestamp with time zone NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "video_stream_session_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "video_stream_session_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "video_stream_session_assetId_idx" ON "video_stream_session" ("assetId");`.execute(db);
  await sql`CREATE INDEX "video_stream_session_expiresAt_idx" ON "video_stream_session" ("expiresAt");`.execute(db);
  await sql`CREATE TABLE "video_stream_variant" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "sessionId" uuid NOT NULL,
  "codec" text NOT NULL,
  "resolution" smallint NOT NULL,
  "bitrate" integer NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "video_stream_variant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "video_stream_session" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "video_stream_variant_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE UNIQUE INDEX "video_stream_variant_sessionId_codec_resolution_bitrate_idx" ON "video_stream_variant" ("sessionId", "codec", "resolution", "bitrate");`.execute(db);
  await sql`CREATE TABLE "video_stream_segment" (
  "variantId" uuid NOT NULL,
  "index" integer NOT NULL,
  "durationUs" integer NOT NULL,
  CONSTRAINT "video_stream_segment_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "video_stream_variant" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "video_stream_segment_pkey" PRIMARY KEY ("variantId", "index")
);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "video_stream_segment";`.execute(db);
  await sql`DROP TABLE "video_stream_variant";`.execute(db);
  await sql`DROP TABLE "video_stream_session";`.execute(db);
}
