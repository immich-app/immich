import { register } from 'src/sql-tools/from-code/register';

export type ForeignKeyAction = 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION';

export type ForeignKeyConstraintOptions = {
  name?: string;
  index?: boolean;
  indexName?: string;
  columns: string[];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  referenceTable: () => Function;
  referenceColumns?: string[];
  onUpdate?: ForeignKeyAction;
  onDelete?: ForeignKeyAction;
  synchronize?: boolean;
};

export const ForeignKeyConstraint = (options: ForeignKeyConstraintOptions): ClassDecorator => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return (target: Function) => {
    register({ type: 'foreignKeyConstraint', item: { object: target, options } });
  };
};
