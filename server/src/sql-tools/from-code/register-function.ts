import { register } from 'src/sql-tools/from-code/register';
import { asFunctionExpression, sha1 } from 'src/sql-tools/helpers';
import { ColumnType, DatabaseFunction } from 'src/sql-tools/types';

export type FunctionOptions = {
  name: string;
  arguments?: string[];
  returnType: ColumnType | string;
  language?: 'SQL' | 'PLPGSQL';
  behavior?: 'immutable' | 'stable' | 'volatile';
  parallel?: 'safe' | 'unsafe' | 'restricted';
  strict?: boolean;
  body: string;
  synchronize?: boolean;
};

export const registerFunction = (options: FunctionOptions) => {
  const name = options.name;
  const placeholder = 'SQL_TOOLS_HASH_PLACEHOLDER';

  // TODO format the SQL to avoid whitespace/case changes leading to a different hash?
  // const hash = sha1(asExpression({...options, body: format(options.body)}, placeholder));
  const hash = sha1(asFunctionExpression(options, placeholder));
  const expressionWithHash = asFunctionExpression(options, hash);

  const item: DatabaseFunction = {
    name,
    expression: expressionWithHash,
    hash,
    synchronize: options.synchronize ?? true,
  };

  register({ type: 'function', item });

  return item;
};
