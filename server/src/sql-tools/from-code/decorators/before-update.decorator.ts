import { TriggerFunction, TriggerFunctionOptions } from 'src/sql-tools/from-code/decorators/trigger-function.decorator';

export const BeforeUpdateTrigger = (options: Omit<TriggerFunctionOptions, 'timing' | 'actions'>) =>
  TriggerFunction({
    timing: 'before',
    actions: ['update'],
    ...options,
  });
