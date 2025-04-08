import { Column, ColumnOptions } from 'src/sql-tools/from-code/decorators/column.decorator';

export const CreateDateColumn = (options: ColumnOptions = {}): PropertyDecorator => {
  return Column({
    type: 'timestamp with time zone',
    default: () => 'now()',
    ...options,
  });
};
