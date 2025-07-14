import { asRenameKey, getColumnType, isDefaultEqual } from 'src/sql-tools/helpers';
import { Comparer, DatabaseColumn, Reason, SchemaDiff } from 'src/sql-tools/types';

export const compareColumns = {
  getRenameKey: (column) => {
    return asRenameKey([
      column.tableName,
      column.type,
      column.nullable,
      column.default,
      column.storage,
      column.primary,
      column.isArray,
      column.length,
      column.identity,
      column.enumName,
      column.numericPrecision,
      column.numericScale,
    ]);
  },
  onRename: (source, target) => [
    {
      type: 'ColumnRename',
      tableName: source.tableName,
      oldName: target.name,
      newName: source.name,
      reason: Reason.Rename,
    },
  ],
  onMissing: (source) => [
    {
      type: 'ColumnAdd',
      column: source,
      reason: Reason.MissingInTarget,
    },
  ],
  onExtra: (target) => [
    {
      type: 'ColumnDrop',
      tableName: target.tableName,
      columnName: target.name,
      reason: Reason.MissingInSource,
    },
  ],
  onCompare: (source, target) => {
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
        type: 'ColumnAlter',
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
        type: 'ColumnAlter',
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
        type: 'ColumnAlter',
        tableName: source.tableName,
        columnName: source.name,
        changes: {
          comment: String(source.comment),
        },
        reason: `comment is different (${source.comment} vs ${target.comment})`,
      });
    }

    return items;
  },
} satisfies Comparer<DatabaseColumn>;

const dropAndRecreateColumn = (source: DatabaseColumn, target: DatabaseColumn, reason: string): SchemaDiff[] => {
  return [
    {
      type: 'ColumnDrop',
      tableName: target.tableName,
      columnName: target.name,
      reason,
    },
    { type: 'ColumnAdd', column: source, reason },
  ];
};
