import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_ocr" ADD "updatedAt" timestamp with time zone NOT NULL DEFAULT now();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_ocr_updatedAt"
  BEFORE UPDATE ON "asset_ocr"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_ocr_updatedAt', '{"type":"trigger","name":"asset_ocr_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"asset_ocr_updatedAt\\"\\n  BEFORE UPDATE ON \\"asset_ocr\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "asset_ocr_updatedAt" ON "asset_ocr";`.execute(db);
  await sql`ALTER TABLE "asset_ocr" DROP COLUMN "updatedAt";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_ocr_updatedAt';`.execute(db);
}
