import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "albums" ADD "isPublicInInstance" boolean NOT NULL DEFAULT false`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "albums" DROP COLUMN "isPublicInInstance"`.execute(db);
}
