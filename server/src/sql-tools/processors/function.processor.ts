import { Processor } from 'src/sql-tools/types';

export const processFunctions: Processor = (ctx, items) => {
  if (ctx.options.functions === false) {
    return;
  }

  for (const { item } of items.filter((item) => item.type === 'function')) {
    // TODO log warnings if function name is not unique
    ctx.functions.push(item);
  }
};
