import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_job_status" ADD "videoFramesExtractedAt" timestamp with time zone;`.execute(db);
  await sql`CREATE TABLE "video_frame" (
  "assetId" uuid NOT NULL,
  "frameIndex" integer NOT NULL,
  "byteOffset" bigint NOT NULL,
  "byteSize" integer NOT NULL,
  "intervalChange" real NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "video_frame_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "video_frame_pkey" PRIMARY KEY ("assetId", "frameIndex")
);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_job_status" DROP COLUMN "videoFramesExtractedAt";`.execute(db);
  await sql`DROP TABLE "video_frame";`.execute(db);
}
