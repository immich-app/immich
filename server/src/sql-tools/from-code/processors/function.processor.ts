import { Processor } from 'src/sql-tools/from-code/processors/type';

export const processFunctions: Processor = (builder, items) => {
  for (const { item } of items.filter((item) => item.type === 'function')) {
    // TODO log warnings if function name is not unique
    builder.functions.push(item);
  }
};
