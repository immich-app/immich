import { register } from 'src/sql-tools/from-code/register';
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

const asFunctionExpression = (options: FunctionOptions) => {
  const name = options.name;
  const sql: string[] = [
    `CREATE OR REPLACE FUNCTION ${name}(${(options.arguments || []).join(', ')})`,
    `RETURNS ${options.returnType}`,
  ];

  const flags = [
    options.parallel ? `PARALLEL ${options.parallel.toUpperCase()}` : undefined,
    options.strict ? 'STRICT' : undefined,
    options.behavior ? options.behavior.toUpperCase() : undefined,
    `LANGUAGE ${options.language ?? 'SQL'}`,
  ].filter((x) => x !== undefined);

  if (flags.length > 0) {
    sql.push(flags.join(' '));
  }

  if ('return' in options) {
    sql.push(`  RETURN ${options.return}`);
  }

  if ('body' in options) {
    const body = options.body;
    sql.push(...(body.includes('\n') ? [`AS $$`, '  ' + body.trim(), `$$;`] : [`AS $$${body}$$;`]));
  }

  return sql.join('\n  ').trim();
};
