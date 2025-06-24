import { ColumnBaseOptions } from 'src/sql-tools/from-code/decorators/column.decorator';
import { ForeignKeyAction } from 'src/sql-tools/from-code/decorators/foreign-key-constraint.decorator';
import { register } from 'src/sql-tools/from-code/register';

export type ForeignKeyColumnOptions = ColumnBaseOptions & {
  onUpdate?: ForeignKeyAction;
  onDelete?: ForeignKeyAction;
  constraintName?: string;
};

export const ForeignKeyColumn = (target: () => object, options: ForeignKeyColumnOptions): PropertyDecorator => {
  return (object: object, propertyName: string | symbol) => {
    register({ type: 'foreignKeyColumn', item: { object, propertyName, options, target } });
  };
};
