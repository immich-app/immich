import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "video_frame_extraction" ADD "updateId" uuid NOT NULL DEFAULT immich_uuid_v7();`.execute(db);
  await sql`CREATE INDEX "video_frame_extraction_updateId_idx" ON "video_frame_extraction" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "video_frame_extraction_updatedAt"
  BEFORE UPDATE ON "video_frame_extraction"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`ALTER TABLE "video_frame" ADD "createdAt" timestamp with time zone NOT NULL DEFAULT now();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_video_frame_extraction_updatedAt', '{"type":"trigger","name":"video_frame_extraction_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"video_frame_extraction_updatedAt\\"\\n  BEFORE UPDATE ON \\"video_frame_extraction\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "video_frame_extraction" DROP COLUMN "updateId";`.execute(db);
  await sql`DROP INDEX "video_frame_extraction_updateId_idx";`.execute(db);
  await sql`DROP TRIGGER "video_frame_extraction_updatedAt" ON "video_frame_extraction";`.execute(db);
  await sql`ALTER TABLE "video_frame" DROP COLUMN "createdAt";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_video_frame_extraction_updatedAt';`.execute(db);
}
