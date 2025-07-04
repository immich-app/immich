import { compareColumns } from 'src/sql-tools/comparers/column.comparer';
import { compareConstraints } from 'src/sql-tools/comparers/constraint.comparer';
import { compareIndexes } from 'src/sql-tools/comparers/index.comparer';
import { compareTriggers } from 'src/sql-tools/comparers/trigger.comparer';
import { compare } from 'src/sql-tools/helpers';
import { Comparer, DatabaseTable, Reason, SchemaDiff } from 'src/sql-tools/types';

const newTable = (name: string) => ({
  name,
  columns: [],
  indexes: [],
  constraints: [],
  triggers: [],
  synchronize: true,
});

export const compareTables: Comparer<DatabaseTable> = {
  onMissing: (source) => [
    {
      type: 'TableCreate',
      table: source,
      reason: Reason.MissingInTarget,
    },
    // TODO merge constraints into table create record when possible
    ...compareTable(source, newTable(source.name), { columns: false }),
  ],
  onExtra: (target) => [
    ...compareTable(newTable(target.name), target, { columns: false }),
    {
      type: 'TableDrop',
      tableName: target.name,
      reason: Reason.MissingInSource,
    },
  ],
  onCompare: (source, target) => compareTable(source, target, { columns: true }),
};

const compareTable = (source: DatabaseTable, target: DatabaseTable, options: { columns?: boolean }): SchemaDiff[] => {
  return [
    ...(options.columns ? compare(source.columns, target.columns, {}, compareColumns) : []),
    ...compare(source.indexes, target.indexes, {}, compareIndexes),
    ...compare(source.constraints, target.constraints, {}, compareConstraints),
    ...compare(source.triggers, target.triggers, {}, compareTriggers),
  ];
};
