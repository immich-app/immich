import {
  DatabaseActionType,
  DatabaseColumn,
  DatabaseColumnChanges,
  DatabaseConstraint,
  DatabaseConstraintType,
  DatabaseIndex,
  SchemaDiff,
  SchemaDiffToSqlOptions,
} from 'src/sql-tools/types';

const asColumnList = (columns: string[]) =>
  columns
    .toSorted()
    .map((column) => `"${column}"`)
    .join(', ');
const withNull = (column: DatabaseColumn) => (column.nullable ? '' : ' NOT NULL');
const withDefault = (column: DatabaseColumn) => (column.default ? ` DEFAULT ${column.default}` : '');
const withAction = (constraint: { onDelete?: DatabaseActionType; onUpdate?: DatabaseActionType }) =>
  ` ON UPDATE ${constraint.onUpdate ?? DatabaseActionType.NO_ACTION} ON DELETE ${constraint.onDelete ?? DatabaseActionType.NO_ACTION}`;

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

export const getColumnType = (column: DatabaseColumn) => {
  let type = column.enumName || column.type;
  if (column.isArray) {
    type += '[]';
  }

  return type;
};

/**
 * Convert schema diffs into SQL statements
 */
export const schemaDiffToSql = (items: SchemaDiff[], options: SchemaDiffToSqlOptions = {}): string[] => {
  return items.flatMap((item) => asArray(asSql(item)).map((result) => result + withComments(options.comments, item)));
};

const asSql = (item: SchemaDiff): string | string[] => {
  switch (item.type) {
    case 'table.create': {
      return asTableCreate(item.tableName, item.columns);
    }

    case 'table.drop': {
      return asTableDrop(item.tableName);
    }

    case 'column.add': {
      return asColumnAdd(item.column);
    }

    case 'column.alter': {
      return asColumnAlter(item.tableName, item.columnName, item.changes);
    }

    case 'column.drop': {
      return asColumnDrop(item.tableName, item.columnName);
    }

    case 'constraint.add': {
      return asConstraintAdd(item.constraint);
    }

    case 'constraint.drop': {
      return asConstraintDrop(item.tableName, item.constraintName);
    }

    case 'index.create': {
      return asIndexCreate(item.index);
    }

    case 'index.drop': {
      return asIndexDrop(item.indexName);
    }

    default: {
      return [];
    }
  }
};

const asTableCreate = (tableName: string, tableColumns: DatabaseColumn[]): string => {
  const columns = tableColumns
    .map((column) => `"${column.name}" ${getColumnType(column)}` + withNull(column) + withDefault(column))
    .join(', ');
  return `CREATE TABLE "${tableName}" (${columns});`;
};

const asTableDrop = (tableName: string): string => {
  return `DROP TABLE "${tableName}";`;
};

const asColumnAdd = (column: DatabaseColumn): string => {
  return (
    `ALTER TABLE "${column.tableName}" ADD "${column.name}" ${getColumnType(column)}` +
    withNull(column) +
    withDefault(column) +
    ';'
  );
};

const asColumnAlter = (tableName: string, columnName: string, changes: DatabaseColumnChanges): string[] => {
  const base = `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}"`;
  const items: string[] = [];
  if (changes.nullable !== undefined) {
    items.push(changes.nullable ? `${base} DROP NOT NULL;` : `${base} SET NOT NULL;`);
  }

  if (changes.default !== undefined) {
    items.push(`${base} SET DEFAULT ${changes.default};`);
  }

  return items;
};

const asColumnDrop = (tableName: string, columnName: string): string => {
  return `ALTER TABLE "${tableName}" DROP COLUMN "${columnName}";`;
};

const asConstraintAdd = (constraint: DatabaseConstraint): string | string[] => {
  const base = `ALTER TABLE "${constraint.tableName}" ADD CONSTRAINT "${constraint.name}"`;
  switch (constraint.type) {
    case DatabaseConstraintType.PRIMARY_KEY: {
      const columnNames = asColumnList(constraint.columnNames);
      return `${base} PRIMARY KEY (${columnNames});`;
    }

    case DatabaseConstraintType.FOREIGN_KEY: {
      const columnNames = asColumnList(constraint.columnNames);
      const referenceColumnNames = asColumnList(constraint.referenceColumnNames);
      return (
        `${base} FOREIGN KEY (${columnNames}) REFERENCES "${constraint.referenceTableName}" (${referenceColumnNames})` +
        withAction(constraint) +
        ';'
      );
    }

    case DatabaseConstraintType.UNIQUE: {
      const columnNames = asColumnList(constraint.columnNames);
      return `${base} UNIQUE (${columnNames});`;
    }

    case DatabaseConstraintType.CHECK: {
      return `${base} CHECK (${constraint.expression});`;
    }

    default: {
      return [];
    }
  }
};

const asConstraintDrop = (tableName: string, constraintName: string): string => {
  return `ALTER TABLE "${tableName}" DROP CONSTRAINT "${constraintName}";`;
};

const asIndexCreate = (index: DatabaseIndex): string => {
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

  if (index.where) {
    sql += ` WHERE ${index.where}`;
  }

  return sql;
};

const asIndexDrop = (indexName: string): string => {
  return `DROP INDEX "${indexName}";`;
};
