import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add source column to stack table
  // Defaults to 'MANUAL' for existing stacks (conservative approach)
  await sql`
    ALTER TABLE stack
    ADD COLUMN source text NOT NULL DEFAULT 'MANUAL'
  `.execute(db);

  // Create index for efficient filtering by source
  await sql`
    CREATE INDEX stack_source_idx ON stack(source)
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop the index
  await sql`DROP INDEX IF EXISTS stack_source_idx`.execute(db);

  // Remove the source column
  await sql`
    ALTER TABLE stack
    DROP COLUMN source
  `.execute(db);
}
