import { register } from 'src/sql-tools/from-code/register';
import { asOptions } from 'src/sql-tools/helpers';

export type ColumnIndexOptions = {
  name?: string;
  unique?: boolean;
  expression?: string;
  using?: string;
  with?: string;
  where?: string;
  synchronize?: boolean;
};
export const ColumnIndex = (options: string | ColumnIndexOptions = {}): PropertyDecorator => {
  return (object: object, propertyName: string | symbol) =>
    void register({ type: 'columnIndex', item: { object, propertyName, options: asOptions(options) } });
};
