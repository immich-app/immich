import { SqlTransformer } from 'src/sql-tools/transformers/types';
import { DatabaseEnum } from 'src/sql-tools/types';

export const transformEnums: SqlTransformer = (ctx, item) => {
  switch (item.type) {
    case 'EnumCreate': {
      return asEnumCreate(item.enum);
    }

    case 'EnumDrop': {
      return asEnumDrop(item.enumName);
    }

    default: {
      return false;
    }
  }
};

const asEnumCreate = ({ name, values }: DatabaseEnum): string => {
  return `CREATE TYPE "${name}" AS ENUM (${values.map((value) => `'${value}'`)});`;
};

const asEnumDrop = (enumName: string): string => {
  return `DROP TYPE "${enumName}";`;
};
