import {
  ColumnChanges,
  DatabaseActionType,
  DatabaseColumn,
  DatabaseConstraint,
  DatabaseConstraintType,
  DatabaseEnum,
  DatabaseExtension,
  DatabaseFunction,
  DatabaseIndex,
  DatabaseParameter,
  DatabaseTrigger,
  SchemaDiff,
  SchemaDiffToSqlOptions,
} from 'src/sql-tools/types';

const asColumnList = (columns: string[]) => columns.map((column) => `"${column}"`).join(', ');
const getColumnModifiers = (column: DatabaseColumn) => {
  const modifiers: string[] = [];

  if (!column.nullable) {
    modifiers.push('NOT NULL');
  }

  if (column.default) {
    modifiers.push(`DEFAULT ${column.default}`);
  }
  if (column.identity) {
    modifiers.push(`GENERATED ALWAYS AS IDENTITY`);
  }

  return modifiers.length === 0 ? '' : ' ' + modifiers.join(' ');
};

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
    type += `[${column.length ?? ''}]`;
  } else if (column.length !== undefined) {
    type += `(${column.length})`;
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
    case 'enum.create': {
      return asEnumCreate(item.enum);
    }

    case 'enum.drop': {
      return asEnumDrop(item.enumName);
    }

    case 'parameter.set': {
      return asParameterSet(item.parameter);
    }

    case 'parameter.reset': {
      return asParameterReset(item.databaseName, item.parameterName);
    }

    case 'extension.create': {
      return asExtensionCreate(item.extension);
    }

    case 'extension.drop': {
      return asExtensionDrop(item.extensionName);
    }

    case 'function.create': {
      return asFunctionCreate(item.function);
    }

    case 'function.drop': {
      return asFunctionDrop(item.functionName);
    }

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

    case 'trigger.create': {
      return asTriggerCreate(item.trigger);
    }

    case 'trigger.drop': {
      return asTriggerDrop(item.tableName, item.triggerName);
    }

    default: {
      return [];
    }
  }
};

const asEnumCreate = ({ name, values }: DatabaseEnum): string => {
  return `CREATE TYPE "${name}" AS ENUM (${values.map((value) => `'${value}'`)});`;
};

const asEnumDrop = (enumName: string): string => {
  return `DROP TYPE "${enumName}";`;
};

const asParameterSet = (parameter: DatabaseParameter): string => {
  let sql = '';
  if (parameter.scope === 'database') {
    sql += `ALTER DATABASE "${parameter.databaseName}" `;
  }

  sql += `SET ${parameter.name} TO ${parameter.value}`;

  return sql;
};

const asParameterReset = (databaseName: string, parameterName: string): string => {
  return `ALTER DATABASE "${databaseName}" RESET "${parameterName}"`;
};

const asExtensionCreate = (extension: DatabaseExtension): string => {
  return `CREATE EXTENSION IF NOT EXISTS "${extension.name}";`;
};

const asExtensionDrop = (extensionName: string): string => {
  return `DROP EXTENSION "${extensionName}";`;
};

const asFunctionCreate = (func: DatabaseFunction): string => {
  return func.expression;
};

const asFunctionDrop = (functionName: string): string => {
  return `DROP FUNCTION ${functionName};`;
};

const asTableCreate = (tableName: string, tableColumns: DatabaseColumn[]): string[] => {
  const columns = tableColumns
    .map((column) => `"${column.name}" ${getColumnType(column)}` + getColumnModifiers(column))
    .join(', ');
  const items = [`CREATE TABLE "${tableName}" (${columns});`];

  for (const column of tableColumns) {
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

const asColumnAdd = (column: DatabaseColumn): string => {
  return (
    `ALTER TABLE "${column.tableName}" ADD "${column.name}" ${getColumnType(column)}` + getColumnModifiers(column) + ';'
  );
};

const asColumnComment = (tableName: string, columnName: string, comment: string): string => {
  return `COMMENT ON COLUMN "${tableName}"."${columnName}" IS '${comment}';`;
};

const asColumnAlter = (tableName: string, columnName: string, changes: ColumnChanges): string[] => {
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

  if (index.with) {
    sql += ` WITH (${index.with})`;
  }

  if (index.where) {
    sql += ` WHERE ${index.where}`;
  }

  return sql;
};

const asIndexDrop = (indexName: string): string => {
  return `DROP INDEX "${indexName}";`;
};

const asTriggerCreate = (trigger: DatabaseTrigger): string => {
  const sql: string[] = [
    `CREATE OR REPLACE TRIGGER "${trigger.name}"`,
    `${trigger.timing.toUpperCase()} ${trigger.actions.map((action) => action.toUpperCase()).join(' OR ')} ON "${trigger.tableName}"`,
  ];

  if (trigger.referencingOldTableAs || trigger.referencingNewTableAs) {
    let statement = `REFERENCING`;
    if (trigger.referencingOldTableAs) {
      statement += ` OLD TABLE AS "${trigger.referencingOldTableAs}"`;
    }
    if (trigger.referencingNewTableAs) {
      statement += ` NEW TABLE AS "${trigger.referencingNewTableAs}"`;
    }
    sql.push(statement);
  }

  if (trigger.scope) {
    sql.push(`FOR EACH ${trigger.scope.toUpperCase()}`);
  }

  if (trigger.when) {
    sql.push(`WHEN (${trigger.when})`);
  }

  sql.push(`EXECUTE FUNCTION ${trigger.functionName}();`);

  return sql.join('\n  ');
};

const asTriggerDrop = (tableName: string, triggerName: string): string => {
  return `DROP TRIGGER "${triggerName}" ON "${tableName}";`;
};
