import { createHash } from 'node:crypto';
import { ColumnValue } from 'src/sql-tools/from-code/decorators/column.decorator';
import {
  Comparer,
  DatabaseColumn,
  DiffOptions,
  SchemaDiff,
  TriggerAction,
  TriggerScope,
  TriggerTiming,
} from 'src/sql-tools/types';

export const asMetadataKey = (name: string) => `sql-tools:${name}`;

export const asSnakeCase = (name: string): string => name.replaceAll(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
// match TypeORM
export const asKey = (prefix: string, tableName: string, values: string[]) =>
  (prefix + sha1(`${tableName}_${values.toSorted().join('_')}`)).slice(0, 30);

export const asOptions = <T extends { name?: string }>(options: string | T): T => {
  if (typeof options === 'string') {
    return { name: options } as T;
  }

  return options;
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

export const setIsEqual = (source: Set<unknown>, target: Set<unknown>) =>
  source.size === target.size && [...source].every((x) => target.has(x));

export const haveEqualColumns = (sourceColumns?: string[], targetColumns?: string[]) => {
  return setIsEqual(new Set(sourceColumns ?? []), new Set(targetColumns ?? []));
};

export const compare = <T extends { name: string; synchronize: boolean }>(
  sources: T[],
  targets: T[],
  options: DiffOptions | undefined,
  comparer: Comparer<T>,
) => {
  options = options || {};
  const sourceMap = Object.fromEntries(sources.map((table) => [table.name, table]));
  const targetMap = Object.fromEntries(targets.map((table) => [table.name, table]));
  const items: SchemaDiff[] = [];

  const keys = new Set([...Object.keys(sourceMap), ...Object.keys(targetMap)]);
  for (const key of keys) {
    const source = sourceMap[key];
    const target = targetMap[key];

    if (isIgnored(source, target, options)) {
      continue;
    }

    if (isSynchronizeDisabled(source, target)) {
      continue;
    }

    if (source && !target) {
      items.push(...comparer.onMissing(source));
    } else if (!source && target) {
      items.push(...comparer.onExtra(target));
    } else {
      items.push(...comparer.onCompare(source, target));
    }
  }

  return items;
};

const isIgnored = (
  source: { synchronize?: boolean } | undefined,
  target: { synchronize?: boolean } | undefined,
  options: DiffOptions,
) => {
  return (options.ignoreExtra && !source) || (options.ignoreMissing && !target);
};

const isSynchronizeDisabled = (source?: { synchronize?: boolean }, target?: { synchronize?: boolean }) => {
  return source?.synchronize === false || target?.synchronize === false;
};

export const isDefaultEqual = (source: DatabaseColumn, target: DatabaseColumn) => {
  if (source.default === target.default) {
    return true;
  }

  if (source.default === undefined || target.default === undefined) {
    return false;
  }

  if (
    withTypeCast(source.default, getColumnType(source)) === target.default ||
    source.default === withTypeCast(target.default, getColumnType(target))
  ) {
    return true;
  }

  return false;
};

export const getColumnType = (column: DatabaseColumn) => {
  let type = column.enumName || column.type;
  if (column.isArray) {
    type += `[${column.length ?? ''}]`;
  } else if (column.length !== undefined) {
    type += `(${column.length})`;
  }

  return type;
};

const withTypeCast = (value: string, type: string) => {
  if (!value.startsWith(`'`)) {
    value = `'${value}'`;
  }
  return `${value}::${type}`;
};

export const getColumnModifiers = (column: DatabaseColumn) => {
  const modifiers: string[] = [];

  if (!column.nullable) {
    modifiers.push('NOT NULL');
  }

  if (column.default) {
    modifiers.push(`DEFAULT ${column.default}`);
  }
  if (column.identity) {
    modifiers.push(`GENERATED ALWAYS AS IDENTITY`);
  }

  return modifiers.length === 0 ? '' : ' ' + modifiers.join(' ');
};

export const asColumnComment = (tableName: string, columnName: string, comment: string): string => {
  return `COMMENT ON COLUMN "${tableName}"."${columnName}" IS '${comment}';`;
};

export const asColumnList = (columns: string[]) => columns.map((column) => `"${column}"`).join(', ');
