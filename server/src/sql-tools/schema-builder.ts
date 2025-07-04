/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { ColumnOptions, TableOptions } from 'src/sql-tools/decorators';
import { asKey } from 'src/sql-tools/helpers';
import {
  DatabaseColumn,
  DatabaseEnum,
  DatabaseExtension,
  DatabaseFunction,
  DatabaseParameter,
  DatabaseSchema,
  DatabaseTable,
  SchemaFromCodeOptions,
} from 'src/sql-tools/types';

type TableMetadata = { options: TableOptions; object: Function; methodToColumn: Map<string | symbol, DatabaseColumn> };

export class SchemaBuilder {
  databaseName: string;
  schemaName: string;
  tables: DatabaseTable[] = [];
  functions: DatabaseFunction[] = [];
  enums: DatabaseEnum[] = [];
  extensions: DatabaseExtension[] = [];
  parameters: DatabaseParameter[] = [];
  warnings: string[] = [];

  classToTable: WeakMap<Function, DatabaseTable> = new WeakMap();
  tableToMetadata: WeakMap<DatabaseTable, TableMetadata> = new WeakMap();

  constructor(options: SchemaFromCodeOptions) {
    this.databaseName = options.databaseName ?? 'postgres';
    this.schemaName = options.schemaName ?? 'public';
  }

  getTableByObject(object: Function) {
    return this.classToTable.get(object);
  }

  getTableByName(name: string) {
    return this.tables.find((table) => table.name === name);
  }

  getTableMetadata(table: DatabaseTable) {
    const metadata = this.tableToMetadata.get(table);
    if (!metadata) {
      throw new Error(`Table metadata not found for table: ${table.name}`);
    }
    return metadata;
  }

  addTable(table: DatabaseTable, options: TableOptions, object: Function) {
    this.tables.push(table);
    this.classToTable.set(object, table);
    this.tableToMetadata.set(table, { options, object, methodToColumn: new Map() });
  }

  getColumnByObjectAndPropertyName(
    object: object,
    propertyName: string | symbol,
  ): { table?: DatabaseTable; column?: DatabaseColumn } {
    const table = this.getTableByObject(object.constructor);
    if (!table) {
      return {};
    }

    const tableMetadata = this.tableToMetadata.get(table);
    if (!tableMetadata) {
      return {};
    }

    const column = tableMetadata.methodToColumn.get(propertyName);

    return { table, column };
  }

  addColumn(table: DatabaseTable, column: DatabaseColumn, options: ColumnOptions, propertyName: string | symbol) {
    table.columns.push(column);
    const tableMetadata = this.getTableMetadata(table);
    tableMetadata.methodToColumn.set(propertyName, column);
  }

  asIndexName(table: string, columns?: string[], where?: string) {
    const items: string[] = [];
    for (const columnName of columns ?? []) {
      items.push(columnName);
    }

    if (where) {
      items.push(where);
    }

    return asKey('IDX_', table, items);
  }

  warn(context: string, message: string) {
    this.warnings.push(`[${context}] ${message}`);
  }

  warnMissingTable(context: string, object: object, propertyName?: symbol | string) {
    const label = object.constructor.name + (propertyName ? '.' + String(propertyName) : '');
    this.warn(context, `Unable to find table (${label})`);
  }

  warnMissingColumn(context: string, object: object, propertyName?: symbol | string) {
    const label = object.constructor.name + (propertyName ? '.' + String(propertyName) : '');
    this.warn(context, `Unable to find column (${label})`);
  }

  build(): DatabaseSchema {
    return {
      databaseName: this.databaseName,
      schemaName: this.schemaName,
      tables: this.tables,
      functions: this.functions,
      enums: this.enums,
      extensions: this.extensions,
      parameters: this.parameters,
      warnings: this.warnings,
    };
  }
}
