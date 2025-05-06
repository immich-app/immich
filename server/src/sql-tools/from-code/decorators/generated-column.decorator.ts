import { Column, ColumnOptions, ColumnValue } from 'src/sql-tools/from-code/decorators/column.decorator';
import { ColumnType } from 'src/sql-tools/types';

export type GeneratedColumnStrategy = 'uuid' | 'identity';

export type GenerateColumnOptions = Omit<ColumnOptions, 'type'> & {
  strategy?: GeneratedColumnStrategy;
};

export const GeneratedColumn = ({ strategy = 'uuid', ...options }: GenerateColumnOptions): PropertyDecorator => {
  let columnType: ColumnType | undefined;
  let columnDefault: ColumnValue | undefined;

  switch (strategy) {
    case 'uuid': {
      columnType = 'uuid';
      columnDefault = () => 'uuid_generate_v4()';
      break;
    }

    case 'identity': {
      columnType = 'integer';
      options.identity = true;
      break;
    }

    default: {
      throw new Error(`Unsupported strategy for @GeneratedColumn ${strategy}`);
    }
  }

  return Column({
    type: columnType,
    default: columnDefault,
    ...options,
  });
};
