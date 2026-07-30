import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_job_status" ADD "transcribedAt" timestamp with time zone;`.execute(db);
  await sql`CREATE TABLE "transcript_segment" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "assetId" uuid NOT NULL,
  "startTime" real NOT NULL,
  "endTime" real NOT NULL,
  "text" text NOT NULL,
  CONSTRAINT "transcript_segment_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "transcript_segment_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "transcript_segment_assetId_idx" ON "transcript_segment" ("assetId");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_job_status" DROP COLUMN "transcribedAt";`.execute(db);
  await sql`DROP TABLE "transcript_segment";`.execute(db);
}
