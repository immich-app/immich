import { processors } from 'src/sql-tools/processors';
import { getRegisteredItems, resetRegisteredItems } from 'src/sql-tools/register';
import { SchemaBuilder } from 'src/sql-tools/schema-builder';
import { SchemaFromCodeOptions } from 'src/sql-tools/types';

/**
 * Load schema from code (decorators, etc)
 */
export const schemaFromCode = (options: SchemaFromCodeOptions = {}) => {
  try {
    const globalOptions = {
      createForeignKeyIndexes: options.createForeignKeyIndexes ?? true,
    };

    const builder = new SchemaBuilder(options);
    const items = getRegisteredItems();
    for (const processor of processors) {
      processor(builder, items, globalOptions);
    }

    const newSchema = builder.build();

    return newSchema;
  } finally {
    if (options.reset) {
      resetRegisteredItems();
    }
  }
};
