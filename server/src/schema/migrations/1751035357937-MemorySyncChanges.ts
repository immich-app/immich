import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> { 
  await sql`CREATE TABLE "memory_assets_audit" ("id" uuid NOT NULL DEFAULT immich_uuid_v7(), "memoryId" uuid NOT NULL, "assetId" uuid NOT NULL, "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp());`.execute(db);
  await sql`CREATE TABLE "memories_audit" ("id" uuid NOT NULL DEFAULT immich_uuid_v7(), "memoryId" uuid NOT NULL, "userId" uuid NOT NULL, "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp());`.execute(db);
  await sql`ALTER TABLE "memories_assets_assets" ADD "createdAt" timestamp with time zone NOT NULL DEFAULT now();`.execute(db);
  await sql`ALTER TABLE "memories_assets_assets" ADD "updatedAt" timestamp with time zone NOT NULL DEFAULT now();`.execute(db);
  await sql`ALTER TABLE "memories_assets_assets" ADD "updateId" uuid NOT NULL DEFAULT immich_uuid_v7();`.execute(db);
  await sql`ALTER TABLE "memory_assets_audit" ADD CONSTRAINT "PK_35ef16910228f980e0766dcc59b" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "memories_audit" ADD CONSTRAINT "PK_19de798c033a710dcfa5c72f81b" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "memory_assets_audit" ADD CONSTRAINT "FK_225a204afcb0bd6de015080fb03" FOREIGN KEY ("memoryId") REFERENCES "memories" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`CREATE INDEX "IDX_memory_assets_audit_memory_id" ON "memory_assets_audit" ("memoryId")`.execute(db);
  await sql`CREATE INDEX "IDX_memory_assets_audit_asset_id" ON "memory_assets_audit" ("assetId")`.execute(db);
  await sql`CREATE INDEX "IDX_memory_assets_audit_deleted_at" ON "memory_assets_audit" ("deletedAt")`.execute(db);
  await sql`CREATE INDEX "IDX_memory_assets_update_id" ON "memories_assets_assets" ("updateId")`.execute(db);
  await sql`CREATE INDEX "IDX_memories_audit_memory_id" ON "memories_audit" ("memoryId")`.execute(db);
  await sql`CREATE INDEX "IDX_memories_audit_user_id" ON "memories_audit" ("userId")`.execute(db);
  await sql`CREATE INDEX "IDX_memories_audit_deleted_at" ON "memories_audit" ("deletedAt")`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION memories_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO memories_audit ("memoryId", "userId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION memory_assets_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO memory_assets_audit ("memoryId", "assetId")
      SELECT "memoriesId", "assetsId" FROM OLD
      WHERE "memoriesId" IN (SELECT "id" FROM memories WHERE "id" IN (SELECT "memoriesId" FROM OLD));
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "memories_delete_audit"
  AFTER DELETE ON "memories"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION memories_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "memory_assets_delete_audit"
  AFTER DELETE ON "memories_assets_assets"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() <= 1)
  EXECUTE FUNCTION memory_assets_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "memory_assets_updated_at"
  BEFORE UPDATE ON "memories_assets_assets"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "memories_delete_audit" ON "memories";`.execute(db);
  await sql`DROP TRIGGER "memory_assets_delete_audit" ON "memories_assets_assets";`.execute(db);
  await sql`DROP TRIGGER "memory_assets_updated_at" ON "memories_assets_assets";`.execute(db);
  await sql`DROP INDEX "IDX_memory_assets_update_id";`.execute(db);
  await sql`DROP INDEX "IDX_memory_assets_audit_memory_id";`.execute(db);
  await sql`DROP INDEX "IDX_memory_assets_audit_asset_id";`.execute(db);
  await sql`DROP INDEX "IDX_memory_assets_audit_deleted_at";`.execute(db);
  await sql`DROP INDEX "IDX_memories_audit_memory_id";`.execute(db);
  await sql`DROP INDEX "IDX_memories_audit_user_id";`.execute(db);
  await sql`DROP INDEX "IDX_memories_audit_deleted_at";`.execute(db);
  await sql`ALTER TABLE "memory_assets_audit" DROP CONSTRAINT "FK_225a204afcb0bd6de015080fb03";`.execute(db);
  await sql`ALTER TABLE "memory_assets_audit" DROP CONSTRAINT "PK_35ef16910228f980e0766dcc59b";`.execute(db);
  await sql`ALTER TABLE "memories_audit" DROP CONSTRAINT "PK_19de798c033a710dcfa5c72f81b";`.execute(db);
  await sql`ALTER TABLE "memories_assets_assets" DROP COLUMN "createdAt";`.execute(db);
  await sql`ALTER TABLE "memories_assets_assets" DROP COLUMN "updatedAt";`.execute(db);
  await sql`ALTER TABLE "memories_assets_assets" DROP COLUMN "updateId";`.execute(db);
  await sql`DROP TABLE "memory_assets_audit";`.execute(db);
  await sql`DROP TABLE "memories_audit";`.execute(db);
  await sql`DROP FUNCTION memories_delete_audit;`.execute(db);
  await sql`DROP FUNCTION memory_assets_delete_audit;`.execute(db);
}
