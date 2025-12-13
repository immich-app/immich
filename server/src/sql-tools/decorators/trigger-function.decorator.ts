import { Trigger, TriggerOptions } from 'src/sql-tools/decorators/trigger.decorator';
import { DatabaseFunction } from 'src/sql-tools/types';

export type TriggerFunctionOptions = Omit<TriggerOptions, 'functionName'> & { function: DatabaseFunction };
export const TriggerFunction = (options: TriggerFunctionOptions) =>
  Trigger({
    name: options.function.name,
    ...options,
    functionName: options.function.name,
  });
