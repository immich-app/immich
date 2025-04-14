import { Comparer, DatabaseExtension, Reason } from 'src/sql-tools/types';

export const compareExtensions: Comparer<DatabaseExtension> = {
  onMissing: (source) => [
    {
      type: 'extension.create',
      extension: source,
      reason: Reason.MissingInTarget,
    },
  ],
  onExtra: (target) => [
    {
      type: 'extension.drop',
      extensionName: target.name,
      reason: Reason.MissingInSource,
    },
  ],
  onCompare: () => {
    // if the name matches they are the same
    return [];
  },
};
