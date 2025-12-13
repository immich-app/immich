import { ConstraintType, Processor } from 'src/sql-tools/types';

export const processPrimaryKeyConstraints: Processor = (ctx) => {
  for (const table of ctx.tables) {
    const columnNames: string[] = [];

    for (const column of table.columns) {
      if (column.primary) {
        columnNames.push(column.name);
      }
    }

    if (columnNames.length > 0) {
      const tableMetadata = ctx.getTableMetadata(table);
      table.constraints.push({
        type: ConstraintType.PRIMARY_KEY,
        name:
          tableMetadata.options.primaryConstraintName ||
          ctx.getNameFor({
            type: 'primaryKey',
            tableName: table.name,
            columnNames,
          }),
        tableName: table.name,
        columnNames,
        synchronize: tableMetadata.options.synchronize ?? true,
      });
    }
  }
};
