import { transformColumns } from 'src/sql-tools/transformers/column.transformer';
import { transformConstraints } from 'src/sql-tools/transformers/constraint.transformer';
import { transformEnums } from 'src/sql-tools/transformers/enum.transformer';
import { transformExtensions } from 'src/sql-tools/transformers/extension.transformer';
import { transformFunctions } from 'src/sql-tools/transformers/function.transformer';
import { transformIndexes } from 'src/sql-tools/transformers/index.transformer';
import { transformOverrides } from 'src/sql-tools/transformers/override.transformer';
import { transformParameters } from 'src/sql-tools/transformers/parameter.transformer';
import { transformTables } from 'src/sql-tools/transformers/table.transformer';
import { transformTriggers } from 'src/sql-tools/transformers/trigger.transformer';
import { SqlTransformer } from 'src/sql-tools/transformers/types';

export const transformers: SqlTransformer[] = [
  transformColumns,
  transformConstraints,
  transformEnums,
  transformExtensions,
  transformFunctions,
  transformIndexes,
  transformParameters,
  transformTables,
  transformTriggers,
  transformOverrides,
];
