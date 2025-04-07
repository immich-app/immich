import { transformColumns } from 'src/sql-tools/to-sql/transformers/column.transformer';
import { transformConstraints } from 'src/sql-tools/to-sql/transformers/constraint.transformer';
import { transformEnums } from 'src/sql-tools/to-sql/transformers/enum.transformer';
import { transformExtensions } from 'src/sql-tools/to-sql/transformers/extension.transformer';
import { transformFunctions } from 'src/sql-tools/to-sql/transformers/function.transformer';
import { transformIndexes } from 'src/sql-tools/to-sql/transformers/index.transformer';
import { transformParameters } from 'src/sql-tools/to-sql/transformers/parameter.transformer';
import { transformTables } from 'src/sql-tools/to-sql/transformers/table.transformer';
import { transformTriggers } from 'src/sql-tools/to-sql/transformers/trigger.transformer';
import { SqlTransformer } from 'src/sql-tools/to-sql/transformers/types';
import { SchemaDiff, SchemaDiffToSqlOptions } from 'src/sql-tools/types';

/**
 * Convert schema diffs into SQL statements
 */
export const schemaDiffToSql = (items: SchemaDiff[], options: SchemaDiffToSqlOptions = {}): string[] => {
  return items.flatMap((item) => asSql(item).map((result) => result + withComments(options.comments, item)));
};

const transformers: SqlTransformer[] = [
  transformColumns,
  transformConstraints,
  transformEnums,
  transformExtensions,
  transformFunctions,
  transformIndexes,
  transformParameters,
  transformTables,
  transformTriggers,
];

const asSql = (item: SchemaDiff): string[] => {
  for (const transform of transformers) {
    const result = transform(item);
    if (!result) {
      continue;
    }

    return asArray(result);
  }

  throw new Error(`Unhandled schema diff type: ${item.type}`);
};

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
