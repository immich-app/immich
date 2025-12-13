import { Processor } from 'src/sql-tools/types';

export const processExtensions: Processor = (ctx, items) => {
  if (ctx.options.extensions === false) {
    return;
  }

  for (const {
    item: { options },
  } of items.filter((item) => item.type === 'extension')) {
    ctx.extensions.push({
      name: options.name,
      synchronize: options.synchronize ?? true,
    });
  }
};
