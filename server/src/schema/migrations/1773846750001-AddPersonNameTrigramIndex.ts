import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE INDEX "idx_person_name_trigram" ON "person" USING gin (f_unaccent("name") gin_trgm_ops)`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "idx_person_name_trigram"`.execute(db);
}
