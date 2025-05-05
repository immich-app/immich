import { register } from 'src/sql-tools/from-code/register';
import { asOptions } from 'src/sql-tools/helpers';
import { ColumnStorage, ColumnType, DatabaseEnum } from 'src/sql-tools/types';

export type ColumnValue = null | boolean | string | number | object | Date | (() => string);

export type ColumnBaseOptions = {
  name?: string;
  primary?: boolean;
  type?: ColumnType;
  nullable?: boolean;
  length?: number;
  default?: ColumnValue;
  comment?: string;
  synchronize?: boolean;
  storage?: ColumnStorage;
  identity?: boolean;
  index?: boolean;
  indexName?: string;
  unique?: boolean;
  uniqueConstraintName?: string;
};

export type ColumnOptions = ColumnBaseOptions & {
  enum?: DatabaseEnum;
  array?: boolean;
};

export const Column = (options: string | ColumnOptions = {}): PropertyDecorator => {
  return (object: object, propertyName: string | symbol) =>
    void register({ type: 'column', item: { object, propertyName, options: asOptions(options) } });
};
