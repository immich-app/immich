import { ColumnBaseOptions } from 'src/sql-tools/from-code/decorators/column.decorator';
import { register } from 'src/sql-tools/from-code/register';

type Action = 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION';

export type ForeignKeyColumnOptions = ColumnBaseOptions & {
  onUpdate?: Action;
  onDelete?: Action;
  constraintName?: string;
};

export const ForeignKeyColumn = (target: () => object, options: ForeignKeyColumnOptions): PropertyDecorator => {
  return (object: object, propertyName: string | symbol) => {
    register({ type: 'foreignKeyColumn', item: { object, propertyName, options, target } });
  };
};
