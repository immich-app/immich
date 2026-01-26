import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add S3 bucket column for encoded videos to match originals pattern
  await sql`
    ALTER TABLE "asset"
    ADD COLUMN IF NOT EXISTS "s3BucketEncodedVideo" character varying;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE "asset"
    DROP COLUMN IF EXISTS "s3BucketEncodedVideo";
  `.execute(db);
}
