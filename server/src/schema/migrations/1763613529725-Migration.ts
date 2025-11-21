import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION event_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO event_audit ("eventId", "userId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`DROP INDEX "IDX_events_audit_user_id";`.execute(db);
  await sql`DROP INDEX "IDX_events_audit_event_id";`.execute(db);
  await sql`DROP INDEX "IDX_events_audit_deleted_at";`.execute(db);
  await sql`CREATE TABLE "event" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "ownerId" uuid NOT NULL,
  "eventName" character varying NOT NULL DEFAULT 'Untitled Event',
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "eventThumbnailAssetId" uuid,
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "description" text NOT NULL DEFAULT '',
  "deletedAt" timestamp with time zone,
  "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  CONSTRAINT "event_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "event_eventThumbnailAssetId_fkey" FOREIGN KEY ("eventThumbnailAssetId") REFERENCES "asset" ("id") ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`COMMENT ON COLUMN "event"."eventThumbnailAssetId" IS 'Asset ID to be used as thumbnail';`.execute(db);
  await sql`CREATE INDEX "event_ownerId_idx" ON "event" ("ownerId");`.execute(db);
  await sql`CREATE INDEX "event_eventThumbnailAssetId_idx" ON "event" ("eventThumbnailAssetId");`.execute(db);
  await sql`CREATE INDEX "event_updateId_idx" ON "event" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "event_delete_audit"
  AFTER DELETE ON "event"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION event_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "events_updatedAt"
  BEFORE UPDATE ON "event"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`ALTER TABLE "events_audit" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();`.execute(db);
  await sql`ALTER TABLE "events_audit" RENAME CONSTRAINT "PK_events_audit" TO "events_audit_pkey";`.execute(db);
  await sql`DROP TRIGGER IF EXISTS "events_delete_audit" ON "events";`.execute(db);
  await sql`DROP FUNCTION IF EXISTS events_delete_audit;`.execute(db);
  await sql`ALTER TABLE "album" ADD "eventId" uuid NOT NULL;`.execute(db);
  await sql`ALTER TABLE "album" ADD CONSTRAINT "album_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event" ("id") ON UPDATE CASCADE ON DELETE SET NULL;`.execute(db);
  await sql`CREATE INDEX "album_eventId_idx" ON "album" ("eventId");`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_event_delete_audit', '{"type":"function","name":"event_delete_audit","sql":"CREATE OR REPLACE FUNCTION event_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO event_audit (\\"eventId\\", \\"userId\\")\\n      SELECT \\"id\\", \\"ownerId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_event_delete_audit', '{"type":"trigger","name":"event_delete_audit","sql":"CREATE OR REPLACE TRIGGER \\"event_delete_audit\\"\\n  AFTER DELETE ON \\"event\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION event_delete_audit();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_events_updatedAt', '{"type":"trigger","name":"events_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"events_updatedAt\\"\\n  BEFORE UPDATE ON \\"event\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION public.events_delete_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      INSERT INTO events_audit ("eventId", "userId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END
  $function$
`.execute(db);
  await sql`DROP INDEX "album_eventId_idx";`.execute(db);
  await sql`ALTER TABLE "album" DROP CONSTRAINT "album_eventId_fkey";`.execute(db);
  await sql`ALTER TABLE "events_audit" ALTER COLUMN "id" SET DEFAULT immich_uuid_v7();`.execute(db);
  await sql`ALTER TABLE "events_audit" ADD "eventId" uuid NOT NULL;`.execute(db);
  await sql`ALTER TABLE "events_audit" ADD "userId" uuid NOT NULL;`.execute(db);
  await sql`ALTER TABLE "events_audit" ADD "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp();`.execute(db);
  await sql`ALTER TABLE "events_audit" RENAME CONSTRAINT "events_audit_pkey" TO "PK_events_audit";`.execute(db);
  await sql`CREATE INDEX "IDX_events_audit_user_id" ON "events_audit" ("userId");`.execute(db);
  await sql`CREATE INDEX "IDX_events_audit_event_id" ON "events_audit" ("eventId");`.execute(db);
  await sql`CREATE INDEX "IDX_events_audit_deleted_at" ON "events_audit" ("deletedAt");`.execute(db);
  await sql`ALTER TABLE "album" DROP COLUMN "eventId";`.execute(db);
  await sql`ALTER TABLE "events_audit" DROP COLUMN "eventId";`.execute(db);
  await sql`ALTER TABLE "events_audit" DROP COLUMN "userId";`.execute(db);
  await sql`ALTER TABLE "events_audit" DROP COLUMN "deletedAt";`.execute(db);
  await sql`DROP TABLE "event";`.execute(db);
  await sql`DROP FUNCTION event_delete_audit;`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_event_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_event_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_events_updatedAt';`.execute(db);
}
