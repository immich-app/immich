import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "locked_album" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "ownerId" uuid NOT NULL,
  "albumName" character varying NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "locked_album_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "locked_album_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "locked_album_ownerId_idx" ON "locked_album" ("ownerId");`.execute(db);
  await sql`CREATE TABLE "locked_album_asset" (
  "albumId" uuid NOT NULL,
  "assetId" uuid NOT NULL,
  CONSTRAINT "locked_album_asset_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "locked_album" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "locked_album_asset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "locked_album_asset_pkey" PRIMARY KEY ("albumId", "assetId")
);`.execute(db);
  await sql`CREATE INDEX "locked_album_asset_assetId_idx" ON "locked_album_asset" ("assetId");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "locked_album_asset";`.execute(db);
  await sql`DROP TABLE "locked_album";`.execute(db);
}
