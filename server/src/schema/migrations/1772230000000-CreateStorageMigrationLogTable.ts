import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE "storage_migration_log" (
      "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
      "entityType" character varying NOT NULL,
      "entityId" uuid NOT NULL,
      "fileType" character varying,
      "oldPath" text NOT NULL,
      "newPath" text NOT NULL,
      "direction" character varying NOT NULL,
      "batchId" uuid NOT NULL,
      "migratedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp()
    );
  `.execute(db);

  await sql`ALTER TABLE "storage_migration_log" ADD CONSTRAINT "storage_migration_log_pkey" PRIMARY KEY ("id");`.execute(
    db,
  );
  await sql`CREATE INDEX "IDX_storage_migration_log_batchId" ON "storage_migration_log" ("batchId")`.execute(db);
  await sql`CREATE INDEX "IDX_storage_migration_log_entityId" ON "storage_migration_log" ("entityId")`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "IDX_storage_migration_log_entityId";`.execute(db);
  await sql`DROP INDEX "IDX_storage_migration_log_batchId";`.execute(db);
  await sql`ALTER TABLE "storage_migration_log" DROP CONSTRAINT "storage_migration_log_pkey";`.execute(db);
  await sql`DROP TABLE "storage_migration_log";`.execute(db);
}
