import { Comparer, DatabaseOverride, Reason } from 'src/sql-tools/types';

export const compareOverrides: Comparer<DatabaseOverride> = {
  onMissing: (source) => [
    {
      type: 'OverrideCreate',
      override: source,
      reason: Reason.MissingInTarget,
    },
  ],
  onExtra: (target) => [
    {
      type: 'OverrideDrop',
      overrideName: target.name,
      reason: Reason.MissingInSource,
    },
  ],
  onCompare: (source, target) => {
    if (source.value.name !== target.value.name || source.value.sql !== target.value.sql) {
      const sourceValue = JSON.stringify(source.value);
      const targetValue = JSON.stringify(target.value);
      return [
        { type: 'OverrideUpdate', override: source, reason: `value is different (${sourceValue} vs ${targetValue})` },
      ];
    }

    return [];
  },
};
