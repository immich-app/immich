import { Comparer, DatabaseFunction, Reason } from 'src/sql-tools/types';

export const compareFunctions: Comparer<DatabaseFunction> = {
  onMissing: (source) => [
    {
      type: 'function.create',
      function: source,
      reason: Reason.MissingInTarget,
    },
  ],
  onExtra: (target) => [
    {
      type: 'function.drop',
      functionName: target.name,
      reason: Reason.MissingInSource,
    },
  ],
  onCompare: (source, target) => {
    if (source.expression !== target.expression) {
      const reason = `function expression has changed (${source.expression} vs ${target.expression})`;
      return [
        {
          type: 'function.create',
          function: source,
          reason,
        },
      ];
    }

    return [];
  },
};
