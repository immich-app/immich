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
  let sql = '';
  if (parameter.scope === 'database') {
    sql += `ALTER DATABASE "${parameter.databaseName}" `;
  }

  sql += `SET ${parameter.name} TO ${parameter.value}`;

  return sql;
};

const asParameterReset = (databaseName: string, parameterName: string): string => {
  return `ALTER DATABASE "${databaseName}" RESET "${parameterName}"`;
};
