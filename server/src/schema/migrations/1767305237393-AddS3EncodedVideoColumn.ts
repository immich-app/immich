import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add S3 key column for encoded videos
  await sql`
    ALTER TABLE "asset"
    ADD COLUMN IF NOT EXISTS "s3KeyEncodedVideo" character varying;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE "asset"
    DROP COLUMN IF EXISTS "s3KeyEncodedVideo";
  `.execute(db);
}
