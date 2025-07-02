import { asKey } from 'src/sql-tools/helpers';
import { ConstraintType, Processor } from 'src/sql-tools/types';

export const processCheckConstraints: Processor = (builder, items) => {
  for (const {
    item: { object, options },
  } of items.filter((item) => item.type === 'checkConstraint')) {
    const table = builder.getTableByObject(object);
    if (!table) {
      builder.warnMissingTable('@Check', object);
      continue;
    }

    const tableName = table.name;

    table.constraints.push({
      type: ConstraintType.CHECK,
      name: options.name || asCheckConstraintName(tableName, options.expression),
      tableName,
      expression: options.expression,
      synchronize: options.synchronize ?? true,
    });
  }
};

const asCheckConstraintName = (table: string, expression: string) => asKey('CHK_', table, [expression]);
