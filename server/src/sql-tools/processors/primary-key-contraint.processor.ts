import { asKey } from 'src/sql-tools/helpers';
import { ConstraintType, Processor } from 'src/sql-tools/types';

export const processPrimaryKeyConstraints: Processor = (builder) => {
  for (const table of builder.tables) {
    const columnNames: string[] = [];

    for (const column of table.columns) {
      if (column.primary) {
        columnNames.push(column.name);
      }
    }

    if (columnNames.length > 0) {
      const tableMetadata = builder.getTableMetadata(table);
      table.constraints.push({
        type: ConstraintType.PRIMARY_KEY,
        name: tableMetadata.options.primaryConstraintName || asPrimaryKeyConstraintName(table.name, columnNames),
        tableName: table.name,
        columnNames,
        synchronize: tableMetadata.options.synchronize ?? true,
      });
    }
  }
};

const asPrimaryKeyConstraintName = (table: string, columns: string[]) => asKey('PK_', table, columns);
