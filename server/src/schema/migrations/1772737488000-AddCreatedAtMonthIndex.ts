import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE INDEX "asset_createdAt_month_idx" ON "asset" ((date_trunc('MONTH'::text, ("createdAt" AT TIME ZONE 'UTC'::text)) AT TIME ZONE 'UTC'::text));`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "asset_createdAt_month_idx";`.execute(db);
}
