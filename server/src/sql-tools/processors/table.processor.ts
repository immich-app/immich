import { asSnakeCase } from 'src/sql-tools/helpers';
import { Processor } from 'src/sql-tools/types';

export const processTables: Processor = (builder, items) => {
  for (const {
    item: { options, object },
  } of items.filter((item) => item.type === 'table')) {
    const test = builder.getTableByObject(object);
    if (test) {
      throw new Error(
        `Table ${test.name} has already been registered. Does ${object.name} have two @Table() decorators?`,
      );
    }

    builder.addTable(
      {
        name: options.name || asSnakeCase(object.name),
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
