import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TYPE "asset_visibility_enum" ADD VALUE IF NOT EXISTS 'locked';`.execute(db);
}

export async function down(): Promise<void> {
  // noop
}
