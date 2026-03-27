import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE "classification_category" (
      "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      "userId" uuid NOT NULL REFERENCES "user"("id") ON UPDATE CASCADE ON DELETE CASCADE,
      "name" character varying NOT NULL,
      "similarity" real NOT NULL DEFAULT 0.28,
      "action" character varying NOT NULL DEFAULT 'tag',
      "enabled" boolean NOT NULL DEFAULT true,
      "tagId" uuid REFERENCES "tag"("id") ON DELETE SET NULL,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
      CONSTRAINT "classification_category_userId_name_uq" UNIQUE ("userId", "name")
    )
  `.execute(db);

  await sql`
    CREATE INDEX "classification_category_updateId_idx" ON "classification_category" ("updateId")
  `.execute(db);

  await sql`
    CREATE INDEX "classification_category_tagId_idx" ON "classification_category" ("tagId")
  `.execute(db);

  await sql`
    CREATE OR REPLACE TRIGGER "classification_category_updatedAt"
    BEFORE UPDATE ON "classification_category"
    FOR EACH ROW EXECUTE FUNCTION updated_at()
  `.execute(db);

  await sql`
    CREATE TABLE "classification_prompt_embedding" (
      "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      "categoryId" uuid NOT NULL REFERENCES "classification_category"("id") ON UPDATE CASCADE ON DELETE CASCADE,
      "prompt" text NOT NULL,
      "embedding" vector(512) NOT NULL,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
    )
  `.execute(db);

  await sql`
    CREATE INDEX "classification_prompt_embedding_categoryId_idx" ON "classification_prompt_embedding" ("categoryId")
  `.execute(db);

  await sql`
    ALTER TABLE "asset_job_status" ADD "classifiedAt" timestamp with time zone
  `.execute(db);

  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_classification_category_updatedAt', '{"type":"trigger","name":"classification_category_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"classification_category_updatedAt\\"\\n  BEFORE UPDATE ON \\"classification_category\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb)`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_classification_category_updatedAt'`.execute(db);
  await sql`ALTER TABLE "asset_job_status" DROP COLUMN "classifiedAt"`.execute(db);
  await sql`DROP TABLE IF EXISTS "classification_prompt_embedding"`.execute(db);
  await sql`DROP TABLE IF EXISTS "classification_category"`.execute(db);
}
