import { TriggerOptions } from 'src/sql-tools/decorators/trigger.decorator';
import { asKey } from 'src/sql-tools/helpers';
import { Processor } from 'src/sql-tools/types';

export const processTriggers: Processor = (builder, items) => {
  for (const {
    item: { object, options },
  } of items.filter((item) => item.type === 'trigger')) {
    const table = builder.getTableByObject(object);
    if (!table) {
      builder.warnMissingTable('@Trigger', object);
      continue;
    }

    table.triggers.push({
      name: options.name || asTriggerName(table.name, options),
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

const asTriggerName = (table: string, trigger: TriggerOptions) =>
  asKey('TR_', table, [...trigger.actions, trigger.scope, trigger.timing, trigger.functionName]);
