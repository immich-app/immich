import { onMissingTable, resolveTable } from 'src/sql-tools/from-code/processors/table.processor';
import { Processor } from 'src/sql-tools/from-code/processors/type';
import { asUniqueConstraintName } from 'src/sql-tools/helpers';
import { DatabaseConstraintType } from 'src/sql-tools/types';

export const processUniqueConstraints: Processor = (builder, items) => {
  for (const {
    item: { object, options },
  } of items.filter((item) => item.type === 'uniqueConstraint')) {
    const table = resolveTable(builder, object);
    if (!table) {
      onMissingTable(builder, '@Unique', object);
      continue;
    }

    const tableName = table.name;
    const columnNames = options.columns;

    table.constraints.push({
      type: DatabaseConstraintType.UNIQUE,
      name: options.name || asUniqueConstraintName(tableName, columnNames),
      tableName,
      columnNames,
      synchronize: options.synchronize ?? true,
    });
  }
};
