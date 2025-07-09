import { compareColumns } from 'src/sql-tools/comparers/column.comparer';
import { compareConstraints } from 'src/sql-tools/comparers/constraint.comparer';
import { compareIndexes } from 'src/sql-tools/comparers/index.comparer';
import { compareTriggers } from 'src/sql-tools/comparers/trigger.comparer';
import { compare } from 'src/sql-tools/helpers';
import { Comparer, DatabaseTable, Reason, SchemaDiff } from 'src/sql-tools/types';

export const compareTables: Comparer<DatabaseTable> = {
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
  onCompare: (source, target) => compareTable(source, target),
};

const compareTable = (source: DatabaseTable, target: DatabaseTable): SchemaDiff[] => {
  return [
    ...compare(source.columns, target.columns, {}, compareColumns),
    ...compare(source.indexes, target.indexes, {}, compareIndexes),
    ...compare(source.constraints, target.constraints, {}, compareConstraints),
    ...compare(source.triggers, target.triggers, {}, compareTriggers),
  ];
};
