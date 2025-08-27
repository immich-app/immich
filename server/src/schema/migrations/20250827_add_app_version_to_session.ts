import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('session')
    .addColumn('appVersion', 'varchar(32)', (col) => col.defaultTo('').notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('session')
    .dropColumn('appVersion')
    .execute();
}
