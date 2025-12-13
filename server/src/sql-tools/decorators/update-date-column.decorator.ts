import { Column, ColumnOptions } from 'src/sql-tools/decorators/column.decorator';

export const UpdateDateColumn = (options: ColumnOptions = {}): PropertyDecorator => {
  return Column({
    type: 'timestamp with time zone',
    default: () => 'now()',
    ...options,
  });
};
