import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_face" ADD "ownerId" uuid;`.execute(db);
  await sql`ALTER TABLE "asset_face" ADD "assetVisibility" asset_visibility_enum;`.execute(db);
  await sql`ALTER TABLE "asset_face" ADD "assetDeletedAt" timestamp with time zone;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION asset_face_set_asset_state()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      -- FOR SHARE so a concurrent update of the asset cannot leave this face with stale state
      SELECT "ownerId", "visibility", "deletedAt"
      INTO NEW."ownerId", NEW."assetVisibility", NEW."assetDeletedAt"
      FROM asset
      WHERE "id" = NEW."assetId"
      FOR SHARE;
      RETURN NEW;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION asset_face_update_asset_state()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      UPDATE asset_face
      SET "ownerId" = NEW."ownerId", "assetVisibility" = NEW."visibility", "assetDeletedAt" = NEW."deletedAt"
      WHERE "assetId" = NEW."id";
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_face_updatedAt"
  BEFORE UPDATE ON "asset_face"
  FOR EACH ROW
  WHEN ((OLD."ownerId", OLD."assetVisibility", OLD."assetDeletedAt") IS NOT DISTINCT FROM (NEW."ownerId", NEW."assetVisibility", NEW."assetDeletedAt"))
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_face_update_asset_state"
  AFTER UPDATE ON "asset"
  FOR EACH ROW
  WHEN ((OLD."ownerId", OLD."visibility", OLD."deletedAt") IS DISTINCT FROM (NEW."ownerId", NEW."visibility", NEW."deletedAt"))
  EXECUTE FUNCTION asset_face_update_asset_state();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_face_set_asset_state"
  BEFORE INSERT ON "asset_face"
  FOR EACH ROW
  EXECUTE FUNCTION asset_face_set_asset_state();`.execute(db);
  await sql`UPDATE "asset_face" SET "ownerId" = "asset"."ownerId", "assetVisibility" = "asset"."visibility", "assetDeletedAt" = "asset"."deletedAt" FROM "asset" WHERE "asset"."id" = "asset_face"."assetId";`.execute(db);
  await sql`ALTER TABLE "asset_face" ALTER COLUMN "ownerId" SET NOT NULL, ALTER COLUMN "assetVisibility" SET NOT NULL;`.execute(db);
  await sql`CREATE INDEX "asset_face_personGroupId_ownerId_assetId_timeline_idx" ON "asset_face" ("personGroupId", "ownerId", "assetId") WHERE ("deletedAt" IS NULL AND "isVisible" IS TRUE AND "assetVisibility" = 'timeline' AND "assetDeletedAt" IS NULL);`.execute(db);
  await sql`ANALYZE "asset_face";`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"trigger","name":"asset_face_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"asset_face_updatedAt\\"\\n  BEFORE UPDATE ON \\"asset_face\\"\\n  FOR EACH ROW\\n  WHEN ((OLD.\\"ownerId\\", OLD.\\"assetVisibility\\", OLD.\\"assetDeletedAt\\") IS NOT DISTINCT FROM (NEW.\\"ownerId\\", NEW.\\"assetVisibility\\", NEW.\\"assetDeletedAt\\"))\\n  EXECUTE FUNCTION updated_at();"}'::jsonb WHERE "name" = 'trigger_asset_face_updatedAt';`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_asset_face_set_asset_state', '{"type":"function","name":"asset_face_set_asset_state","sql":"CREATE OR REPLACE FUNCTION asset_face_set_asset_state()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      -- FOR SHARE so a concurrent update of the asset cannot leave this face with stale state\\n      SELECT \\"ownerId\\", \\"visibility\\", \\"deletedAt\\"\\n      INTO NEW.\\"ownerId\\", NEW.\\"assetVisibility\\", NEW.\\"assetDeletedAt\\"\\n      FROM asset\\n      WHERE \\"id\\" = NEW.\\"assetId\\"\\n      FOR SHARE;\\n      RETURN NEW;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_asset_face_update_asset_state', '{"type":"function","name":"asset_face_update_asset_state","sql":"CREATE OR REPLACE FUNCTION asset_face_update_asset_state()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      UPDATE asset_face\\n      SET \\"ownerId\\" = NEW.\\"ownerId\\", \\"assetVisibility\\" = NEW.\\"visibility\\", \\"assetDeletedAt\\" = NEW.\\"deletedAt\\"\\n      WHERE \\"assetId\\" = NEW.\\"id\\";\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_face_update_asset_state', '{"type":"trigger","name":"asset_face_update_asset_state","sql":"CREATE OR REPLACE TRIGGER \\"asset_face_update_asset_state\\"\\n  AFTER UPDATE ON \\"asset\\"\\n  FOR EACH ROW\\n  WHEN ((OLD.\\"ownerId\\", OLD.\\"visibility\\", OLD.\\"deletedAt\\") IS DISTINCT FROM (NEW.\\"ownerId\\", NEW.\\"visibility\\", NEW.\\"deletedAt\\"))\\n  EXECUTE FUNCTION asset_face_update_asset_state();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_face_set_asset_state', '{"type":"trigger","name":"asset_face_set_asset_state","sql":"CREATE OR REPLACE TRIGGER \\"asset_face_set_asset_state\\"\\n  BEFORE INSERT ON \\"asset_face\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION asset_face_set_asset_state();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_asset_face_personGroupId_ownerId_assetId_timeline_idx', '{"type":"index","name":"asset_face_personGroupId_ownerId_assetId_timeline_idx","sql":"CREATE INDEX \\"asset_face_personGroupId_ownerId_assetId_timeline_idx\\" ON \\"asset_face\\" (\\"personGroupId\\", \\"ownerId\\", \\"assetId\\") WHERE (\\"deletedAt\\" IS NULL AND \\"isVisible\\" IS TRUE AND \\"assetVisibility\\" = ''timeline'' AND \\"assetDeletedAt\\" IS NULL);"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "asset_face_set_asset_state" ON "asset_face";`.execute(db);
  await sql`DROP FUNCTION asset_face_set_asset_state;`.execute(db);
  await sql`DROP TRIGGER "asset_face_update_asset_state" ON "asset";`.execute(db);
  await sql`DROP FUNCTION asset_face_update_asset_state;`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_face_updatedAt"
  BEFORE UPDATE ON "asset_face"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`DROP INDEX "asset_face_personGroupId_ownerId_assetId_timeline_idx";`.execute(db);
  await sql`ALTER TABLE "asset_face" DROP COLUMN "ownerId";`.execute(db);
  await sql`ALTER TABLE "asset_face" DROP COLUMN "assetVisibility";`.execute(db);
  await sql`ALTER TABLE "asset_face" DROP COLUMN "assetDeletedAt";`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE OR REPLACE TRIGGER \\"asset_face_updatedAt\\"\\n  BEFORE UPDATE ON \\"asset_face\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();","name":"asset_face_updatedAt","type":"trigger"}'::jsonb WHERE "name" = 'trigger_asset_face_updatedAt';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_asset_face_set_asset_state';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_asset_face_update_asset_state';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_face_update_asset_state';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_face_set_asset_state';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_asset_face_personGroupId_ownerId_assetId_timeline_idx';`.execute(db);
}
