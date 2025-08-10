import { Kysely, sql } from 'kysely';

// Phase 1: candidate tables for auto-stacking
// Tables:
//  auto_stack_candidate (id uuid pk, ownerId uuid, createdAt timestamptz)
//  auto_stack_candidate_asset (candidateId uuid fk, assetId uuid fk, position int, PRIMARY KEY (candidateId, assetId))
// Indices to support lookups by owner and asset.

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE "auto_stack_candidate" (
      "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
      "ownerId" uuid NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT clock_timestamp(),
      CONSTRAINT "auto_stack_candidate_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "auto_stack_candidate_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON UPDATE CASCADE ON DELETE CASCADE
    );
  `.execute(db);

  await sql`
    CREATE TABLE "auto_stack_candidate_asset" (
      "candidateId" uuid NOT NULL,
      "assetId" uuid NOT NULL,
      "position" integer NOT NULL,
      CONSTRAINT "auto_stack_candidate_asset_pkey" PRIMARY KEY ("candidateId", "assetId"),
      CONSTRAINT "auto_stack_candidate_asset_candidate_fkey" FOREIGN KEY ("candidateId") REFERENCES "auto_stack_candidate"("id") ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT "auto_stack_candidate_asset_asset_fkey" FOREIGN KEY ("assetId") REFERENCES "asset"("id") ON UPDATE CASCADE ON DELETE CASCADE
    );
  `.execute(db);

  await sql`CREATE INDEX "auto_stack_candidate_ownerId_idx" ON "auto_stack_candidate" ("ownerId");`.execute(db);
  await sql`CREATE INDEX "auto_stack_candidate_asset_assetId_idx" ON "auto_stack_candidate_asset" ("assetId");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS "auto_stack_candidate_asset_assetId_idx";`.execute(db);
  await sql`DROP INDEX IF EXISTS "auto_stack_candidate_ownerId_idx";`.execute(db);
  await sql`DROP TABLE IF EXISTS "auto_stack_candidate_asset";`.execute(db);
  await sql`DROP TABLE IF EXISTS "auto_stack_candidate";`.execute(db);
}
