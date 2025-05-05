import { Comparer, DatabaseParameter, Reason } from 'src/sql-tools/types';

export const compareParameters: Comparer<DatabaseParameter> = {
  onMissing: (source) => [
    {
      type: 'parameter.set',
      parameter: source,
      reason: Reason.MissingInTarget,
    },
  ],
  onExtra: (target) => [
    {
      type: 'parameter.reset',
      databaseName: target.databaseName,
      parameterName: target.name,
      reason: Reason.MissingInSource,
    },
  ],
  onCompare: () => {
    // TODO
    return [];
  },
};
