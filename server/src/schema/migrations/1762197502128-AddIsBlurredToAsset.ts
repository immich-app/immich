import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('asset') 
    .addColumn('isBlurred', 'boolean', (col: any) => col.defaultTo(false).notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('asset') 
    .dropColumn('isBlurred')
    .execute();
}
