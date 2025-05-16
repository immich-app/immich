import { register } from 'src/sql-tools/from-code/register';

export type UniqueOptions = {
  name?: string;
  columns: string[];
  synchronize?: boolean;
};
export const Unique = (options: UniqueOptions): ClassDecorator => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return (object: Function) => void register({ type: 'uniqueConstraint', item: { object, options } });
};
