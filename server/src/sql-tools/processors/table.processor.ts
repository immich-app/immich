import { Processor } from 'src/sql-tools/types';

export const processTables: Processor = (ctx, items) => {
  for (const {
    item: { options, object },
  } of items.filter((item) => item.type === 'table')) {
    const test = ctx.getTableByObject(object);
    if (test) {
      throw new Error(
        `Table ${test.name} has already been registered. Does ${object.name} have two @Table() decorators?`,
      );
    }

    ctx.addTable(
      {
        name: options.name || ctx.getNameFor({ type: 'table', name: object.name }),
        columns: [],
        constraints: [],
        indexes: [],
        triggers: [],
        synchronize: options.synchronize ?? true,
      },
      options,
      object,
    );
  }
};
