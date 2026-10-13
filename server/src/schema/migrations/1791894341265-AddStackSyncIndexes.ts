import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE INDEX "stack_updateId_idx" ON "stack" ("updateId");`.execute(db);
  await sql`CREATE INDEX "stack_audit_userId_idx" ON "stack_audit" ("userId");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "stack_audit_userId_idx";`.execute(db);
  await sql`DROP INDEX "stack_updateId_idx";`.execute(db);
}
