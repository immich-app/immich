import { onMissingTable, resolveTable } from 'src/sql-tools/from-code/processors/table.processor';
import { Processor } from 'src/sql-tools/from-code/processors/type';
import { asTriggerName } from 'src/sql-tools/helpers';

export const processTriggers: Processor = (builder, items) => {
  for (const {
    item: { object, options },
  } of items.filter((item) => item.type === 'trigger')) {
    const table = resolveTable(builder, object);
    if (!table) {
      onMissingTable(builder, '@Trigger', object);
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
