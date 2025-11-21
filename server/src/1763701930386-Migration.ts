import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "album" DROP CONSTRAINT "album_eventId_fkey";`.execute(db);
  await sql`ALTER TABLE "album" ALTER COLUMN "eventId" SET NOT NULL;`.execute(db);
  await sql`ALTER TABLE "events_audit" ADD "eventId" character varying NOT NULL;`.execute(db);
  await sql`ALTER TABLE "events_audit" ADD "userId" character varying NOT NULL;`.execute(db);
  await sql`ALTER TABLE "events_audit" ADD "deletedAt" character varying NOT NULL DEFAULT 'clock_timestamp()';`.execute(db);
  await sql`ALTER TABLE "album" ADD CONSTRAINT "album_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`ALTER TABLE "events_audit" DROP COLUMN "eventId";`.execute(db);
  await sql`ALTER TABLE "events_audit" DROP COLUMN "userId";`.execute(db);
  await sql`ALTER TABLE "events_audit" DROP COLUMN "deletedAt";`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "album" DROP CONSTRAINT "album_eventId_fkey";`.execute(db);
  await sql`ALTER TABLE "album" ALTER COLUMN "eventId" DROP NOT NULL;`.execute(db);
  await sql`ALTER TABLE "events_audit" ADD "eventId" uuid NOT NULL;`.execute(db);
  await sql`ALTER TABLE "events_audit" ADD "userId" uuid NOT NULL;`.execute(db);
  await sql`ALTER TABLE "events_audit" ADD "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp();`.execute(db);
  await sql`ALTER TABLE "album" ADD CONSTRAINT "album_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event" ("id") ON UPDATE CASCADE ON DELETE SET NULL;`.execute(db);
  await sql`ALTER TABLE "events_audit" DROP COLUMN "eventId";`.execute(db);
  await sql`ALTER TABLE "events_audit" DROP COLUMN "userId";`.execute(db);
  await sql`ALTER TABLE "events_audit" DROP COLUMN "deletedAt";`.execute(db);
}
