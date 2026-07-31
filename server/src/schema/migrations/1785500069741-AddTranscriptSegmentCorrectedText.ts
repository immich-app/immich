import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "transcript_segment" ADD "correctedText" text;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "transcript_segment" DROP COLUMN "correctedText";`.execute(db);
}
