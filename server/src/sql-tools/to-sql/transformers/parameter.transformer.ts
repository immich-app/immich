import { sql } from 'kysely';
import { SqlTransformer } from 'src/sql-tools/to-sql/transformers/types';
import { DatabaseParameter, SchemaDiff } from 'src/sql-tools/types';

export const transformParameters: SqlTransformer = (item: SchemaDiff) => {
  switch (item.type) {
    case 'parameter.set': {
      return asParameterSet(item.parameter);
    }

    case 'parameter.reset': {
      return asParameterReset(item.databaseName, item.parameterName);
    }

    default: {
      return false;
    }
  }
};

const asParameterSet = (parameter: DatabaseParameter): string => {
  let sql_str = '';
  if (parameter.scope === 'database') {
    sql_str += `ALTER DATABASE "${sql.raw(parameter.databaseName)}" `;
  }

  sql_str += `SET ${parameter.name} TO ${parameter.value}`;

  return sql_str;
};

const asParameterReset = (databaseName: string, parameterName: string): string => {
  return `ALTER DATABASE "${sql.raw(databaseName)}" RESET "${parameterName}"`;
};
