import { Kysely, sql } from 'kysely';
import { columns } from 'src/database';

export async function up(db: Kysely<any>): Promise<void> {
  const tags = await db.selectFrom('tags').select(columns.tag).execute();
  return db.transaction().execute(async (tx) => {
    for (const tag of tags) {
      await tx
        .insertInto('tags_closure')
        .values({ id_ancestor: tag.id, id_descendant: tag.id })
        .onConflict((oc) => oc.doNothing())
        .execute();

      if (tag.parentId) {
        await tx
          .insertInto('tags_closure')
          .columns(['id_ancestor', 'id_descendant'])
          .expression(
            db
              .selectFrom('tags_closure')
              .select(['id_ancestor', sql.raw<string>(`'${tag.id}'`).as('id_descendant')])
              .where('id_descendant', '=', tag.parentId),
          )
          .onConflict((oc) => oc.doNothing())
          .execute();
      }
    }
  });
}

export async function down(_: Kysely<any>): Promise<void> { }
