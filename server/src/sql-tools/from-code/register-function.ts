import { register } from 'src/sql-tools/from-code/register';
import { asFunctionExpression } from 'src/sql-tools/helpers';
import { ColumnType, DatabaseFunction } from 'src/sql-tools/types';

export type FunctionOptions = {
  name: string;
  arguments?: string[];
  returnType: ColumnType | string;
  language?: 'SQL' | 'PLPGSQL';
  behavior?: 'immutable' | 'stable' | 'volatile';
  parallel?: 'safe' | 'unsafe' | 'restricted';
  strict?: boolean;
  synchronize?: boolean;
} & ({ body: string } | { return: string });

export const registerFunction = (options: FunctionOptions) => {
  const name = options.name;
  const expression = asFunctionExpression(options);

  const item: DatabaseFunction = {
    name,
    expression,
    synchronize: options.synchronize ?? true,
  };

  register({ type: 'function', item });

  return item;
};
