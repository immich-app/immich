import { sql } from 'kysely';
import { DatabaseReader, ParameterScope } from 'src/sql-tools/types';

export const readParameters: DatabaseReader = async (schema, db) => {
  const parameters = await db
    .selectFrom('pg_settings')
    .where('source', 'in', [sql.lit('database'), sql.lit('user')])
    .select(['name', 'setting as value', 'source as scope'])
    .execute();

  for (const parameter of parameters) {
    schema.parameters.push({
      name: parameter.name,
      value: parameter.value,
      databaseName: schema.databaseName,
      scope: parameter.scope as ParameterScope,
      synchronize: true,
    });
  }
};
