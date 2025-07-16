import { SqlTransformer } from 'src/sql-tools/transformers/types';
import { DatabaseFunction } from 'src/sql-tools/types';

export const transformFunctions: SqlTransformer = (ctx, item) => {
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

export const asFunctionCreate = (func: DatabaseFunction): string => {
  return func.expression;
};

const asFunctionDrop = (functionName: string): string => {
  return `DROP FUNCTION ${functionName};`;
};
