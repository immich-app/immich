import { Comparer, DatabaseParameter, Reason } from 'src/sql-tools/types';

export const compareParameters: Comparer<DatabaseParameter> = {
  onMissing: (source) => [
    {
      type: 'ParameterSet',
      parameter: source,
      reason: Reason.MissingInTarget,
    },
  ],
  onExtra: (target) => [
    {
      type: 'ParameterReset',
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
