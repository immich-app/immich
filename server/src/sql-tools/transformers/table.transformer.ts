import { asColumnComment, getColumnModifiers, getColumnType } from 'src/sql-tools/helpers';
import { asColumnAlter } from 'src/sql-tools/transformers/column.transformer';
import { asConstraintBody } from 'src/sql-tools/transformers/constraint.transformer';
import { asIndexCreate } from 'src/sql-tools/transformers/index.transformer';
import { asTriggerCreate } from 'src/sql-tools/transformers/trigger.transformer';
import { SqlTransformer } from 'src/sql-tools/transformers/types';
import { DatabaseTable } from 'src/sql-tools/types';

export const transformTables: SqlTransformer = (ctx, item) => {
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

const asTableCreate = (table: DatabaseTable) => {
  const tableName = table.name;

  const items: string[] = [];
  for (const column of table.columns) {
    items.push(`"${column.name}" ${getColumnType(column)}${getColumnModifiers(column)}`);
  }

  for (const constraint of table.constraints) {
    items.push(asConstraintBody(constraint));
  }

  const sql = [`CREATE TABLE "${tableName}" (\n  ${items.join(',\n  ')}\n);`];

  for (const column of table.columns) {
    if (column.comment) {
      sql.push(asColumnComment(tableName, column.name, column.comment));
    }

    if (column.storage) {
      sql.push(...asColumnAlter(tableName, column.name, { storage: column.storage }));
    }
  }

  for (const index of table.indexes) {
    sql.push(asIndexCreate(index));
  }

  for (const trigger of table.triggers) {
    sql.push(asTriggerCreate(trigger));
  }

  return sql;
};

const asTableDrop = (tableName: string) => {
  return `DROP TABLE "${tableName}";`;
};
