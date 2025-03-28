import { getColumnType, schemaDiffToSql } from 'src/sql-tools/schema-diff-to-sql';
import {
  DatabaseCheckConstraint,
  DatabaseColumn,
  DatabaseConstraint,
  DatabaseConstraintType,
  DatabaseForeignKeyConstraint,
  DatabaseIndex,
  DatabasePrimaryKeyConstraint,
  DatabaseSchema,
  DatabaseTable,
  DatabaseUniqueConstraint,
  SchemaDiff,
  SchemaDiffToSqlOptions,
} from 'src/sql-tools/types';

enum Reason {
  MissingInSource = 'missing in source',
  MissingInTarget = 'missing in target',
}

const setIsEqual = (source: Set<unknown>, target: Set<unknown>) =>
  source.size === target.size && [...source].every((x) => target.has(x));

const haveEqualColumns = (sourceColumns?: string[], targetColumns?: string[]) => {
  return setIsEqual(new Set(sourceColumns ?? []), new Set(targetColumns ?? []));
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
export const schemaDiff = (
  source: DatabaseSchema,
  target: DatabaseSchema,
  options: { ignoreExtraTables?: boolean } = {},
) => {
  const items = diffTables(source.tables, target.tables, {
    ignoreExtraTables: options.ignoreExtraTables ?? true,
  });

  return {
    items,
    asSql: (options?: SchemaDiffToSqlOptions) => schemaDiffToSql(items, options),
  };
};

export const diffTables = (
  sources: DatabaseTable[],
  targets: DatabaseTable[],
  options: { ignoreExtraTables: boolean },
) => {
  const items: SchemaDiff[] = [];
  const sourceMap = Object.fromEntries(sources.map((table) => [table.name, table]));
  const targetMap = Object.fromEntries(targets.map((table) => [table.name, table]));
  const keys = new Set([...Object.keys(sourceMap), ...Object.keys(targetMap)]);

  for (const key of keys) {
    if (options.ignoreExtraTables && !sourceMap[key]) {
      continue;
    }
    items.push(...diffTable(sourceMap[key], targetMap[key]));
  }

  return items;
};

const diffTable = (source?: DatabaseTable, target?: DatabaseTable): SchemaDiff[] => {
  if (isSynchronizeDisabled(source, target)) {
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
    ];
  }

  if (!source && target) {
    return [
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
  ];
};

const diffColumns = (sources: DatabaseColumn[], targets: DatabaseColumn[]): SchemaDiff[] => {
  const items: SchemaDiff[] = [];
  const sourceMap = Object.fromEntries(sources.map((column) => [column.name, column]));
  const targetMap = Object.fromEntries(targets.map((column) => [column.name, column]));
  const keys = new Set([...Object.keys(sourceMap), ...Object.keys(targetMap)]);

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

  return items;
};

const diffConstraints = (sources: DatabaseConstraint[], targets: DatabaseConstraint[]): SchemaDiff[] => {
  const items: SchemaDiff[] = [];

  for (const type of Object.values(DatabaseConstraintType)) {
    const sourceMap = Object.fromEntries(sources.filter((item) => item.type === type).map((item) => [item.name, item]));
    const targetMap = Object.fromEntries(targets.filter((item) => item.type === type).map((item) => [item.name, item]));
    const keys = new Set([...Object.keys(sourceMap), ...Object.keys(targetMap)]);

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
  const sourceMap = Object.fromEntries(sources.map((index) => [index.name, index]));
  const targetMap = Object.fromEntries(targets.map((index) => [index.name, index]));
  const keys = new Set([...Object.keys(sourceMap), ...Object.keys(targetMap)]);

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
    return dropAndRecreateIndex(source, target, reason);
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

const dropAndRecreateIndex = (source: DatabaseIndex, target: DatabaseIndex, reason: string): SchemaDiff[] => {
  return [
    { type: 'index.drop', indexName: target.name, reason },
    { type: 'index.create', index: source, reason },
  ];
};
