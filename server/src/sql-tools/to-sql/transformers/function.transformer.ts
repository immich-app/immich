import { SqlTransformer } from 'src/sql-tools/to-sql/transformers/types';
import { DatabaseFunction, SchemaDiff } from 'src/sql-tools/types';

export const transformFunctions: SqlTransformer = (item: SchemaDiff) => {
  switch (item.type) {
    case 'function.create': {
      return asFunctionCreate(item.function);
    }

    case 'function.drop': {
      return asFunctionDrop(item.functionName);
    }

    default: {
      return false;
    }
  }
};

const asFunctionCreate = (func: DatabaseFunction): string => {
  return func.expression;
};

const asFunctionDrop = (functionName: string): string => {
  return `DROP FUNCTION ${functionName};`;
};
