import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "integrity_report" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "type" character varying NOT NULL,
  "path" character varying NOT NULL,
  CONSTRAINT "integrity_report_type_path_uq" UNIQUE ("type", "path"),
  CONSTRAINT "integrity_report_pkey" PRIMARY KEY ("id")
);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "integrity_report";`.execute(db);
}
