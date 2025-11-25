import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  sql`ALTER TABLE asset_file ADD COLUMN edited BOOLEAN NOT NULL DEFAULT FALSE`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  sql`ALTER TABLE asset_file DROP COLUMN edited`.execute(db);
}
