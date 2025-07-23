import { Processor } from 'src/sql-tools/types';

export const processIndexes: Processor = (ctx, items) => {
  for (const {
    item: { object, options },
  } of items.filter((item) => item.type === 'index')) {
    const table = ctx.getTableByObject(object);
    if (!table) {
      ctx.warnMissingTable('@Check', object);
      continue;
    }

    const indexName =
      options.name ||
      ctx.getNameFor({
        type: 'index',
        tableName: table.name,
        columnNames: options.columns,
        where: options.where,
      });

    table.indexes.push({
      name: indexName,
      tableName: table.name,
      unique: options.unique ?? false,
      expression: options.expression,
      using: options.using,
      with: options.with,
      where: options.where,
      columnNames: options.columns,
      synchronize: options.synchronize ?? true,
    });
  }

  // column indexes
  for (const {
    type,
    item: { object, propertyName, options },
  } of items.filter((item) => item.type === 'column' || item.type === 'foreignKeyColumn')) {
    const { table, column } = ctx.getColumnByObjectAndPropertyName(object, propertyName);
    if (!table) {
      ctx.warnMissingTable('@Column', object);
      continue;
    }

    if (!column) {
      // should be impossible since they are created in `column.processor.ts`
      ctx.warnMissingColumn('@Column', object, propertyName);
      continue;
    }

    if (options.index === false) {
      continue;
    }

    const isIndexRequested =
      options.indexName || options.index || (type === 'foreignKeyColumn' && ctx.options.createForeignKeyIndexes);
    if (!isIndexRequested) {
      continue;
    }

    const indexName =
      options.indexName ||
      ctx.getNameFor({
        type: 'index',
        tableName: table.name,
        columnNames: [column.name],
      });

    const isIndexPresent = table.indexes.some((index) => index.name === indexName);
    if (isIndexPresent) {
      continue;
    }

    const isOnlyPrimaryColumn = options.primary && table.columns.filter(({ primary }) => primary === true).length === 1;
    if (isOnlyPrimaryColumn) {
      // will have an index created by the primary key constraint
      continue;
    }

    table.indexes.push({
      name: indexName,
      tableName: table.name,
      unique: false,
      columnNames: [column.name],
      synchronize: options.synchronize ?? true,
    });
  }
};
