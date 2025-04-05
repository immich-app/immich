import { register } from 'src/sql-tools/from-code/register';
import { TriggerAction, TriggerScope, TriggerTiming } from 'src/sql-tools/types';

export type TriggerOptions = {
  name?: string;
  timing: TriggerTiming;
  actions: TriggerAction[];
  scope: TriggerScope;
  functionName: string;
  referencingNewTableAs?: string;
  referencingOldTableAs?: string;
  when?: string;
  synchronize?: boolean;
};

export const Trigger = (options: TriggerOptions): ClassDecorator => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return (object: Function) => void register({ type: 'trigger', item: { object, options } });
};
