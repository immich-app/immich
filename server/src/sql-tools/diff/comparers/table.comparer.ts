import { compareColumns } from 'src/sql-tools/diff/comparers/column.comparer';
import { compareConstraints } from 'src/sql-tools/diff/comparers/constraint.comparer';
import { compareIndexes } from 'src/sql-tools/diff/comparers/index.comparer';
import { compareTriggers } from 'src/sql-tools/diff/comparers/trigger.comparer';
import { compare } from 'src/sql-tools/helpers';
import { Comparer, DatabaseTable, Reason, SchemaDiff } from 'src/sql-tools/types';

export const compareTables: Comparer<DatabaseTable> = {
  onMissing: (source) => [
    {
      type: 'table.create',
      table: source,
      reason: Reason.MissingInTarget,
    },
    // TODO merge constraints into table create record when possible
    ...compareTable(
      source,
      {
        name: source.name,
        columns: [],
        indexes: [],
        constraints: [],
        triggers: [],
        synchronize: true,
      },

      { columns: false },
    ),
  ],
  onExtra: (target) => [
    ...compareTable(
      {
        name: target.name,
        columns: [],
        indexes: [],
        constraints: [],
        triggers: [],
        synchronize: true,
      },
      target,
      { columns: false },
    ),
    {
      type: 'table.drop',
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
