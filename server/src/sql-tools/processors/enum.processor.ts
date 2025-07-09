import { Processor } from 'src/sql-tools/types';

export const processEnums: Processor = (ctx, items) => {
  for (const { item } of items.filter((item) => item.type === 'enum')) {
    // TODO log warnings if enum name is not unique
    ctx.enums.push(item);
  }
};
