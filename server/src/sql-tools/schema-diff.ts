import { compareEnums } from 'src/sql-tools/comparers/enum.comparer';
import { compareExtensions } from 'src/sql-tools/comparers/extension.comparer';
import { compareFunctions } from 'src/sql-tools/comparers/function.comparer';
import { compareOverrides } from 'src/sql-tools/comparers/override.comparer';
import { compareParameters } from 'src/sql-tools/comparers/parameter.comparer';
import { compareTables } from 'src/sql-tools/comparers/table.comparer';
import { BaseContext } from 'src/sql-tools/contexts/base-context';
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
    ...compare(source.parameters, target.parameters, options.parameters, compareParameters()),
    ...compare(source.extensions, target.extensions, options.extensions, compareExtensions()),
    ...compare(source.functions, target.functions, options.functions, compareFunctions()),
    ...compare(source.enums, target.enums, options.enums, compareEnums()),
    ...compare(source.tables, target.tables, options.tables, compareTables(options)),
    ...compare(source.overrides, target.overrides, options.overrides, compareOverrides()),
  ];

  type SchemaName = SchemaDiff['type'];
  const itemMap: Record<SchemaName, SchemaDiff[]> = {
    ColumnRename: [],
    ConstraintRename: [],
    IndexRename: [],

    ExtensionDrop: [],
    ExtensionCreate: [],

    ParameterSet: [],
    ParameterReset: [],

    FunctionDrop: [],
    FunctionCreate: [],

    EnumDrop: [],
    EnumCreate: [],

    TriggerDrop: [],
    ConstraintDrop: [],
    TableDrop: [],
    ColumnDrop: [],
    ColumnAdd: [],
    ColumnAlter: [],
    TableCreate: [],
    ConstraintAdd: [],
    TriggerCreate: [],

    IndexCreate: [],
    IndexDrop: [],

    OverrideCreate: [],
    OverrideUpdate: [],
    OverrideDrop: [],
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
    ...itemMap.ColumnRename,
    ...constraintAdds.filter(({ constraint }) => constraint.type === ConstraintType.PRIMARY_KEY),
    ...constraintAdds.filter(({ constraint }) => constraint.type === ConstraintType.FOREIGN_KEY),
    ...constraintAdds.filter(({ constraint }) => constraint.type === ConstraintType.UNIQUE),
    ...constraintAdds.filter(({ constraint }) => constraint.type === ConstraintType.CHECK),
    ...itemMap.ConstraintRename,
    ...itemMap.IndexCreate,
    ...itemMap.IndexRename,
    ...itemMap.TriggerCreate,
    ...itemMap.ColumnDrop,
    ...itemMap.TableDrop,
    ...itemMap.EnumDrop,
    ...itemMap.FunctionDrop,
    ...itemMap.OverrideCreate,
    ...itemMap.OverrideUpdate,
    ...itemMap.OverrideDrop,
  ];

  return {
    items: orderedItems,
    asSql: (options?: SchemaDiffToSqlOptions) => schemaDiffToSql(orderedItems, options),
    asHuman: () => schemaDiffToHuman(orderedItems),
  };
};

/**
 * Convert schema diffs into SQL statements
 */
export const schemaDiffToSql = (items: SchemaDiff[], options: SchemaDiffToSqlOptions = {}): string[] => {
  return items.flatMap((item) => asSql(item, options));
};

/**
 * Convert schema diff into human readable statements
 */
export const schemaDiffToHuman = (items: SchemaDiff[]): string[] => {
  return items.flatMap((item) => asHuman(item));
};

export const asSql = (item: SchemaDiff, options: SchemaDiffToSqlOptions): string[] => {
  const ctx = new BaseContext(options);
  for (const transform of transformers) {
    const result = transform(ctx, item);
    if (!result) {
      continue;
    }

    return asArray(result).map((result) => result + withComments(options.comments, item));
  }

  throw new Error(`Unhandled schema diff type: ${item.type}`);
};

export const asHuman = (item: SchemaDiff): string => {
  switch (item.type) {
    case 'ExtensionCreate': {
      return `The extension "${item.extension.name}" is missing and needs to be created`;
    }
    case 'ExtensionDrop': {
      return `The extension "${item.extensionName}" exists but is no longer needed`;
    }
    case 'FunctionCreate': {
      return `The function "${item.function.name}" is missing and needs to be created`;
    }
    case 'FunctionDrop': {
      return `The function "${item.functionName}" exists but should be removed`;
    }
    case 'TableCreate': {
      return `The table "${item.table.name}" is missing and needs to be created`;
    }
    case 'TableDrop': {
      return `The table "${item.tableName}" exists but should be removed`;
    }
    case 'ColumnAdd': {
      return `The column "${item.column.tableName}"."${item.column.name}" is missing and needs to be created`;
    }
    case 'ColumnRename': {
      return `The column "${item.tableName}"."${item.oldName}" was renamed to "${item.tableName}"."${item.newName}"`;
    }
    case 'ColumnAlter': {
      return `The column "${item.tableName}"."${item.columnName}" has changes that need to be applied ${JSON.stringify(
        item.changes,
      )}`;
    }
    case 'ColumnDrop': {
      return `The column "${item.tableName}"."${item.columnName}" exists but should be removed`;
    }
    case 'ConstraintAdd': {
      return `The constraint "${item.constraint.tableName}"."${item.constraint.name}" (${item.constraint.type}) is missing and needs to be created`;
    }
    case 'ConstraintRename': {
      return `The constraint "${item.tableName}"."${item.oldName}" was renamed to "${item.tableName}"."${item.newName}"`;
    }
    case 'ConstraintDrop': {
      return `The constraint "${item.tableName}"."${item.constraintName}" exists but should be removed`;
    }
    case 'IndexCreate': {
      return `The index "${item.index.tableName}"."${item.index.name}" is missing and needs to be created`;
    }
    case 'IndexRename': {
      return `The index "${item.tableName}"."${item.oldName}" was renamed to "${item.tableName}"."${item.newName}"`;
    }
    case 'IndexDrop': {
      return `The index "${item.indexName}" exists but is no longer needed`;
    }
    case 'TriggerCreate': {
      return `The trigger "${item.trigger.tableName}"."${item.trigger.name}" is missing and needs to be created`;
    }
    case 'TriggerDrop': {
      return `The trigger "${item.tableName}"."${item.triggerName}" exists but is no longer needed`;
    }
    case 'ParameterSet': {
      return `The configuration parameter "${item.parameter.name}" has a different value and needs to be updated to "${item.parameter.value}"`;
    }
    case 'ParameterReset': {
      return `The configuration parameter "${item.parameterName}" is set, but should be reset to the default value`;
    }
    case 'EnumCreate': {
      return `The enum "${item.enum.name}" is missing and needs to be created`;
    }
    case 'EnumDrop': {
      return `The enum "${item.enumName}" exists but is no longer needed`;
    }
    case 'OverrideCreate': {
      return `The override "${item.override.name}" is missing and needs to be created`;
    }
    case 'OverrideUpdate': {
      return `The override "${item.override.name}" needs to be updated`;
    }
    case 'OverrideDrop': {
      return `The override "${item.overrideName}" exists but is no longer needed`;
    }
  }
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
