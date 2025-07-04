import { SqlTransformer } from 'src/sql-tools/transformers/types';
import { DatabaseFunction, SchemaDiff } from 'src/sql-tools/types';

export const transformFunctions: SqlTransformer = (item: SchemaDiff) => {
  switch (item.type) {
    case 'FunctionCreate': {
      return asFunctionCreate(item.function);
    }

    case 'FunctionDrop': {
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
