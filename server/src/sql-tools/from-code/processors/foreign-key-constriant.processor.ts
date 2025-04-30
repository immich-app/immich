import { onMissingColumn, resolveColumn } from 'src/sql-tools/from-code/processors/column.processor';
import { onMissingTable, resolveTable } from 'src/sql-tools/from-code/processors/table.processor';
import { Processor } from 'src/sql-tools/from-code/processors/type';
import { asKey } from 'src/sql-tools/helpers';
import { DatabaseActionType, DatabaseConstraintType } from 'src/sql-tools/types';

export const processForeignKeyConstraints: Processor = (builder, items) => {
  for (const {
    item: { object, propertyName, options, target },
  } of items.filter((item) => item.type === 'foreignKeyColumn')) {
    const { table, column } = resolveColumn(builder, object, propertyName);
    if (!table) {
      onMissingTable(builder, '@ForeignKeyColumn', object);
      continue;
    }

    if (!column) {
      // should be impossible since they are pre-created in `column.processor.ts`
      onMissingColumn(builder, '@ForeignKeyColumn', object, propertyName);
      continue;
    }

    const referenceTable = resolveTable(builder, target());
    if (!referenceTable) {
      onMissingTable(builder, '@ForeignKeyColumn', object, propertyName);
      continue;
    }

    const columnNames = [column.name];
    const referenceColumns = referenceTable.columns.filter((column) => column.primary);

    // infer FK column type from reference table
    if (referenceColumns.length === 1) {
      column.type = referenceColumns[0].type;
    }

    table.constraints.push({
      name: options.constraintName || asForeignKeyConstraintName(table.name, columnNames),
      tableName: table.name,
      columnNames,
      type: DatabaseConstraintType.FOREIGN_KEY,
      referenceTableName: referenceTable.name,
      referenceColumnNames: referenceColumns.map((column) => column.name),
      onUpdate: options.onUpdate as DatabaseActionType,
      onDelete: options.onDelete as DatabaseActionType,
      synchronize: options.synchronize ?? true,
    });

    if (options.unique || options.uniqueConstraintName) {
      table.constraints.push({
        name: options.uniqueConstraintName || asRelationKeyConstraintName(table.name, columnNames),
        tableName: table.name,
        columnNames,
        type: DatabaseConstraintType.UNIQUE,
        synchronize: options.synchronize ?? true,
      });
    }
  }
};

const asForeignKeyConstraintName = (table: string, columns: string[]) => asKey('FK_', table, columns);
const asRelationKeyConstraintName = (table: string, columns: string[]) => asKey('REL_', table, columns);
