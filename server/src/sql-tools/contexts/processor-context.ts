/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { BaseContext } from 'src/sql-tools/contexts/base-context';
import { ColumnOptions } from 'src/sql-tools/decorators/column.decorator';
import { TableOptions } from 'src/sql-tools/decorators/table.decorator';
import { DatabaseColumn, DatabaseTable, SchemaFromCodeOptions } from 'src/sql-tools/types';

type TableMetadata = { options: TableOptions; object: Function; methodToColumn: Map<string | symbol, DatabaseColumn> };

export class ProcessorContext extends BaseContext {
  constructor(public options: SchemaFromCodeOptions) {
    options.createForeignKeyIndexes = options.createForeignKeyIndexes ?? true;
    options.overrides = options.overrides ?? false;
    super(options);
  }

  classToTable: WeakMap<Function, DatabaseTable> = new WeakMap();
  tableToMetadata: WeakMap<DatabaseTable, TableMetadata> = new WeakMap();

  getTableByObject(object: Function) {
    return this.classToTable.get(object);
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

  warnMissingTable(context: string, object: object, propertyName?: symbol | string) {
    const label = object.constructor.name + (propertyName ? '.' + String(propertyName) : '');
    this.warn(context, `Unable to find table (${label})`);
  }

  warnMissingColumn(context: string, object: object, propertyName?: symbol | string) {
    const label = object.constructor.name + (propertyName ? '.' + String(propertyName) : '');
    this.warn(context, `Unable to find column (${label})`);
  }
}
