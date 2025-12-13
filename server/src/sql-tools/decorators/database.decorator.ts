import { register } from 'src/sql-tools/register';

export type DatabaseOptions = {
  name?: string;
  synchronize?: boolean;
};
export const Database = (options: DatabaseOptions): ClassDecorator => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return (object: Function) => void register({ type: 'database', item: { object, options } });
};
