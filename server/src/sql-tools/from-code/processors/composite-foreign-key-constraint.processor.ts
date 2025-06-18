import { onMissingTable, resolveTable } from 'src/sql-tools/from-code/processors/table.processor';
import { Processor } from 'src/sql-tools/from-code/processors/type';
import { asKey } from 'src/sql-tools/helpers';
import { DatabaseActionType, DatabaseConstraintType } from 'src/sql-tools/types';

export const processCompositeForeignKeyConstraints: Processor = (builder, items) => {
  for (const {
    item: { object, options },
  } of items.filter((item) => item.type === 'compositeForeignKey')) {
    const table = resolveTable(builder, object);
    if (!table) {
      onMissingTable(builder, '@CompositeForeignKey', object);
      continue;
    }

    const referenceTable = resolveTable(builder, options.target());
    if (!referenceTable) {
      builder.warnings.push(
        `Cannot find reference table for composite foreign key constraint on table "${table.name}"`,
      );
      continue;
    }

    const missingColumns = options.columns.filter((colName) => !table.columns.some((c) => c.name === colName));
    if (missingColumns.length > 0) {
      builder.warnings.push(
        `Composite foreign key constraint on table "${table.name}" references non-existent columns: ${missingColumns.join(', ')}`,
      );
      continue;
    }

    const missingReferenceColumns = options.targetColumns.filter(
      (colName) => !referenceTable.columns.some((c) => c.name === colName),
    );
    if (missingReferenceColumns.length > 0) {
      builder.warnings.push(
        `Composite foreign key constraint on table "${table.name}" references non-existent columns in reference table "${referenceTable.name}": ${missingReferenceColumns.join(', ')}`,
      );
      continue;
    }

    const constraintName =
      options.constraintName ||
      asConstraintName(table.name, options.columns, referenceTable.name, options.targetColumns);

    const isConstraintPresent = table.constraints.some((constraint) => constraint.name === constraintName);
    if (isConstraintPresent) {
      continue;
    }

    table.constraints.push({
      type: DatabaseConstraintType.FOREIGN_KEY,
      name: constraintName,
      tableName: table.name,
      columnNames: options.columns,
      referenceTableName: referenceTable.name,
      referenceColumnNames: options.targetColumns,
      onUpdate: options.onUpdate as DatabaseActionType,
      onDelete: options.onDelete as DatabaseActionType,
      synchronize: options.synchronize ?? true,
    });
  }
};

const asConstraintName = (table: string, columns: string[], referenceTable: string, referenceColumns: string[]) => {
  const allValuesForHash = [...columns, referenceTable, ...referenceColumns];
  return asKey('FK_', table, allValuesForHash);
};
