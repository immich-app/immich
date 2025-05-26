import { asColumnList } from 'src/sql-tools/helpers';
import { SqlTransformer } from 'src/sql-tools/to-sql/transformers/types';
import { DatabaseIndex, SchemaDiff } from 'src/sql-tools/types';

export const transformIndexes: SqlTransformer = (item: SchemaDiff) => {
  switch (item.type) {
    case 'index.create': {
      return asIndexCreate(item.index);
    }

    case 'index.drop': {
      return asIndexDrop(item.indexName);
    }

    default: {
      return false;
    }
  }
};

export const asIndexCreate = (index: DatabaseIndex): string => {
  let sql = `CREATE`;

  if (index.unique) {
    sql += ' UNIQUE';
  }

  sql += ` INDEX "${index.name}" ON "${index.tableName}"`;

  if (index.columnNames) {
    const columnNames = asColumnList(index.columnNames);
    sql += ` (${columnNames})`;
  }

  if (index.using && index.using !== 'btree') {
    sql += ` USING ${index.using}`;
  }

  if (index.expression) {
    sql += ` (${index.expression})`;
  }

  if (index.with) {
    sql += ` WITH (${index.with})`;
  }

  if (index.where) {
    sql += ` WHERE ${index.where}`;
  }

  return sql;
};

export const asIndexDrop = (indexName: string): string => {
  return `DROP INDEX "${indexName}";`;
};
