import { haveEqualColumns } from 'src/sql-tools/helpers';
import { Comparer, DatabaseIndex, Reason } from 'src/sql-tools/types';

export const compareIndexes: Comparer<DatabaseIndex> = {
  onMissing: (source) => [
    {
      type: 'index.create',
      index: source,
      reason: Reason.MissingInTarget,
    },
  ],
  onExtra: (target) => [
    {
      type: 'index.drop',
      indexName: target.name,
      reason: Reason.MissingInSource,
    },
  ],
  onCompare: (source, target) => {
    const sourceUsing = source.using ?? 'btree';
    const targetUsing = target.using ?? 'btree';

    let reason = '';

    if (!haveEqualColumns(source.columnNames, target.columnNames)) {
      reason = `columns are different (${source.columnNames} vs ${target.columnNames})`;
    } else if (source.unique !== target.unique) {
      reason = `uniqueness is different (${source.unique} vs ${target.unique})`;
    } else if (sourceUsing !== targetUsing) {
      reason = `using method is different (${source.using} vs ${target.using})`;
    } else if (source.where !== target.where) {
      reason = `where clause is different (${source.where} vs ${target.where})`;
    } else if (source.expression !== target.expression) {
      reason = `expression is different (${source.expression} vs ${target.expression})`;
    }

    if (reason) {
      return [
        { type: 'index.drop', indexName: target.name, reason },
        { type: 'index.create', index: source, reason },
      ];
    }

    return [];
  },
};
