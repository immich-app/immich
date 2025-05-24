import { TriggerFunction, TriggerFunctionOptions } from 'src/sql-tools/from-code/decorators/trigger-function.decorator';

export const AfterInsertTrigger = (options: Omit<TriggerFunctionOptions, 'timing' | 'actions'>) =>
  TriggerFunction({
    timing: 'after',
    actions: ['insert'],
    ...options,
  });
