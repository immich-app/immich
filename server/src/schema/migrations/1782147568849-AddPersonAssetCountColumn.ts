import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "person" ADD "assetCount" integer NOT NULL DEFAULT 0;`.execute(db);
  await sql`UPDATE "person" SET "assetCount" = (
    SELECT COUNT("assetId")
    FROM "asset_face"
    WHERE "personId" = "person".id AND "deletedAt" IS NULL AND "isVisible" IS true
  )`.execute(db);
  await sql`CREATE INDEX "idx_person_assetCount" ON "person" ("assetCount");`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION person_increment_asset_count()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      IF NEW."deletedAt" IS NULL AND NEW."isVisible" IS true THEN
        UPDATE person SET "assetCount" = "assetCount" + 1 WHERE id = NEW."personId";
      END IF;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION person_update_asset_count()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      IF OLD."personId" != NEW."personId" AND OLD."deletedAt" IS NULL AND OLD."isVisible" IS true THEN
        UPDATE person SET "assetCount" = "assetCount" - 1 WHERE id = OLD."personId";
      END IF;

      IF OLD."personId" != NEW."personId" AND NEW."deletedAt" IS NULL AND OLD."isVisible" IS true THEN
        UPDATE person SET "assetCount" = "assetCount" + 1 WHERE id = NEW."personId";
      END IF;

      IF
        OLD."personId" = NEW."personId" AND
        (OLD."deletedAt" IS NULL AND NEW."deletedAt" IS NOT NULL) OR
        (OLD."isVisible" IS true AND NEW."isVisible" IS false)
      THEN
         UPDATE person SET "assetCount" = "assetCount" - 1 WHERE id = NEW."personId";
      END IF;

      IF
        OLD."personId" = NEW."personId" AND
        (OLD."deletedAt" IS NOT NULL AND NEW."deletedAt" IS NULL) OR
        (OLD."isVisible" IS false AND NEW."isVisible" IS true)
      THEN
         UPDATE person SET "assetCount" = "assetCount" + 1 WHERE id = NEW."personId";
      END IF;

      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE FUNCTION person_decrement_asset_count()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      IF OLD."deletedAt" IS NULL AND OLD."isVisible" IS true THEN
        UPDATE person SET "assetCount" = "assetCount" - 1 WHERE id = OLD."personId";
      END IF;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_face_delete_decrement_person_asset_count_trigger"
  AFTER DELETE ON "asset_face"
  FOR EACH ROW
  EXECUTE FUNCTION person_decrement_asset_count();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_face_update_increment_person_asset_count_trigger"
  AFTER UPDATE ON "asset_face"
  FOR EACH ROW
  EXECUTE FUNCTION person_update_asset_count();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_face_insert_increment_person_asset_count_trigger"
  AFTER INSERT ON "asset_face"
  FOR EACH ROW
  EXECUTE FUNCTION person_increment_asset_count();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_person_increment_asset_count', '{"type":"function","name":"person_increment_asset_count","sql":"CREATE OR REPLACE FUNCTION person_increment_asset_count()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      IF NEW.\\"deletedAt\\" IS NULL AND NEW.\\"isVisible\\" IS true THEN\\n        UPDATE person SET \\"assetCount\\" = \\"assetCount\\" + 1 WHERE id = NEW.\\"personId\\";\\n      END IF;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_person_update_asset_count', '{"type":"function","name":"person_update_asset_count","sql":"CREATE OR REPLACE FUNCTION person_update_asset_count()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      IF OLD.\\"personId\\" != NEW.\\"personId\\" AND OLD.\\"deletedAt\\" IS NULL AND OLD.\\"isVisible\\" IS true THEN\\n        UPDATE person SET \\"assetCount\\" = \\"assetCount\\" - 1 WHERE id = OLD.\\"personId\\";\\n      END IF;\\n\\n      IF OLD.\\"personId\\" != NEW.\\"personId\\" AND NEW.\\"deletedAt\\" IS NULL AND OLD.\\"isVisible\\" IS true THEN\\n        UPDATE person SET \\"assetCount\\" = \\"assetCount\\" + 1 WHERE id = NEW.\\"personId\\";\\n      END IF;\\n\\n      IF\\n        OLD.\\"personId\\" = NEW.\\"personId\\" AND\\n        (OLD.\\"deletedAt\\" IS NULL AND NEW.\\"deletedAt\\" IS NOT NULL) OR\\n        (OLD.\\"isVisible\\" IS true AND NEW.\\"isVisible\\" IS false)\\n      THEN\\n         UPDATE person SET \\"assetCount\\" = \\"assetCount\\" - 1 WHERE id = NEW.\\"personId\\";\\n      END IF;\\n\\n      IF\\n        OLD.\\"personId\\" = NEW.\\"personId\\" AND\\n        (OLD.\\"deletedAt\\" IS NOT NULL AND NEW.\\"deletedAt\\" IS NULL) OR\\n        (OLD.\\"isVisible\\" IS false AND NEW.\\"isVisible\\" IS true)\\n      THEN\\n         UPDATE person SET \\"assetCount\\" = \\"assetCount\\" + 1 WHERE id = NEW.\\"personId\\";\\n      END IF;\\n\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_person_decrement_asset_count', '{"type":"function","name":"person_decrement_asset_count","sql":"CREATE OR REPLACE FUNCTION person_decrement_asset_count()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      IF OLD.\\"deletedAt\\" IS NULL AND OLD.\\"isVisible\\" IS true THEN\\n        UPDATE person SET \\"assetCount\\" = \\"assetCount\\" - 1 WHERE id = OLD.\\"personId\\";\\n      END IF;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_face_delete_decrement_person_asset_count_trigger', '{"type":"trigger","name":"asset_face_delete_decrement_person_asset_count_trigger","sql":"CREATE OR REPLACE TRIGGER \\"asset_face_delete_decrement_person_asset_count_trigger\\"\\n  AFTER DELETE ON \\"asset_face\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION person_decrement_asset_count();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_face_update_increment_person_asset_count_trigger', '{"type":"trigger","name":"asset_face_update_increment_person_asset_count_trigger","sql":"CREATE OR REPLACE TRIGGER \\"asset_face_update_increment_person_asset_count_trigger\\"\\n  AFTER UPDATE ON \\"asset_face\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION person_update_asset_count();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_face_insert_increment_person_asset_count_trigger', '{"type":"trigger","name":"asset_face_insert_increment_person_asset_count_trigger","sql":"CREATE OR REPLACE TRIGGER \\"asset_face_insert_increment_person_asset_count_trigger\\"\\n  AFTER INSERT ON \\"asset_face\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION person_increment_asset_count();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "asset_face_insert_increment_person_asset_count_trigger" ON "asset_face";`.execute(db);
  await sql`DROP FUNCTION person_increment_asset_count;`.execute(db);
  await sql`DROP TRIGGER "asset_face_update_increment_person_asset_count_trigger" ON "asset_face";`.execute(db);
  await sql`DROP FUNCTION person_update_asset_count;`.execute(db);
  await sql`DROP TRIGGER "asset_face_delete_decrement_person_asset_count_trigger" ON "asset_face";`.execute(db);
  await sql`DROP FUNCTION person_decrement_asset_count;`.execute(db);
  await sql`DROP INDEX "idx_person_assetCount";`.execute(db);
  await sql`ALTER TABLE "person" DROP COLUMN "assetCount";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_person_increment_asset_count';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_person_update_asset_count';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_person_decrement_asset_count';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_face_delete_decrement_person_asset_count_trigger';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_face_update_increment_person_asset_count_trigger';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_face_insert_increment_person_asset_count_trigger';`.execute(db);
}
