import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('shared_space_member').addColumn('lastViewedAt', 'timestamptz').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('shared_space_member').dropColumn('lastViewedAt').execute();
}
