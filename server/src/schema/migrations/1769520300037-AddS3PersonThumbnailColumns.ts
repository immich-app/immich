import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE "person"
    ADD COLUMN IF NOT EXISTS "storageBackend" storage_backend_enum NOT NULL DEFAULT 'local',
    ADD COLUMN IF NOT EXISTS "s3Bucket" character varying,
    ADD COLUMN IF NOT EXISTS "s3Key" character varying;
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS "person_storage_backend_idx" ON "person" ("storageBackend")
    WHERE "storageBackend" = 's3';
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS "person_storage_backend_idx";`.execute(db);
  await sql`
    ALTER TABLE "person"
    DROP COLUMN IF EXISTS "storageBackend",
    DROP COLUMN IF EXISTS "s3Bucket",
    DROP COLUMN IF EXISTS "s3Key";
  `.execute(db);
}
