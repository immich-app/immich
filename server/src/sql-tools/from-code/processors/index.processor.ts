import { onMissingColumn, resolveColumn } from 'src/sql-tools/from-code/processors/column.processor';
import { onMissingTable, resolveTable } from 'src/sql-tools/from-code/processors/table.processor';
import { Processor } from 'src/sql-tools/from-code/processors/type';
import { asKey } from 'src/sql-tools/helpers';

export const processIndexes: Processor = (builder, items, config) => {
  for (const {
    item: { object, options },
  } of items.filter((item) => item.type === 'index')) {
    const table = resolveTable(builder, object);
    if (!table) {
      onMissingTable(builder, '@Check', object);
      continue;
    }

    table.indexes.push({
      name: options.name || asIndexName(table.name, options.columns, options.where),
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

    if (options.index === false) {
      continue;
    }

    const isIndexRequested =
      options.indexName || options.index || (type === 'foreignKeyColumn' && config.createForeignKeyIndexes);
    if (!isIndexRequested) {
      continue;
    }

    const indexName = options.indexName || asIndexName(table.name, [column.name]);

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

const asIndexName = (table: string, columns?: string[], where?: string) => {
  const items: string[] = [];
  for (const columnName of columns ?? []) {
    items.push(columnName);
  }

  if (where) {
    items.push(where);
  }

  return asKey('IDX_', table, items);
};
