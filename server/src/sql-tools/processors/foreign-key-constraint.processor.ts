import { asForeignKeyConstraintName } from 'src/sql-tools/helpers';
import { ActionType, ConstraintType, Processor } from 'src/sql-tools/types';

export const processForeignKeyConstraints: Processor = (ctx, items) => {
  for (const {
    item: { object, options },
  } of items.filter((item) => item.type === 'foreignKeyConstraint')) {
    const table = ctx.getTableByObject(object);
    if (!table) {
      ctx.warnMissingTable('@ForeignKeyConstraint', { name: 'referenceTable' });
      continue;
    }

    const referenceTable = ctx.getTableByObject(options.referenceTable());
    if (!referenceTable) {
      const referenceTableName = options.referenceTable()?.name;
      ctx.warn(
        '@ForeignKeyConstraint.referenceTable',
        `Unable to find table` + (referenceTableName ? ` (${referenceTableName})` : ''),
      );
      continue;
    }

    let missingColumn = false;

    for (const columnName of options.columns) {
      if (!table.columns.some(({ name }) => name === columnName)) {
        const metadata = ctx.getTableMetadata(table);
        ctx.warn('@ForeignKeyConstraint.columns', `Unable to find column (${metadata.object.name}.${columnName})`);
        missingColumn = true;
      }
    }

    for (const columnName of options.referenceColumns || []) {
      if (!referenceTable.columns.some(({ name }) => name === columnName)) {
        const metadata = ctx.getTableMetadata(referenceTable);
        ctx.warn(
          '@ForeignKeyConstraint.referenceColumns',
          `Unable to find column (${metadata.object.name}.${columnName})`,
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
      type: ConstraintType.FOREIGN_KEY,
      name,
      tableName: table.name,
      columnNames: options.columns,
      referenceTableName: referenceTable.name,
      referenceColumnNames: referenceColumns,
      onUpdate: options.onUpdate as ActionType,
      onDelete: options.onDelete as ActionType,
      synchronize: options.synchronize ?? true,
    });

    if (options.index === false) {
      continue;
    }

    if (options.index || options.indexName || ctx.options.createForeignKeyIndexes) {
      table.indexes.push({
        name: options.indexName || ctx.asIndexName(table.name, options.columns),
        tableName: table.name,
        columnNames: options.columns,
        unique: false,
        synchronize: options.synchronize ?? true,
      });
    }
  }
};
