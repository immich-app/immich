import { register } from 'src/sql-tools/from-code/register';
import { DatabaseEnum } from 'src/sql-tools/types';

export type EnumOptions = {
  name: string;
  values: string[];
  synchronize?: boolean;
};

export const registerEnum = (options: EnumOptions) => {
  const item: DatabaseEnum = {
    name: options.name,
    values: options.values,
    synchronize: options.synchronize ?? true,
  };

  register({ type: 'enum', item });

  return item;
};
