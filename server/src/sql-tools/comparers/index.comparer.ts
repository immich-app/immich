import { asRenameKey, haveEqualColumns } from 'src/sql-tools/helpers';
import { Comparer, DatabaseIndex, Reason } from 'src/sql-tools/types';

export const compareIndexes: Comparer<DatabaseIndex> = {
  getRenameKey: (index) => {
    if (index.override) {
      return index.override.value.sql.replace(index.name, 'INDEX_NAME');
    }

    return asRenameKey([index.tableName, ...(index.columnNames || []).toSorted(), index.unique]);
  },
  onRename: (source, target) => [
    {
      type: 'IndexRename',
      tableName: source.tableName,
      oldName: target.name,
      newName: source.name,
      reason: Reason.Rename,
    },
  ],
  onMissing: (source) => [
    {
      type: 'IndexCreate',
      index: source,
      reason: Reason.MissingInTarget,
    },
  ],
  onExtra: (target) => [
    {
      type: 'IndexDrop',
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
        { type: 'IndexDrop', indexName: target.name, reason },
        { type: 'IndexCreate', index: source, reason },
      ];
    }

    return [];
  },
};
