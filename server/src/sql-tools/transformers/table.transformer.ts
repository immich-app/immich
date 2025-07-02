import { asColumnComment, getColumnModifiers, getColumnType } from 'src/sql-tools/helpers';
import { asColumnAlter } from 'src/sql-tools/transformers/column.transformer';
import { SqlTransformer } from 'src/sql-tools/transformers/types';
import { DatabaseTable, SchemaDiff } from 'src/sql-tools/types';

export const transformTables: SqlTransformer = (item: SchemaDiff) => {
  switch (item.type) {
    case 'TableCreate': {
      return asTableCreate(item.table);
    }

    case 'TableDrop': {
      return asTableDrop(item.tableName);
    }

    default: {
      return false;
    }
  }
};

const asTableCreate = (table: DatabaseTable): string[] => {
  const tableName = table.name;
  const columnsTypes = table.columns
    .map((column) => `"${column.name}" ${getColumnType(column)}` + getColumnModifiers(column))
    .join(', ');
  const items = [`CREATE TABLE "${tableName}" (${columnsTypes});`];

  for (const column of table.columns) {
    if (column.comment) {
      items.push(asColumnComment(tableName, column.name, column.comment));
    }

    if (column.storage) {
      items.push(...asColumnAlter(tableName, column.name, { storage: column.storage }));
    }
  }

  return items;
};

const asTableDrop = (tableName: string): string => {
  return `DROP TABLE "${tableName}";`;
};
