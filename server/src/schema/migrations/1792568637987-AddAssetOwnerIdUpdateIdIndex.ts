import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE INDEX "asset_ownerId_updateId_idx" ON "asset" ("ownerId", "updateId");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "asset_ownerId_updateId_idx";`.execute(db);
}
