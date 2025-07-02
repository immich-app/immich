import { Processor } from 'src/sql-tools/types';

export const processEnums: Processor = (builder, items) => {
  for (const { item } of items.filter((item) => item.type === 'enum')) {
    // TODO log warnings if enum name is not unique
    builder.enums.push(item);
  }
};
