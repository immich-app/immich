import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "plugin_method" ADD "allowedHosts" character varying[] NOT NULL DEFAULT '{}';`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "plugin_method" DROP COLUMN "allowedHosts";`.execute(db);
}
