import { getColumnType, schemaDiffToSql } from 'src/sql-tools/schema-diff-to-sql';
import {
  DatabaseCheckConstraint,
  DatabaseColumn,
  DatabaseConstraint,
  DatabaseConstraintType,
  DatabaseEnum,
  DatabaseExtension,
  DatabaseForeignKeyConstraint,
  DatabaseFunction,
  DatabaseIndex,
  DatabaseParameter,
  DatabasePrimaryKeyConstraint,
  DatabaseSchema,
  DatabaseTable,
  DatabaseTrigger,
  DatabaseUniqueConstraint,
  DiffOptions,
  SchemaDiff,
  SchemaDiffOptions,
  SchemaDiffToSqlOptions,
} from 'src/sql-tools/types';

enum Reason {
  MissingInSource = 'missing in source',
  MissingInTarget = 'missing in target',
}

const prepare = <T extends { name: string }>(sources: T[], targets: T[]) => {
  const sourceMap = Object.fromEntries(sources.map((table) => [table.name, table]));
  const targetMap = Object.fromEntries(targets.map((table) => [table.name, table]));
  const keys = new Set([...Object.keys(sourceMap), ...Object.keys(targetMap)]);
  return { keys, sourceMap, targetMap };
};

const setIsEqual = (source: Set<unknown>, target: Set<unknown>) =>
  source.size === target.size && [...source].every((x) => target.has(x));

const haveEqualColumns = (sourceColumns?: string[], targetColumns?: string[]) => {
  return setIsEqual(new Set(sourceColumns ?? []), new Set(targetColumns ?? []));
};

const isIgnored = (
  source: { synchronize?: boolean } | undefined,
  target: { synchronize?: boolean } | undefined,
  options: DiffOptions,
) => {
  return (
    (options.ignoreExtra && !source) || (options.ignoreMissing && !target) || isSynchronizeDisabled(source, target)
  );
};

const isSynchronizeDisabled = (source?: { synchronize?: boolean }, target?: { synchronize?: boolean }) => {
  return source?.synchronize === false || target?.synchronize === false;
};

const withTypeCast = (value: string, type: string) => {
  if (!value.startsWith(`'`)) {
    value = `'${value}'`;
  }
  return `${value}::${type}`;
};

const isDefaultEqual = (source: DatabaseColumn, target: DatabaseColumn) => {
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

/**
 * Compute the difference between two database schemas
 */
export const schemaDiff = (source: DatabaseSchema, target: DatabaseSchema, options: SchemaDiffOptions = {}) => {
  const enumCreates = [];
  const constraintDrops = [];
  const extensionsCreates = [];
  const extensionsDrops = [];
  const functionCreates = [];
  const tableCreates = [];
  const everythingElse = [];
  const primaryKeyCreates = [];
  const foreignKeyCreates = [];
  const constraintAdds = [];

  const items = diffSchema(source, target, options);

  for (const item of items) {
    switch (item.type) {
      case 'enum.create': {
        enumCreates.push(item);
        break;
      }

      case 'extension.create': {
        extensionsCreates.push(item);
        break;
      }

      case 'extension.drop': {
        extensionsDrops.push(item);
        break;
      }

      case 'function.create': {
        functionCreates.push(item);
        break;
      }

      case 'table.create': {
        tableCreates.push(item);
        break;
      }

      case 'constraint.drop': {
        constraintDrops.push(item);
        break;
      }

      case 'constraint.add': {
        if (item.constraint.type === DatabaseConstraintType.PRIMARY_KEY) {
          primaryKeyCreates.push(item);
          break;
        }
        if (item.constraint.type === DatabaseConstraintType.FOREIGN_KEY) {
          foreignKeyCreates.push(item);
          break;
        }
        constraintAdds.push(item);
        break;
      }

      default: {
        everythingElse.push(item);
      }
    }
  }

  const orderedItems = [
    ...extensionsCreates,
    ...constraintDrops,
    ...enumCreates,
    ...functionCreates,
    ...tableCreates,
    ...everythingElse,
    ...primaryKeyCreates,
    ...foreignKeyCreates,
    ...constraintAdds,
    ...extensionsDrops,
  ];

  return {
    items: orderedItems,
    asSql: (options?: SchemaDiffToSqlOptions) => schemaDiffToSql(orderedItems, options),
  };
};

const diffSchema = (source: DatabaseSchema, target: DatabaseSchema, options: SchemaDiffOptions) => {
  return [
    ...diffParameters(source.parameters, target.parameters, options.parameters),
    ...diffExtensions(source.extensions, target.extensions, options.extension),
    ...diffFunctions(source.functions, target.functions, options.functions),
    ...diffEnums(source.enums, target.enums, options.enums),
    ...diffTables(source.tables, target.tables, options.tables),
  ];
};

const diffParameters = (sources: DatabaseParameter[], targets: DatabaseParameter[], options: DiffOptions = {}) => {
  const items: SchemaDiff[] = [];
  const { keys, sourceMap, targetMap } = prepare(sources, targets);
  for (const key of keys) {
    items.push(...diffParameter(sourceMap[key], targetMap[key], options));
  }

  return items;
};

const diffParameter = (
  source: DatabaseParameter | undefined,
  target: DatabaseParameter | undefined,
  options: DiffOptions,
): SchemaDiff[] => {
  if (isIgnored(source, target, options)) {
    return [];
  }

  if (source && !target) {
    return [
      {
        type: 'parameter.set',
        parameter: source,
        reason: Reason.MissingInTarget,
      },
    ];
  }

  if (!source && target) {
    return [
      {
        type: 'parameter.reset',
        databaseName: target.databaseName,
        parameterName: target.name,
        reason: Reason.MissingInSource,
      },
    ];
  }

  return [];
};

const diffExtensions = (sources: DatabaseExtension[], targets: DatabaseExtension[], options: DiffOptions = {}) => {
  const items: SchemaDiff[] = [];
  const { keys, sourceMap, targetMap } = prepare(sources, targets);
  for (const key of keys) {
    items.push(...diffExtension(sourceMap[key], targetMap[key], options));
  }

  return items;
};

const diffExtension = (
  source: DatabaseExtension | undefined,
  target: DatabaseExtension | undefined,
  options: DiffOptions,
): SchemaDiff[] => {
  if (isIgnored(source, target, options)) {
    return [];
  }

  if (source && !target) {
    return [
      {
        type: 'extension.create',
        extension: source,
        reason: Reason.MissingInTarget,
      },
    ];
  }

  if (!source && target) {
    return [
      {
        type: 'extension.drop',
        extensionName: target.name,
        reason: Reason.MissingInSource,
      },
    ];
  }

  return [];
};

const diffFunctions = (sources: DatabaseFunction[], targets: DatabaseFunction[], options: DiffOptions = {}) => {
  const items: SchemaDiff[] = [];
  const { keys, sourceMap, targetMap } = prepare(sources, targets);
  for (const key of keys) {
    items.push(...diffFunction(sourceMap[key], targetMap[key], options));
  }

  return items;
};

const diffFunction = (
  source: DatabaseFunction | undefined,
  target: DatabaseFunction | undefined,
  options: DiffOptions,
): SchemaDiff[] => {
  if (isIgnored(source, target, options)) {
    return [];
  }

  if (source && !target) {
    return [
      {
        type: 'function.create',
        function: source,
        reason: Reason.MissingInTarget,
      },
    ];
  }

  if (!source && target) {
    return [
      {
        type: 'function.drop',
        functionName: target.name,
        reason: Reason.MissingInSource,
      },
    ];
  }

  if (!source || !target) {
    return [];
  }

  if (source.hash !== target.hash) {
    const reason = `function hash has changed (${source.hash} vs ${target.hash})`;
    return [
      {
        type: 'function.create',
        function: source,
        reason,
      },
    ];
  }

  return [];
};

const diffEnums = (sources: DatabaseEnum[], targets: DatabaseEnum[], options: DiffOptions = {}) => {
  const items: SchemaDiff[] = [];
  const { keys, sourceMap, targetMap } = prepare(sources, targets);
  for (const key of keys) {
    items.push(...diffEnum(sourceMap[key], targetMap[key], options));
  }

  return items;
};

const diffEnum = (
  source: DatabaseEnum | undefined,
  target: DatabaseEnum | undefined,
  options: DiffOptions,
): SchemaDiff[] => {
  if (isIgnored(source, target, options)) {
    return [];
  }

  if (source && !target) {
    return [
      {
        type: 'enum.create',
        enum: source,
        reason: Reason.MissingInTarget,
      },
    ];
  }

  if (!source && target) {
    return [
      {
        type: 'enum.drop',
        enumName: target.name,
        reason: Reason.MissingInSource,
      },
    ];
  }

  if (!source || !target) {
    return [];
  }

  if (source.values.toString() !== target.values.toString()) {
    // TODO add or remove values if the lists are different or the order has changed
    const reason = `enum values has changed (${source.values} vs ${target.values})`;
    return [
      {
        type: 'enum.drop',
        enumName: source.name,
        reason,
      },
      {
        type: 'enum.create',
        enum: source,
        reason,
      },
    ];
  }

  return [];
};

const diffTables = (sources: DatabaseTable[], targets: DatabaseTable[], options: DiffOptions = {}) => {
  const { keys, sourceMap, targetMap } = prepare(sources, targets);
  const items: SchemaDiff[] = [];
  for (const key of keys) {
    items.push(...diffTable(sourceMap[key], targetMap[key], options));
  }

  return items;
};

const diffTable = (
  source: DatabaseTable | undefined,
  target: DatabaseTable | undefined,
  options: DiffOptions,
): SchemaDiff[] => {
  if (isIgnored(source, target, options)) {
    return [];
  }

  if (source && !target) {
    return [
      {
        type: 'table.create',
        tableName: source.name,
        columns: Object.values(source.columns),
        reason: Reason.MissingInTarget,
      },
      ...diffIndexes(source.indexes, []),
      // TODO merge constraints into table create record when possible
      ...diffConstraints(source.constraints, []),
      ...diffTriggers(source.triggers, []),
    ];
  }

  if (!source && target) {
    return [
      ...diffIndexes([], target.indexes),
      ...diffConstraints([], target.constraints),
      ...diffTriggers([], target.triggers),
      {
        type: 'table.drop',
        tableName: target.name,
        reason: Reason.MissingInSource,
      },
    ];
  }

  if (!source || !target) {
    return [];
  }

  return [
    ...diffColumns(source.columns, target.columns),
    ...diffConstraints(source.constraints, target.constraints),
    ...diffIndexes(source.indexes, target.indexes),
    ...diffTriggers(source.triggers, target.triggers),
  ];
};

const diffColumns = (sources: DatabaseColumn[], targets: DatabaseColumn[]): SchemaDiff[] => {
  const items: SchemaDiff[] = [];
  const { keys, sourceMap, targetMap } = prepare(sources, targets);
  for (const key of keys) {
    items.push(...diffColumn(sourceMap[key], targetMap[key]));
  }

  return items;
};

const diffColumn = (source?: DatabaseColumn, target?: DatabaseColumn): SchemaDiff[] => {
  if (isSynchronizeDisabled(source, target)) {
    return [];
  }

  if (source && !target) {
    return [
      {
        type: 'column.add',
        column: source,
        reason: Reason.MissingInTarget,
      },
    ];
  }

  if (!source && target) {
    return [
      {
        type: 'column.drop',
        tableName: target.tableName,
        columnName: target.name,
        reason: Reason.MissingInSource,
      },
    ];
  }

  if (!source || !target) {
    return [];
  }

  const sourceType = getColumnType(source);
  const targetType = getColumnType(target);

  const isTypeChanged = sourceType !== targetType;

  if (isTypeChanged) {
    // TODO: convert between types via UPDATE when possible
    return dropAndRecreateColumn(source, target, `column type is different (${sourceType} vs ${targetType})`);
  }

  const items: SchemaDiff[] = [];
  if (source.nullable !== target.nullable) {
    items.push({
      type: 'column.alter',
      tableName: source.tableName,
      columnName: source.name,
      changes: {
        nullable: source.nullable,
      },
      reason: `nullable is different (${source.nullable} vs ${target.nullable})`,
    });
  }

  if (!isDefaultEqual(source, target)) {
    items.push({
      type: 'column.alter',
      tableName: source.tableName,
      columnName: source.name,
      changes: {
        default: String(source.default),
      },
      reason: `default is different (${source.default} vs ${target.default})`,
    });
  }

  if (source.comment !== target.comment) {
    items.push({
      type: 'column.alter',
      tableName: source.tableName,
      columnName: source.name,
      changes: {
        comment: String(source.comment),
      },
      reason: `comment is different (${source.default} vs ${target.default})`,
    });
  }

  return items;
};

const diffConstraints = (sources: DatabaseConstraint[], targets: DatabaseConstraint[]): SchemaDiff[] => {
  const items: SchemaDiff[] = [];

  for (const type of Object.values(DatabaseConstraintType)) {
    const { keys, sourceMap, targetMap } = prepare(
      sources.filter((item) => item.type === type),
      targets.filter((item) => item.type === type),
    );
    for (const key of keys) {
      items.push(...diffConstraint(sourceMap[key], targetMap[key]));
    }
  }

  return items;
};

const diffConstraint = <T extends DatabaseConstraint>(source?: T, target?: T): SchemaDiff[] => {
  if (isSynchronizeDisabled(source, target)) {
    return [];
  }

  if (source && !target) {
    return [
      {
        type: 'constraint.add',
        constraint: source,
        reason: Reason.MissingInTarget,
      },
    ];
  }

  if (!source && target) {
    return [
      {
        type: 'constraint.drop',
        tableName: target.tableName,
        constraintName: target.name,
        reason: Reason.MissingInSource,
      },
    ];
  }

  if (!source || !target) {
    return [];
  }

  switch (source.type) {
    case DatabaseConstraintType.PRIMARY_KEY: {
      return diffPrimaryKeyConstraint(source, target as DatabasePrimaryKeyConstraint);
    }

    case DatabaseConstraintType.FOREIGN_KEY: {
      return diffForeignKeyConstraint(source, target as DatabaseForeignKeyConstraint);
    }

    case DatabaseConstraintType.UNIQUE: {
      return diffUniqueConstraint(source, target as DatabaseUniqueConstraint);
    }

    case DatabaseConstraintType.CHECK: {
      return diffCheckConstraint(source, target as DatabaseCheckConstraint);
    }

    default: {
      return dropAndRecreateConstraint(source, target, `Unknown constraint type: ${(source as any).type}`);
    }
  }
};

const diffPrimaryKeyConstraint = (
  source: DatabasePrimaryKeyConstraint,
  target: DatabasePrimaryKeyConstraint,
): SchemaDiff[] => {
  if (!haveEqualColumns(source.columnNames, target.columnNames)) {
    return dropAndRecreateConstraint(
      source,
      target,
      `Primary key columns are different: (${source.columnNames} vs ${target.columnNames})`,
    );
  }

  return [];
};

const diffForeignKeyConstraint = (
  source: DatabaseForeignKeyConstraint,
  target: DatabaseForeignKeyConstraint,
): SchemaDiff[] => {
  let reason = '';

  const sourceDeleteAction = source.onDelete ?? 'NO ACTION';
  const targetDeleteAction = target.onDelete ?? 'NO ACTION';

  const sourceUpdateAction = source.onUpdate ?? 'NO ACTION';
  const targetUpdateAction = target.onUpdate ?? 'NO ACTION';

  if (!haveEqualColumns(source.columnNames, target.columnNames)) {
    reason = `columns are different (${source.columnNames} vs ${target.columnNames})`;
  } else if (!haveEqualColumns(source.referenceColumnNames, target.referenceColumnNames)) {
    reason = `reference columns are different (${source.referenceColumnNames} vs ${target.referenceColumnNames})`;
  } else if (source.referenceTableName !== target.referenceTableName) {
    reason = `reference table is different (${source.referenceTableName} vs ${target.referenceTableName})`;
  } else if (sourceDeleteAction !== targetDeleteAction) {
    reason = `ON DELETE action is different (${sourceDeleteAction} vs ${targetDeleteAction})`;
  } else if (sourceUpdateAction !== targetUpdateAction) {
    reason = `ON UPDATE action is different (${sourceUpdateAction} vs ${targetUpdateAction})`;
  }

  if (reason) {
    return dropAndRecreateConstraint(source, target, reason);
  }

  return [];
};

const diffUniqueConstraint = (source: DatabaseUniqueConstraint, target: DatabaseUniqueConstraint): SchemaDiff[] => {
  let reason = '';

  if (!haveEqualColumns(source.columnNames, target.columnNames)) {
    reason = `columns are different (${source.columnNames} vs ${target.columnNames})`;
  }

  if (reason) {
    return dropAndRecreateConstraint(source, target, reason);
  }

  return [];
};

const diffCheckConstraint = (source: DatabaseCheckConstraint, target: DatabaseCheckConstraint): SchemaDiff[] => {
  if (source.expression !== target.expression) {
    // comparing expressions is hard because postgres reconstructs it with different formatting
    // for now if the constraint exists with the same name, we will just skip it
  }

  return [];
};

const diffIndexes = (sources: DatabaseIndex[], targets: DatabaseIndex[]) => {
  const items: SchemaDiff[] = [];
  const { keys, sourceMap, targetMap } = prepare(sources, targets);
  for (const key of keys) {
    items.push(...diffIndex(sourceMap[key], targetMap[key]));
  }

  return items;
};

const diffIndex = (source?: DatabaseIndex, target?: DatabaseIndex): SchemaDiff[] => {
  if (isSynchronizeDisabled(source, target)) {
    return [];
  }

  if (source && !target) {
    return [{ type: 'index.create', index: source, reason: Reason.MissingInTarget }];
  }

  if (!source && target) {
    return [
      {
        type: 'index.drop',
        indexName: target.name,
        reason: Reason.MissingInSource,
      },
    ];
  }

  if (!target || !source) {
    return [];
  }

  const sourceUsing = source.using ?? 'btree';
  const targetUsing = target.using ?? 'btree';

  let reason = '';

  if (!haveEqualColumns(source.columnNames, target.columnNames)) {
    reason = `columns are different (${source.columnNames} vs ${target.columnNames})`;
  } else if (source.unique !== target.unique) {
    reason = `uniqueness is different (${source.unique} vs ${target.unique})`;
  } else if (sourceUsing !== targetUsing) {
    reason = `using method is different (${source.using} vs ${target.using})`;
  } else if (source.where !== target.where) {
    reason = `where clause is different (${source.where} vs ${target.where})`;
  } else if (source.expression !== target.expression) {
    reason = `expression is different (${source.expression} vs ${target.expression})`;
  }

  if (reason) {
    return [
      { type: 'index.drop', indexName: target.name, reason },
      { type: 'index.create', index: source, reason },
    ];
  }

  return [];
};

const diffTriggers = (sources: DatabaseTrigger[], targets: DatabaseTrigger[]) => {
  const items: SchemaDiff[] = [];
  const { keys, sourceMap, targetMap } = prepare(sources, targets);
  for (const key of keys) {
    items.push(...diffTrigger(sourceMap[key], targetMap[key]));
  }

  return items;
};

const diffTrigger = (source?: DatabaseTrigger, target?: DatabaseTrigger): SchemaDiff[] => {
  if (isSynchronizeDisabled(source, target)) {
    return [];
  }

  if (source && !target) {
    return [{ type: 'trigger.create', trigger: source, reason: Reason.MissingInTarget }];
  }

  if (!source && target) {
    return [
      {
        type: 'trigger.drop',
        tableName: target.tableName,
        triggerName: target.name,
        reason: Reason.MissingInSource,
      },
    ];
  }

  if (!target || !source) {
    return [];
  }

  let reason = '';
  if (source.functionName !== target.functionName) {
    reason = `function is different (${source.functionName} vs ${target.functionName})`;
  } else if (source.actions.join(' OR ') !== target.actions.join(' OR ')) {
    reason = `action is different (${source.actions} vs ${target.actions})`;
  } else if (source.timing !== target.timing) {
    reason = `timing method is different (${source.timing} vs ${target.timing})`;
  } else if (source.scope !== target.scope) {
    reason = `scope is different (${source.scope} vs ${target.scope})`;
  } else if (source.referencingNewTableAs !== target.referencingNewTableAs) {
    reason = `new table reference is different (${source.referencingNewTableAs} vs ${target.referencingNewTableAs})`;
  } else if (source.referencingOldTableAs !== target.referencingOldTableAs) {
    reason = `old table reference is different (${source.referencingOldTableAs} vs ${target.referencingOldTableAs})`;
  }

  if (reason) {
    return [{ type: 'trigger.create', trigger: source, reason }];
  }

  return [];
};

const dropAndRecreateColumn = (source: DatabaseColumn, target: DatabaseColumn, reason: string): SchemaDiff[] => {
  return [
    {
      type: 'column.drop',
      tableName: target.tableName,
      columnName: target.name,
      reason,
    },
    { type: 'column.add', column: source, reason },
  ];
};

const dropAndRecreateConstraint = (
  source: DatabaseConstraint,
  target: DatabaseConstraint,
  reason: string,
): SchemaDiff[] => {
  return [
    {
      type: 'constraint.drop',
      tableName: target.tableName,
      constraintName: target.name,
      reason,
    },
    { type: 'constraint.add', constraint: source, reason },
  ];
};
