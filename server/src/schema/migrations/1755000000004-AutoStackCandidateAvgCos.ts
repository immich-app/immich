import { Kysely, sql } from 'kysely';

// Add avgCos (average cosine similarity of CLIP embeddings across asset pairs) for auditing visual similarity strength.
// Nullable because legacy candidates or those without embeddings at creation time won't have a value until rescored.

export async function up(db: Kysely<any>): Promise<void> {
  // Some dialect builders may not expose .nullable(); use explicit SQL for portability.
  await sql`ALTER TABLE auto_stack_candidate ADD COLUMN IF NOT EXISTS "avgCos" double precision NULL;`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS auto_stack_candidate_owner_avgcos_idx ON auto_stack_candidate("ownerId") WHERE "avgCos" IS NOT NULL;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS auto_stack_candidate_owner_avgcos_idx;`.execute(db);
  await db.schema
    .alterTable('auto_stack_candidate')
    .dropColumn('avgCos')
    .execute();
}
