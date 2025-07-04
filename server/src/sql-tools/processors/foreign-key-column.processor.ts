import { asForeignKeyConstraintName, asKey } from 'src/sql-tools/helpers';
import { ActionType, ConstraintType, Processor } from 'src/sql-tools/types';

export const processForeignKeyColumns: Processor = (builder, items) => {
  for (const {
    item: { object, propertyName, options, target },
  } of items.filter((item) => item.type === 'foreignKeyColumn')) {
    const { table, column } = builder.getColumnByObjectAndPropertyName(object, propertyName);
    if (!table) {
      builder.warnMissingTable('@ForeignKeyColumn', object);
      continue;
    }

    if (!column) {
      // should be impossible since they are pre-created in `column.processor.ts`
      builder.warnMissingColumn('@ForeignKeyColumn', object, propertyName);
      continue;
    }

    const referenceTable = builder.getTableByObject(target());
    if (!referenceTable) {
      builder.warnMissingTable('@ForeignKeyColumn', object, propertyName);
      continue;
    }

    const columnNames = [column.name];
    const referenceColumns = referenceTable.columns.filter((column) => column.primary);

    // infer FK column type from reference table
    if (referenceColumns.length === 1) {
      column.type = referenceColumns[0].type;
    }

    const referenceColumnNames = referenceColumns.map((column) => column.name);
    const name = options.constraintName || asForeignKeyConstraintName(table.name, columnNames);

    table.constraints.push({
      name,
      tableName: table.name,
      columnNames,
      type: ConstraintType.FOREIGN_KEY,
      referenceTableName: referenceTable.name,
      referenceColumnNames,
      onUpdate: options.onUpdate as ActionType,
      onDelete: options.onDelete as ActionType,
      synchronize: options.synchronize ?? true,
    });

    if (options.unique || options.uniqueConstraintName) {
      table.constraints.push({
        name: options.uniqueConstraintName || asRelationKeyConstraintName(table.name, columnNames),
        tableName: table.name,
        columnNames,
        type: ConstraintType.UNIQUE,
        synchronize: options.synchronize ?? true,
      });
    }
  }
};

const asRelationKeyConstraintName = (table: string, columns: string[]) => asKey('REL_', table, columns);
