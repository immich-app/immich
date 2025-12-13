import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" timestamp with time zone NOT NULL DEFAULT now(), "updatedAt" timestamp with time zone NOT NULL DEFAULT now(), "deletedAt" timestamp with time zone, "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(), "userId" uuid, "level" character varying NOT NULL DEFAULT 'info', "type" character varying NOT NULL DEFAULT 'info', "data" jsonb, "title" character varying NOT NULL, "description" text, "readAt" timestamp with time zone);`.execute(db);
  await sql`ALTER TABLE "notifications" ADD CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`CREATE INDEX "IDX_notifications_update_id" ON "notifications" ("updateId")`.execute(db);
  await sql`CREATE INDEX "IDX_692a909ee0fa9383e7859f9b40" ON "notifications" ("userId")`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "notifications_updated_at"
  BEFORE UPDATE ON "notifications"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "notifications_updated_at" ON "notifications";`.execute(db);
  await sql`DROP INDEX "IDX_notifications_update_id";`.execute(db);
  await sql`DROP INDEX "IDX_692a909ee0fa9383e7859f9b40";`.execute(db);
  await sql`ALTER TABLE "notifications" DROP CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a";`.execute(db);
  await sql`ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406";`.execute(db);
  await sql`DROP TABLE "notifications";`.execute(db);
}
