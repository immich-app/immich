import { onMissingTable, resolveTable } from 'src/sql-tools/from-code/processors/table.processor';
import { Processor } from 'src/sql-tools/from-code/processors/type';
import { asIndexName } from 'src/sql-tools/helpers';

export const processIndexes: Processor = (builder, items) => {
  for (const {
    item: { object, options },
  } of items.filter((item) => item.type === 'index')) {
    const table = resolveTable(builder, object);
    if (!table) {
      onMissingTable(builder, '@Check', object);
      continue;
    }

    table.indexes.push({
      name: options.name || asIndexName(table.name, options.columns, options.where),
      tableName: table.name,
      unique: options.unique ?? false,
      expression: options.expression,
      using: options.using,
      with: options.with,
      where: options.where,
      columnNames: options.columns,
      synchronize: options.synchronize ?? true,
    });
  }
};
