import { register } from 'src/sql-tools/from-code/register';

type Action = 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION';

export type CompositeForeignKeyOptions = {
  columns: string[];
  target: () => object;
  targetColumns: string[];
  onUpdate?: Action;
  onDelete?: Action;
  constraintName?: string;
  synchronize?: boolean;
};

export const CompositeForeignKey = (options: CompositeForeignKeyOptions): ClassDecorator => {
  return (target: object) => {
    register({ type: 'compositeForeignKey', item: { object: target, options } });
  };
};
