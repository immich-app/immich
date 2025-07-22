import { asColumnComment, getColumnModifiers, getColumnType } from 'src/sql-tools/helpers';
import { SqlTransformer } from 'src/sql-tools/transformers/types';
import { ColumnChanges, DatabaseColumn } from 'src/sql-tools/types';

export const transformColumns: SqlTransformer = (ctx, item) => {
  switch (item.type) {
    case 'ColumnAdd': {
      return asColumnAdd(item.column);
    }

    case 'ColumnAlter': {
      return asColumnAlter(item.tableName, item.columnName, item.changes);
    }

    case 'ColumnRename': {
      return `ALTER TABLE "${item.tableName}" RENAME COLUMN "${item.oldName}" TO "${item.newName}";`;
    }

    case 'ColumnDrop': {
      return `ALTER TABLE "${item.tableName}" DROP COLUMN "${item.columnName}";`;
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
