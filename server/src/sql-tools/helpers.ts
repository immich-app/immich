import { createHash } from 'node:crypto';
import { ColumnValue } from 'src/sql-tools/from-code/decorators/column.decorator';
import { TriggerOptions } from 'src/sql-tools/from-code/decorators/trigger.decorator';
import { FunctionOptions } from 'src/sql-tools/from-code/register-function';
import { TriggerAction, TriggerScope, TriggerTiming } from 'src/sql-tools/types';

const re = /-- sql-tools-hash=(?<hash>(.*))/;

export const asMetadataKey = (name: string) => `sql-tools:${name}`;

export const asSnakeCase = (name: string): string => name.replaceAll(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
// match TypeORM
export const asKey = (prefix: string, tableName: string, values: string[]) =>
  (prefix + sha1(`${tableName}_${values.toSorted().join('_')}`)).slice(0, 30);
export const asPrimaryKeyConstraintName = (table: string, columns: string[]) => asKey('PK_', table, columns);
export const asForeignKeyConstraintName = (table: string, columns: string[]) => asKey('FK_', table, columns);
export const asTriggerName = (table: string, trigger: TriggerOptions) =>
  asKey('TR_', table, [...trigger.actions, trigger.scope, trigger.timing, trigger.functionName]);
export const asRelationKeyConstraintName = (table: string, columns: string[]) => asKey('REL_', table, columns);
export const asUniqueConstraintName = (table: string, columns: string[]) => asKey('UQ_', table, columns);
export const asCheckConstraintName = (table: string, expression: string) => asKey('CHK_', table, [expression]);
export const asIndexName = (table: string, columns: string[] | undefined, where: string | undefined) => {
  const items: string[] = [];
  for (const columnName of columns ?? []) {
    items.push(columnName);
  }

  if (where) {
    items.push(where);
  }

  return asKey('IDX_', table, items);
};

export const asOptions = <T extends { name?: string }>(options: string | T): T => {
  if (typeof options === 'string') {
    return { name: options } as T;
  }

  return options;
};

export const extractFunctionHash = (expression: string) => {
  return expression.match(re)?.groups?.hash;
};

export const asFunctionExpression = (options: FunctionOptions, hash: string) => {
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

  sql.push(
    //
    `AS $$`,
    `  -- sql-tools-hash=${hash}`,
    '  ' + options.body.trim(),
    `$$;`,
  );

  return sql.join('\n  ').trim();
};

export const sha1 = (value: string) => createHash('sha1').update(value).digest('hex');
export const hasMask = (input: number, mask: number) => (input & mask) === mask;

export const parseTriggerType = (type: number) => {
  // eslint-disable-next-line unicorn/prefer-math-trunc
  const scope: TriggerScope = hasMask(type, 1 << 0) ? 'row' : 'statement';

  let timing: TriggerTiming = 'after';
  const timingMasks: Array<{ mask: number; value: TriggerTiming }> = [
    { mask: 1 << 1, value: 'before' },
    { mask: 1 << 6, value: 'instead of' },
  ];

  for (const { mask, value } of timingMasks) {
    if (hasMask(type, mask)) {
      timing = value;
      break;
    }
  }

  const actions: TriggerAction[] = [];
  const actionMasks: Array<{ mask: number; value: TriggerAction }> = [
    { mask: 1 << 2, value: 'insert' },
    { mask: 1 << 3, value: 'delete' },
    { mask: 1 << 4, value: 'update' },
    { mask: 1 << 5, value: 'truncate' },
  ];

  for (const { mask, value } of actionMasks) {
    if (hasMask(type, mask)) {
      actions.push(value);
      break;
    }
  }

  if (actions.length === 0) {
    throw new Error(`Unable to parse trigger type ${type}`);
  }

  return { actions, timing, scope };
};

export const fromColumnValue = (columnValue?: ColumnValue) => {
  if (columnValue === undefined) {
    return;
  }

  if (typeof columnValue === 'function') {
    return columnValue() as string;
  }

  const value = columnValue;

  if (value === null) {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }

  return `'${String(value)}'`;
};
