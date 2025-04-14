import { asColumnComment, getColumnModifiers, getColumnType } from 'src/sql-tools/helpers';
import { SqlTransformer } from 'src/sql-tools/to-sql/transformers/types';
import { ColumnChanges, DatabaseColumn, SchemaDiff } from 'src/sql-tools/types';

export const transformColumns: SqlTransformer = (item: SchemaDiff) => {
  switch (item.type) {
    case 'column.add': {
      return asColumnAdd(item.column);
    }

    case 'column.alter': {
      return asColumnAlter(item.tableName, item.columnName, item.changes);
    }

    case 'column.drop': {
      return asColumnDrop(item.tableName, item.columnName);
    }

    default: {
      return false;
    }
  }
};

const asColumnAdd = (column: DatabaseColumn): string => {
  return (
    `ALTER TABLE "${column.tableName}" ADD "${column.name}" ${getColumnType(column)}` + getColumnModifiers(column) + ';'
  );
};

const asColumnDrop = (tableName: string, columnName: string): string => {
  return `ALTER TABLE "${tableName}" DROP COLUMN "${columnName}";`;
};

export const asColumnAlter = (tableName: string, columnName: string, changes: ColumnChanges): string[] => {
  const base = `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}"`;
  const items: string[] = [];
  if (changes.nullable !== undefined) {
    items.push(changes.nullable ? `${base} DROP NOT NULL;` : `${base} SET NOT NULL;`);
  }

  if (changes.default !== undefined) {
    items.push(`${base} SET DEFAULT ${changes.default};`);
  }

  if (changes.storage !== undefined) {
    items.push(`${base} SET STORAGE ${changes.storage.toUpperCase()};`);
  }

  if (changes.comment !== undefined) {
    items.push(asColumnComment(tableName, columnName, changes.comment));
  }

  return items;
};
