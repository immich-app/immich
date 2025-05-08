import { ColumnOptions } from 'src/sql-tools/from-code/decorators/column.decorator';
import { onMissingTable, resolveTable } from 'src/sql-tools/from-code/processors/table.processor';
import { Processor, SchemaBuilder } from 'src/sql-tools/from-code/processors/type';
import { asMetadataKey, fromColumnValue } from 'src/sql-tools/helpers';
import { DatabaseColumn } from 'src/sql-tools/types';

export const processColumns: Processor = (builder, items) => {
  for (const {
    type,
    item: { object, propertyName, options },
  } of items.filter((item) => item.type === 'column' || item.type === 'foreignKeyColumn')) {
    const table = resolveTable(builder, object.constructor);
    if (!table) {
      onMissingTable(builder, type === 'column' ? '@Column' : '@ForeignKeyColumn', object, propertyName);
      continue;
    }

    const columnName = options.name ?? String(propertyName);
    const existingColumn = table.columns.find((column) => column.name === columnName);
    if (existingColumn) {
      // TODO log warnings if column name is not unique
      continue;
    }

    const tableName = table.name;

    let defaultValue = fromColumnValue(options.default);
    let nullable = options.nullable ?? false;

    // map `{ default: null }` to `{ nullable: true }`
    if (defaultValue === null) {
      nullable = true;
      defaultValue = undefined;
    }

    const isEnum = !!(options as ColumnOptions).enum;

    const column: DatabaseColumn = {
      name: columnName,
      tableName,
      primary: options.primary ?? false,
      default: defaultValue,
      nullable,
      isArray: (options as ColumnOptions).array ?? false,
      length: options.length,
      type: isEnum ? 'enum' : options.type || 'character varying',
      enumName: isEnum ? (options as ColumnOptions).enum!.name : undefined,
      comment: options.comment,
      storage: options.storage,
      identity: options.identity,
      synchronize: options.synchronize ?? true,
    };

    writeMetadata(object, propertyName, { name: column.name, options });

    table.columns.push(column);
  }
};

type ColumnMetadata = { name: string; options: ColumnOptions };

export const resolveColumn = (builder: SchemaBuilder, object: object, propertyName: string | symbol) => {
  const table = resolveTable(builder, object.constructor);
  if (!table) {
    return {};
  }

  const metadata = readMetadata(object, propertyName);
  if (!metadata) {
    return { table };
  }

  const column = table.columns.find((column) => column.name === metadata.name);
  return { table, column };
};

export const onMissingColumn = (
  builder: SchemaBuilder,
  context: string,
  object: object,
  propertyName?: symbol | string,
) => {
  const label = object.constructor.name + (propertyName ? '.' + String(propertyName) : '');
  builder.warnings.push(`[${context}] Unable to find column (${label})`);
};

const METADATA_KEY = asMetadataKey('table-metadata');

const writeMetadata = (object: object, propertyName: symbol | string, metadata: ColumnMetadata) =>
  Reflect.defineMetadata(METADATA_KEY, metadata, object, propertyName);

const readMetadata = (object: object, propertyName: symbol | string): ColumnMetadata | undefined =>
  Reflect.getMetadata(METADATA_KEY, object, propertyName);
