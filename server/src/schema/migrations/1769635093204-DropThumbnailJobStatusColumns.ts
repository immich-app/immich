import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_job_status" DROP COLUMN "previewAt";`.execute(db);
  await sql`ALTER TABLE "asset_job_status" DROP COLUMN "thumbnailAt";`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_job_status" ADD "previewAt" timestamp with time zone;`.execute(db);
  await sql`ALTER TABLE "asset_job_status" ADD "thumbnailAt" timestamp with time zone;`.execute(db);
}
