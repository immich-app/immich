import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER INDEX "idx_person_name_trigram" RENAME TO "idx_face_cluster_name_trigram";`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "person_cluster_updatedAt"
  BEFORE UPDATE ON "person"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`DROP TRIGGER "face_cluster_updatedAt" ON "person";`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"trigger","name":"face_cluster_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"face_cluster_updatedAt\\"\\n  BEFORE UPDATE ON \\"face_cluster\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb WHERE "name" = 'trigger_face_cluster_updatedAt';`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_idx_face_cluster_name_trigram', '{"type":"index","name":"idx_face_cluster_name_trigram","sql":"CREATE INDEX \\"idx_face_cluster_name_trigram\\" ON \\"face_cluster\\" USING gin (f_unaccent(\\"name\\") gin_trgm_ops);"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_person_cluster_updatedAt', '{"type":"trigger","name":"person_cluster_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"person_cluster_updatedAt\\"\\n  BEFORE UPDATE ON \\"person\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_idx_person_name_trigram';`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE TRIGGER "face_cluster_updatedAt"
  BEFORE UPDATE ON "person"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`DROP TRIGGER "person_cluster_updatedAt" ON "person";`.execute(db);
  await sql`ALTER INDEX "idx_face_cluster_name_trigram" RENAME TO "idx_person_name_trigram";`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE OR REPLACE TRIGGER \\"face_cluster_updatedAt\\"\\n  BEFORE UPDATE ON \\"person\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();","name":"face_cluster_updatedAt","type":"trigger"}'::jsonb WHERE "name" = 'trigger_face_cluster_updatedAt';`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_idx_person_name_trigram', '{"sql":"CREATE INDEX \\"idx_person_name_trigram\\" ON \\"face_cluster\\" USING gin (f_unaccent(\\"name\\") gin_trgm_ops);","name":"idx_person_name_trigram","type":"index"}'::jsonb);`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_idx_face_cluster_name_trigram';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_person_cluster_updatedAt';`.execute(db);
}
