import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TYPE "assets_status_enum" ADD VALUE IF NOT EXISTS 'partial'`.execute(db);
}

export async function down(): Promise<void> {
  // Cannot remove enum values in PostgreSQL
}
