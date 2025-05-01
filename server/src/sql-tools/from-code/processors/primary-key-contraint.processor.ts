import { Processor } from 'src/sql-tools/from-code/processors/type';
import { asKey } from 'src/sql-tools/helpers';
import { DatabaseConstraintType } from 'src/sql-tools/types';

export const processPrimaryKeyConstraints: Processor = (builder) => {
  for (const table of builder.tables) {
    const columnNames: string[] = [];

    for (const column of table.columns) {
      if (column.primary) {
        columnNames.push(column.name);
      }
    }
    if (columnNames.length > 0) {
      table.constraints.push({
        type: DatabaseConstraintType.PRIMARY_KEY,
        name: table.metadata.options.primaryConstraintName || asPrimaryKeyConstraintName(table.name, columnNames),
        tableName: table.name,
        columnNames,
        synchronize: table.metadata.options.synchronize ?? true,
      });
    }
  }
};

const asPrimaryKeyConstraintName = (table: string, columns: string[]) => asKey('PK_', table, columns);
