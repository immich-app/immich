/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { createHash } from 'node:crypto';
import 'reflect-metadata';
import {
  CheckOptions,
  ColumnDefaultValue,
  ColumnIndexOptions,
  ColumnOptions,
  DatabaseActionType,
  DatabaseColumn,
  DatabaseConstraintType,
  DatabaseSchema,
  DatabaseTable,
  ForeignKeyColumnOptions,
  IndexOptions,
  TableOptions,
  UniqueOptions,
} from 'src/sql-tools/types';

enum SchemaKey {
  TableName = 'immich-schema:table-name',
  ColumnName = 'immich-schema:column-name',
  IndexName = 'immich-schema:index-name',
}

type SchemaTable = DatabaseTable & { options: TableOptions };
type SchemaTables = SchemaTable[];
type ClassBased<T> = { object: Function } & T;
type PropertyBased<T> = { object: object; propertyName: string | symbol } & T;
type RegisterItem =
  | { type: 'table'; item: ClassBased<{ options: TableOptions }> }
  | { type: 'index'; item: ClassBased<{ options: IndexOptions }> }
  | { type: 'uniqueConstraint'; item: ClassBased<{ options: UniqueOptions }> }
  | { type: 'checkConstraint'; item: ClassBased<{ options: CheckOptions }> }
  | { type: 'column'; item: PropertyBased<{ options: ColumnOptions }> }
  | { type: 'columnIndex'; item: PropertyBased<{ options: ColumnIndexOptions }> }
  | { type: 'foreignKeyColumn'; item: PropertyBased<{ options: ForeignKeyColumnOptions; target: () => object }> };

const items: RegisterItem[] = [];
export const register = (item: RegisterItem) => void items.push(item);

const asSnakeCase = (name: string): string => name.replaceAll(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
const asKey = (prefix: string, tableName: string, values: string[]) =>
  (prefix + sha1(`${tableName}_${values.toSorted().join('_')}`)).slice(0, 30);
const asPrimaryKeyConstraintName = (table: string, columns: string[]) => asKey('PK_', table, columns);
const asForeignKeyConstraintName = (table: string, columns: string[]) => asKey('FK_', table, columns);
const asRelationKeyConstraintName = (table: string, columns: string[]) => asKey('REL_', table, columns);
const asUniqueConstraintName = (table: string, columns: string[]) => asKey('UQ_', table, columns);
const asCheckConstraintName = (table: string, expression: string) => asKey('CHK_', table, [expression]);
const asIndexName = (table: string, columns: string[] | undefined, where: string | undefined) => {
  const items: string[] = [];
  for (const columnName of columns ?? []) {
    items.push(columnName);
  }

  if (where) {
    items.push(where);
  }

  return asKey('IDX_', table, items);
};

const makeColumn = ({
  name,
  tableName,
  options,
}: {
  name: string;
  tableName: string;
  options: ColumnOptions;
}): DatabaseColumn => {
  const columnName = options.name ?? name;
  const enumName = options.enumName ?? `${tableName}_${columnName}_enum`.toLowerCase();
  let defaultValue = asDefaultValue(options);
  let nullable = options.nullable ?? false;

  if (defaultValue === null) {
    nullable = true;
    defaultValue = undefined;
  }

  const isEnum = !!options.enum;

  return {
    name: columnName,
    tableName,
    primary: options.primary ?? false,
    default: defaultValue,
    nullable,
    enumName: isEnum ? enumName : undefined,
    enumValues: isEnum ? Object.values(options.enum as object) : undefined,
    isArray: options.array ?? false,
    type: isEnum ? 'enum' : options.type || 'character varying',
    synchronize: options.synchronize ?? true,
  };
};

const asDefaultValue = (options: { nullable?: boolean; default?: ColumnDefaultValue }) => {
  if (typeof options.default === 'function') {
    return options.default() as string;
  }

  if (options.default === undefined) {
    return;
  }

  const value = options.default;

  if (value === null) {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }

  return `'${String(value)}'`;
};

const missingTableError = (context: string, object: object, propertyName?: string | symbol) => {
  const label = object.constructor.name + (propertyName ? '.' + String(propertyName) : '');
  return `[${context}] Unable to find table (${label})`;
};

// match TypeORM
const sha1 = (value: string) => createHash('sha1').update(value).digest('hex');

const findByName = <T extends { name: string }>(items: T[], name?: string) =>
  name ? items.find((item) => item.name === name) : undefined;
const resolveTable = (tables: SchemaTables, object: object) =>
  findByName(tables, Reflect.getMetadata(SchemaKey.TableName, object));

let initialized = false;
let schema: DatabaseSchema;

export const reset = () => {
  initialized = false;
  items.length = 0;
};

export const schemaFromDecorators = () => {
  if (!initialized) {
    const schemaTables: SchemaTables = [];

    const warnings: string[] = [];
    const warn = (message: string) => void warnings.push(message);

    for (const { item } of items.filter((item) => item.type === 'table')) {
      processTable(schemaTables, item);
    }

    for (const { item } of items.filter((item) => item.type === 'column')) {
      processColumn(schemaTables, item, { warn });
    }

    for (const { item } of items.filter((item) => item.type === 'foreignKeyColumn')) {
      processForeignKeyColumn(schemaTables, item, { warn });
    }

    for (const { item } of items.filter((item) => item.type === 'uniqueConstraint')) {
      processUniqueConstraint(schemaTables, item, { warn });
    }

    for (const { item } of items.filter((item) => item.type === 'checkConstraint')) {
      processCheckConstraint(schemaTables, item, { warn });
    }

    for (const table of schemaTables) {
      processPrimaryKeyConstraint(table);
    }

    for (const { item } of items.filter((item) => item.type === 'index')) {
      processIndex(schemaTables, item, { warn });
    }

    for (const { item } of items.filter((item) => item.type === 'columnIndex')) {
      processColumnIndex(schemaTables, item, { warn });
    }

    for (const { item } of items.filter((item) => item.type === 'foreignKeyColumn')) {
      processForeignKeyConstraint(schemaTables, item, { warn });
    }

    schema = {
      name: 'public',
      tables: schemaTables.map(({ options: _, ...table }) => table),
      warnings,
    };

    initialized = true;
  }

  return schema;
};

const processTable = (tables: SchemaTables, { object, options }: ClassBased<{ options: TableOptions }>) => {
  const tableName = options.name || asSnakeCase(object.name);
  Reflect.defineMetadata(SchemaKey.TableName, tableName, object);
  tables.push({
    name: tableName,
    columns: [],
    constraints: [],
    indexes: [],
    options,
    synchronize: options.synchronize ?? true,
  });
};

type OnWarn = (message: string) => void;

const processColumn = (
  tables: SchemaTables,
  { object, propertyName, options }: PropertyBased<{ options: ColumnOptions }>,
  { warn }: { warn: OnWarn },
) => {
  const table = resolveTable(tables, object.constructor);
  if (!table) {
    warn(missingTableError('@Column', object, propertyName));
    return;
  }

  // TODO make sure column name is unique

  const column = makeColumn({ name: String(propertyName), tableName: table.name, options });

  Reflect.defineMetadata(SchemaKey.ColumnName, column.name, object, propertyName);

  table.columns.push(column);

  if (!options.primary && options.unique) {
    table.constraints.push({
      type: DatabaseConstraintType.UNIQUE,
      name: options.uniqueConstraintName || asUniqueConstraintName(table.name, [column.name]),
      tableName: table.name,
      columnNames: [column.name],
      synchronize: options.synchronize ?? true,
    });
  }
};

const processUniqueConstraint = (
  tables: SchemaTables,
  { object, options }: ClassBased<{ options: UniqueOptions }>,
  { warn }: { warn: OnWarn },
) => {
  const table = resolveTable(tables, object);
  if (!table) {
    warn(missingTableError('@Unique', object));
    return;
  }

  const tableName = table.name;
  const columnNames = options.columns;

  table.constraints.push({
    type: DatabaseConstraintType.UNIQUE,
    name: options.name || asUniqueConstraintName(tableName, columnNames),
    tableName,
    columnNames,
    synchronize: options.synchronize ?? true,
  });
};

const processCheckConstraint = (
  tables: SchemaTables,
  { object, options }: ClassBased<{ options: CheckOptions }>,
  { warn }: { warn: OnWarn },
) => {
  const table = resolveTable(tables, object);
  if (!table) {
    warn(missingTableError('@Check', object));
    return;
  }

  const tableName = table.name;

  table.constraints.push({
    type: DatabaseConstraintType.CHECK,
    name: options.name || asCheckConstraintName(tableName, options.expression),
    tableName,
    expression: options.expression,
    synchronize: options.synchronize ?? true,
  });
};

const processPrimaryKeyConstraint = (table: SchemaTable) => {
  const columnNames: string[] = [];

  for (const column of table.columns) {
    if (column.primary) {
      columnNames.push(column.name);
    }
  }

  if (columnNames.length > 0) {
    table.constraints.push({
      type: DatabaseConstraintType.PRIMARY_KEY,
      name: table.options.primaryConstraintName || asPrimaryKeyConstraintName(table.name, columnNames),
      tableName: table.name,
      columnNames,
      synchronize: table.options.synchronize ?? true,
    });
  }
};

const processIndex = (
  tables: SchemaTables,
  { object, options }: ClassBased<{ options: IndexOptions }>,
  { warn }: { warn: OnWarn },
) => {
  const table = resolveTable(tables, object);
  if (!table) {
    warn(missingTableError('@Index', object));
    return;
  }

  table.indexes.push({
    name: options.name || asIndexName(table.name, options.columns, options.where),
    tableName: table.name,
    unique: options.unique ?? false,
    expression: options.expression,
    using: options.using,
    where: options.where,
    columnNames: options.columns,
    synchronize: options.synchronize ?? true,
  });
};

const processColumnIndex = (
  tables: SchemaTables,
  { object, propertyName, options }: PropertyBased<{ options: ColumnIndexOptions }>,
  { warn }: { warn: OnWarn },
) => {
  const table = resolveTable(tables, object.constructor);
  if (!table) {
    warn(missingTableError('@ColumnIndex', object, propertyName));
    return;
  }

  const column = findByName(table.columns, Reflect.getMetadata(SchemaKey.ColumnName, object, propertyName));
  if (!column) {
    return;
  }

  table.indexes.push({
    name: options.name || asIndexName(table.name, [column.name], options.where),
    tableName: table.name,
    unique: options.unique ?? false,
    expression: options.expression,
    using: options.using,
    where: options.where,
    columnNames: [column.name],
    synchronize: options.synchronize ?? true,
  });
};

const processForeignKeyColumn = (
  tables: SchemaTables,
  { object, propertyName, options }: PropertyBased<{ options: ForeignKeyColumnOptions; target: () => object }>,
  { warn }: { warn: OnWarn },
) => {
  const table = resolveTable(tables, object.constructor);
  if (!table) {
    warn(missingTableError('@ForeignKeyColumn', object));
    return;
  }

  const columnName = String(propertyName);
  const existingColumn = table.columns.find((column) => column.name === columnName);
  if (existingColumn) {
    // TODO log warnings if column options and `@Column` is also used
    return;
  }

  const column = makeColumn({ name: columnName, tableName: table.name, options });

  Reflect.defineMetadata(SchemaKey.ColumnName, columnName, object, propertyName);

  table.columns.push(column);
};

const processForeignKeyConstraint = (
  tables: SchemaTables,
  { object, propertyName, options, target }: PropertyBased<{ options: ForeignKeyColumnOptions; target: () => object }>,
  { warn }: { warn: OnWarn },
) => {
  const childTable = resolveTable(tables, object.constructor);
  if (!childTable) {
    warn(missingTableError('@ForeignKeyColumn', object));
    return;
  }

  const parentTable = resolveTable(tables, target());
  if (!parentTable) {
    warn(missingTableError('@ForeignKeyColumn', object, propertyName));
    return;
  }

  const columnName = String(propertyName);
  const column = childTable.columns.find((column) => column.name === columnName);
  if (!column) {
    warn('@ForeignKeyColumn: Column not found, creating a new one');
    return;
  }

  const columnNames = [column.name];
  const referenceColumns = parentTable.columns.filter((column) => column.primary);

  // infer FK column type from reference table
  if (referenceColumns.length === 1) {
    column.type = referenceColumns[0].type;
  }

  childTable.constraints.push({
    name: options.constraintName || asForeignKeyConstraintName(childTable.name, columnNames),
    tableName: childTable.name,
    columnNames,
    type: DatabaseConstraintType.FOREIGN_KEY,
    referenceTableName: parentTable.name,
    referenceColumnNames: referenceColumns.map((column) => column.name),
    onUpdate: options.onUpdate as DatabaseActionType,
    onDelete: options.onDelete as DatabaseActionType,
    synchronize: options.synchronize ?? true,
  });

  if (options.unique) {
    childTable.constraints.push({
      name: options.uniqueConstraintName || asRelationKeyConstraintName(childTable.name, columnNames),
      tableName: childTable.name,
      columnNames,
      type: DatabaseConstraintType.UNIQUE,
      synchronize: options.synchronize ?? true,
    });
  }
};
