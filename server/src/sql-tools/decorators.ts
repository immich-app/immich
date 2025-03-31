/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { register } from 'src/sql-tools/schema-from-decorators';
import {
  CheckOptions,
  ColumnDefaultValue,
  ColumnIndexOptions,
  ColumnOptions,
  ForeignKeyColumnOptions,
  GenerateColumnOptions,
  IndexOptions,
  TableOptions,
  UniqueOptions,
} from 'src/sql-tools/types';

export const Table = (options: string | TableOptions = {}): ClassDecorator => {
  return (object: Function) => void register({ type: 'table', item: { object, options: asOptions(options) } });
};

export const Column = (options: string | ColumnOptions = {}): PropertyDecorator => {
  return (object: object, propertyName: string | symbol) =>
    void register({ type: 'column', item: { object, propertyName, options: asOptions(options) } });
};

export const Index = (options: string | IndexOptions = {}): ClassDecorator => {
  return (object: Function) => void register({ type: 'index', item: { object, options: asOptions(options) } });
};

export const Unique = (options: UniqueOptions): ClassDecorator => {
  return (object: Function) => void register({ type: 'uniqueConstraint', item: { object, options } });
};

export const Check = (options: CheckOptions): ClassDecorator => {
  return (object: Function) => void register({ type: 'checkConstraint', item: { object, options } });
};

export const ColumnIndex = (options: string | ColumnIndexOptions = {}): PropertyDecorator => {
  return (object: object, propertyName: string | symbol) =>
    void register({ type: 'columnIndex', item: { object, propertyName, options: asOptions(options) } });
};

export const ForeignKeyColumn = (target: () => object, options: ForeignKeyColumnOptions): PropertyDecorator => {
  return (object: object, propertyName: string | symbol) => {
    register({ type: 'foreignKeyColumn', item: { object, propertyName, options, target } });
  };
};

export const CreateDateColumn = (options: ColumnOptions = {}): PropertyDecorator => {
  return Column({
    type: 'timestamp with time zone',
    default: () => 'now()',
    ...options,
  });
};

export const UpdateDateColumn = (options: ColumnOptions = {}): PropertyDecorator => {
  return Column({
    type: 'timestamp with time zone',
    default: () => 'now()',
    ...options,
  });
};

export const DeleteDateColumn = (options: ColumnOptions = {}): PropertyDecorator => {
  return Column({
    type: 'timestamp with time zone',
    nullable: true,
    ...options,
  });
};

export const PrimaryGeneratedColumn = (options: Omit<GenerateColumnOptions, 'primary'> = {}) =>
  GeneratedColumn({ type: 'v4', ...options, primary: true });

export const PrimaryColumn = (options: Omit<ColumnOptions, 'primary'> = {}) => Column({ ...options, primary: true });

export const GeneratedColumn = ({ type = 'v4', ...options }: GenerateColumnOptions): PropertyDecorator => {
  const columnType = type === 'v4' || type === 'v7' ? 'uuid' : type;

  let columnDefault: ColumnDefaultValue | undefined;
  switch (type) {
    case 'v4': {
      columnDefault = () => 'uuid_generate_v4()';
      break;
    }

    case 'v7': {
      columnDefault = () => 'immich_uuid_v7()';
      break;
    }
  }

  return Column({
    type: columnType,
    default: columnDefault,
    ...options,
  });
};

export const UpdateIdColumn = () => GeneratedColumn({ type: 'v7', nullable: false });

const asOptions = <T extends { name?: string }>(options: string | T): T => {
  if (typeof options === 'string') {
    return { name: options } as T;
  }

  return options;
};
