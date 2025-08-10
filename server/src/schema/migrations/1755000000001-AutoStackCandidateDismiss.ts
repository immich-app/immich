import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('auto_stack_candidate')
  .addColumn('dismissedAt', 'timestamptz', (col: any) => col.defaultTo(sql`NULL`))
    .execute();
  await db.schema
    .alterTable('auto_stack_candidate')
  .addColumn('promotedStackId', 'uuid', (col: any) => col.defaultTo(sql`NULL`))
    .execute();
  await db.schema
    .createIndex('idx_auto_stack_candidate_active')
    .on('auto_stack_candidate')
    .columns(['ownerId'])
  .where((eb: any) =>
      eb.and([
        eb('dismissedAt', 'is', null),
        eb('promotedStackId', 'is', null),
      ]),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_auto_stack_candidate_active').execute();
  await db.schema
    .alterTable('auto_stack_candidate')
    .dropColumn('promotedStackId')
    .execute();
  await db.schema
    .alterTable('auto_stack_candidate')
    .dropColumn('dismissedAt')
    .execute();
}
