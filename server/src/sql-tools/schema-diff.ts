import { compareEnums } from 'src/sql-tools/comparers/enum.comparer';
import { compareExtensions } from 'src/sql-tools/comparers/extension.comparer';
import { compareFunctions } from 'src/sql-tools/comparers/function.comparer';
import { compareParameters } from 'src/sql-tools/comparers/parameter.comparer';
import { compareTables } from 'src/sql-tools/comparers/table.comparer';
import { compare } from 'src/sql-tools/helpers';
import { transformers } from 'src/sql-tools/transformers';
import {
  ConstraintType,
  DatabaseSchema,
  SchemaDiff,
  SchemaDiffOptions,
  SchemaDiffToSqlOptions,
} from 'src/sql-tools/types';

/**
 * Compute the difference between two database schemas
 */
export const schemaDiff = (source: DatabaseSchema, target: DatabaseSchema, options: SchemaDiffOptions = {}) => {
  const items = [
    ...compare(source.parameters, target.parameters, options.parameters, compareParameters),
    ...compare(source.extensions, target.extensions, options.extension, compareExtensions),
    ...compare(source.functions, target.functions, options.functions, compareFunctions),
    ...compare(source.enums, target.enums, options.enums, compareEnums),
    ...compare(source.tables, target.tables, options.tables, compareTables),
  ];

  type SchemaName = SchemaDiff['type'];
  const itemMap: Record<SchemaName, SchemaDiff[]> = {
    EnumCreate: [],
    EnumDrop: [],
    ExtensionCreate: [],
    ExtensionDrop: [],
    FunctionCreate: [],
    FunctionDrop: [],
    TableCreate: [],
    TableDrop: [],
    ColumnAdd: [],
    ColumnAlter: [],
    ColumnDrop: [],
    ConstraintAdd: [],
    ConstraintDrop: [],
    IndexCreate: [],
    IndexDrop: [],
    TriggerCreate: [],
    TriggerDrop: [],
    ParameterSet: [],
    ParameterReset: [],
  };

  for (const item of items) {
    itemMap[item.type].push(item);
  }

  const constraintAdds = itemMap.ConstraintAdd.filter((item) => item.type === 'ConstraintAdd');

  const orderedItems = [
    ...itemMap.ExtensionCreate,
    ...itemMap.FunctionCreate,
    ...itemMap.ParameterSet,
    ...itemMap.ParameterReset,
    ...itemMap.EnumCreate,
    ...itemMap.TriggerDrop,
    ...itemMap.IndexDrop,
    ...itemMap.ConstraintDrop,
    ...itemMap.TableCreate,
    ...itemMap.ColumnAlter,
    ...itemMap.ColumnAdd,
    ...constraintAdds.filter(({ constraint }) => constraint.type === ConstraintType.PRIMARY_KEY),
    ...constraintAdds.filter(({ constraint }) => constraint.type === ConstraintType.FOREIGN_KEY),
    ...constraintAdds.filter(({ constraint }) => constraint.type === ConstraintType.UNIQUE),
    ...constraintAdds.filter(({ constraint }) => constraint.type === ConstraintType.CHECK),
    ...itemMap.IndexCreate,
    ...itemMap.TriggerCreate,
    ...itemMap.ColumnDrop,
    ...itemMap.TableDrop,
    ...itemMap.EnumDrop,
    ...itemMap.FunctionDrop,
  ];

  return {
    items: orderedItems,
    asSql: (options?: SchemaDiffToSqlOptions) => schemaDiffToSql(orderedItems, options),
  };
};

/**
 * Convert schema diffs into SQL statements
 */
export const schemaDiffToSql = (items: SchemaDiff[], options: SchemaDiffToSqlOptions = {}): string[] => {
  return items.flatMap((item) => asSql(item).map((result) => result + withComments(options.comments, item)));
};

const asSql = (item: SchemaDiff): string[] => {
  for (const transform of transformers) {
    const result = transform(item);
    if (!result) {
      continue;
    }

    return asArray(result);
  }

  throw new Error(`Unhandled schema diff type: ${item.type}`);
};

const withComments = (comments: boolean | undefined, item: SchemaDiff): string => {
  if (!comments) {
    return '';
  }

  return ` -- ${item.reason}`;
};

const asArray = <T>(items: T | T[]): T[] => {
  if (Array.isArray(items)) {
    return items;
  }

  return [items];
};
