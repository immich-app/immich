import { Comparer, DatabaseTrigger, Reason } from 'src/sql-tools/types';

export const compareTriggers: Comparer<DatabaseTrigger> = {
  onMissing: (source) => [
    {
      type: 'trigger.create',
      trigger: source,
      reason: Reason.MissingInTarget,
    },
  ],
  onExtra: (target) => [
    {
      type: 'trigger.drop',
      tableName: target.tableName,
      triggerName: target.name,
      reason: Reason.MissingInSource,
    },
  ],
  onCompare: (source, target) => {
    let reason = '';
    if (source.functionName !== target.functionName) {
      reason = `function is different (${source.functionName} vs ${target.functionName})`;
    } else if (source.actions.join(' OR ') !== target.actions.join(' OR ')) {
      reason = `action is different (${source.actions} vs ${target.actions})`;
    } else if (source.timing !== target.timing) {
      reason = `timing method is different (${source.timing} vs ${target.timing})`;
    } else if (source.scope !== target.scope) {
      reason = `scope is different (${source.scope} vs ${target.scope})`;
    } else if (source.referencingNewTableAs !== target.referencingNewTableAs) {
      reason = `new table reference is different (${source.referencingNewTableAs} vs ${target.referencingNewTableAs})`;
    } else if (source.referencingOldTableAs !== target.referencingOldTableAs) {
      reason = `old table reference is different (${source.referencingOldTableAs} vs ${target.referencingOldTableAs})`;
    }

    if (reason) {
      return [{ type: 'trigger.create', trigger: source, reason }];
    }

    return [];
  },
};
