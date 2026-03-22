import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "person" ADD "type" character varying NOT NULL DEFAULT 'person'`.execute(db);
  await sql`ALTER TABLE "person" ADD "species" character varying`.execute(db);
  await sql`ALTER TABLE "asset_job_status" ADD "petsDetectedAt" timestamp with time zone`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_job_status" DROP COLUMN "petsDetectedAt"`.execute(db);
  await sql`ALTER TABLE "person" DROP COLUMN "species"`.execute(db);
  await sql`ALTER TABLE "person" DROP COLUMN "type"`.execute(db);
}
