import { asSnakeCase } from 'src/sql-tools/helpers';
import { Processor } from 'src/sql-tools/types';

export const processDatabases: Processor = (ctx, items) => {
  for (const {
    item: { object, options },
  } of items.filter((item) => item.type === 'database')) {
    ctx.databaseName = options.name || asSnakeCase(object.name);
  }
};
