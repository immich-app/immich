import { sql } from 'kysely';
import { Reader } from 'src/sql-tools/types';

export const readIndexes: Reader = async (ctx, db) => {
  const indexes = await db
    .selectFrom('pg_index as ix')
    // matching index, which has column information
    .innerJoin('pg_class as i', 'ix.indexrelid', 'i.oid')
    .innerJoin('pg_am as a', 'i.relam', 'a.oid')
    // matching table
    .innerJoin('pg_class as t', 'ix.indrelid', 't.oid')
    // namespace
    .innerJoin('pg_namespace', 'pg_namespace.oid', 'i.relnamespace')
    // PK and UQ constraints automatically have indexes, so we can ignore those
    .leftJoin('pg_constraint', (join) =>
      join
        .onRef('pg_constraint.conindid', '=', 'i.oid')
        .on('pg_constraint.contype', 'in', [sql.lit('p'), sql.lit('u')]),
    )
    .where('pg_constraint.oid', 'is', null)
    .select((eb) => [
      'i.relname as index_name',
      't.relname as table_name',
      'ix.indisunique as unique',
      'a.amname as using',
      eb.fn<string>('pg_get_expr', ['ix.indexprs', 'ix.indrelid']).as('expression'),
      eb.fn<string>('pg_get_expr', ['ix.indpred', 'ix.indrelid']).as('where'),
      eb
        .selectFrom('pg_attribute as a')
        .where('t.relkind', '=', sql.lit('r'))
        .whereRef('a.attrelid', '=', 't.oid')
        // list of columns numbers in the index
        .whereRef('a.attnum', '=', sql`any("ix"."indkey")`)
        .select((eb) => eb.fn<string[]>('json_agg', ['a.attname']).as('column_name'))
        .as('column_names'),
    ])
    .where('pg_namespace.nspname', '=', ctx.schemaName)
    .where('ix.indisprimary', '=', sql.lit(false))
    .execute();

  for (const index of indexes) {
    const table = ctx.getTableByName(index.table_name);
    if (!table) {
      continue;
    }

    table.indexes.push({
      name: index.index_name,
      tableName: index.table_name,
      columnNames: index.column_names ?? undefined,
      expression: index.expression ?? undefined,
      using: index.using,
      where: index.where ?? undefined,
      unique: index.unique,
      synchronize: true,
    });
  }
};
