import { Trigger, TriggerOptions } from 'src/sql-tools/from-code/decorators/trigger.decorator';
import { DatabaseFunction } from 'src/sql-tools/types';

export type TriggerFunctionOptions = Omit<TriggerOptions, 'functionName'> & { function: DatabaseFunction };
export const TriggerFunction = (options: TriggerFunctionOptions) =>
  Trigger({ ...options, functionName: options.function.name });
