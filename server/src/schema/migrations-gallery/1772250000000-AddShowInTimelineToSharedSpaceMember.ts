import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "shared_space_member" ADD "showInTimeline" boolean NOT NULL DEFAULT true;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "shared_space_member" DROP COLUMN "showInTimeline";`.execute(db);
}
