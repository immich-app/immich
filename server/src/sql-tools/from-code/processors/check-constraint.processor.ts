import { onMissingTable, resolveTable } from 'src/sql-tools/from-code/processors/table.processor';
import { Processor } from 'src/sql-tools/from-code/processors/type';
import { asKey } from 'src/sql-tools/helpers';
import { DatabaseConstraintType } from 'src/sql-tools/types';

export const processCheckConstraints: Processor = (builder, items) => {
  for (const {
    item: { object, options },
  } of items.filter((item) => item.type === 'checkConstraint')) {
    const table = resolveTable(builder, object);
    if (!table) {
      onMissingTable(builder, '@Check', object);
      continue;
    }

    const tableName = table.name;

    table.constraints.push({
      type: DatabaseConstraintType.CHECK,
      name: options.name || asCheckConstraintName(tableName, options.expression),
      tableName,
      expression: options.expression,
      synchronize: options.synchronize ?? true,
    });
  }
};

const asCheckConstraintName = (table: string, expression: string) => asKey('CHK_', table, [expression]);
