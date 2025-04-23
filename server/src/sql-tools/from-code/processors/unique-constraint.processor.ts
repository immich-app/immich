import { onMissingColumn, resolveColumn } from 'src/sql-tools/from-code/processors/column.processor';
import { onMissingTable, resolveTable } from 'src/sql-tools/from-code/processors/table.processor';
import { Processor } from 'src/sql-tools/from-code/processors/type';
import { asKey } from 'src/sql-tools/helpers';
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

  // column level constraints
  for (const {
    type,
    item: { object, propertyName, options },
  } of items.filter((item) => item.type === 'column' || item.type === 'foreignKeyColumn')) {
    const { table, column } = resolveColumn(builder, object, propertyName);
    if (!table) {
      onMissingTable(builder, '@Column', object);
      continue;
    }

    if (!column) {
      // should be impossible since they are created in `column.processor.ts`
      onMissingColumn(builder, '@Column', object, propertyName);
      continue;
    }

    if (type === 'column' && !options.primary && (options.unique || options.uniqueConstraintName)) {
      table.constraints.push({
        type: DatabaseConstraintType.UNIQUE,
        name: options.uniqueConstraintName || asUniqueConstraintName(table.name, [column.name]),
        tableName: table.name,
        columnNames: [column.name],
        synchronize: options.synchronize ?? true,
      });
    }
  }
};

const asUniqueConstraintName = (table: string, columns: string[]) => asKey('UQ_', table, columns);
