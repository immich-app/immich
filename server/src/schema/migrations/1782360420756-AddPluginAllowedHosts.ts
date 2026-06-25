import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "plugin" ADD "allowedHosts" character varying[] NOT NULL DEFAULT '{}';`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "plugin" DROP COLUMN "allowedHosts";`.execute(db);
}
