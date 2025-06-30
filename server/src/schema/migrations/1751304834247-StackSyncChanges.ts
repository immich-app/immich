import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "stacks_audit" ("id" uuid NOT NULL DEFAULT immich_uuid_v7(), "stackId" uuid NOT NULL, "userId" uuid NOT NULL, "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp());`.execute(db);
  await sql`ALTER TABLE "asset_stack" ADD "createdAt" timestamp with time zone NOT NULL DEFAULT now();`.execute(db);
  await sql`ALTER TABLE "asset_stack" ADD "updatedAt" timestamp with time zone NOT NULL DEFAULT now();`.execute(db);
  await sql`ALTER TABLE "asset_stack" ADD "updateId" uuid NOT NULL DEFAULT immich_uuid_v7();`.execute(db);
  await sql`ALTER TABLE "stacks_audit" ADD CONSTRAINT "PK_dbe4ec648fa032e8973297de07e" PRIMARY KEY ("id");`.execute(db);
  await sql`CREATE INDEX "IDX_stacks_audit_deleted_at" ON "stacks_audit" ("deletedAt")`.execute(db);
    await sql`CREATE OR REPLACE FUNCTION stacks_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO stacks_audit ("stackId", "userId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "stacks_delete_audit"
  AFTER DELETE ON "asset_stack"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION stacks_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "stacks_updated_at"
  BEFORE UPDATE ON "asset_stack"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "stacks_delete_audit" ON "asset_stack";`.execute(db);
  await sql`DROP TRIGGER "stacks_updated_at" ON "asset_stack";`.execute(db);
  await sql`DROP INDEX "IDX_stacks_audit_deleted_at";`.execute(db);
  await sql`ALTER TABLE "stacks_audit" DROP CONSTRAINT "PK_dbe4ec648fa032e8973297de07e";`.execute(db);
  await sql`ALTER TABLE "asset_stack" DROP COLUMN "createdAt";`.execute(db);
  await sql`ALTER TABLE "asset_stack" DROP COLUMN "updatedAt";`.execute(db);
  await sql`ALTER TABLE "asset_stack" DROP COLUMN "updateId";`.execute(db);
  await sql`DROP TABLE "stacks_audit";`.execute(db);
  await sql`DROP FUNCTION stacks_delete_audit;`.execute(db);
}
