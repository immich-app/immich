import { register } from 'src/sql-tools/from-code/register';
import { asOptions } from 'src/sql-tools/helpers';

export type TableOptions = {
  name?: string;
  primaryConstraintName?: string;
  synchronize?: boolean;
};

/** Table comments here */
export const Table = (options: string | TableOptions = {}): ClassDecorator => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return (object: Function) => void register({ type: 'table', item: { object, options: asOptions(options) } });
};
