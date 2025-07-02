import { processCheckConstraints } from 'src/sql-tools/processors/check-constraint.processor';
import { processColumns } from 'src/sql-tools/processors/column.processor';
import { processConfigurationParameters } from 'src/sql-tools/processors/configuration-parameter.processor';
import { processDatabases } from 'src/sql-tools/processors/database.processor';
import { processEnums } from 'src/sql-tools/processors/enum.processor';
import { processExtensions } from 'src/sql-tools/processors/extension.processor';
import { processForeignKeyColumns } from 'src/sql-tools/processors/foreign-key-column.processor';
import { processForeignKeyConstraints } from 'src/sql-tools/processors/foreign-key-constraint.processor';
import { processFunctions } from 'src/sql-tools/processors/function.processor';
import { processIndexes } from 'src/sql-tools/processors/index.processor';
import { processPrimaryKeyConstraints } from 'src/sql-tools/processors/primary-key-contraint.processor';
import { processTables } from 'src/sql-tools/processors/table.processor';
import { processTriggers } from 'src/sql-tools/processors/trigger.processor';
import { processUniqueConstraints } from 'src/sql-tools/processors/unique-constraint.processor';
import { Processor } from 'src/sql-tools/types';

export const processors: Processor[] = [
  processDatabases,
  processConfigurationParameters,
  processEnums,
  processExtensions,
  processFunctions,
  processTables,
  processColumns,
  processForeignKeyColumns,
  processForeignKeyConstraints,
  processUniqueConstraints,
  processCheckConstraints,
  processPrimaryKeyConstraints,
  processIndexes,
  processTriggers,
];
