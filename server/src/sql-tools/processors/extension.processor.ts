import { Processor } from 'src/sql-tools/types';

export const processExtensions: Processor = (builder, items) => {
  for (const {
    item: { options },
  } of items.filter((item) => item.type === 'extension')) {
    builder.extensions.push({
      name: options.name,
      synchronize: options.synchronize ?? true,
    });
  }
};
