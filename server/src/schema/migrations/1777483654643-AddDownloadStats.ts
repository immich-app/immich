import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "asset_download_log" (
  "id" uuid NOT NULL DEFAULT immich_uuid_v7(now()),
  "assetId" uuid NOT NULL,
  "userId" uuid,
  "downloadedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "ipAddress" varchar,
  CONSTRAINT "asset_download_log_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "asset_download_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "asset_download_log_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "asset_download_log_assetId_idx" ON "asset_download_log" ("assetId");`.execute(db);
  await sql`CREATE INDEX "asset_download_log_userId_idx" ON "asset_download_log" ("userId");`.execute(db);
  await sql`CREATE INDEX "asset_download_log_downloadedAt_idx" ON "asset_download_log" ("downloadedAt" DESC);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "asset_download_log";`.execute(db);
}
