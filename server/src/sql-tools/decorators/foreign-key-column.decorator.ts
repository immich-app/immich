/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { ForeignKeyAction } from 'src/sql-tools//decorators/foreign-key-constraint.decorator';
import { ColumnBaseOptions } from 'src/sql-tools/decorators/column.decorator';
import { register } from 'src/sql-tools/register';

export type ForeignKeyColumnOptions = ColumnBaseOptions & {
  onUpdate?: ForeignKeyAction;
  onDelete?: ForeignKeyAction;
  constraintName?: string;
};

export const ForeignKeyColumn = (target: () => Function, options: ForeignKeyColumnOptions): PropertyDecorator => {
  return (object: object, propertyName: string | symbol) => {
    register({ type: 'foreignKeyColumn', item: { object, propertyName, options, target } });
  };
};
