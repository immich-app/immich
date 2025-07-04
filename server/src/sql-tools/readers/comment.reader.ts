import { DatabaseReader } from 'src/sql-tools/types';

export const readComments: DatabaseReader = async (schema, db) => {
  const comments = await db
    .selectFrom('pg_description as d')
    .innerJoin('pg_class as c', 'd.objoid', 'c.oid')
    .leftJoin('pg_attribute as a', (join) =>
      join.onRef('a.attrelid', '=', 'c.oid').onRef('a.attnum', '=', 'd.objsubid'),
    )
    .select([
      'c.relname as object_name',
      'c.relkind as object_type',
      'd.description as value',
      'a.attname as column_name',
    ])
    .where('d.description', 'is not', null)
    .orderBy('object_type')
    .orderBy('object_name')
    .execute();

  for (const comment of comments) {
    if (comment.object_type === 'r') {
      const table = schema.tables.find((table) => table.name === comment.object_name);
      if (!table) {
        continue;
      }

      if (comment.column_name) {
        const column = table.columns.find(({ name }) => name === comment.column_name);
        if (column) {
          column.comment = comment.value;
        }
      }
    }
  }
};
