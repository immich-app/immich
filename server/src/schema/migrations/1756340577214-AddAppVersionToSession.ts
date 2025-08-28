import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "session" ADD "appVersion" character varying NOT NULL DEFAULT '';`.execute(db);
  await sql`ALTER TABLE "session" DROP COLUMN "appVersion";`.execute(db);
  await sql`ALTER TABLE "session" DROP COLUMN "app_version";`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "session" ADD "appVersion" character varying(32) NOT NULL DEFAULT ''::character varying;`.execute(db);
  await sql`ALTER TABLE "session" ADD "app_version" character varying NOT NULL DEFAULT ''::character varying;`.execute(db);
  await sql`ALTER TABLE "session" DROP COLUMN "appVersion";`.execute(db);
}
