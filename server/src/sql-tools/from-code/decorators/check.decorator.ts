import { register } from 'src/sql-tools/from-code/register';

export type CheckOptions = {
  name?: string;
  expression: string;
  synchronize?: boolean;
};
export const Check = (options: CheckOptions): ClassDecorator => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return (object: Function) => void register({ type: 'checkConstraint', item: { object, options } });
};
