import { sql } from 'kysely';
import { ParameterScope, Reader } from 'src/sql-tools/types';

export const readParameters: Reader = async (ctx, db) => {
  const parameters = await db
    .selectFrom('pg_settings')
    .where('source', 'in', [sql.lit('database'), sql.lit('user')])
    .select(['name', 'setting as value', 'source as scope'])
    .execute();

  for (const parameter of parameters) {
    ctx.parameters.push({
      name: parameter.name,
      value: parameter.value,
      databaseName: ctx.databaseName,
      scope: parameter.scope as ParameterScope,
      synchronize: true,
    });
  }
};
