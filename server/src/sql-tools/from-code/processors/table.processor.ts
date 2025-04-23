import { TableOptions } from 'src/sql-tools/from-code/decorators/table.decorator';
import { Processor, SchemaBuilder } from 'src/sql-tools/from-code/processors/type';
import { asMetadataKey, asSnakeCase } from 'src/sql-tools/helpers';

export const processTables: Processor = (builder, items) => {
  for (const {
    item: { options, object },
  } of items.filter((item) => item.type === 'table')) {
    const test = readMetadata(object);
    if (test) {
      throw new Error(
        `Table ${test.name} has already been registered. Does ${object.name} have two @Table() decorators?`,
      );
    }

    const tableName = options.name || asSnakeCase(object.name);

    writeMetadata(object, { name: tableName, options });

    builder.tables.push({
      name: tableName,
      columns: [],
      constraints: [],
      indexes: [],
      triggers: [],
      synchronize: options.synchronize ?? true,
      metadata: { options, object },
    });
  }
};

export const resolveTable = (builder: SchemaBuilder, object: object) => {
  const metadata = readMetadata(object);
  if (!metadata) {
    return;
  }

  return builder.tables.find((table) => table.name === metadata.name);
};

export const onMissingTable = (
  builder: SchemaBuilder,
  context: string,
  object: object,
  propertyName?: symbol | string,
) => {
  const label = object.constructor.name + (propertyName ? '.' + String(propertyName) : '');
  builder.warnings.push(`[${context}] Unable to find table (${label})`);
};

const METADATA_KEY = asMetadataKey('table-metadata');

type TableMetadata = { name: string; options: TableOptions };

const readMetadata = (object: object): TableMetadata | undefined => Reflect.getMetadata(METADATA_KEY, object);

const writeMetadata = (object: object, metadata: TableMetadata): void =>
  Reflect.defineMetadata(METADATA_KEY, metadata, object);
