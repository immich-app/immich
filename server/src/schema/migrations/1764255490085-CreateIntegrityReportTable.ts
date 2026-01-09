import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "integrity_report" (
  "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "type" character varying NOT NULL,
  "path" character varying NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "assetId" uuid,
  "fileAssetId" uuid,
  CONSTRAINT "integrity_report_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "integrity_report_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "asset_file" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "integrity_report_type_path_uq" UNIQUE ("type", "path"),
  CONSTRAINT "integrity_report_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "integrity_report_assetId_idx" ON "integrity_report" ("assetId");`.execute(db);
  await sql`CREATE INDEX "integrity_report_fileAssetId_idx" ON "integrity_report" ("fileAssetId");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "integrity_report";`.execute(db);
}
