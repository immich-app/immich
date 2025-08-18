import { Kysely, sql } from 'kysely';

// Add composite index to speed up candidate listing by owner with ordering by score desc, createdAt desc
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE INDEX IF NOT EXISTS "auto_stack_candidate_owner_score_created_idx"
    ON "auto_stack_candidate" ("ownerId", "score" DESC, "createdAt" DESC);
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS "auto_stack_candidate_owner_score_created_idx";`.execute(db);
}
