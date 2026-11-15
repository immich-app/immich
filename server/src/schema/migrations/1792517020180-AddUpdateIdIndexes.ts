import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE INDEX "stack_updateId_idx" ON "stack" ("updateId");`.execute(db);
  await sql`CREATE INDEX "asset_face_updateId_idx" ON "asset_face" ("updateId");`.execute(db);
  await sql`CREATE INDEX "workflow_updateId_idx" ON "workflow" ("updateId");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "stack_updateId_idx";`.execute(db);
  await sql`DROP INDEX "workflow_updateId_idx";`.execute(db);
  await sql`DROP INDEX "asset_face_updateId_idx";`.execute(db);
}
