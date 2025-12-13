import { asColumnList } from 'src/sql-tools/helpers';
import { SqlTransformer } from 'src/sql-tools/transformers/types';
import { DatabaseIndex } from 'src/sql-tools/types';

export const transformIndexes: SqlTransformer = (ctx, item) => {
  switch (item.type) {
    case 'IndexCreate': {
      return asIndexCreate(item.index);
    }

    case 'IndexRename': {
      return `ALTER INDEX "${item.oldName}" RENAME TO "${item.newName}";`;
    }

    case 'IndexDrop': {
      return `DROP INDEX "${item.indexName}";`;
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

  return sql + ';';
};
