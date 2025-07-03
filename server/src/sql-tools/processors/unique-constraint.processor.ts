import { asKey } from 'src/sql-tools/helpers';
import { ConstraintType, Processor } from 'src/sql-tools/types';

export const processUniqueConstraints: Processor = (builder, items) => {
  for (const {
    item: { object, options },
  } of items.filter((item) => item.type === 'uniqueConstraint')) {
    const table = builder.getTableByObject(object);
    if (!table) {
      builder.warnMissingTable('@Unique', object);
      continue;
    }

    const tableName = table.name;
    const columnNames = options.columns;

    table.constraints.push({
      type: ConstraintType.UNIQUE,
      name: options.name || asUniqueConstraintName(tableName, columnNames),
      tableName,
      columnNames,
      synchronize: options.synchronize ?? true,
    });
  }

  // column level constraints
  for (const {
    type,
    item: { object, propertyName, options },
  } of items.filter((item) => item.type === 'column' || item.type === 'foreignKeyColumn')) {
    const { table, column } = builder.getColumnByObjectAndPropertyName(object, propertyName);
    if (!table) {
      builder.warnMissingTable('@Column', object);
      continue;
    }

    if (!column) {
      // should be impossible since they are created in `column.processor.ts`
      builder.warnMissingColumn('@Column', object, propertyName);
      continue;
    }

    if (type === 'column' && !options.primary && (options.unique || options.uniqueConstraintName)) {
      table.constraints.push({
        type: ConstraintType.UNIQUE,
        name: options.uniqueConstraintName || asUniqueConstraintName(table.name, [column.name]),
        tableName: table.name,
        columnNames: [column.name],
        synchronize: options.synchronize ?? true,
      });
    }
  }
};

const asUniqueConstraintName = (table: string, columns: string[]) => asKey('UQ_', table, columns);
