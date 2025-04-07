import { onMissingColumn, resolveColumn } from 'src/sql-tools/from-code/processors/column.processor';
import { onMissingTable } from 'src/sql-tools/from-code/processors/table.processor';
import { Processor } from 'src/sql-tools/from-code/processors/type';
import { asIndexName } from 'src/sql-tools/helpers';

export const processColumnIndexes: Processor = (builder, items) => {
  for (const {
    item: { object, propertyName, options },
  } of items.filter((item) => item.type === 'columnIndex')) {
    const { table, column } = resolveColumn(builder, object, propertyName);
    if (!table) {
      onMissingTable(builder, '@ColumnIndex', object);
      continue;
    }

    if (!column) {
      onMissingColumn(builder, `@ColumnIndex`, object, propertyName);
      continue;
    }

    table.indexes.push({
      name: options.name || asIndexName(table.name, [column.name], options.where),
      tableName: table.name,
      unique: options.unique ?? false,
      expression: options.expression,
      using: options.using,
      where: options.where,
      columnNames: [column.name],
      synchronize: options.synchronize ?? true,
    });
  }
};
