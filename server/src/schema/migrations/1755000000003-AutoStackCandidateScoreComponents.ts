import { Kysely, sql } from 'kysely';

// Add scoreComponents JSONB column to store per-factor breakdown for transparency and future learning.
// Stored shape: { size:number, timeSpan:number, continuity:number, content:number, exposure:number }

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('auto_stack_candidate')
    .addColumn('scoreComponents', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .execute();
  // Must quote "scoreComponents" because the column was created with camelCase (quoted) identifiers.
  await sql`CREATE INDEX IF NOT EXISTS auto_stack_candidate_owner_components_idx ON auto_stack_candidate("ownerId") WHERE "scoreComponents" IS NOT NULL;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS auto_stack_candidate_owner_components_idx;`.execute(db);
  await db.schema
    .alterTable('auto_stack_candidate')
    .dropColumn('scoreComponents')
    .execute();
}
