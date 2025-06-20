import { onMissingTable, resolveTable } from 'src/sql-tools/from-code/processors/table.processor';
import { Processor } from 'src/sql-tools/from-code/processors/type';
import { addWarning, asForeignKeyConstraintName, asIndexName } from 'src/sql-tools/helpers';
import { DatabaseActionType, DatabaseConstraintType } from 'src/sql-tools/types';

export const processForeignKeyConstraints: Processor = (builder, items, config) => {
  for (const {
    item: { object, options },
  } of items.filter((item) => item.type === 'foreignKeyConstraint')) {
    const table = resolveTable(builder, object);
    if (!table) {
      onMissingTable(builder, '@ForeignKeyConstraint', { name: 'referenceTable' });
      continue;
    }

    const referenceTable = resolveTable(builder, options.referenceTable());
    if (!referenceTable) {
      const referenceTableName = options.referenceTable()?.name;
      addWarning(
        builder,
        '@ForeignKeyConstraint.referenceTable',
        `Unable to find table` + (referenceTableName ? ` (${referenceTableName})` : ''),
      );
      continue;
    }

    let missingColumn = false;

    for (const columnName of options.columns) {
      if (!table.columns.some(({ name }) => name === columnName)) {
        addWarning(
          builder,
          '@ForeignKeyConstraint.columns',
          `Unable to find column (${table.metadata.object.name}.${columnName})`,
        );
        missingColumn = true;
      }
    }

    for (const columnName of options.referenceColumns || []) {
      if (!referenceTable.columns.some(({ name }) => name === columnName)) {
        addWarning(
          builder,
          '@ForeignKeyConstraint.referenceColumns',
          `Unable to find column (${referenceTable.metadata.object.name}.${columnName})`,
        );
        missingColumn = true;
      }
    }

    if (missingColumn) {
      continue;
    }

    const referenceColumns =
      options.referenceColumns || referenceTable.columns.filter(({ primary }) => primary).map(({ name }) => name);

    const name = options.name || asForeignKeyConstraintName(table.name, options.columns);

    table.constraints.push({
      type: DatabaseConstraintType.FOREIGN_KEY,
      name,
      tableName: table.name,
      columnNames: options.columns,
      referenceTableName: referenceTable.name,
      referenceColumnNames: referenceColumns,
      onUpdate: options.onUpdate as DatabaseActionType,
      onDelete: options.onDelete as DatabaseActionType,
      synchronize: options.synchronize ?? true,
    });

    if (options.index === false) {
      continue;
    }

    if (options.index || options.indexName || config.createForeignKeyIndexes) {
      table.indexes.push({
        name: options.indexName || asIndexName(table.name, options.columns),
        tableName: table.name,
        columnNames: options.columns,
        unique: false,
        synchronize: options.synchronize ?? true,
      });
    }
  }
};
