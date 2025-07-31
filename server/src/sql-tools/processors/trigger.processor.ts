import { Processor } from 'src/sql-tools/types';

export const processTriggers: Processor = (ctx, items) => {
  for (const {
    item: { object, options },
  } of items.filter((item) => item.type === 'trigger')) {
    const table = ctx.getTableByObject(object);
    if (!table) {
      ctx.warnMissingTable('@Trigger', object);
      continue;
    }

    const triggerName =
      options.name ||
      ctx.getNameFor({
        type: 'trigger',
        tableName: table.name,
        actions: options.actions,
        scope: options.scope,
        timing: options.timing,
        functionName: options.functionName,
      });

    table.triggers.push({
      name: triggerName,
      tableName: table.name,
      timing: options.timing,
      actions: options.actions,
      when: options.when,
      scope: options.scope,
      referencingNewTableAs: options.referencingNewTableAs,
      referencingOldTableAs: options.referencingOldTableAs,
      functionName: options.functionName,
      synchronize: options.synchronize ?? true,
    });
  }
};
