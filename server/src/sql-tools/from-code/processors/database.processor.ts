import { Processor } from 'src/sql-tools/from-code/processors/type';
import { asSnakeCase } from 'src/sql-tools/helpers';

export const processDatabases: Processor = (builder, items) => {
  for (const {
    item: { object, options },
  } of items.filter((item) => item.type === 'database')) {
    builder.name = options.name || asSnakeCase(object.name);
  }
};
