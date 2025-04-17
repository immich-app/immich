import 'reflect-metadata';
import { processCheckConstraints } from 'src/sql-tools/from-code/processors/check-constraint.processor';
import { processColumns } from 'src/sql-tools/from-code/processors/column.processor';
import { processConfigurationParameters } from 'src/sql-tools/from-code/processors/configuration-parameter.processor';
import { processDatabases } from 'src/sql-tools/from-code/processors/database.processor';
import { processEnums } from 'src/sql-tools/from-code/processors/enum.processor';
import { processExtensions } from 'src/sql-tools/from-code/processors/extension.processor';
import { processForeignKeyConstraints } from 'src/sql-tools/from-code/processors/foreign-key-constriant.processor';
import { processFunctions } from 'src/sql-tools/from-code/processors/function.processor';
import { processIndexes } from 'src/sql-tools/from-code/processors/index.processor';
import { processPrimaryKeyConstraints } from 'src/sql-tools/from-code/processors/primary-key-contraint.processor';
import { processTables } from 'src/sql-tools/from-code/processors/table.processor';
import { processTriggers } from 'src/sql-tools/from-code/processors/trigger.processor';
import { Processor, SchemaBuilder } from 'src/sql-tools/from-code/processors/type';
import { processUniqueConstraints } from 'src/sql-tools/from-code/processors/unique-constraint.processor';
import { getRegisteredItems, resetRegisteredItems } from 'src/sql-tools/from-code/register';
import { DatabaseSchema } from 'src/sql-tools/types';

let initialized = false;
let schema: DatabaseSchema;

export const reset = () => {
  initialized = false;
  resetRegisteredItems();
};

const processors: Processor[] = [
  processDatabases,
  processConfigurationParameters,
  processEnums,
  processExtensions,
  processFunctions,
  processTables,
  processColumns,
  processUniqueConstraints,
  processCheckConstraints,
  processPrimaryKeyConstraints,
  processForeignKeyConstraints,
  processIndexes,
  processTriggers,
];

export type SchemaFromCodeOptions = {
  /** automatically create indexes on foreign key columns */
  createForeignKeyIndexes?: boolean;
};
export const schemaFromCode = (options: SchemaFromCodeOptions = {}) => {
  if (!initialized) {
    const globalOptions = {
      createForeignKeyIndexes: options.createForeignKeyIndexes ?? true,
    };

    const builder: SchemaBuilder = {
      name: 'postgres',
      schemaName: 'public',
      tables: [],
      functions: [],
      enums: [],
      extensions: [],
      parameters: [],
      warnings: [],
    };

    const items = getRegisteredItems();

    for (const processor of processors) {
      processor(builder, items, globalOptions);
    }

    schema = { ...builder, tables: builder.tables.map(({ metadata: _, ...table }) => table) };
    initialized = true;
  }

  return schema;
};
