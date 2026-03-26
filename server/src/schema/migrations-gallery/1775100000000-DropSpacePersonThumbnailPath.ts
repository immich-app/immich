import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Clear stale name copies (these were copied from personal person at creation,
  // not intentional overrides — no UI exposes manual naming)
  await db.updateTable('shared_space_person').set({ name: '' }).execute();

  await db.schema.alterTable('shared_space_person').dropColumn('thumbnailPath').execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('shared_space_person')
    .addColumn('thumbnailPath', 'varchar', (col) => col.defaultTo('').notNull())
    .execute();
}
