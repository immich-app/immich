import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE "fuji_cleanup_outbox" (
      "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
      "assetId" uuid NOT NULL,
      "path" character varying NOT NULL,
      "createdAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
      "availableAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
      CONSTRAINT "fuji_cleanup_outbox_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "fuji_cleanup_outbox_path_uq" UNIQUE ("path")
    )
  `.execute(db);
  await sql`CREATE INDEX "fuji_cleanup_outbox_availableAt_idx" ON "fuji_cleanup_outbox" ("availableAt")`.execute(
    db,
  );
  await sql`CREATE INDEX "fuji_cleanup_outbox_assetId_idx" ON "fuji_cleanup_outbox" ("assetId")`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "fuji_cleanup_outbox"`.execute(db);
}
