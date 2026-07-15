import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TYPE "video_frame_extraction_status_enum" AS ENUM ('pending','processing','completed','failed');`.execute(db);
  await sql`CREATE TABLE "video_frame_extraction" (
  "assetId" uuid NOT NULL,
  "status" video_frame_extraction_status_enum NOT NULL,
  "version" integer NOT NULL,
  "parameters" jsonb NOT NULL,
  "parametersHash" character varying NOT NULL,
  "path" text,
  "initSegmentSize" integer,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "video_frame_extraction_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "video_frame_extraction_pkey" PRIMARY KEY ("assetId")
);`.execute(db);
  await sql`CREATE INDEX "video_frame_extraction_parametersHash_idx" ON "video_frame_extraction" ("parametersHash");`.execute(db);
  await sql`CREATE TABLE "video_frame" (
  "assetId" uuid NOT NULL,
  "frameIndex" integer NOT NULL,
  "byteOffset" bigint NOT NULL,
  "byteSize" integer NOT NULL,
  "intervalChange" real NOT NULL,
  CONSTRAINT "video_frame_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "video_frame_pkey" PRIMARY KEY ("assetId", "frameIndex")
);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "video_frame_extraction";`.execute(db);
  await sql`DROP TYPE "video_frame_extraction_status_enum";`.execute(db);
  await sql`DROP TABLE "video_frame";`.execute(db);
}
