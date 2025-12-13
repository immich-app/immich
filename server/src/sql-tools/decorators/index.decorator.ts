import { asOptions } from 'src/sql-tools/helpers';
import { register } from 'src/sql-tools/register';

export type IndexOptions = {
  name?: string;
  unique?: boolean;
  expression?: string;
  using?: string;
  with?: string;
  where?: string;
  columns?: string[];
  synchronize?: boolean;
};
export const Index = (options: string | IndexOptions = {}): ClassDecorator => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return (object: Function) => void register({ type: 'index', item: { object, options: asOptions(options) } });
};
