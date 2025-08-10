import { Kysely, sql } from 'kysely';

// Add score column to auto_stack_candidate for ranking/pruning/auto-promotion
// Score range 0-100 (int). Default 0 for existing rows.
// Index to accelerate ordered listing and pruning.

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('auto_stack_candidate')
    .addColumn('score', 'integer', (col) => col.notNull().defaultTo(0))
    .execute();

  await sql`CREATE INDEX IF NOT EXISTS auto_stack_candidate_owner_score_idx ON auto_stack_candidate("ownerId", score DESC, "createdAt" DESC);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS auto_stack_candidate_owner_score_idx;`.execute(db);
  await db.schema
    .alterTable('auto_stack_candidate')
    .dropColumn('score')
    .execute();
}
