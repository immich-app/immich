import { register } from 'src/sql-tools/from-code/register';
import { asOptions } from 'src/sql-tools/helpers';

export type ExtensionsOptions = {
  name: string;
  synchronize?: boolean;
};
export const Extensions = (options: Array<string | ExtensionsOptions>): ClassDecorator => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return (object: Function) => {
    for (const option of options) {
      register({ type: 'extension', item: { object, options: asOptions(option) } });
    }
  };
};
