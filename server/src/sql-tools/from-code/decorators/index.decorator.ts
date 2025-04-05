import { ColumnIndexOptions } from 'src/sql-tools/from-code/decorators/column-index.decorator';
import { register } from 'src/sql-tools/from-code/register';
import { asOptions } from 'src/sql-tools/helpers';

export type IndexOptions = ColumnIndexOptions & {
  columns?: string[];
  synchronize?: boolean;
};
export const Index = (options: string | IndexOptions = {}): ClassDecorator => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return (object: Function) => void register({ type: 'index', item: { object, options: asOptions(options) } });
};
