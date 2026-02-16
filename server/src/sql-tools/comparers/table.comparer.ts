import { compareColumns } from 'src/sql-tools/comparers/column.comparer';
import { compareConstraints } from 'src/sql-tools/comparers/constraint.comparer';
import { compareIndexes } from 'src/sql-tools/comparers/index.comparer';
import { compareTriggers } from 'src/sql-tools/comparers/trigger.comparer';
import { compare } from 'src/sql-tools/helpers';
import { Comparer, DatabaseTable, Reason, SchemaDiffOptions } from 'src/sql-tools/types';

export const compareTables = (options: SchemaDiffOptions): Comparer<DatabaseTable> => ({
  onMissing: (source) => [
    {
      type: 'TableCreate',
      table: source,
      reason: Reason.MissingInTarget,
    },
  ],
  onExtra: (target) => [
    {
      type: 'TableDrop',
      tableName: target.name,
      reason: Reason.MissingInSource,
    },
  ],
  onCompare: (source, target) => {
    return [
      ...compare(source.columns, target.columns, options.columns, compareColumns()),
      ...compare(source.indexes, target.indexes, options.indexes, compareIndexes()),
      ...compare(source.constraints, target.constraints, options.constraints, compareConstraints()),
      ...compare(source.triggers, target.triggers, options.triggers, compareTriggers()),
    ];
  },
});
