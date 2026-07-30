import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "transcript_segment" ADD "noSpeechProbability" real;`.execute(db);
  await sql`ALTER TABLE "transcript_segment" ADD "avgLogProbability" real;`.execute(db);
  await sql`ALTER TABLE "transcript_segment" ADD "compressionRatio" real;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "transcript_segment" DROP COLUMN "noSpeechProbability";`.execute(db);
  await sql`ALTER TABLE "transcript_segment" DROP COLUMN "avgLogProbability";`.execute(db);
  await sql`ALTER TABLE "transcript_segment" DROP COLUMN "compressionRatio";`.execute(db);
}
