import { Comparer, DatabaseFunction, Reason } from 'src/sql-tools/types';

export const compareFunctions: Comparer<DatabaseFunction> = {
  onMissing: (source) => [
    {
      type: 'FunctionCreate',
      function: source,
      reason: Reason.MissingInTarget,
    },
  ],
  onExtra: (target) => [
    {
      type: 'FunctionDrop',
      functionName: target.name,
      reason: Reason.MissingInSource,
    },
  ],
  onCompare: (source, target) => {
    if (source.expression !== target.expression) {
      const reason = `function expression has changed (${source.expression} vs ${target.expression})`;
      return [
        {
          type: 'FunctionCreate',
          function: source,
          reason,
        },
      ];
    }

    return [];
  },
};
