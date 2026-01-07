import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "download_request" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "expiresAt" timestamp with time zone NOT NULL,
  CONSTRAINT "download_request_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE TABLE "download_request_asset" (
  "assetId" uuid NOT NULL,
  "downloadRequestId" uuid NOT NULL,
  CONSTRAINT "download_request_asset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "download_request_asset_downloadRequestId_fkey" FOREIGN KEY ("downloadRequestId") REFERENCES "download_request" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "download_request_asset_pkey" PRIMARY KEY ("assetId", "downloadRequestId")
);`.execute(db);
  await sql`CREATE INDEX "download_request_asset_assetId_idx" ON "download_request_asset" ("assetId");`.execute(db);
  await sql`CREATE INDEX "download_request_asset_downloadRequestId_idx" ON "download_request_asset" ("downloadRequestId");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "download_request_asset";`.execute(db);
  await sql`DROP TABLE "download_request";`.execute(db);
}
